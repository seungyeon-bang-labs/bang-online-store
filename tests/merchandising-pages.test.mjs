import assert from 'node:assert/strict';
import {test} from 'node:test';
import {loadTs} from './helpers/load-ts.mjs';

const mapping=loadTs('src/domains/product/mapper.ts');
const pricing=loadTs('src/domains/product/domain.ts');
const sale=loadTs('src/domains/product/sale.ts');
const sectionDomain=loadTs('src/domains/product/section/domain.ts');
const sectionMapping=loadTs('src/domains/product/section/mapper.ts');
const {createProductService}=loadTs('src/domains/product/service.ts');
const events={...loadTs('src/domains/event/repository.ts'),
  ...loadTs('src/domains/event/mapper.ts',{'@/domains/product':mapping})};
const fixedNow=new Date('2026-10-19T12:00:00+09:00');
const row=(id,changes={})=>({
  product:{id,style_id:id,color_id:id,display_name:`DB product ${id}`,price:10000,state:'active',
    created_at:'2026-09-01T12:00:00+09:00',restocked_at:null,...changes},
  style:{id,name:`Style ${id}`,category_id:'tops',created_at:'2026-09-01T12:00:00+09:00',updated_at:'2026-09-01T12:00:00+09:00'},
  color:{id,name:'black',code:'BK',hex_code:'#000000'},
  variants:[{id:id*10,sku:`TEST-${id}`,product_id:id,size:'M',stock:10,price_offset:0}],stats:null,images:[],
});
const candidate=(productId,id,priority=1,changes={})=>({product_id:productId,discount_id:id,discount_rate:35,
  discount:{id,title:`DB campaign ${id}`,priority,is_active:true,starts_at:'2026-10-19T00:00:00+09:00',ends_at:'2026-10-20T00:00:00+09:00',...changes}});
const service=(rows,candidates=[])=>createProductService({findManyWithRelations:async()=>rows},
  {findByProductIds:async()=>candidates});
const model=id=>mapping.toProductModel(row(id),{discountRate:35,appliedDiscountId:7});
function nodes(node) {
  if(!node||typeof node!=='object') return [];
  if(Array.isArray(node)) return node.flatMap(nodes);
  return [node,...nodes(node.props?.children)];
}
const productSections=view=>nodes(view).filter(node=>node.props?.productCardViewModels);
function freezeClock(t) {
  const RealDate=globalThis.Date;
  globalThis.Date=class extends RealDate { constructor(...args){super(...(args.length?args:[fixedNow.getTime()]));} };
  t.after(()=>{globalThis.Date=RealDate;});
}
const productExports={...mapping,...pricing,...sale,...sectionDomain,...sectionMapping};

test('SALE has one chosen campaign per product, stable display priority and sold-out active cards',async()=>{
  const soldOut=row(1); soldOut.variants[0].stock=0;
  const products=[soldOut,row(2),row(3,{state:'inactive'}),row(4),row(5),row(6)];
  const candidates=[candidate(1,9,1),candidate(1,7,2),candidate(2,3,2),candidate(3,8),
    candidate(4,4,1,{starts_at:'2026-10-20T00:00:00+09:00',ends_at:'2026-10-21T00:00:00+09:00'}),
    candidate(4,2,1,{is_active:false}),candidate(5,6,1,{ends_at:'2026-10-19T12:00:00+09:00'}),candidate(6,5)];
  const sections=await service(products,candidates).findSaleSections({now:fixedNow});
  const before=JSON.stringify(sections);
  const views=sale.toSaleSectionViewModels(sections,fixedNow);
  assert.deepEqual(views.map(s=>[s.id,s.productCardViewModels.map(p=>p.id)]),[[5,[6]],[3,[2]],[7,[1]]]);
  assert.ok(views.every(s=>s.remainingLabel==='오늘 종료'));
  assert.equal(views.find(s=>s.id===7).productCardViewModels[0].isSoldOut,true);
  assert.equal(JSON.stringify(sections),before);
});

