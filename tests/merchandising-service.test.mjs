import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createClient} from '@supabase/supabase-js';
import {loadTs} from './helpers/load-ts.mjs';

const {fixtureProductRepository}=loadTs('src/domains/product/fixture-repository.ts');
const [fixtureRow]=await fixtureProductRepository.findManyWithRelations({ids:[1]});
const row=(id=1)=>({...fixtureRow,product:{...fixtureRow.product,id,price:10000},
  stats:{product_id:id,total_sales:9001,today_sales:7,weekly_sales:50,monthly_sales:200}});
const now=new Date('2026-10-19T12:00:00+09:00');
const candidate=(productId=1,id=77,rate=35,changes={})=>({product_id:productId,discount_id:id,discount_rate:rate,
  discount:{id,title:`DB ${id}`,priority:3,is_active:true,starts_at:'2026-10-19T00:00:00+09:00',ends_at:'2026-10-20T14:00:00+09:00',...changes}});
const mapping=loadTs('src/domains/product/mapper.ts');
const {createProductService}=loadTs('src/domains/product/service.ts');
const baseCriteria={sizes:[],colorIds:[],priceRangeId:null,discountRateId:null,sort:'discount'};

test('DB discount wins over the same fixture ID in Model, card, detail, cart and filters',async()=>{
  const reads=[];
  const service=createProductService({findManyWithRelations:async()=>[row(1),row(2)]},
    {findByProductIds:async ids=>{reads.push(ids);return [candidate(),candidate(2,88,50)];}});
  const products=await service.findMany({now});
  assert.deepEqual(reads,[[1,2]]);
  assert.deepEqual(products.map(p=>[p.discountRate,p.appliedDiscountId]),[[35,77],[50,88]]);
  assert.equal(products[0].stats.totalSales,9001);
  const card=mapping.toProductCardViewModel(products[0]);
  assert.equal(card.discountRate,35);
  assert.equal(card.discountedPrice,6500);
  assert.equal(mapping.toProductDetailViewModel(products[0],products).discountRate,35);
  assert.equal(mapping.toProductCartItemViewModel(products[0],2).discountRate,35);
  const {filterProducts}=loadTs('src/domains/product/filter/domain.ts');
  assert.deepEqual(filterProducts(products,{...baseCriteria,discountRateId:'over-30'}).map(p=>p.id),[2,1]);
  assert.deepEqual(filterProducts(products,{...baseCriteria,discountRateId:'over-50'}).map(p=>p.id),[2]);
  assert.deepEqual(filterProducts(products,{...baseCriteria,sort:'price_asc'}).map(p=>p.id),[2,1]);
  assert.deepEqual(filterProducts(products,{...baseCriteria,sort:'price_desc'}).map(p=>p.id),[1,2]);
});

test('no candidates means 0/null, while empty or inactive-only products skip discount reads',async()=>{
  let reads=0;
  const discounts={findByProductIds:async()=>{reads++;return [];}};
  const product=await createProductService({findManyWithRelations:async()=>[row()]},discounts).findById(1,{now});
  assert.deepEqual([product.discountRate,product.appliedDiscountId],[0,null]);
  for(const rows of [[],[{...row(),product:{...row().product,state:'inactive'}}]]) {
    const service=createProductService({findManyWithRelations:async()=>rows},discounts);
    assert.equal(await service.findById(999,{now}),null);
    assert.deepEqual(await service.findSaleSections({now}),[]);
  }
  assert.equal(reads,1);
});

test('a discount read failure rejects both ordinary products and SALE instead of fixture fallback',async()=>{
  const service=createProductService({findManyWithRelations:async()=>[row()]},
    {findByProductIds:async()=>{throw new Error('discount read failed');}});
  await assert.rejects(service.findMany({now}),/discount read failed/);
  await assert.rejects(service.findSaleSections({now}),/discount read failed/);
});

test('each selector preserves its query and passes the same explicit clock to every choice',async()=>{
  const queries=[];
  const clocks=[];
  const service=createProductService({findManyWithRelations:async query=>{queries.push(query);return [row(1),row(2)];}},
    {findByProductIds:async()=>[]},(_id,_candidates,time)=>{clocks.push(time);return {discountRate:0,appliedDiscountId:null};});
  await service.findMany({now});
  await service.findById(1,{now});
  await service.findByIds([1,2],{now});
  await service.findByCategoryIds(['coat'],{now});
  await service.findByStyleId(1,{now});
  assert.deepEqual(queries,[undefined,{ids:[1]},{ids:[1,2]},{categoryIds:['coat']},{styleId:1}]);
  assert.equal(clocks.length,10);
  assert.ok(clocks.every(clock=>clock===now));
});

