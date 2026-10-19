-- Separate approval required. Fixed fixture snapshot: 27/3/15/2/25 rows.
-- Proposed frozen period: 2026-10-19 00:00 Asia/Seoul to 2027-10-19 00:00.
-- Confirm these exact values before remote application; retries reuse this file.
-- Do not upsert, skip conflicts, fill gaps, or dynamically regenerate dates.
begin;
set local lock_timeout='5s';
lock table public.product_stats,public.discounts,public.discount_items,public.product_sections,public.product_section_items
  in share row exclusive mode;

do $$
declare
  seed jsonb := $merch_seed${
  "product_stats": [
    {"product_id":1,"total_sales":2451,"today_sales":12,"weekly_sales":89,"monthly_sales":342},
    {"product_id":2,"total_sales":892,"today_sales":3,"weekly_sales":42,"monthly_sales":156},
    {"product_id":3,"total_sales":1567,"today_sales":21,"weekly_sales":112,"monthly_sales":489},
    {"product_id":4,"total_sales":432,"today_sales":0,"weekly_sales":28,"monthly_sales":92},
    {"product_id":5,"total_sales":2840,"today_sales":28,"weekly_sales":167,"monthly_sales":512},
    {"product_id":6,"total_sales":621,"today_sales":1,"weekly_sales":15,"monthly_sales":102},
    {"product_id":7,"total_sales":1842,"today_sales":15,"weekly_sales":94,"monthly_sales":412},
    {"product_id":8,"total_sales":1120,"today_sales":4,"weekly_sales":56,"monthly_sales":215},
    {"product_id":9,"total_sales":2134,"today_sales":32,"weekly_sales":142,"monthly_sales":562},
    {"product_id":10,"total_sales":549,"today_sales":2,"weekly_sales":24,"monthly_sales":88},
    {"product_id":11,"total_sales":132,"today_sales":0,"weekly_sales":5,"monthly_sales":21},
    {"product_id":12,"total_sales":954,"today_sales":7,"weekly_sales":41,"monthly_sales":128},
    {"product_id":13,"total_sales":612,"today_sales":2,"weekly_sales":18,"monthly_sales":76},
    {"product_id":14,"total_sales":1421,"today_sales":11,"weekly_sales":74,"monthly_sales":289},
    {"product_id":15,"total_sales":782,"today_sales":5,"weekly_sales":38,"monthly_sales":142},
    {"product_id":16,"total_sales":212,"today_sales":0,"weekly_sales":8,"monthly_sales":45},
    {"product_id":17,"total_sales":1678,"today_sales":14,"weekly_sales":82,"monthly_sales":310},
    {"product_id":18,"total_sales":1245,"today_sales":9,"weekly_sales":63,"monthly_sales":241},
    {"product_id":19,"total_sales":3042,"today_sales":5,"weekly_sales":120,"monthly_sales":456},
    {"product_id":20,"total_sales":2715,"today_sales":24,"weekly_sales":189,"monthly_sales":612},
    {"product_id":21,"total_sales":1890,"today_sales":17,"weekly_sales":104,"monthly_sales":387},
    {"product_id":22,"total_sales":1422,"today_sales":8,"weekly_sales":71,"monthly_sales":294},
    {"product_id":23,"total_sales":567,"today_sales":3,"weekly_sales":22,"monthly_sales":105},
    {"product_id":24,"total_sales":1104,"today_sales":10,"weekly_sales":58,"monthly_sales":201},
    {"product_id":25,"total_sales":412,"today_sales":1,"weekly_sales":12,"monthly_sales":58},
    {"product_id":26,"total_sales":2234,"today_sales":21,"weekly_sales":145,"monthly_sales":502},
    {"product_id":27,"total_sales":1056,"today_sales":6,"weekly_sales":48,"monthly_sales":189}
  ],
  "discounts": [
    {"id":1,"title":"겨울 시즌 마지막 세일","starts_at":"2026-10-19T00:00:00+09:00","ends_at":"2027-10-19T00:00:00+09:00","priority":1,"is_active":true},
    {"id":2,"title":"봄 시즌 세일","starts_at":"2026-10-19T00:00:00+09:00","ends_at":"2027-10-19T00:00:00+09:00","priority":2,"is_active":true},
    {"id":3,"title":"여름 시즌 세일","starts_at":"2026-10-19T00:00:00+09:00","ends_at":"2027-10-19T00:00:00+09:00","priority":1,"is_active":true}
  ],
  "discount_items": [
    {"discount_id":1,"product_id":1,"discount_rate":20},
    {"discount_id":1,"product_id":2,"discount_rate":20},
    {"discount_id":1,"product_id":3,"discount_rate":20},
    {"discount_id":1,"product_id":4,"discount_rate":10},
    {"discount_id":1,"product_id":5,"discount_rate":10},
    {"discount_id":2,"product_id":6,"discount_rate":15},
    {"discount_id":2,"product_id":7,"discount_rate":15},
    {"discount_id":2,"product_id":8,"discount_rate":15},
    {"discount_id":2,"product_id":9,"discount_rate":5},
    {"discount_id":2,"product_id":10,"discount_rate":5},
    {"discount_id":3,"product_id":11,"discount_rate":25},
    {"discount_id":3,"product_id":12,"discount_rate":25},
    {"discount_id":3,"product_id":13,"discount_rate":25},
    {"discount_id":3,"product_id":14,"discount_rate":10},
    {"discount_id":3,"product_id":15,"discount_rate":10}
  ],
  "product_sections": [
    {"id":1,"title":"가을 인기 상품","display_order":1,"desktop_rows":2,"is_active":true},
    {"id":2,"title":"이달의 추천 상품","display_order":2,"desktop_rows":1,"is_active":true}
  ],
  "product_section_items": [
    {"section_id":1,"product_id":1,"display_order":1},
    {"section_id":1,"product_id":2,"display_order":2},
    {"section_id":1,"product_id":3,"display_order":3},
    {"section_id":1,"product_id":4,"display_order":4},
    {"section_id":1,"product_id":5,"display_order":5},
    {"section_id":1,"product_id":6,"display_order":6},
    {"section_id":1,"product_id":7,"display_order":7},
    {"section_id":1,"product_id":8,"display_order":8},
    {"section_id":1,"product_id":9,"display_order":9},
    {"section_id":1,"product_id":10,"display_order":10},
    {"section_id":1,"product_id":11,"display_order":11},
    {"section_id":1,"product_id":12,"display_order":12},
    {"section_id":1,"product_id":13,"display_order":13},
    {"section_id":1,"product_id":14,"display_order":14},
    {"section_id":1,"product_id":15,"display_order":15},
    {"section_id":2,"product_id":16,"display_order":1},
    {"section_id":2,"product_id":17,"display_order":2},
    {"section_id":2,"product_id":18,"display_order":3},
    {"section_id":2,"product_id":19,"display_order":4},
    {"section_id":2,"product_id":20,"display_order":5},
    {"section_id":2,"product_id":21,"display_order":6},
    {"section_id":2,"product_id":22,"display_order":7},
    {"section_id":2,"product_id":23,"display_order":8},
    {"section_id":2,"product_id":24,"display_order":9},
    {"section_id":2,"product_id":25,"display_order":10}
  ]
}$merch_seed$::jsonb;
  group_name text;
  row_data jsonb;
  field_name text;
  integer_fields text[];
  number_value numeric;
