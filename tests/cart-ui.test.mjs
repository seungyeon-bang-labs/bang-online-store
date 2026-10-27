import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';
import { client, confirmed, deferred, nodes, text } from './helpers/cart-client.mjs';
import { A, I1, I2, cartView } from './helpers/cart-fixtures.mjs';

const productProps = { productId:1,colors:[],price:10001,discount:15,variants:[{id:2,size:'M',stock:10,priceOffset:500},{id:3,size:'L',stock:5,priceOffset:0}] };
function select(view, value) { const node=view.nodes().find(n=>n.props?.onValueChange);assert.ok(node,'size selector');node.props.onValueChange(String(value));view.flush(); }

test('detail entry sends multiple selections as one command and clears only after confirmed success', async t => {
  const pending=deferred();const sent=[];
  const view=client('src/features/product/product-form.tsx','ProductForm',{props:productProps,commands:{addItems:items=>{sent.push(items);return pending.promise;}}});t.after(()=>view.dispose());
  select(view,2);select(view,3);
  const work=view.button('장바구니').props.onClick();view.flush();
  assert.deepEqual(sent,[[{productId:1,variantId:2,quantity:1},{productId:1,variantId:3,quantity:1}]]);
  assert.equal(view.calls.success.length,0);assert.equal(view.button('장바구니').props.disabled,true);
  pending.resolve(confirmed());await work;view.flush();
  assert.equal(view.calls.success.length,1);assert.equal(view.button('장바구니').props.disabled,true);
  assert.equal(view.nodes().filter(n=>n.props?.count===1).length,0);
});

for(const reply of [{status:'retryable',message:'재시도 필요'},confirmed('rejected')])test(`add ${reply.status==='ok'?'rejected':reply.status} keeps selections without success toast`,async t=>{
  const view=client('src/features/product/product-form.tsx','ProductForm',{props:productProps,commands:{addItems:async()=>reply}});t.after(()=>view.dispose());
  select(view,2);await view.button('장바구니').props.onClick();view.flush();
  assert.equal(view.calls.success.length,0);assert.equal(view.nodes().some(n=>n.props?.count===1),true);
});

test('cart lock disables additions and offers retry without stopping product browsing',async t=>{
  const view=client('src/features/product/product-form.tsx','ProductForm',{props:productProps,phase:'retryable'});t.after(()=>view.dispose());select(view,2);
  assert.equal(view.button('장바구니').props.disabled,true);
  const retry=view.button('다시 시도');assert.ok(retry);await retry.props.onClick();assert.equal(view.calls.retry,1);
});

test('member rows use UUID selection, exclude sold-out lines and delete only captured selected IDs',async t=>{
  const view=client('src/features/cart/cart-page-client.tsx','CartPageClient',{cart:cartView({items:[cartView().items[0],{...cartView().items[0],id:I2,variantId:7,stock:0,canSelect:false}]})});t.after(()=>view.dispose());view.flush();
  assert.equal(view.calls.enter,1);assert.deepEqual(view.store.getState().selectedIds,[]);
  const all=view.nodes().find(n=>n.props?.id==='select-all');assert.ok(all);all.props.onCheckedChange(true);view.flush();
  assert.deepEqual(view.store.getState().selectedIds,[I1]);
  const soldout=view.nodes().find(n=>n.props?.['aria-label']===`${cartView().items[0].name} 선택`&&n.props.disabled);assert.ok(soldout);
  const summary=view.nodes().find(n=>n.props?.selectedProducts);assert.deepEqual(summary.props.selectedProducts.map(i=>i.id),[I1]);
  const confirm=view.nodes().find(n=>n.props?.type==='selected'&&n.props.onConfirm).props.onConfirm;
  const before=view.store.getState().cart;view.store.getState().setStateFromController({cart:{...before,items:[...before.items,{...before.items[0],id:'10000000-0000-4000-8000-000000000003'}]}});
  await confirm();assert.deepEqual(view.calls.remove,[[I1]]);
  const soldQuantity=view.nodes().filter(n=>n.props?.onIncrease&&n.props?.stock===0)[0];assert.ok(soldQuantity);await soldQuantity.props.onDecrease();assert.deepEqual(view.calls.adjust,[]);
});