test('SALE mapper hides empty or ended sections and retains a precise non-midnight boundary',()=>{
  const sections=[
    {id:1,title:'empty',priority:1,endsAt:'2026-10-21T00:00:00+09:00',products:[]},
    {id:2,title:'ended',priority:1,endsAt:'2026-10-20T00:00:00+09:00',products:[model(1)]},
    {id:3,title:'precise',priority:1,endsAt:'2026-10-20T00:00:00.000001+09:00',products:[model(2)]},
  ];
  const views=sale.toSaleSectionViewModels(sections,new Date('2026-10-20T00:00:00+09:00'));
  assert.deepEqual(views.map(s=>[s.id,s.remainingLabel]),[[3,'오늘 00:00 종료']]);
});

function loadSale(productService,convert=sale.toSaleSectionViewModels) {
  return loadTs('src/app/(storefront)/sale/page.tsx',{
    '@/domains/product':{...productExports,productService,toSaleSectionViewModels:convert},
    '@/domains/event':events,
  }).default;
}

test('SALE page uses the shared query and clock while keeping its existing sale event banner',async t=>{
  freezeClock(t);
  let reads=0,options,viewClock;
  const query=service([row(26)],[candidate(26,77)]);
  const Page=loadSale({findMany:async()=>{throw new Error('Use the shared SALE query');},
    findSaleSections:async opts=>{reads++;options=opts;return query.findSaleSections(opts);}},
    (sections,clock)=>{viewClock=clock;return sale.toSaleSectionViewModels(sections,clock);});
  const view=await Page();
  assert.equal(reads,1);
  assert.equal(options.now,viewClock);
  assert.equal(options.now.getTime(),fixedNow.getTime());
  const sections=productSections(view);
  assert.deepEqual(sections.map(s=>s.props.productCardViewModels.map(p=>p.id)),[[26]]);
  assert.equal(sections[0].key,'77');
  assert.deepEqual(nodes(view).find(node=>node.props?.eventBannerViewModels).props.eventBannerViewModels.map(e=>e.id),[5]);
});

test('hiding all SALE campaigns does not hide or replace the fixture sale event',async t=>{
  freezeClock(t);
  const view=await loadSale(service([row(1)]))();
  assert.deepEqual(productSections(view),[]);
  assert.deepEqual(nodes(view).find(node=>node.props?.eventBannerViewModels).props.eventBannerViewModels.map(e=>e.id),[5]);
});

test('home section ties use ID order and preserve item order, row counts and input arrays',()=>{
  const sections=[{id:8,title:'eight',display_order:1,desktop_rows:2,is_active:true},
    {id:3,title:'three',display_order:1,desktop_rows:1,is_active:true}];
  const items=[{section_id:8,product_id:1,display_order:2},{section_id:8,product_id:3,display_order:0},
    {section_id:3,product_id:1,display_order:0}];
  const before=JSON.stringify({sections,items});
  const views=sectionMapping.toProductSectionViewModels(sectionDomain.createProductSections(sections,items),
    [mapping.toProductCardViewModel(model(1)),mapping.toProductCardViewModel(model(3))]);
  assert.deepEqual(views.map(s=>[s.id,s.desktopRows,s.productCardViewModels.map(p=>p.id)]),[[3,1,[1]],[8,2,[3,1]]]);
  assert.equal(JSON.stringify({sections,items}),before);
});

const categoryMock={categoryRepository:{findMany:async()=>[]},createCategoryGroups:()=>[],toCategoryGroupViewModels:()=>[]};
function loadHome(productService,data={sections:[],items:[]}) {
  return loadTs('src/app/(storefront)/page.tsx',{'@/domains/product':{
    ...productExports,productService,productSectionRepository:{findActiveWithItems:async()=>data},
  },'@/domains/category':categoryMock,'@/domains/event':events}).default;
}

test('home omits missing and inactive products, keeps sold-out rows and hides empty section titles',async t=>{
  freezeClock(t);
  const soldOut=row(1); soldOut.variants[0].stock=0;
  const data={sections:[{id:8,title:'DB eight',display_order:1,desktop_rows:2,is_active:true},
    {id:3,title:'DB three',display_order:1,desktop_rows:1,is_active:true},
    {id:6,title:'empty title',display_order:0,desktop_rows:2,is_active:true}],
  items:[{section_id:8,product_id:1,display_order:2},{section_id:8,product_id:3,display_order:0},
    {section_id:3,product_id:1,display_order:0},{section_id:3,product_id:2,display_order:1},
    {section_id:6,product_id:2,display_order:0},{section_id:6,product_id:999,display_order:1}]};
  const view=await loadHome(service([soldOut,row(2,{state:'inactive'}),row(3)]),data)();
  const sliders=nodes(view).filter(node=>node.props?.products);
  assert.deepEqual(sliders.map(node=>[node.props.title,node.props.desktopRows,node.props.products.map(p=>p.id)]),[
    ['DB three',1,[1]],['DB eight',2,[3,1]],
  ]);
  assert.equal(sliders[0].props.products[0].isSoldOut,true);
});

