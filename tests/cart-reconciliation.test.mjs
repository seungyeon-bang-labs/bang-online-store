import { productResponse } from './helpers/cart-products.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { loadTs } from './helpers/load-ts.mjs';
import { client } from './helpers/cart-client.mjs';
import { I1, I2 } from './helpers/cart-fixtures.mjs';

const line=(extra={})=>({id:I1,productId:1,variantId:2,quantity:3,...extra});
const product=(productId=1,variantId=2,extra={})=>({productId,variantId,styleId:1,name:'상품',color:'회색',thumbnailUrl:'/file.svg',price:10000,discountRate:0,priceOffset:0,stock:10,size:'M',...extra});
const response=items=>Response.json(productResponse(items));
async function until(fn){for(let n=0;n<120;n++){if(fn())return;await setImmediate();}assert.fail('Request boundary not reached');}
async function mountCart(t,items=[line()]){
  let raw=null;let writes=0;const requests=[];
  const store=loadTs('src/domains/cart/store.ts').createCartStore();
  const local=loadTs('src/domains/cart/local.ts').createCartLocalAdapter({storage:{getItem:()=>raw,setItem:(_,value)=>{raw=value;writes++;}}});
  local.write(items);
  const previous=globalThis.fetch;
  const fetchBoundary=(url,options)=>new Promise((resolve,reject)=>requests.push({url,options,resolve,reject}));
  globalThis.fetch=fetchBoundary;
  const restore=()=>{if(globalThis.fetch===fetchBoundary)globalThis.fetch=previous;};
  t.after(restore);
  const {loadCartProducts}=loadTs('src/features/cart/cart.product-client.ts');
  const controller=loadTs('src/features/cart/cart-controller.ts').createCartController({store,local,loadProducts:loadCartProducts,newId:()=>I2,notify:{info(){},error(){}},actions:{resolveAccess:async()=>({status:'guest'}),read:async()=>{throw new Error('Member read forbidden');},mutate:async()=>{throw new Error('Member write forbidden');}}});
  const page=client('src/features/cart/cart-page-client.tsx','CartPageClient',{store,commands:{...controller,setSelected:(...a)=>store.getState().setSelected(...a),selectAll:c=>store.getState().selectAll(c)}});
  t.after(()=>{controller.dispose();page.dispose();});
  page.flush();controller.start({status:'guest'});await until(()=>requests.length===1);
  const idle=async()=>{await controller.whenIdle();page.flush();};
  return {controller,store,local,page,requests,idle,dispose(){controller.dispose();page.dispose();restore();},writes:()=>writes,async finish(products){requests.at(-1).resolve(response(products));await idle();}};
}
test('reconciliation removes unavailable pairs and their selections while preserving current quantities',async t=>{
  const cart=await mountCart(t,[line(),line({id:I2,productId:2,variantId:7,quantity:2})]);await cart.finish([product(),product(2,7)]);
  cart.store.getState().setSelected(I1,true);cart.store.getState().setSelected(I2,true);
  cart.controller.enterCart();await until(()=>cart.requests.length===2);await cart.finish([product(2,7)]);
  assert.deepEqual(cart.local.read().items,[line({id:I2,productId:2,variantId:7,quantity:2})]);assert.deepEqual(cart.store.getState().selectedIds,[]);
});
test('an empty successful response clears unavailable items, selections and the badge count',async t=>{
  const cart=await mountCart(t);await cart.finish([]);
  assert.deepEqual(cart.local.read().items,[]);assert.deepEqual(cart.store.getState().selectedIds,[]);
  assert.ok(cart.page.nodes().some(n=>n.props?.isEmpty===true));assert.equal(cart.store.getState().cart.notices[0].kind,'unavailable');assert.equal(cart.requests.length,1);
  const {getCartItemCount}=loadTs('src/domains/cart/domain.ts');assert.equal(getCartItemCount(cart.store.getState().cart.items),0);
});
test('a variant from another product cannot preserve an invalid cart pair',async t=>{
  const cart=await mountCart(t);await cart.finish([product(9,2)]);assert.deepEqual(cart.local.read().items,[line()]);
  assert.equal(cart.store.getState().phase,'error'); // HTTP boundary rejects unsolicited pairs, preserving durable input.
});
test('unchanged guest responses do not write local storage or trigger a repeat product query',async t=>{
  const cart=await mountCart(t);const before=cart.writes();await cart.finish([product()]);assert.equal(cart.writes(),before);assert.equal(cart.requests.length,1);
});
test('stale product snapshots cannot delete additions, changed options, quantities or re-added UUIDs',async t=>{
  for(const current of [[line(),line({id:I2,productId:2,variantId:7})],[line({productId:2,variantId:7})],[line({quantity:4})],[line({id:I2})]]){
    const cart=await mountCart(t);cart.local.write(current);cart.requests[0].resolve(response([]));
    await until(()=>cart.requests.length===2);await cart.finish(current.map(item=>product(item.productId,item.variantId)));
    assert.deepEqual(cart.local.read().items,current);assert.equal(cart.store.getState().phase,'ready');
    assert.deepEqual(cart.store.getState().cart.items.map(item=>item.id),current.map(item=>item.id));cart.dispose();
  }
});
test('partial cleanup preserves sold-out quantities and removes them from order selection without query loops',async t=>{
  const cart=await mountCart(t,[line(),line({id:I2,productId:2,variantId:7})]);await cart.finish([product(1,2,{stock:0})]);
  assert.deepEqual(cart.local.read().items,[line()]);assert.equal(cart.store.getState().cart.items[0].quantity,3);assert.deepEqual(cart.store.getState().selectedIds,[]);
  const summary=cart.page.nodes().find(n=>n.props?.selectedProducts);assert.deepEqual(summary.props.selectedProducts,[]);assert.equal(cart.requests.length,1);
});
test('HTTP, network and JSON failures preserve local source and provide a working page retry',async t=>{
  for(const fail of [request=>request.resolve(new Response(null,{status:500})),request=>request.reject(new Error('offline')),request=>request.resolve(new Response('invalid',{status:200}))]){
    const cart=await mountCart(t);const before=cart.local.read();fail(cart.requests[0]);await cart.idle();assert.deepEqual(cart.local.read(),before);assert.ok(cart.page.nodes().some(n=>n.props?.role==='alert'));
    cart.page.button('다시 시도').props.onClick();await until(()=>cart.requests.length===2);await cart.finish([product()]);
    assert.equal(cart.store.getState().phase,'ready');assert.deepEqual(cart.local.read(),before);cart.dispose();
  }
});
test('an old success before a page render cannot delete a newly persisted line',async t=>{
  const cart=await mountCart(t);const next=[line(),line({id:I2,productId:2,variantId:7})];cart.local.write(next);cart.requests[0].resolve(response([]));
  await until(()=>cart.requests.length===2);await cart.finish([product(),product(2,7)]);
  assert.deepEqual(cart.local.read().items,next);assert.equal(cart.store.getState().phase,'ready');
});
test('disposing the Provider controller makes late results unable to clear persisted items',async t=>{
  const cart=await mountCart(t);cart.controller.dispose();cart.requests[0].resolve(response([]));await cart.idle();
  assert.deepEqual(cart.local.read().items,[line()]);assert.equal(cart.store.getState().cart,null);
});