test('the default clock is captured before product IO crosses the campaign end',async t=>{
  const RealDate=globalThis.Date;
  let time=RealDate.parse('2026-10-20T13:59:59.999+09:00');
  globalThis.Date=class extends RealDate { constructor(...args){super(...(args.length?args:[time]));} };
  t.after(()=>{globalThis.Date=RealDate;});
  const service=createProductService({findManyWithRelations:async()=>{
    time=RealDate.parse('2026-10-20T14:00:00+09:00');return [row(1),row(2)];
  }},{findByProductIds:async()=>[candidate(),candidate(2)]});
  assert.deepEqual((await service.findMany()).map(p=>p.discountRate),[35,35]);
});

test('DB-public candidates and the app clock must both permit start and end boundaries',async()=>{
  const cases=[
    ['2026-10-18T23:59:59.999+09:00',[candidate()],0],
    ['2026-10-19T00:00:00+09:00',[],0],
    ['2026-10-19T00:00:00+09:00',[candidate()],35],
    ['2026-10-20T13:59:59.999+09:00',[],0],
    ['2026-10-20T14:00:00+09:00',[candidate()],0],
    ['2026-10-20T13:59:59.999+09:00',[candidate()],35],
  ];
  for(const [time,candidates,rate] of cases) {
    let reads=0;
    const service=createProductService({findManyWithRelations:async()=>[row()]},
      {findByProductIds:async()=>{reads++;return candidates;}});
    const product=await service.findById(1,{now:new Date(time)});
    assert.equal(product.discountRate,rate,time);
    assert.equal(product.appliedDiscountId,rate?77:null,time);
    assert.equal(reads,1,'never retrieve candidates hidden by DB again');
  }
});

test('SALE uses the same candidate snapshot for price, chosen campaign and metadata',async()=>{
  let reads=0;
  const first=[candidate(1,7,35),candidate(1,9,90,{priority:1}),candidate(2,9,50,{priority:1})];
  const changed=[candidate(1,7,80,{title:'changed'}),candidate(2,9,80,{title:'changed'})];
  const service=createProductService({findManyWithRelations:async()=>[row(1),row(2)]},
    {findByProductIds:async()=>++reads===1?first:changed});
  const sections=await service.findSaleSections({now});
  assert.equal(reads,1);
  assert.deepEqual(sections.map(s=>[s.id,s.title,s.endsAt,s.products.map(p=>[p.id,p.discountRate,p.appliedDiscountId])]),[
    [7,'DB 7','2026-10-20T14:00:00+09:00',[[1,35,7]]],
    [9,'DB 9','2026-10-20T14:00:00+09:00',[[2,50,9]]],
  ]);
});

test('SALE makes one discount HTTP query when all candidates fit in one page',async()=>{
  const requests=[];
  const client=createClient('https://catalog-test.supabase.co','test-anon-key',{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{fetch:async input=>{
      requests.push(new URL(String(input)));
      return new Response(JSON.stringify([candidate(),candidate(2)]),{headers:{'content-type':'application/json','content-range':'0-1/2'}});
    }},
  });
  const {discountRepository}=loadTs('src/domains/discount/discount.repository.ts',{'@/shared/lib/supabase/server':{supabase:client}});
  const service=createProductService({findManyWithRelations:async()=>[row(1),row(2)]},discountRepository);
  const sections=await service.findSaleSections({now});
  assert.equal(sections[0].products.length,2);
  assert.equal(requests.length,1);
  assert.equal(requests[0].pathname,'/rest/v1/discount_items');
});

test('fixture service retains expired demo discounts, sales and local URLs without a server client',async()=>{
  const blocked={'@/shared/lib/supabase/server':{get supabase(){throw new Error('Server client must not load');}}};
  const {fixtureProductService}=loadTs('src/domains/product/fixture-service.ts',blocked);
  const product=await fixtureProductService.findById(1,{now:new Date('2040-01-01')});
  assert.deepEqual([product.discountRate,product.appliedDiscountId,product.stats.totalSales],[20,1,2451]);
  assert.ok(product.images.every(image=>image.url.startsWith('/images/')));
  const {fixtureProductService:inactive}=loadTs('src/domains/product/fixture-service.ts',{
    ...blocked,'./fixture-repository':{fixtureProductRepository:{findManyWithRelations:async()=>[
      {...fixtureRow,product:{...fixtureRow.product,state:'inactive'}},
    ]}},
  });
  assert.deepEqual(await inactive.findMany(),[]);
  const [hidden]=await inactive.findByIdsIncludingInactive([1]);
  assert.deepEqual([hidden.state,hidden.discountRate,hidden.appliedDiscountId],['inactive',20,1]);
});

