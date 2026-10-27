import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';
import { client, deferred, nodes, text } from './helpers/cart-client.mjs';
import { I1, I2, cartView } from './helpers/cart-fixtures.mjs';

const productProps = { productId:1,colors:[],price:10001,discount:15,variants:[{id:2,size:'M',stock:10,priceOffset:500},{id:3,size:'L',stock:5,priceOffset:0}] };
function select(view, value) { const node=view.nodes().find(n=>n.props?.onValueChange);assert.ok(node,'size selector');node.props.onValueChange(String(value));view.flush(); }

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

test('product add shows the success toast only when accepted', t => {
  for (const accepted of [true, false]) {
    const sent = [];
    const view = client('src/features/product/product-form.tsx', 'ProductForm', { props: productProps, commands: { addItems: items => { sent.push(items); return accepted; } } }); t.after(() => view.dispose());
    select(view, 2); select(view, 3);
    view.button('장바구니').props.onClick(); view.flush();
    assert.deepEqual(sent, [[{ productId: 1, variantId: 2, quantity: 1 }, { productId: 1, variantId: 3, quantity: 1 }]]);
    assert.equal(view.calls.success.length, accepted ? 1 : 0);
    assert.equal(view.nodes().some(n => n.props?.count === 1), !accepted, 'selections clear only when accepted');
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
  assert.equal(view.nodes().some(n => n.props?.isEmpty === true), false);
  assert.match(text(view.tree()), /불러오/);
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
    ready(view, { phase: 'ready', cart: cartView({ items: [cartView().items[0], { ...cartView().items[0], id: I2, stock: 0, canSelect: false, quantity: 3 }] }) });
    assert.equal(count(), 5);
    ready(view, { busy: true, pendingAdd: 2 });
    assert.equal(count(), 7, `${name} counts an add at once`);
  }
  const { CartItemCountBadge, getCartAriaLabel } = loadTs('src/shared/components/layout/cart-item-count-badge.tsx'); assert.equal(CartItemCountBadge({ count: null }), null); assert.notEqual(getCartAriaLabel(null), getCartAriaLabel(0));
});

test('home repurchase shows success only when accepted and keeps demo source records', t => {
  for (const accepted of [true, false]) {
    const action = { cartItem: { productId: 1, variantId: 2, quantity: 2 } }; const original = structuredClone(action); const sent = [];
    const view = client('src/features/mypage/home/hooks/use-order-action-command.ts', 'useOrderActionCommand', { commands: { addItems: items => { sent.push(items); return accepted; } } }); t.after(() => view.dispose());
    view.tree()(action);
    assert.deepEqual(sent, [[action.cartItem]]);
    assert.equal(view.calls.success.length, accepted ? 1 : 0);
    assert.deepEqual(action, original);
    assert.equal(view.calls.info.length, 0, 'no cart-check gate');
  }
});

test('repurchase is disabled while locked and has no cart-check gate', t => {
  const sent = [];
  const view = client('src/features/mypage/orders/order-item-actions.tsx', 'MypageOrderItemActions', { phase: 'loading', cart: null, props: { actions: { primary: { type: 'repurchase', label: '다시 담기' }, secondary: null, more: [] }, productName: '상품', orderId: 'demo-order', orderItemId: 'demo-item', repurchaseItem: { productId: 1, variantId: 2, quantity: 2 } }, commands: { addItems: items => { sent.push(items); return true; } } }); t.after(() => view.dispose());
  let action = view.nodes().find(n => n.props?.action?.type === 'repurchase'); assert.equal(action.type(action.props).props.disabled, true);
  ready(view, { phase: 'ready', cart: cartView() });
  action = view.nodes().find(n => n.props?.action?.type === 'repurchase'); assert.equal(action.type(action.props).props.disabled, false);
  action.props.onAction(action.props.action);
  assert.deepEqual(sent, [[{ productId: 1, variantId: 2, quantity: 2 }]]);
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