test('loading and lookup errors do not render a successful empty cart, and retry stays available',async t=>{
  const view=client('src/features/cart/cart-page-client.tsx','CartPageClient',{phase:'checking',cart:null});t.after(()=>view.dispose());view.flush();
  assert.equal(view.nodes().some(n=>n.props?.isEmpty===true),false);assert.match(text(view.tree()),/확인|불러오|복원/);
  view.store.getState().setStateFromController({phase:'retryable',message:'다시 확인해주세요.'});view.flush();
  assert.equal(view.nodes().some(n=>n.props?.isEmpty===true),false);await view.button('다시 시도').props.onClick();assert.equal(view.calls.retry,1);
});

for(const desktop of [true,false])for(const outcome of ['retryable','rejected','applied'])test(`${desktop?'desktop':'mobile'} option modal ${outcome} waits for the saved result using the source UUID`,async t=>{
  const wait=deferred();const sent=[];const view=client('src/features/cart/option-change-modal.tsx','OptionChangeModal',{props:{itemId:I1,currentProductId:1,currentVariantId:2,productOptionViewModels:[{productId:1,styleId:1,color:{id:1,label:'회색',hex:'#888'},variants:productProps.variants}]},commands:{changeOption:(...args)=>{sent.push(args);return wait.promise;}},mocks:{'@/shared/hooks/use-media-query':{useMediaQuery:()=>desktop}}});t.after(()=>view.dispose());view.flush();
  const dialog=()=>view.nodes().find(n=>n.props?.onOpenChange&&'open'in n.props);dialog().props.onOpenChange(true);view.flush();select(view,3);
  const work=view.button(desktop?'변경 적용':'변경 내용 저장').props.onClick();view.flush();assert.equal(dialog().props.open,true);assert.deepEqual(sent,[[I1,1,3]]);
  wait.resolve(outcome==='retryable'?{status:'retryable',message:'오류'}:confirmed(outcome));await work;view.flush();assert.equal(dialog().props.open,outcome!=='applied');
});

test('desktop, storefront mobile and mypage headers distinguish unknown count from ready quantities',t=>{
  for(const [file,name,props]of[['src/features/cart/cart-header.tsx','CartAwareHeader',{}],['src/features/storefront/storefront-mobile-header.tsx','StorefrontMobileHeader',{categoryGroupViewModels:[]}],['src/features/mypage/navigation/mobile-mypage-header.tsx','MypageMobileHeader',{}]]){
    const view=client(file,name,{props,phase:'checking',cart:null});t.after(()=>view.dispose());
    let badge=view.nodes().find(n=>'cartItemCount'in(n.props??{})||'count'in(n.props??{}));assert.ok(badge,name);assert.equal(('cartItemCount' in badge.props ? badge.props.cartItemCount : badge.props.count),null);
    view.store.getState().setStateFromController({phase:'ready',cart:cartView({items:[cartView().items[0],{...cartView().items[0],id:I2,stock:0,canSelect:false,quantity:3}]})});view.flush();badge=view.nodes().find(n=>'cartItemCount'in(n.props??{})||'count'in(n.props??{}));assert.equal(('cartItemCount' in badge.props ? badge.props.cartItemCount : badge.props.count),5);
    // A change or sync of the same cart keeps the last confirmed count instead of blinking.
    for(const phase of ['mutating','syncing','restoring']){view.store.getState().setStateFromController({phase});view.flush();badge=view.nodes().find(n=>'cartItemCount'in(n.props??{})||'count'in(n.props??{}));assert.equal(('cartItemCount' in badge.props ? badge.props.cartItemCount : badge.props.count),5,`${name} ${phase}`);}
    view.store.getState().setStateFromController({phase:'checking',cart:null});view.flush();badge=view.nodes().find(n=>'cartItemCount'in(n.props??{})||'count'in(n.props??{}));assert.equal(('cartItemCount' in badge.props ? badge.props.cartItemCount : badge.props.count),null);
  }
  const {CartItemCountBadge,getCartAriaLabel}=loadTs('src/shared/components/layout/cart-item-count-badge.tsx');assert.equal(CartItemCountBadge({count:null}),null);assert.notEqual(getCartAriaLabel(null),getCartAriaLabel(0));
});