test('fixture candidate conversion preserves all three legacy campaigns and filters requested IDs',async()=>{
  const {fixtureDiscountRepository,selectFixtureProductDiscount}=loadTs('src/domains/discount/discount.fixture-repository.ts');
  const ids=Array.from({length:27},(_,i)=>i+1);
  const candidates=await fixtureDiscountRepository.findByProductIds(ids);
  assert.equal(candidates.length,15);
  assert.deepEqual(candidates.map(c=>[c.product_id,c.discount_id,c.discount_rate]),[
    [1,1,20],[2,1,20],[3,1,20],[4,1,10],[5,1,10],
    [6,2,15],[7,2,15],[8,2,15],[9,2,5],[10,2,5],
    [11,3,25],[12,3,25],[13,3,25],[14,3,10],[15,3,10],
  ]);
  assert.equal(candidates[5].discount.ends_at,'2026-04-30T00:00:00.000Z');
  assert.deepEqual(await fixtureDiscountRepository.findByProductIds([]),[]);
  assert.deepEqual((await fixtureDiscountRepository.findByProductIds([11,11])).map(c=>c.product_id),[11]);
  assert.deepEqual(selectFixtureProductDiscount(11,candidates),{discountRate:25,appliedDiscountId:3});
});

test('actual product composition injects the DB discount repository',async()=>{
  const {productService}=loadTs('src/domains/product/index.ts',{
    './repository':{productRepository:{findManyWithRelations:async()=>[row()]}},
    '@/domains/discount/discount.repository':{discountRepository:{findByProductIds:async()=>[candidate()]}},
    './section':{},
  });
  assert.equal((await productService.findById(1,{now})).discountRate,35);
  assert.equal((await productService.findById(1,{now:new Date('2040-01-01')})).discountRate,0);
});

function nodes(node) {
  if(!node||typeof node!=='object') return [];
  if(Array.isArray(node)) return node.flatMap(nodes);
  return [node,...nodes(node.props?.children)];
}
const model=(id=1,discountRate=35)=>mapping.toProductModel(row(id),{discountRate,appliedDiscountId:discountRate?77:null});

test('cart lookup and every style lookup share one clock and preserve option ownership and order',async()=>{
  const options=[];
  const a=model(1),b={...model(2),styleId:2,variants:[{...model(2).variants[0],id:77,productId:2,stock:0}]};
  const {POST}=loadTs('src/app/api/cart/products/route.ts',{'@/domains/product':{
    ...mapping,productService:{findByIds:async(ids,opts)=>{assert.deepEqual(ids,[2,1]);options.push(opts);return [a,b];},
      findByStyleId:async(id,opts)=>{options.push(opts);return [a,b].filter(product=>product.styleId===id);}},
  }});
  const response=await POST(new Request('http://localhost/api/cart/products',{method:'POST',headers:{'content-type':'application/json',origin:'http://localhost',host:'localhost'},
    body:JSON.stringify([{productId:2,variantId:77},{productId:1,variantId:2},{productId:1,variantId:77}])}));
  assert.equal(response.status,200);
  assert.deepEqual((await response.json()).cartItems.map(p=>[p.productId,p.variantId,p.discountRate,p.stock]),[[2,77,35,0],[1,2,35,a.variants.find(v=>v.id===2).stock]]);
  assert.equal(options.length,3);
  assert.ok(options[0]?.now instanceof Date);
  assert.ok(options.every(value=>value===options[0]));
});

test('product detail body uses one clock for the product and other colors',async()=>{
  const options=[];
  const {default:Page}=loadTs('src/app/(storefront)/product/[id]/page.tsx',{'@/domains/product':{
    ...mapping,productService:{findById:async(_id,opts)=>{options.push(opts);return model();},
      findByStyleId:async(_id,opts)=>{options.push(opts);return [model()];}},
  }});
  await Page({params:Promise.resolve({id:'1'})});
  assert.equal(options.length,2);
  assert.ok(options[0]?.now instanceof Date);
  assert.equal(options[0],options[1]);
});

test('home shares its clock with new-product selection and selects discounts from Model fields',async()=>{
  const products=[model(1,0),model(26,35)];
  let options,selectionClock;
  const pricing=loadTs('src/domains/product/domain.ts');
  const {default:Home}=loadTs('src/app/(storefront)/page.tsx',{
    '@/domains/product':{...mapping,...pricing,
      productService:{findMany:async opts=>{options=opts;return products;}},
      getNewProducts:(values,clock)=>{selectionClock=clock;return pricing.getNewProducts(values,clock);},
      productSectionRepository:{findActiveWithItems:async()=>({sections:[],items:[]})},
      createProductSections:()=>[],toProductSectionViewModels:()=>[],
    },
    '@/domains/category':{categoryRepository:{findMany:async()=>[]},createCategoryGroups:()=>[],toCategoryGroupViewModels:()=>[]},
    '@/domains/event':{eventRepository:{findMany:async()=>[]},toEventBannerViewModels:()=>[]},
  });
  const view=await Home();
  assert.ok(options?.now instanceof Date);
  assert.equal(options.now,selectionClock);
  assert.deepEqual(nodes(view).find(node=>node.props?.title==='할인 상품').props.products.map(p=>[p.id,p.discountRate]),[[26,35]]);
});
