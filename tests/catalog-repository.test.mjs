import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createClient} from '@supabase/supabase-js';
import {loadTs} from './helpers/load-ts.mjs';

const fixtures=loadTs('src/domains/product/fixture.ts');
const product=fixtures.PRODUCT_FIXTURE[0];
const style=fixtures.PRODUCT_STYLE_FIXTURE.find(row=>row.id===product.style_id);
const color=fixtures.PRODUCT_COLOR_FIXTURE.find(row=>row.id===product.color_id);
const joined={...product,style,color:{...color,label:color.name},
  variants:fixtures.PRODUCT_VARIANT_FIXTURE.filter(row=>row.product_id===1),
  images:[{id:1,product_id:1,image_path:'products/1/thumbnail.png',image_type:'thumbnail',display_order:0}]};
function catalogRequest({rows=[joined],error=false}={}){
 const requests=[];
 const client=createClient('https://catalog-test.supabase.co','test-anon-key',{
  auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
  global:{fetch:async input=>{
   const url=new URL(String(input)); requests.push(url);
   return new Response(JSON.stringify(error?{code:'42501',message:'PRIVATE_DB_DETAIL'}:rows),
    {status:error?403:200,headers:{'content-type':'application/json'}});
  }},
 });
 const mocks={'@/shared/lib/supabase/server':{supabase:client}};
 return {requests,mocks,repository:loadTs('src/domains/product/repository.ts',mocks).productRepository};
}

test('repository narrows IDs, category and style together and maps public image URLs',async()=>{
 const {repository,requests}=catalogRequest();
 const rows=await repository.findManyWithRelations({ids:[1],categoryIds:['coat'],styleId:1});
 assert.equal(requests.length,1);
 assert.equal(requests[0].pathname,'/rest/v1/products');
 assert.equal(requests[0].searchParams.get('id'),'in.(1)');
 assert.equal(requests[0].searchParams.get('state'),'eq.active');
 assert.equal(requests[0].searchParams.get('style.category_id'),'in.(coat)');
 assert.equal(requests[0].searchParams.get('style_id'),'eq.1');
 assert.equal(rows[0].color.name,'그레이');
 assert.equal(rows[0].images[0].image_url,'https://catalog-test.supabase.co/storage/v1/object/public/product-images/products/1/thumbnail.png');
 const {toProductModel,toProductCardViewModel}=loadTs('src/domains/product/mapper.ts');
 assert.equal(toProductCardViewModel(toProductModel(rows[0])).thumbnailUrl,rows[0].images[0].image_url);
});

test('empty criteria perform no requests and normal empty database results stay empty',async()=>{
 const {repository,requests}=catalogRequest({rows:[]});
 assert.deepEqual(await repository.findManyWithRelations({ids:[]}),[]);
 assert.deepEqual(await repository.findManyWithRelations({categoryIds:[]}),[]);
 assert.equal(requests.length,0);
 assert.deepEqual(await repository.findManyWithRelations(),[]);
 assert.equal(requests.length,1);
});

test('database errors propagate without fixture fallback or private diagnostics',async()=>{
 const {repository}=catalogRequest({error:true});
 await assert.rejects(repository.findManyWithRelations(),error=>{
  assert.ok(!error.message.includes('PRIVATE_DB_DETAIL'));
  return true;
 });
});

test('missing required style or color throws rather than hiding the product',async()=>{
 for(const missing of ['style','color']){
  const {repository}=catalogRequest({rows:[{...joined,[missing]:null}]});
  await assert.rejects(repository.findManyWithRelations(),/관계/);
 }
});

test('service forwards selectors and exposes only active products',async()=>{
 const {createProductService}=loadTs('src/domains/product/service.ts');
 const queries=[];
 const aggregate={product,style,color,variants:[],images:[],stats:null};
 const service=createProductService({findManyWithRelations:async query=>{
  queries.push(query);return [aggregate,{...aggregate,product:{...product,id:999,state:'inactive'}}];
 }});
 assert.deepEqual((await service.findMany()).map(row=>row.id),[1]);
 assert.equal((await service.findById(1)).id,1);
 await service.findByIds([1,2]);
 await service.findByCategoryIds(['coat']);
 await service.findByStyleId(1);
 assert.deepEqual(queries,[undefined,{ids:[1]},{ids:[1,2]},{categoryIds:['coat']},{styleId:1}]);
 assert.equal(service.findByIdsIncludingInactive,undefined);
});

test('fixture service remains independent of failed remote reads and keeps local URLs',async()=>{
 const mocks={'@/shared/lib/supabase/server':{get supabase(){throw new Error('Remote client must not load');}}};
 const {fixtureProductService}=loadTs('src/domains/product/fixture-service.ts',mocks);
 const rows=await fixtureProductService.findByIdsIncludingInactive([1]);
 assert.equal(rows[0].id,1);
 assert.ok(rows[0].images.every(image=>image.url.startsWith('/images/')));
});

test('categories preserve null root images and request display order with a stable tie break',async()=>{
 const {requests,mocks}=catalogRequest({rows:[
  {id:'outer',name:'OUTER',slug:'outer',parent_id:null,image_path:null,alt_text:null,display_order:0},
  {id:'coat',name:'코트',slug:'coat',parent_id:'outer',image_path:'categories/coat.png',alt_text:'코트',display_order:0},
 ]});
 const {categoryRepository}=loadTs('src/domains/category/repository.ts',mocks);
 const rows=await categoryRepository.findMany();
 assert.equal(requests[0].pathname,'/rest/v1/categories');
 assert.equal(requests[0].searchParams.get('order'),'display_order.asc,id.asc');
 assert.equal(rows[0].image_url,null);
 assert.equal(rows[1].image_url,'https://catalog-test.supabase.co/storage/v1/object/public/category-images/categories/coat.png');
});

test('product detail rejects malformed IDs before database reads and preserves read errors',async()=>{
 let reads=0;
 const {default:Page}=loadTs('src/app/(storefront)/product/[id]/page.tsx',{
  '@/domains/product':{productService:{findById:async()=>{reads++;throw new Error('DB unavailable');}}},
  'next/navigation':{notFound:()=>{throw new Error('NOT_FOUND');}},
 });
 for(const id of ['bad','0','-1','1.5','Infinity','9007199254740992']){
  await assert.rejects(Page({params:Promise.resolve({id})}),/NOT_FOUND/);
 }
 assert.equal(reads,0);
 await assert.rejects(Page({params:Promise.resolve({id:'1'})}),/DB unavailable/);
});

test('catalog error boundary retries with a new server request and hides private diagnostics',()=>{
 const {default:ErrorPage}=loadTs('src/app/error.tsx');
 let reloads=0;
 const previous=globalThis.window;
 globalThis.window={location:{reload:()=>{reloads++;}}};
 try{
  const view=ErrorPage({error:new Error('PRIVATE_DB_DETAIL')});
  const nodes=[];
  function visit(node){
   if(!node||typeof node!=='object')return;
   nodes.push(node);
   for(const child of [node.props?.children].flat())visit(child);
  }
  visit(view);
  const retry=nodes.find(node=>typeof node.props?.onClick==='function');
  assert.ok(retry);
  retry.props.onClick();
  assert.equal(reloads,1);
  assert.ok(!JSON.stringify(view).includes('PRIVATE_DB_DETAIL'));
 }finally{globalThis.window=previous;}
});
