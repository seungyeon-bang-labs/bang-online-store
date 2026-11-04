import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';
import { client, deferred, nodes, text } from './helpers/cart-client.mjs';
import { I1, I2, cartView } from './helpers/cart-fixtures.mjs';

const productProps = { productId:1,colors:[],price:10001,discount:15,variants:[{id:2,size:'M',stock:10,priceOffset:500},{id:3,size:'L',stock:5,priceOffset:0}] };
function select(view, value) { const node=view.nodes().find(n=>n.props?.onValueChange);assert.ok(node,'size selector');node.props.onValueChange(String(value));view.flush(); }

test('member rows use UUID selection, include sold-out lines and delete only captured selected IDs',async t=>{
  const view=client('src/features/cart/cart-page-client.tsx','CartPageClient',{cart:cartView({items:[cartView().items[0],{...cartView().items[0],id:I2,variantId:7,stock:0}]})});t.after(()=>view.dispose());view.flush();
  assert.equal(view.calls.enter,1);assert.deepEqual(view.store.getState().selectedIds,[]);
  const all=view.nodes().find(n=>n.props?.id==='select-all');assert.ok(all);all.props.onCheckedChange(true);view.flush();
  assert.deepEqual(view.store.getState().selectedIds,[I1,I2]);
  assert.ok(view.nodes().filter(n=>n.props?.['aria-label']===`${cartView().items[0].name} 선택`).every(n=>!n.props.disabled));
  const summary=view.nodes().find(n=>n.props?.selectedProducts);assert.deepEqual(summary.props.selectedProducts.map(i=>i.id),[I1,I2]);
  const confirm=view.nodes().find(n=>n.props?.type==='selected'&&n.props.onConfirm).props.onConfirm;
  const before=view.store.getState().cart;view.store.getState().setStateFromController({cart:{...before,items:[...before.items,{...before.items[0],id:'10000000-0000-4000-8000-000000000003'}]}});
  await confirm();assert.deepEqual(view.calls.remove,[[I1,I2]]);
  const soldQuantity=view.nodes().filter(n=>n.props?.onIncrease&&n.props?.stock===0)[0];assert.ok(soldQuantity);await soldQuantity.props.onDecrease();assert.deepEqual(view.calls.adjust,[]);
});

test('a problem line keeps its quantity and shows one red mark with its reason; a fine line shows none',t=>{
  const base=cartView().items[0];const id3='10000000-0000-4000-8000-000000000003';
  const option=(productId,stocks)=>({productId,styleId:1,name:base.name,thumbnailUrl:base.thumbnailUrl,price:base.price,discountRate:base.discountRate,color:{id:productId,label:'',hex:''},variants:stocks.map((stock,index)=>({id:productId*10+index,size:'M',stock,priceOffset:0}))});
  const view=client('src/features/cart/cart-page-client.tsx','CartPageClient',{cart:cartView({
    items:[base,{...base,id:I2,variantId:7,quantity:5,stock:3},{...base,id:id3,variantId:8,stock:0}],
    optionGroups:{1:[option(1,[0,4])]},
  })});t.after(()=>view.dispose());view.flush();
  const card=id=>view.nodes().find(n=>n.props?.id===`cart-item-${id}`);
  const reasons=id=>nodes(card(id)).filter(n=>n.type==='p'&&n.props.className?.includes('bg-gray-100')).map(text);
  assert.ok(!card(I1).props.className.includes('border-red-200'));assert.deepEqual(reasons(I1),[]);
  assert.ok(card(I2).props.className.includes('border-red-200'));assert.deepEqual(reasons(I2),['재고 3개 · 수량을 줄여 주세요']);
  const over=nodes(card(I2)).find(n=>n.props?.onIncrease);assert.deepEqual([over.props.count,over.props.overStock],[5,true]);
  over.props.onDecrease();assert.deepEqual(view.calls.adjust,[[I2,-1]]);
  assert.deepEqual(reasons(id3),['선택한 옵션이 품절되었습니다 · 옵션을 변경해 주세요']);
  assert.ok(nodes(card(id3)).some(n=>typeof n.props?.className==='string'&&n.props.className.includes('text-red-500')&&text(n).includes(base.color)));
  assert.equal(nodes(card(id3)).find(n=>n.type==='fieldset').props.disabled,true);
  assert.ok(!nodes(card(id3)).some(n=>n.props?.label==='일시품절'));
  view.store.getState().setStateFromController({cart:{...view.store.getState().cart,optionGroups:{1:[option(1,[0,0])]}}});view.flush();
  assert.ok(nodes(card(id3)).some(n=>n.props?.label==='일시품절'));assert.deepEqual(reasons(id3),['모든 옵션이 품절되었습니다']);
});