test('repurchase commands await storage confirmation and preserve demo source records',async t=>{
  const action={cartItem:{productId:1,variantId:2,quantity:2}};const original=structuredClone(action);const wait=deferred();const sent=[];
  const view=client('src/features/mypage/home/hooks/use-order-action-command.ts','useOrderActionCommand',{commands:{addItems:items=>{sent.push(items);return wait.promise;}}});t.after(()=>view.dispose());
  const work=view.tree()(action);assert.equal(view.calls.success.length,0);assert.deepEqual(sent,[[action.cartItem]]);wait.resolve(confirmed());await work;assert.equal(view.calls.success.length,1);assert.deepEqual(action,original);
});

test('root mounts exactly one server cart boundary around all route children',()=>{
  function CartBoundary(){}const root=loadTs('src/app/layout.tsx',{'./globals.css':{},'next/font/google':{Geist:()=>({variable:'sans'}),Geist_Mono:()=>({variable:'mono'})},'./cart-boundary':{CartBoundary}}).default({children:'ALL ROUTES'});
  const boundaries=nodes(root).filter(n=>n.type===CartBoundary);assert.equal(boundaries.length,1);assert.equal(boundaries[0].props.children,'ALL ROUTES');
});

for(const saved of [false,true])test(`delete confirmation stays open until ${saved?'confirmed success':'a failed result'}`,async t=>{
  const wait=deferred();const view=client('src/features/cart/delete-confirm-modal.tsx','DeleteConfirmModal',{props:{onConfirm:()=>wait.promise,type:'item',disableTrigger:false}});t.after(()=>view.dispose());
  const modal=()=>view.nodes().find(n=>'open'in(n.props??{})&&n.props.onOpenChange);assert.ok(modal(),'controlled delete confirmation');modal().props.onOpenChange(true);view.flush();
  let prevented=0;const work=view.button('삭제하기').props.onClick({preventDefault(){prevented++;}});view.flush();assert.equal(prevented,1);assert.equal(modal().props.open,true);
  wait.resolve(saved);await work;view.flush();assert.equal(modal().props.open,!saved);
});

test('order item repurchase remains disabled while cart is locked and waits for confirmed acceptance',async t=>{
  const wait=deferred();const sent=[];const view=client('src/features/mypage/orders/order-item-actions.tsx','MypageOrderItemActions',{phase:'checking',props:{actions:{primary:{type:'repurchase',label:'다시 담기'},secondary:null,more:[]},productName:'상품',orderId:'demo-order',orderItemId:'demo-item',repurchaseItem:{productId:1,variantId:2,quantity:2}},commands:{addItems:items=>{sent.push(items);return wait.promise;}}});t.after(()=>view.dispose());
  let action=view.nodes().find(n=>n.props?.action?.type==='repurchase');assert.equal(action.type(action.props).props.disabled,true);
  view.store.getState().setStateFromController({phase:'ready'});view.flush();action=view.nodes().find(n=>n.props?.action?.type==='repurchase');const work=action.props.onAction(action.props.action);assert.equal(view.calls.success.length,0);assert.equal(sent.length,1);wait.resolve(confirmed('rejected'));await work;assert.equal(view.calls.success.length,0);
});

