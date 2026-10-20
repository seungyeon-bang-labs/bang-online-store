import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createClient} from '@supabase/supabase-js';
import {loadTs} from './helpers/load-ts.mjs';

const fixtures=loadTs('src/domains/product/fixture.ts');
const first=fixtures.PRODUCT_FIXTURE[0];
function productRow(id=1,stats=null) {
  const style=fixtures.PRODUCT_STYLE_FIXTURE.find(row=>row.id===first.style_id);
  const color=fixtures.PRODUCT_COLOR_FIXTURE.find(row=>row.id===first.color_id);
  return {...first,id,style,color:{...color,label:color.name},stats,images:[],
    variants:[{id:id*10,sku:`TEST-${id}`,product_id:id,size:'M',stock:0,price_offset:500}]};
}
const campaign={id:41,title:'DB campaign',starts_at:'2026-10-19T00:00:00+09:00',
  ends_at:'2027-10-19T00:00:00+09:00',priority:3,is_active:true};
const candidate=(discountId,productId)=>({discount_id:discountId,product_id:productId,
  discount_rate:35,discount:{...campaign,id:discountId}});
const section=id=>({id,title:`DB section ${id}`,display_order:1000-id,desktop_rows:2,is_active:true});
const image=(id,productId=1)=>({id,product_id:productId,image_path:`products/${productId}/${id}.png`,
  image_type:'detail',display_order:id});

// The real SDK builds requests; only HTTP responses and server configuration are replaced.
function database({tables={},cap=2,fail,gap,respond,missingCount=false}={}) {
  const requests=[];
  const fetch=async(input,init)=>{
    const url=new URL(String(input));
    const table=url.pathname.split('/').at(-1);
    const offset=Number(url.searchParams.get('offset')??0);
    requests.push({url,init,table,offset});
    if(fail?.({table,offset,url})) return new Response(JSON.stringify({code:'42501',message:'PRIVATE_DB_DETAIL'}),
      {status:403,headers:{'content-type':'application/json'}});
    let rows=structuredClone(respond?.({table,offset,url,requests})??tables[table]??[]);
    for(const [key,value] of url.searchParams) {
      if(key==='select'||key==='order'||key==='offset'||key==='limit') continue;
      const get=row=>key==='style.category_id'?row.style?.category_id:row[key];
      if(value.startsWith('in.(')) {
        const values=value.slice(4,-1).split(',').map(item=>item.replaceAll('"',''));
        rows=rows.filter(row=>values.includes(String(get(row))));
      } else if(value.startsWith('eq.')) rows=rows.filter(row=>String(get(row))===value.slice(3));
    }
    for(const order of (url.searchParams.get('order')??'').split(',').reverse()) {
      if(!order) continue;
      const [field,direction]=order.split('.');
      rows.sort((a,b)=>(a[field]<b[field]?-1:a[field]>b[field]?1:0)*(direction==='desc'?-1:1));
    }
    const count=rows.length;
    const result=(gap?.({table,offset})?[]:rows.slice(offset,offset+Math.min(cap,Number(url.searchParams.get('limit')??cap))))
      .map(row=>table==='products'&&!url.searchParams.get('select')?.includes('images:')
        ?Object.fromEntries(Object.entries(row).filter(([key])=>key!=='images')):row);
    return new Response(JSON.stringify(result),{status:200,headers:{'content-type':'application/json',
      ...(missingCount?{}:{'content-range':`${result.length?`${offset}-${offset+result.length-1}`:'*'}/${count}`})}});
  };
  const client=createClient('https://catalog-test.supabase.co','test-anon-key',{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch},
  });
  const mocks={'@/shared/lib/supabase/server':{supabase:client}};
  return {requests,fetch,load:path=>loadTs(path,mocks)};
}