begin
  if not seed ?& array['product_stats','discounts','discount_items','product_sections','product_section_items']
    or (select count(*) from jsonb_object_keys(seed))<>5 then
    raise exception 'MERCHANDISING_SEED_INVALID_SHAPE';
  end if;
  foreach group_name in array array['product_stats','discounts','discount_items','product_sections','product_section_items'] loop
    if jsonb_typeof(seed->group_name) is distinct from 'array' then
      raise exception 'MERCHANDISING_SEED_INVALID_SHAPE: %',group_name;
    end if;
    integer_fields := case group_name
      when 'product_stats' then array['product_id','total_sales','today_sales','weekly_sales','monthly_sales']
      when 'discounts' then array['id','priority']
      when 'discount_items' then array['discount_id','product_id','discount_rate']
      when 'product_sections' then array['id','display_order','desktop_rows']
      when 'product_section_items' then array['section_id','product_id','display_order'] end;
    for row_data in select value from jsonb_array_elements(seed->group_name) loop
      foreach field_name in array integer_fields loop
        if jsonb_typeof(row_data->field_name) is distinct from 'number' then
          raise exception 'MERCHANDISING_SEED_INVALID_INTEGER: %.%',group_name,field_name;
        end if;
        number_value := (row_data->>field_name)::numeric;
        if number_value<>trunc(number_value) then
          raise exception 'MERCHANDISING_SEED_INVALID_INTEGER: %.%',group_name,field_name;
        end if;
        if field_name in ('id','product_id','discount_id','section_id') then
          if number_value<=0 or number_value>9223372036854775807 then
            raise exception 'MERCHANDISING_SEED_INVALID_VALUE: %.%',group_name,field_name;
          end if;
        elsif number_value>2147483647 or number_value < (case when field_name='priority' then -2147483648 else 0 end)
          or (field_name='discount_rate' and (number_value<1 or number_value>100))
          or (field_name='desktop_rows' and number_value<1) then
          raise exception 'MERCHANDISING_SEED_INVALID_VALUE: %.%',group_name,field_name;
        end if;
      end loop;
      if group_name in ('discounts','product_sections') then
        if jsonb_typeof(row_data->'title') is distinct from 'string'
          or jsonb_typeof(row_data->'is_active') is distinct from 'boolean' then
          raise exception 'MERCHANDISING_SEED_INVALID_VALUE: %',group_name;
        end if;
      end if;
      if group_name='discounts' then
        if jsonb_typeof(row_data->'starts_at') is distinct from 'string'
          or jsonb_typeof(row_data->'ends_at') is distinct from 'string' then
          raise exception 'MERCHANDISING_SEED_INVALID_PERIOD';
        end if;
        if not isfinite((row_data->>'starts_at')::timestamptz)
          or not isfinite((row_data->>'ends_at')::timestamptz)
          or (row_data->>'starts_at')::timestamptz >= (row_data->>'ends_at')::timestamptz then
          raise exception 'MERCHANDISING_SEED_INVALID_PERIOD';
        end if;
      end if;
    end loop;
  end loop;
  if jsonb_array_length(seed->'product_stats')<>27 or jsonb_array_length(seed->'discounts')<>3
    or jsonb_array_length(seed->'discount_items')<>15 or jsonb_array_length(seed->'product_sections')<>2
    or jsonb_array_length(seed->'product_section_items')<>25 then
    raise exception 'MERCHANDISING_SEED_ROW_COUNT_MISMATCH';
  end if;
  if exists (select 1 from jsonb_to_recordset(seed->'product_stats') x(product_id bigint) group by product_id having count(*)>1)
    or exists (select 1 from jsonb_to_recordset(seed->'discounts') x(id bigint) group by id having count(*)>1)
    or exists (select 1 from jsonb_to_recordset(seed->'discount_items') x(discount_id bigint,product_id bigint)
      group by discount_id,product_id having count(*)>1)
    or exists (select 1 from jsonb_to_recordset(seed->'product_sections') x(id bigint) group by id having count(*)>1)
    or exists (select 1 from jsonb_to_recordset(seed->'product_section_items') x(section_id bigint,product_id bigint)
      group by section_id,product_id having count(*)>1)
    or exists (select 1 from jsonb_to_recordset(seed->'product_section_items') x(section_id bigint,display_order integer)
      group by section_id,display_order having count(*)>1) then
    raise exception 'MERCHANDISING_SEED_DUPLICATE_INPUT';
  end if;

  if exists (select 1 from public.product_stats s join jsonb_to_recordset(seed->'product_stats') x(product_id bigint) using(product_id))
    or exists (select 1 from public.discounts d join jsonb_to_recordset(seed->'discounts') x(id bigint) using(id))
    or exists (select 1 from public.product_sections s join jsonb_to_recordset(seed->'product_sections') x(id bigint) using(id))
    or exists (select 1 from public.discount_items d join jsonb_to_recordset(seed->'discount_items') x(discount_id bigint,product_id bigint) using(discount_id,product_id))
    or exists (select 1 from public.product_section_items s join jsonb_to_recordset(seed->'product_section_items') x(section_id bigint,product_id bigint) using(section_id,product_id)) then
    raise exception 'MERCHANDISING_SEED_TARGET_EXISTS';
  end if;

  if exists (
    select 1 from (
      select product_id from jsonb_to_recordset(seed->'product_stats') x(product_id bigint)
      union select product_id from jsonb_to_recordset(seed->'discount_items') x(product_id bigint)
      union select product_id from jsonb_to_recordset(seed->'product_section_items') x(product_id bigint)
    ) wanted where not exists (select 1 from public.products p where p.id=wanted.product_id)
  ) then raise exception 'MERCHANDISING_SEED_PRODUCT_MISSING'; end if;
  if exists (
    select 1 from jsonb_to_recordset(seed->'discount_items') i(discount_id bigint)
    where not exists (select 1 from public.discounts d where d.id=i.discount_id)
      and not exists (select 1 from jsonb_to_recordset(seed->'discounts') d(id bigint) where d.id=i.discount_id)
  ) or exists (
    select 1 from jsonb_to_recordset(seed->'product_section_items') i(section_id bigint)
    where not exists (select 1 from public.product_sections s where s.id=i.section_id)
      and not exists (select 1 from jsonb_to_recordset(seed->'product_sections') s(id bigint) where s.id=i.section_id)
  ) then raise exception 'MERCHANDISING_SEED_PARENT_MISSING'; end if;

  if exists (
    with campaigns as (
      select id,starts_at,ends_at,is_active from public.discounts
      union all select id,starts_at,ends_at,is_active
      from jsonb_to_recordset(seed->'discounts') d(id bigint,starts_at timestamptz,ends_at timestamptz,is_active boolean)
    ), links as (
      select discount_id,product_id from public.discount_items
      union all select discount_id,product_id from jsonb_to_recordset(seed->'discount_items') i(discount_id bigint,product_id bigint)
    ), candidates as (
      select c.*,l.product_id from campaigns c join links l on l.discount_id=c.id where c.is_active
    ) select 1 from candidates a join candidates b on a.product_id=b.product_id and a.id<b.id
      where a.starts_at<b.ends_at and b.starts_at<a.ends_at
  ) then raise exception 'MERCHANDISING_SEED_PERIOD_OVERLAP'; end if;

  insert into public.product_stats(product_id,total_sales,today_sales,weekly_sales,monthly_sales)
    select product_id,total_sales,today_sales,weekly_sales,monthly_sales
    from jsonb_to_recordset(seed->'product_stats') x(product_id bigint,total_sales integer,today_sales integer,weekly_sales integer,monthly_sales integer);
  insert into public.discounts(id,title,starts_at,ends_at,priority,is_active)
    select id,title,starts_at,ends_at,priority,is_active
    from jsonb_to_recordset(seed->'discounts') x(id bigint,title text,starts_at timestamptz,ends_at timestamptz,priority integer,is_active boolean);
  insert into public.discount_items(discount_id,product_id,discount_rate)
    select discount_id,product_id,discount_rate
    from jsonb_to_recordset(seed->'discount_items') x(discount_id bigint,product_id bigint,discount_rate integer);
  insert into public.product_sections(id,title,display_order,desktop_rows,is_active)
    select id,title,display_order,desktop_rows,is_active
    from jsonb_to_recordset(seed->'product_sections') x(id bigint,title text,display_order integer,desktop_rows integer,is_active boolean);
  insert into public.product_section_items(section_id,product_id,display_order)
    select section_id,product_id,display_order
    from jsonb_to_recordset(seed->'product_section_items') x(section_id bigint,product_id bigint,display_order integer);
end $$;
commit;