for (const recoveredElsewhere of [false, true]) test(`lost add response recovers its own receipt ${recoveredElsewhere ? 'after another tab acknowledges' : 'after a later operation'} without a second add`, async t => {
  const { A } = await import('./helpers/cart-fixtures.mjs');
  let raw = null, tail = Promise.resolve(), sequence = 0;
  const local = loadTs('src/domains/cart/cart.local.ts').createCartLocalAdapter({
    storage: { getItem: () => raw, setItem: (_, value) => { raw = value; } },
    locks: { request: (_, callback) => { const result = tail.then(callback); tail = result.catch(() => {}); return result; } },
    events: { subscribe: () => () => {} }, newId: () => `70000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`,
  });
  const sent = []; const saved = new Map(); let revision = 1;
  const actions = { resolveAccess: async () => ({ status: 'member', userId: A }), read: async () => ({ status: 'ok', cart: cartView({ revision: String(revision) }) }), mutate: async command => {
    sent.push(structuredClone(command));
    if (!saved.has(command.requestId)) saved.set(command.requestId, { requestId: command.requestId, outcome: 'applied', notices: [], itemIdMap: {} });
    revision++;
    if (sent.length === 1) throw new Error('committed but response lost');
    return { status: 'ok', cart: cartView({ revision: String(revision), operation: saved.get(command.requestId) }) };
  } };
  const create = () => {
    const store = loadTs('src/domains/cart/cart.store.ts').createCartStore();
    const controller = loadTs('src/features/cart/cart-controller.ts').createCartController({store, local, actions, loadProducts: async () => { throw new Error('member only'); }, newId: () => `80000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`});
    t.after(() => controller.dispose()); return { store, controller };
  };
  const {store,controller}=create(); await controller.start({status:'member',userId:A});
  const view=client('src/features/product/product-form.tsx','ProductForm',{props:productProps,store,commands:controller});t.after(()=>view.dispose());
  select(view,2);await view.button('장바구니').props.onClick();view.flush();
  assert.equal(store.getState().phase,'retryable');assert.equal(view.calls.success.length,0);
  if (recoveredElsewhere) { const other=create();await other.controller.start({status:'member',userId:A});await other.controller.retry();assert.equal(await local.peek(A),null); }
  await controller.retry();
  // A different consumer can replace the last receipt before this form renders.
  await controller.adjustQuantity(I1,1);
  view.flush();
  assert.equal(view.calls.success.length,1);
  assert.equal(view.nodes().some(node=>node.props?.count===1),false,'confirmed captured selections must be cleared');
  assert.equal(view.button('장바구니').props.disabled,true);
  await view.button('장바구니').props.onClick();view.flush();
  const adds=sent.filter(command=>command.operation.kind==='add_items');
  assert.equal(new Set(adds.map(command=>command.requestId)).size,1,'recovery must not create a second add intent');
  assert.ok(adds.length>=2);assert.deepEqual(adds[0],adds[1]);
  assert.equal(view.calls.success.length,1);
});

test('a definitively rejected add shows one error and does not wait for recovery',async t=>{
  const requestId='90000000-0000-4000-8000-000000000001';let view;
  view=client('src/features/product/product-form.tsx','ProductForm',{props:productProps,commands:{addItems:async()=>{
    // The controller records the rejection before it returns, as it does for a server-confirmed invalid reply.
    view.store.getState().setStateFromController({settledRequests:{[requestId]:{requestId,outcome:'rejected',itemIdMap:{},notices:[]}}});
    return {status:'invalid',message:'담을 수 없는 요청입니다.',requestId};
  }}});t.after(()=>view.dispose());
  select(view,2);await view.button('장바구니').props.onClick();view.flush();
  assert.equal(view.calls.error.length+view.calls.info.length,1);
  assert.equal(view.button('다시 시도'),undefined);
});