test('product stats use DB values while a missing stats row and sold-out variants retain the product',async()=>{
  const db=database({tables:{products:[productRow(1,{product_id:1,total_sales:9001,today_sales:99,weekly_sales:400,monthly_sales:800}),productRow(2)]}});
  const rows=await db.load('src/domains/product/repository.ts').productRepository.findManyWithRelations();
  assert.equal(rows[0].stats.total_sales,9001);
  assert.equal(rows[0].stats.today_sales,99);
  assert.equal(rows[1].stats,null);
  assert.equal(rows[0].variants[0].stock,0);
  const select=db.requests.find(r=>r.table==='products').url.searchParams.get('select');
  assert.match(select,/stats:product_stats\(/);
  assert.ok(!select.includes('product_stats!inner'));
});

test('product pages and unbounded images are complete under a smaller HTTP row cap',async()=>{
  const db=database({tables:{products:[5,4,3,2,1].map(id=>productRow(id)),
    product_images:[image(5),image(2),image(4),image(1),image(3)]}});
  const rows=await db.load('src/domains/product/repository.ts').productRepository.findManyWithRelations();
  assert.deepEqual(rows.map(row=>row.product.id),[1,2,3,4,5]);
  assert.deepEqual(rows[0].images.map(row=>row.id),[1,2,3,4,5]);
  assert.equal(rows[0].images[0].image_url,'https://catalog-test.supabase.co/storage/v1/object/public/product-images/products/1/1.png');
  assert.deepEqual(db.requests.filter(r=>r.table==='products').map(r=>r.offset),[0,2,4]);
  assert.deepEqual(db.requests.filter(r=>r.table==='product_images').map(r=>r.offset),[0,2,4]);
  assert.ok(db.requests.filter(r=>r.table==='products').every(r=>!r.url.searchParams.get('select').includes('images:')));
});

test('product ID and category batches preserve their intersection, style filter and global ID order',async()=>{
  const products=[1,2,3].map(id=>productRow(id));
  products[1].style={...products[1].style,category_id:'outside'};
  const db=database({tables:{products}});
  const ids=Array.from({length:205},(_,i)=>205-i);
  const categories=[products[0].style.category_id,...Array.from({length:204},(_,i)=>`category-${i}`)];
  const rows=await db.load('src/domains/product/repository.ts').productRepository.findManyWithRelations({ids,categoryIds:categories,styleId:first.style_id});
  assert.deepEqual(rows.map(row=>row.product.id),[1,3]);
  const requests=db.requests.filter(r=>r.table==='products');
  assert.ok(requests.length>1);
  for(const {url} of requests) {
    assert.ok(url.searchParams.get('id').slice(4,-1).split(',').length<=100);
    assert.ok(url.searchParams.get('style.category_id').slice(4,-1).split(',').length<=100);
    assert.equal(url.searchParams.get('style_id'),`eq.${first.style_id}`);
    assert.equal(url.searchParams.get('state'),'eq.active');
    assert.equal(url.searchParams.get('order'),'id.asc');
  }
});

test('images for products beyond the first ID batch retain the correct owners',async()=>{
  const db=database({tables:{products:Array.from({length:105},(_,i)=>productRow(i+1)),
    product_images:Array.from({length:105},(_,i)=>image(i+1,i+1))}});
  const rows=await db.load('src/domains/product/repository.ts').productRepository.findManyWithRelations();
  assert.equal(rows.length,105);
  assert.ok(rows.every(row=>row.images.length===1&&row.images[0].product_id===row.product.id));
  assert.equal(rows.at(-1).images[0].id,105);
  const requests=db.requests.filter(r=>r.table==='product_images');
  assert.ok(requests.some(r=>r.url.searchParams.get('product_id')==='in.(101,102,103,104,105)'));
  assert.ok(requests.every(r=>r.url.searchParams.get('product_id').slice(4,-1).split(',').length<=100));
});

test('empty products skip image reads and late product or image errors reject all results',async()=>{
  const empty=database();
  assert.deepEqual(await empty.load('src/domains/product/repository.ts').productRepository.findManyWithRelations(),[]);
  assert.equal(empty.requests.filter(r=>r.table==='product_images').length,0);
  for(const table of ['products','product_images']) {
    const db=database({tables:{products:[1,2,3].map(id=>productRow(id)),product_images:[image(1),image(2),image(3)]},
      fail:request=>request.table===table&&request.offset===2});
    await assert.rejects(db.load('src/domains/product/repository.ts').productRepository.findManyWithRelations(),
      error=>error.message.includes('상품')&&!error.message.includes('PRIVATE_DB_DETAIL'));
  }
});

test('discount reads batch IDs and collect every stable page with the same embedded campaign data',async()=>{
  const candidates=[candidate(3,1),candidate(1,1),candidate(2,1),candidate(1,2),candidate(1,205)];
  const db=database({tables:{discount_items:candidates}});
  const repository=db.load('src/domains/discount/discount.repository.ts').discountRepository;
  assert.deepEqual(await repository.findByProductIds([]),[]);
  assert.equal(db.requests.length,0);
  const rows=await repository.findByProductIds([...Array.from({length:205},(_,i)=>i+1),1]);
  assert.deepEqual(rows.map(row=>[row.discount_id,row.product_id]),[[1,1],[1,2],[1,205],[2,1],[3,1]]);
  assert.equal(rows.find(row=>row.product_id===205).discount.title,'DB campaign');
  for(const {url,table} of db.requests) {
    assert.equal(table,'discount_items');
    assert.equal(url.searchParams.get('order'),'discount_id.asc,product_id.asc');
    assert.match(url.searchParams.get('select'),/discount:discounts!inner\(/);
    assert.ok(url.searchParams.get('product_id').slice(4,-1).split(',').length<=100);
  }
  assert.ok(db.requests.some(r=>r.offset===2));
});

test('discount errors, incomplete pages and missing campaign relations never become no discount',async()=>{
  for(const options of [
    {tables:{discount_items:[candidate(1,1),candidate(2,1),candidate(3,1)]},fail:r=>r.offset===2},
    {tables:{discount_items:[candidate(1,1),candidate(2,1),candidate(3,1)]},gap:r=>r.offset===2},
    {tables:{discount_items:[{...candidate(1,1),discount:null}]}},
    {tables:{discount_items:[candidate(1,1)]},missingCount:true},
  ]) {
    const db=database(options);
    await assert.rejects(db.load('src/domains/discount/discount.repository.ts').discountRepository.findByProductIds([1]),
      error=>error.message.includes('할인')&&!error.message.includes('PRIVATE_DB_DETAIL'));
  }
  const empty=database();
  assert.deepEqual(await empty.load('src/domains/discount/discount.repository.ts').discountRepository.findByProductIds([999]),[]);
});

test('active section and link pages preserve display ordering and batch parent IDs',async()=>{
  const sections=Array.from({length:205},(_,i)=>section(i+1));
  sections.push({...section(999),is_active:false});
  const items=[{section_id:1,product_id:9,display_order:1},{section_id:1,product_id:4,display_order:0},
    {section_id:1,product_id:7,display_order:2},{section_id:205,product_id:5,display_order:0}];
  const db=database({tables:{product_sections:sections,product_section_items:items}});
  const rows=await db.load('src/domains/product/section/repository.ts').productSectionRepository.findActiveWithItems();
  assert.equal(rows.sections.length,205);
  assert.deepEqual(rows.sections.slice(0,3).map(row=>row.id),[205,204,203]);
  assert.deepEqual(rows.items.map(row=>row.product_id),[4,9,7,5]);
  for(const {table,url} of db.requests) {
    if(table==='product_sections') {
      assert.equal(url.searchParams.get('is_active'),'eq.true');
      assert.equal(url.searchParams.get('order'),'display_order.asc,id.asc');
    } else {
      assert.equal(table,'product_section_items');
      assert.equal(url.searchParams.get('order'),'section_id.asc,display_order.asc,product_id.asc');
      assert.ok(url.searchParams.get('section_id').slice(4,-1).split(',').length<=100);
    }
  }
});

test('empty sections skip links and a later parent or link failure rejects the entire result',async()=>{
  const empty=database();
  assert.deepEqual(await empty.load('src/domains/product/section/repository.ts').productSectionRepository.findActiveWithItems(),{sections:[],items:[]});
  assert.equal(empty.requests.length,1);
  for(const table of ['product_sections','product_section_items']) {
    const db=database({tables:{product_sections:[section(1),section(2),section(3)],
      product_section_items:[1,2,3].map(id=>({section_id:1,product_id:id,display_order:id}))},
      fail:r=>r.table===table&&r.offset===2});
    await assert.rejects(db.load('src/domains/product/section/repository.ts').productSectionRepository.findActiveWithItems(),
      error=>error.message.includes('진열')&&!error.message.includes('PRIVATE_DB_DETAIL'));
  }
});

test('actual shared server client requests no-store and reflects changes on the next read',async t=>{
  const previous={fetch:globalThis.fetch,url:process.env.SUPABASE_URL,key:process.env.SUPABASE_ANON_KEY};
  t.after(()=>{
    globalThis.fetch=previous.fetch;
    for(const [key,value] of [['SUPABASE_URL',previous.url],['SUPABASE_ANON_KEY',previous.key]]) {
      if(value===undefined) delete process.env[key]; else process.env[key]=value;
    }
  });
  process.env.SUPABASE_URL='https://catalog-test.supabase.co';
  process.env.SUPABASE_ANON_KEY='test-anon-key';
  let sales=700;
  const db=database({respond:({table})=>{
    if(table==='products') return [productRow(1,{product_id:1,total_sales:sales,today_sales:1,weekly_sales:2,monthly_sales:3})];
    if(table==='discount_items') return [{...candidate(1,1),discount_rate:sales===700?35:40}];
    if(table==='product_sections') return [{...section(1),title:`sales ${sales}`}];
    return [];
  }});
  globalThis.fetch=db.fetch;
  const product=loadTs('src/domains/product/repository.ts').productRepository;
  const discount=loadTs('src/domains/discount/discount.repository.ts').discountRepository;
  const sections=loadTs('src/domains/product/section/repository.ts').productSectionRepository;
  for(const [value,rate] of [[700,35],[701,40]]) {
    sales=value;
    assert.equal((await product.findManyWithRelations())[0].stats.total_sales,value);
    assert.equal((await discount.findByProductIds([1]))[0].discount_rate,rate);
    assert.equal((await sections.findActiveWithItems()).sections[0].title,`sales ${value}`);
  }
  assert.ok(db.requests.length>=8);
  assert.ok(db.requests.every(r=>r.init.cache==='no-store'));
});
