-- Preparation only. Obtain approval before applying; apply after the app that shows over-stock lines is deployed.
-- The cart no longer lowers quantities the customer did not just change:
--   reading the cart keeps quantities above stock (cart_cleanup);
--   adding, a login merge and an option change keep the quantity asked for, even above stock;
--   + stops at stock, and one - from above stock lands on stock without an adjustment notice (apply_cart_operation).
-- place_order still checks stock. Only these two functions change; tables, data and grants stay as they are.
begin;
set local lock_timeout='5s';

do $$
begin
  if obj_description(to_regprocedure('private.cart_cleanup(uuid)'),'pg_proc') is distinct from 'bang_cart_20261023000000'
    or obj_description(to_regprocedure('public.apply_cart_operation(uuid,uuid,jsonb)'),'pg_proc')
      is distinct from 'bang_cart_20261023000000' then
    raise exception 'CART_KEEP_QUANTITIES_REVIEW_REQUIRED';
  end if;
end $$;

create or replace function private.cart_cleanup(p_cart_id uuid) returns jsonb
language plpgsql set search_path=pg_catalog as $$
declare
  line record;
  changed boolean:=false;
  notices jsonb:='[]';
begin
  for line in select i.id,i.product_variant_id,i.quantity,p.state
    from public.cart_items i left join public.product_variants v on v.id=i.product_variant_id
    left join public.products p on p.id=v.product_id where i.cart_id=p_cart_id order by i.id loop
    if line.state is distinct from 'active' then
      delete from public.cart_items where id=line.id and cart_id=p_cart_id;
      changed:=true;
      notices:=notices||jsonb_build_array(jsonb_build_object('kind','unavailable',
        'itemId',line.id,'variantId',line.product_variant_id,'before',line.quantity,'after',0));
    end if;
  end loop;
  return jsonb_build_object('changed',changed,'notices',notices);
end $$;

create or replace function public.apply_cart_operation(p_expected_user_id uuid,p_request_id uuid,p_operation jsonb) returns jsonb
language plpgsql security definer set search_path=pg_catalog as $$
declare
  owner_id uuid;
  v_cart_id uuid;
  canonical jsonb;
  op jsonb;
  kind text;
  receipt public.cart_operations%rowtype;
  existing public.cart_items%rowtype;
  source record;
  target record;
  entry jsonb;
  item_id uuid;
  desired bigint;
  next_quantity integer;
  affected integer;
  changed boolean:=false;
  accepted boolean:=false;
  notices jsonb:='[]';
  item_map jsonb:='{}';
  cleaned jsonb;
  result jsonb;
