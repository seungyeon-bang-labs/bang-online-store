-- Preparation only. Obtain approval before applying; apply before the app that keeps discontinued lines is deployed.
-- Adds one read-only function. The earlier app never calls it, so it is safe to apply first.
-- products RLS lets the storefront read active products only. A cart still shows a discontinued line,
-- so this returns, for the requested (product, variant) pairs whose product is inactive, only the fields
-- a cart card needs. It does not check that the pair is in the caller's cart: 'inactive' means
-- discontinued only, so these names and images were public before. If pre-launch products ever use
-- 'inactive', stop returning names and images here or check the caller's cart first.
begin;
set local lock_timeout='5s';

do $$
begin
  if to_regprocedure('public.get_discontinued_cart_lines(jsonb)') is not null then
    raise exception 'CART_DISCONTINUED_LINES_OBJECT_EXISTS';
  end if;
  if to_regclass('public.products') is null or to_regclass('public.product_variants') is null
    or to_regclass('public.product_images') is null or to_regclass('public.product_styles') is null
    or to_regclass('public.colors') is null then
    raise exception 'CART_DISCONTINUED_LINES_DEPENDENCY_REVIEW_REQUIRED';
  end if;
end $$;

create function public.get_discontinued_cart_lines(p_items jsonb) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog as $$
begin
  -- Same bound as the cart product route.
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items)>500 then
    raise exception 'CART_INVALID_REQUEST' using errcode='22023';
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'productId',p.id,'variantId',v.id,'styleId',p.style_id,
      'name',coalesce(p.display_name,c.label||' '||s.name),'color',c.label,'size',v.size,
      'price',p.price,'priceOffset',v.price_offset,'stock',v.stock,
      -- The storefront's thumbnail rule: the first thumbnail image, else the first image.
      'imagePath',(select i.image_path from public.product_images i where i.product_id=p.id
        order by i.image_type='thumbnail' desc,i.display_order,i.id limit 1))
      order by p.id,v.id)
    from (select distinct (value->>'productId')::bigint product_id,(value->>'variantId')::bigint variant_id
      from jsonb_array_elements(p_items)) r
    join public.product_variants v on v.id=r.variant_id and v.product_id=r.product_id
    join public.products p on p.id=v.product_id
    join public.product_styles s on s.id=p.style_id
    join public.colors c on c.id=p.color_id
    where p.state='inactive'),'[]'::jsonb);
end $$;

comment on function public.get_discontinued_cart_lines(jsonb) is 'bang_cart_discontinued_lines_20261104000000';
revoke all on function public.get_discontinued_cart_lines(jsonb) from public,anon,authenticated,service_role;
grant execute on function public.get_discontinued_cart_lines(jsonb) to anon,authenticated;
commit;