test('a double-clicked home repurchase sends one add and shows no error alongside its success',async t=>{
  const action={cartItem:{productId:1,variantId:2,quantity:2}};const wait=deferred();const sent=[];
  const view=client('src/features/mypage/home/hooks/use-order-action-command.ts','useOrderActionCommand',{commands:{addItems:items=>{sent.push(items);return wait.promise;}}});t.after(()=>view.dispose());
  const first=view.tree()(action);const second=view.tree()(action);
  wait.resolve(confirmed());await Promise.all([first,second]);
  assert.equal(sent.length,1);assert.equal(view.calls.success.length,1);assert.equal(view.calls.error.length,0);
});

test('a double-clicked order item repurchase sends one add',async t=>{
  const wait=deferred();const sent=[];const view=client('src/features/mypage/orders/order-item-actions.tsx','MypageOrderItemActions',{props:{actions:{primary:{type:'repurchase',label:'다시 담기'},secondary:null,more:[]},productName:'상품',orderId:'demo-order',orderItemId:'demo-item',repurchaseItem:{productId:1,variantId:2,quantity:2}},commands:{addItems:items=>{sent.push(items);return wait.promise;}}});t.after(()=>view.dispose());
  const action=view.nodes().find(n=>n.props?.action?.type==='repurchase');
  const first=action.props.onAction(action.props.action);const second=action.props.onAction(action.props.action);
  wait.resolve(confirmed());await Promise.all([first,second]);
  assert.equal(sent.length,1);assert.equal(view.calls.success.length,1);assert.equal(view.calls.error.length,0);
});

for(const [phase,shown] of [['mutating',false],['syncing',false],['checking',true],['retryable',true]])test(`product form ${shown?'shows':'hides'} the cart status line while ${phase}`,async t=>{
  const view=client('src/features/product/product-form.tsx','ProductForm',{props:productProps,phase});t.after(()=>view.dispose());view.flush();
  assert.equal(view.nodes().some(n=>n.props?.role==='status'||n.props?.role==='alert'),shown);
});

test('an unresolved request keeps the last count with a visible check label, and no count becomes check-only', () => {
  const { selectCartItemCount, selectCartNeedsCheck } = loadTs('src/features/cart/cart-count.ts');
  const { CartItemCountBadge, getCartAriaLabel } = loadTs('src/shared/components/layout/cart-item-count-badge.tsx');
  const base = { access: { status: 'member', userId: A }, selectedIds: [], message: null, settledRequests: {}, heldCount: 0 };
  const zero = cartView({ items: [] });
  assert.equal(selectCartItemCount({ ...base, phase: 'retryable', unresolved: true, cart: zero }), 0);
  assert.equal(selectCartNeedsCheck({ ...base, phase: 'retryable', unresolved: true, cart: zero }), true);
  assert.equal(selectCartNeedsCheck({ ...base, access: null, phase: 'checking', unresolved: true, cart: null }), false);
  assert.equal(text(CartItemCountBadge({ count: 0, needsCheck: true })), '0 확인 필요');
  assert.equal(text(CartItemCountBadge({ count: null, needsCheck: true })), '확인 필요');
  const wide = CartItemCountBadge({ count: 120, needsCheck: true, className: 'pointer-events-none absolute -right-2 -top-2' }).props.className;
  assert.match(wide, /whitespace-nowrap/);
  assert.match(wide, /(^|\s)right-0(\s|$)/);
  assert.doesNotMatch(wide, /-right-2/);
  assert.equal(text(CartItemCountBadge({ count: 120, needsCheck: true })), '99+ 확인 필요');
  assert.equal(getCartAriaLabel(3, true), '장바구니, 상품 3개, 확인 필요');
  assert.equal(getCartAriaLabel(null, true), '장바구니, 확인 필요');
});