begin
  owner_id:=private.cart_member(p_expected_user_id);
  perform private.cart_uuid(to_jsonb(p_request_id));
  canonical:=private.cart_normalize_operation(p_operation);
  op:=canonical->'operation';
  kind:=op->>'kind';
  v_cart_id:=private.cart_lock(owner_id);
  select r.* into receipt from public.cart_operations r
    where r.cart_id=v_cart_id and r.request_id=p_request_id;
  if found then
    if receipt.operation_type<>kind or receipt.request_payload<>canonical then
      raise exception 'CART_REQUEST_CONFLICT' using errcode='P0001';
    end if;
    perform private.cart_lock_catalog(v_cart_id,null);
    cleaned:=private.cart_cleanup(v_cart_id);
    if (cleaned->>'changed')::boolean then
      update public.carts c set revision=c.revision+1 where c.id=v_cart_id;
    end if;
    return private.cart_snapshot(v_cart_id,
      coalesce(receipt.result->'notices','[]'::jsonb)||(cleaned->'notices'),receipt.result);
  end if;
  perform private.cart_lock_catalog(v_cart_id,canonical);
  if kind in ('merge_guest','add_items') then
    for entry in select value from jsonb_array_elements(op->'items') loop
      select v.id,v.product_id,v.stock,p.state into target from public.product_variants v
        join public.products p on p.id=v.product_id where v.id=(entry->>'variantId')::bigint;
      if not found or target.product_id<>(entry->>'productId')::bigint or target.state<>'active' then
        notices:=notices||jsonb_build_array(jsonb_build_object('kind','unavailable',
          'variantId',(entry->>'variantId')::bigint));
        continue;
      end if;
      select i.* into existing from public.cart_items i
        where i.cart_id=v_cart_id and i.product_variant_id=target.id;
      if target.stock=0 and kind='add_items' then
        notices:=notices||jsonb_build_array(jsonb_build_object('kind','sold_out','variantId',target.id));
        continue;
      end if;
      desired:=coalesce(existing.quantity,0)::bigint+(entry->>'quantity')::bigint;
      if desired>2147483647 then raise exception 'CART_INVALID_OPERATION' using errcode='22023'; end if;
      -- The cart never changes the quantity a customer asked for; a line above stock shows why it cannot be ordered.
      next_quantity:=desired::integer;
      accepted:=true;
      if existing.id is null then
        insert into public.cart_items(cart_id,product_variant_id,quantity)
          values (v_cart_id,target.id,next_quantity) returning id into item_id;
        changed:=true;
      else
        item_id:=existing.id;
        if existing.quantity<>next_quantity then
          update public.cart_items set quantity=next_quantity where id=existing.id and cart_id=v_cart_id;
          changed:=true;
        end if;
      end if;
    end loop;
  elsif kind='adjust_quantity' then
    select i.id,i.quantity,i.product_variant_id,v.stock,p.state into source from public.cart_items i
      join public.product_variants v on v.id=i.product_variant_id join public.products p on p.id=v.product_id
      where i.cart_id=v_cart_id and i.id=(op->>'itemId')::uuid;
    if not found then
      accepted:=true;
      notices:=notices||jsonb_build_array(jsonb_build_object('kind','item_missing','itemId',(op->>'itemId')::uuid));
    elsif source.state<>'active' or source.stock=0 then
      notices:=notices||jsonb_build_array(jsonb_build_object(
        'kind',case when source.stock=0 and source.state='active' then 'sold_out' else 'unavailable' end,
        'itemId',source.id,'variantId',source.product_variant_id));
    else
      desired:=greatest(1,source.quantity::bigint+(op->>'delta')::integer);
      if desired>2147483647 then raise exception 'CART_INVALID_OPERATION' using errcode='22023'; end if;
      -- A decrease from above stock lands on stock at once; an increase never lowers a line above stock.
      next_quantity:=case when (op->>'delta')::integer<0 then least(desired,source.stock)
        else least(desired,greatest(source.stock,source.quantity)) end::integer;
      accepted:=true;
      if next_quantity<>source.quantity then
        update public.cart_items set quantity=next_quantity where id=source.id and cart_id=v_cart_id;
        changed:=true;
      end if;
      -- Landing on stock is what the member asked for, so only a refused increase is reported.
      if desired<>next_quantity and (op->>'delta')::integer>0 then
        notices:=notices||jsonb_build_array(jsonb_build_object('kind','quantity_adjusted',
          'itemId',source.id,'variantId',source.product_variant_id,'before',desired,'after',next_quantity));
      end if;
    end if;
  elsif kind='change_option' then
    select i.id,i.quantity,i.product_variant_id,p.style_id,p.state into source from public.cart_items i
      join public.product_variants v on v.id=i.product_variant_id join public.products p on p.id=v.product_id
      where i.cart_id=v_cart_id and i.id=(op->>'itemId')::uuid;
    if not found then
      accepted:=true;
      notices:=notices||jsonb_build_array(jsonb_build_object('kind','item_missing','itemId',(op->>'itemId')::uuid));
    else
      select v.id,v.product_id,v.stock,p.style_id,p.state into target from public.product_variants v
        join public.products p on p.id=v.product_id where v.id=(op->>'variantId')::bigint;
      if not found or source.state<>'active' or target.state<>'active' or target.stock=0
        or target.product_id<>(op->>'productId')::bigint or target.style_id<>source.style_id then
        notices:=notices||jsonb_build_array(jsonb_build_object('kind','option_rejected',
          'itemId',source.id,'variantId',(op->>'variantId')::bigint));
      elsif source.product_variant_id=target.id then
        accepted:=true;
      else
        select i.* into existing from public.cart_items i
          where i.cart_id=v_cart_id and i.product_variant_id=target.id;
        desired:=source.quantity::bigint+coalesce(existing.quantity,0)::bigint;
        if desired>2147483647 then raise exception 'CART_INVALID_OPERATION' using errcode='22023'; end if;
        next_quantity:=desired::integer;
        if existing.id is null then
          insert into public.cart_items(cart_id,product_variant_id,quantity)
            values (v_cart_id,target.id,next_quantity) returning id into item_id;
        else
          item_id:=existing.id;
          if existing.quantity<>next_quantity then
            update public.cart_items set quantity=next_quantity where id=existing.id and cart_id=v_cart_id;
          end if;
        end if;
        delete from public.cart_items where id=source.id and cart_id=v_cart_id;
        item_map:=jsonb_build_object(source.id::text,item_id::text);
        accepted:=true;
        changed:=true;
      end if;
    end if;
  elsif kind='remove_items' then
    delete from public.cart_items i where i.cart_id=v_cart_id and i.id in (
      select (value#>>'{}')::uuid from jsonb_array_elements(op->'itemIds'));
    get diagnostics affected=row_count;
    changed:=affected>0;
    accepted:=true;
  end if;
  -- A move uses the latest stored source quantity; cleanup applies to the result.
  cleaned:=private.cart_cleanup(v_cart_id);
  notices:=notices||(cleaned->'notices');
  if changed or (cleaned->>'changed')::boolean then
    update public.carts c set revision=c.revision+1 where c.id=v_cart_id;
  end if;
  result:=jsonb_build_object('requestId',p_request_id,
    'outcome',case when changed then 'applied' when accepted then 'noop' else 'rejected' end,
    'itemIdMap',item_map,'notices',notices);
  insert into public.cart_operations(cart_id,request_id,operation_type,request_payload,result)
    values (v_cart_id,p_request_id,kind,canonical,result);
  return private.cart_snapshot(v_cart_id,notices,result);
end $$;

comment on function private.cart_cleanup(uuid) is 'bang_cart_keep_quantities_20261103000000';
comment on function public.apply_cart_operation(uuid,uuid,jsonb) is 'bang_cart_keep_quantities_20261103000000';
commit;