test('home hides empty automatic new and discount sections including when only old regular products exist',async t=>{
  freezeClock(t);
  for(const rows of [[],[row(1)]]) {
    const view=await loadHome(service(rows))();
    assert.deepEqual(nodes(view).filter(node=>node.props?.products),[]);
  }
});

test('BEST sorts every tab by its DB stats field and treats missing stats as zero',async()=>{
  const rows=[row(1),row(2),row(3),row(4)];
  rows[0].stats={product_id:1,today_sales:30,weekly_sales:10,monthly_sales:20,total_sales:40};
  rows[1].stats={product_id:2,today_sales:10,weekly_sales:40,monthly_sales:30,total_sales:20};
  rows[2].stats={product_id:3,today_sales:20,weekly_sales:20,monthly_sales:40,total_sales:10};
  const {default:Best}=loadTs('src/app/(storefront)/best/page.tsx',{'@/domains/product':{...mapping,productService:service(rows)}});
  for(const [period,want] of [['daily',[1,3,2,4]],['weekly',[2,3,1,4]],['monthly',[3,2,1,4]],['total',[1,2,3,4]],[undefined,[1,3,2,4]]]) {
    const view=await Best({searchParams:Promise.resolve({period})});
    const items=nodes(view).filter(node=>node.props?.rank);
    assert.deepEqual(items.map(node=>node.props.product.id),want,period);
    assert.deepEqual(items.map(node=>node.props.rank),[1,2,3,4]);
  }
});

test('BEST retains the current full-list display count rather than introducing a new limit',async()=>{
  const rows=Array.from({length:27},(_,i)=>row(i+1));
  const {default:Best}=loadTs('src/app/(storefront)/best/page.tsx',{'@/domains/product':{...mapping,productService:service(rows)}});
  const view=await Best({searchParams:Promise.resolve({period:'total'})});
  assert.equal(nodes(view).filter(node=>node.props?.rank).length,27);
});

test('NEW keeps its new, restock, upcoming and past cohorts while cards use current Model discounts',async t=>{
  freezeClock(t);
  const rows=[row(1,{created_at:'2026-10-18T12:00:00+09:00'}),row(2,{restocked_at:'2026-10-18T12:00:00+09:00'}),
    row(3,{created_at:'2026-10-20T12:00:00+09:00'}),row(4,{restocked_at:'2026-10-21T12:00:00+09:00'}),row(5)];
  const {default:New}=loadTs('src/app/(storefront)/new/page.tsx',{'@/domains/product':{
    ...mapping,productService:service(rows,[candidate(1,77)]),
  },'@/domains/event':events});
  const cases=[['now',[['신규 발매 예정',[3]],['재입고 예정',[4]],['신규 발매',[1]],['재입고',[2]]]],
    ['new-arrivals',[['신규 발매',[1]]]],['restock',[['재입고',[2]]]],
    ['upcoming',[['신규 발매 예정',[3]],['재입고 예정',[4]]]],['past',[['신규 출시',[2,4,5]]]]];
  for(const [period,want] of cases) {
    const view=await New({searchParams:Promise.resolve({period})});
    const sections=productSections(view);
    assert.deepEqual(sections.map(node=>[node.props.title.replace(/^\d{2}\.\d{2}\.\d{2} /,''),
      node.props.productCardViewModels.map(p=>p.id)]),want,period);
    const card=sections.flatMap(node=>node.props.productCardViewModels).find(p=>p.id===1);
    if(card) assert.equal(card.discountRate,35);
    assert.deepEqual(nodes(view).find(node=>node.props?.eventBannerViewModels).props.eventBannerViewModels.map(e=>e.id),[1,6,7]);
  }
});
