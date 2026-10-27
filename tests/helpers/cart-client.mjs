import assert from 'node:assert/strict';
import React from 'react';
import { loadTs } from './load-ts.mjs';
import { cartView } from './cart-fixtures.mjs';

export const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; };
export const confirmed = (outcome = 'applied') => ({ status: 'ok', cart: cartView({ operation: {
  requestId: '20000000-0000-4000-8000-000000000001', outcome, notices: [], itemIdMap: {},
} }) });
export const nodes = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
export const text = node => node === null || node === undefined || typeof node === 'boolean' ? '' : typeof node !== 'object' ? String(node) : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);

// Real TSX and vanilla Store; replace React scheduling and public UI ports only.
export function client(file, name, { props = {}, phase = 'ready', cart = cartView(), store: providedStore, commands: overrides = {}, mocks = {} } = {}) {
  const store = providedStore ?? loadTs('src/domains/cart/cart.store.ts').createCartStore();
  if (!providedStore) store.getState().setStateFromController({ phase, cart, access: cart?.owner.kind === 'member' ? { status: 'member', userId: cart.owner.userId } : { status: 'guest' } });
  const calls = { add: [], adjust: [], option: [], remove: [], enter: 0, retry: 0, recheck: [], begin: 0, success: [], info: [], error: [], navigation: [] };
  const commands = {
    addItems: async items => { calls.add.push(items); return confirmed(); },
    adjustQuantity: async (...args) => { calls.adjust.push(args); return confirmed(); },
    changeOption: async (...args) => { calls.option.push(args); return confirmed(); },
    removeItems: async items => { calls.remove.push(items); return confirmed(); },
    moveHeldItems: async () => confirmed(),
    enterCart: async () => { calls.enter++; }, retry: async () => { calls.retry++; },
    recheck: async reason => { calls.recheck.push(reason); }, beginAuthTransition: () => { calls.begin++; },
    setSelected: (...args) => store.getState().setSelected(...args), selectAll: checked => store.getState().selectAll(checked), ...overrides,
  };
  const slots = []; const effects = []; let cursor = 0; let dirty = false; let tree; let currentProps = props;
  const changed = (a,b) => !a || !b || a.length !== b.length || a.some((v,i) => !Object.is(v,b[i]));
  const memo = (fn,deps) => { const i=cursor++; if (changed(slots[i]?.deps,deps)) slots[i]={deps,value:fn()}; return slots[i].value; };
  const react = { ...React, useMemo:memo, useCallback:(fn,deps)=>memo(()=>fn,deps),
    useRef: initial => { const i=cursor++; if (!slots[i]) slots[i]={value:{current:initial}}; return slots[i].value; },
    useState: initial => { const i=cursor++; if (!slots[i]) slots[i]={value:typeof initial==='function'?initial():initial}; return [slots[i].value,next=>{slots[i].value=typeof next==='function'?next(slots[i].value):next;dirty=true;}]; },
    useEffect:(effect,deps)=>{const i=cursor++;if(changed(slots[i]?.deps,deps))effects.push(()=>{slots[i]?.cleanup?.();slots[i]={deps,cleanup:effect()};});},
  };
  const cartHooks = { useCartState: selector => selector(store.getState()), useCartCommands: () => commands };
  const legacyState = { items:[], selectedIds:[], addToCart(){}, updateOption(){}, reconcileItems(){}, removeFromCart(){}, updateQuantity(){}, setSelectedIds(){}, toggleSelected(){}, selectAll(){}, clearCart(){} };
  const legacy = Object.assign(selector => selector ? selector(legacyState) : legacyState,{getState:()=>legacyState});
  const Module = loadTs(file, {
    react, '@/features/cart/use-cart':cartHooks, './use-cart':cartHooks,
    '@/domains/cart': { getCartItemCount: items=>items.reduce((sum,item)=>sum+item.quantity,0), useCartStore:legacy },
    'next/navigation': { usePathname:()=>'/mypage/orders', useSearchParams:()=>new URLSearchParams(), useParams:()=>({}), useRouter:()=>({push:href=>calls.navigation.push(href),replace:href=>calls.navigation.push(href),back(){},refresh(){}}) },
    '@/shared/hooks/use-media-query':{useMediaQuery:()=>true},
    sonner:{toast:{success:(...args)=>calls.success.push(args),info:(...args)=>calls.info.push(args),error:(...args)=>calls.error.push(args)}},
    ...mocks,
  });
  const unsubscribe = store.subscribe(()=>{dirty=true;});
  function render(next={}) {currentProps={...currentProps,...next};cursor=0;tree=Module[name](currentProps);dirty=false;return tree;}
  function flush(){for(let n=0;dirty||effects.length;n++){assert.ok(n<20,'UI must settle');if(dirty)render();for(const run of effects.splice(0))run();}}
  render();
  return {store,commands,calls,react,render,flush,tree:()=>tree,nodes:()=>nodes(tree),button:label=>nodes(tree).find(n=>n.props?.onClick&&text(n)===label),dispose(){slots.forEach(s=>s.cleanup?.());unsubscribe();}};
}