test('every header shows the check label while the member has an unresolved request', t => {
  for (const [file, name, props] of [['src/features/cart/cart-header.tsx', 'CartAwareHeader', {}], ['src/features/storefront/storefront-mobile-header.tsx', 'StorefrontMobileHeader', { categoryGroupViewModels: [] }], ['src/features/mypage/navigation/mobile-mypage-header.tsx', 'MypageMobileHeader', {}]]) {
    const view = client(file, name, { props, phase: 'retryable' }); t.after(() => view.dispose());
    view.store.getState().setStateFromController({ unresolved: true }); view.flush();
    const html = JSON.stringify(view.nodes().map(node => node.props?.['aria-label']).filter(Boolean));
    const flagged = view.nodes().some(node => node.props?.cartNeedsCheck === true || node.props?.needsCheck === true);
    assert.ok(flagged || html.includes('확인 필요'), name);
  }
});

test('the cart page keeps the last cart with a progress line while a change is in flight', async t => {
  const view = client('src/features/cart/cart-page-client.tsx', 'CartPageClient', { phase: 'mutating' }); t.after(() => view.dispose());
  view.flush();
  assert.ok(view.nodes().some(n => n.props?.role === 'status' && text(n).includes('장바구니 변경을 확인하고 있습니다.')));
  assert.ok(view.nodes().some(n => text(n).includes(cartView().items[0].name)));
});

test('held items offer an explicit move on the cart page', async t => {
  let moved = 0;
  const view = client('src/features/cart/cart-page-client.tsx', 'CartPageClient', { commands: { moveHeldItems: async () => { moved++; return confirmed(); } } });
  t.after(() => view.dispose());
  view.store.getState().setStateFromController({ heldCount: 2 }); view.flush();
  assert.ok(view.nodes().some(n => text(n) === '로그인 전에 담은 상품 2개를 보관하고 있습니다.'));
  await view.button('보관 상품 다시 옮기기').props.onClick();
  assert.equal(moved, 1);
});

test('a product page blocked by an unresolved request links to the cart', async t => {
  const view = client('src/features/product/product-form.tsx', 'ProductForm', { phase: 'retryable', props: productProps });
  t.after(() => view.dispose());
  view.store.getState().setStateFromController({ unresolved: true, message: '확인이 필요한 장바구니 요청이 있습니다. 다시 시도를 눌러 확인해주세요.' }); view.flush();
  view.button('장바구니에서 확인').props.onClick();
  assert.equal(view.calls.navigation.length, 1);
});

test('mypage repurchase while the cart is not ready offers a way to the cart', async t => {
  const view = client('src/features/mypage/orders/order-item-actions.tsx', 'MypageOrderItemActions', { phase: 'retryable', props: { actions: { primary: { type: 'repurchase', label: '다시 담기' }, secondary: null, more: [] }, productName: '상품', orderId: 'demo-order', orderItemId: 'demo-item', repurchaseItem: { productId: 1, variantId: 2, quantity: 2 } } });
  t.after(() => view.dispose());
  const action = view.nodes().find(n => n.props?.action?.type === 'repurchase');
  await action.props.onAction(action.props.action);
  const [, options] = view.calls.info.at(-1);
  assert.equal(options.action.label, '장바구니 확인');
  options.action.onClick();
  assert.equal(view.calls.navigation.length, 1);
});

test('a definitively rejected held move is told once, by the held notice only', async t => {
  const view = client('src/features/cart/cart-page-client.tsx', 'CartPageClient', { commands: { moveHeldItems: async () => ({ status: 'conflict', message: '확정 거부' }) } });
  t.after(() => view.dispose());
  view.store.getState().setStateFromController({ heldCount: 1 }); view.flush();
  await view.button('보관 상품 다시 옮기기').props.onClick();
  assert.equal(view.calls.error.length, 0);
  assert.equal(view.calls.success.length, 0);
});

test('the product page hides the previous account\'s cart link while the account is unknown', async t => {
  const view = client('src/features/product/product-form.tsx', 'ProductForm', { phase: 'retryable', props: productProps });
  t.after(() => view.dispose());
  view.store.getState().setStateFromController({ unresolved: true, access: null, cart: null }); view.flush();
  assert.equal(view.button('장바구니에서 확인'), undefined);
});