test('주문하기 stops a selection with a problem line: 확인하기 scrolls to it, the other button orders only the fine lines',t=>{
  const base=cartView().items[0];const over={...base,id:I2,variantId:7,quantity:5,stock:3};
  const view=client('src/features/cart/cart-summary.tsx','CartSummary',{cart:cartView({items:[base,over]}),props:{selectedProducts:[base,over]}});t.after(()=>view.dispose());
  view.store.getState().setSelected(I1,true);view.store.getState().setSelected(I2,true);view.flush();
  const scrolled=[];globalThis.document={getElementById:id=>({scrollIntoView:options=>scrolled.push([id,options.block])})};t.after(()=>{delete globalThis.document;});
  const dialog=()=>view.nodes().find(n=>'open'in(n.props??{})&&n.props.onOpenChange);
  const closed=()=>{let prevented=0;view.nodes().find(n=>n.props?.onCloseAutoFocus).props.onCloseAutoFocus({preventDefault(){prevented++;}});return prevented;};
  view.button('주문하기').props.onClick();view.flush();
  assert.equal(dialog().props.open,true);assert.deepEqual(view.calls.navigation,[]);
  assert.ok(text(dialog()).includes(`${base.name} ${base.color} / ${base.size} — 재고 3개`),text(dialog()));
  dialog().props.onOpenChange(false);view.flush();
  assert.equal(closed(),0,'outside click and Esc only close');assert.deepEqual(scrolled,[]);
  view.button('주문하기').props.onClick();view.flush();
  view.button('확인하기').props.onClick();view.flush();
  assert.equal(dialog().props.open,false);assert.equal(closed(),1);assert.deepEqual(scrolled,[[`cart-item-${I2}`,'center']]);
  view.button('주문하기').props.onClick();view.flush();
  view.button('주문 가능한 상품만 주문하기').props.onClick();view.flush();
  assert.deepEqual(view.store.getState().selectedIds,[I1],'the problem line is only unselected, not removed');
  assert.deepEqual(view.calls.navigation,[`/checkout?items=${I1}`]);assert.deepEqual(view.calls.remove,[]);
  view.render({selectedProducts:[over]});view.flush();
  view.button('주문하기').props.onClick();view.flush();
  assert.equal(dialog().props.open,true);assert.equal(view.button('주문 가능한 상품만 주문하기'),undefined);
  view.render({selectedProducts:[base]});view.flush();
  view.button('주문하기').props.onClick();view.flush();
  assert.deepEqual(view.calls.navigation.at(-1),`/checkout?items=${I1}`);
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

const ready = (view, patch) => { view.store.getState().setStateFromController(patch); view.flush(); };

test('product add shows the success toast and clears selections only once saved', t => {
  for (const accepted of [true, false]) {
    const sent = [], saves = [];
    const view = client('src/features/product/product-form.tsx', 'ProductForm', { props: productProps, commands: { addItems: (items, onSaved) => { sent.push(items); saves.push(onSaved); return accepted; } } }); t.after(() => view.dispose());
    select(view, 2); select(view, 3);
    view.button('장바구니').props.onClick(); view.flush();
    assert.deepEqual(sent, [[{ productId: 1, variantId: 2, quantity: 1 }, { productId: 1, variantId: 3, quantity: 1 }]]);
    assert.equal(view.calls.success.length, 0, 'not before the cart saves it');
    assert.equal(view.nodes().some(n => n.props?.count === 1), true, 'selections stay until saved');
    if (!accepted) continue;
    saves[0](); view.flush();
    assert.equal(view.calls.success.length, 1);
    assert.equal(view.nodes().some(n => n.props?.count === 1), false, 'selections clear once saved');
  }
});

test('product add is disabled while the cart is locked and offers retry on error', t => {
  const view = client('src/features/product/product-form.tsx', 'ProductForm', { props: productProps }); t.after(() => view.dispose());
  select(view, 2);
  assert.equal(view.button('장바구니').props.disabled, false);
  ready(view, { busy: true });
  assert.equal(view.button('장바구니').props.disabled, true);
  ready(view, { busy: false, phase: 'error', cart: null, message: '장바구니를 불러오지 못했습니다.' });
  assert.equal(view.button('장바구니').props.disabled, true);
  assert.match(text(view.tree()), /장바구니를 불러오지 못했습니다/);
  view.button('다시 시도').props.onClick(); assert.equal(view.calls.retry, 1);
});

test('cart page disables changes while locked and retries only on error', t => {
  const view = client('src/features/cart/cart-page-client.tsx', 'CartPageClient', { phase: 'loading', cart: null }); t.after(() => view.dispose()); view.flush();
  // Loading keeps the select-all row (disabled) and shows a skeleton in place of the lines, not the empty state.
  assert.equal(view.nodes().find(n => n.props?.id === 'select-all').props.disabled, true);
  assert.equal(view.nodes().find(n => n.props?.type === 'selected').props.disableTrigger, true);
  assert.equal(view.nodes().some(n => n.type?.name === 'CartItemsSkeleton'), true);
  assert.equal(view.nodes().some(n => n.type?.name === 'EmptyState'), false);
  ready(view, { phase: 'ready', cart: cartView() });
  const deleteTrigger = () => view.nodes().find(n => n.props?.type === 'item' && 'disableTrigger' in n.props);
  const quantity = () => view.nodes().find(n => n.type === 'fieldset');
  assert.equal(deleteTrigger().props.disableTrigger, false);
  assert.equal(quantity().props.disabled, false);
  ready(view, { busy: true });
  assert.equal(deleteTrigger().props.disableTrigger, true);
  assert.equal(quantity().props.disabled, true);
  ready(view, { busy: false, phase: 'error', message: '장바구니를 불러오지 못했습니다.' });
  assert.equal(view.button('다시 시도').props.disabled, false);
  view.button('다시 시도').props.onClick(); assert.equal(view.calls.retry, 1);
  ready(view, { phase: 'restricted', cart: null, message: '이메일 인증과 회원 상태를 확인해주세요.' });
  assert.match(text(view.tree()), /이메일 인증/);
  assert.equal(view.button('다시 시도').props.disabled, true);
});

test('delete confirm closes only when removal was accepted', async t => {
  for (const accepted of [true, false]) {
    const removed = [];
    const view = client('src/features/cart/cart-page-client.tsx', 'CartPageClient', { commands: { removeItems: items => { removed.push(items); return accepted; } } }); t.after(() => view.dispose()); view.flush();
    const confirm = view.nodes().find(n => n.props?.type === 'item' && n.props.onConfirm).props.onConfirm;
    assert.equal(await confirm(), accepted);
    assert.deepEqual(removed, [[I1]]);
  }
});

for (const desktop of [true, false]) test(`${desktop ? 'desktop' : 'mobile'} option modal closes when the change is accepted and stays open when locked`, t => {
  for (const accepted of [true, false]) {
    const sent = [];
    const view = client('src/features/cart/option-change-modal.tsx', 'OptionChangeModal', { props: { itemId: I1, currentProductId: 1, currentVariantId: 2, productOptionViewModels: [{ productId: 1, styleId: 1, color: { id: 1, label: '회색', hex: '#888' }, variants: productProps.variants }] }, commands: { changeOption: (...args) => { sent.push(args); return accepted; } }, mocks: { '@/shared/hooks/use-media-query': { useMediaQuery: () => desktop } } }); t.after(() => view.dispose()); view.flush();
    const dialog = () => view.nodes().find(n => n.props?.onOpenChange && 'open' in n.props);
    const apply = () => view.button(desktop ? '변경 적용' : '변경 내용 저장');
    dialog().props.onOpenChange(true); view.flush(); select(view, 3);
    apply().props.onClick(); view.flush();
    assert.deepEqual(sent, [[I1, 1, 3]]);
    assert.equal(dialog().props.open, !accepted);
    if (!accepted) { ready(view, { busy: true }); assert.equal(apply().props.disabled, true); }
  }
});

test('headers show nothing while loading and the cart quantity plus pending adds', t => {
  for (const [file, name, props] of [['src/features/cart/cart-header.tsx', 'CartAwareHeader', {}], ['src/features/storefront/storefront-mobile-header.tsx', 'StorefrontMobileHeader', { categoryGroupViewModels: [] }], ['src/features/mypage/navigation/mobile-mypage-header.tsx', 'MypageMobileHeader', {}]]) {
    const view = client(file, name, { props, phase: 'loading', cart: null }); t.after(() => view.dispose());
    const count = () => { const badge = view.nodes().find(n => 'cartItemCount' in (n.props ?? {}) || 'count' in (n.props ?? {})); assert.ok(badge, name); return 'cartItemCount' in badge.props ? badge.props.cartItemCount : badge.props.count; };
    assert.equal(count(), null);
    ready(view, { phase: 'ready', cart: cartView({ items: [cartView().items[0], { ...cartView().items[0], id: I2, stock: 0, quantity: 3 }] }) });
    assert.equal(count(), 5);
    ready(view, { busy: true, pendingAdd: 2 });
    assert.equal(count(), 7, `${name} counts an add at once`);
  }
  const { CartItemCountBadge, getCartAriaLabel } = loadTs('src/shared/components/layout/cart-item-count-badge.tsx'); assert.equal(CartItemCountBadge({ count: null }), null); assert.notEqual(getCartAriaLabel(null), getCartAriaLabel(0));
});

test('home repurchase shows success only once saved and keeps demo source records', t => {
  for (const accepted of [true, false]) {
    const action = { cartItem: { productId: 1, variantId: 2, quantity: 2 } }; const original = structuredClone(action); const sent = [], saves = [];
    const view = client('src/features/mypage/home/hooks/use-order-action-command.ts', 'useOrderActionCommand', { commands: { addItems: (items, onSaved) => { sent.push(items); saves.push(onSaved); return accepted; } } }); t.after(() => view.dispose());
    view.tree()(action);
    assert.deepEqual(sent, [[action.cartItem]]);
    assert.equal(view.calls.success.length, 0, 'not before the cart saves it');
    if (accepted) saves[0]();
    assert.equal(view.calls.success.length, accepted ? 1 : 0);
    assert.deepEqual(action, original);
    assert.equal(view.calls.info.length, 0, 'no cart-check gate');
  }
});

test('repurchase is disabled while locked, reports success once saved and has no cart-check gate', t => {
  const sent = [], saves = [];
  const view = client('src/features/mypage/orders/order-item-actions.tsx', 'MypageOrderItemActions', { phase: 'loading', cart: null, props: { actions: { primary: { type: 'repurchase', label: '다시 담기' }, secondary: null, more: [] }, productName: '상품', orderId: 'demo-order', orderItemId: 'demo-item', repurchaseItem: { productId: 1, variantId: 2, quantity: 2 } }, commands: { addItems: (items, onSaved) => { sent.push(items); saves.push(onSaved); return true; } } }); t.after(() => view.dispose());
  let action = view.nodes().find(n => n.props?.action?.type === 'repurchase'); assert.equal(action.type(action.props).props.disabled, true);
  ready(view, { phase: 'ready', cart: cartView() });
  action = view.nodes().find(n => n.props?.action?.type === 'repurchase'); assert.equal(action.type(action.props).props.disabled, false);
  action.props.onAction(action.props.action);
  assert.deepEqual(sent, [[{ productId: 1, variantId: 2, quantity: 2 }]]);
  assert.equal(view.calls.success.length, 0, 'not before the cart saves it');
  saves[0]();
  assert.equal(view.calls.success.length, 1);
  assert.equal(view.calls.info.length, 0);
});

test('home repurchase buttons are disabled while the cart is locked', t => {
  const command = { type: 'repurchase', behavior: 'command', label: '재구매', cartItem: { productId: 1, variantId: 2, quantity: 1 } };
  const view = client('src/features/mypage/home/order-actions.tsx', 'MypageHomeOrderActions', { props: { actions: { primary: command, secondary: null, more: [command] }, orderTitle: '주문' } }); t.after(() => view.dispose());
  const buttons = () => view.nodes().filter(n => n.props?.action === command).map(n => n.type(n.props)).flatMap(node => nodes(node)).filter(n => 'disabled' in (n.props ?? {}));
  assert.ok(buttons().length >= 1);
  assert.ok(buttons().every(n => !n.props.disabled));
  ready(view, { busy: true });
  assert.ok(buttons().every(n => n.props.disabled));
  ready(view, { busy: false, phase: 'error', cart: null });
  assert.ok(buttons().every(n => n.props.disabled));
});

test('an empty cart shows the shared empty state stretched to the summary, and loading is announced outside the busy skeleton', t => {
  const view = client('src/features/cart/cart-page-client.tsx', 'CartPageClient', { cart: cartView({ items: [] }) }); t.after(() => view.dispose()); view.flush();
  const empty = view.nodes().find(n => n.type?.name === 'EmptyState');
  assert.equal(empty.props.fill, true);
  // The select-all row stays (disabled) on every screen size, so loading into an empty cart does not shift it.
  const selectAll = view.nodes().find(n => n.props?.id === 'select-all');
  assert.equal(selectAll.props.disabled, true);
  assert.doesNotMatch(view.nodes().find(n => String(n.props?.className).includes('sticky top-14')).props.className, /hidden/);
  assert.deepEqual(empty.props.action, { href: '/', label: '쇼핑 계속하기' });
  // Its only action is the filled button; mypage home passes outline for its three side-by-side empty states.
  assert.equal(nodes(empty.type(empty.props)).find(n => n.props?.href === '/').props.variant, 'default');
  assert.equal(view.nodes().some(n => n.type?.name === 'CartItemsSkeleton'), false);

  // The status line lives outside the busy skeleton and stays mounted; only its sentence changes.
  const status = view => view.nodes().find(n => n.props?.role === 'status');
  assert.equal(text(status(view)), '');

  const loading = client('src/features/cart/cart-page-client.tsx', 'CartPageClient', { phase: 'loading', cart: null }); t.after(() => loading.dispose()); loading.flush();
  assert.equal(text(status(loading)), '장바구니 상품을 불러오는 중입니다.');
  const skeleton = loading.nodes().find(n => n.type?.name === 'CartItemsSkeleton').type();
  assert.equal(skeleton.props['aria-busy'], 'true');
  assert.equal(nodes(skeleton).some(n => n.props?.role === 'status' || n.props?.['aria-live']), false);
  ready(loading, { phase: 'ready', cart: cartView({ items: [] }) });
  assert.equal(text(status(loading)), '');
});
