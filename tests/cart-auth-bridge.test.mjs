import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { setImmediate } from 'node:timers/promises';
import { redirect as nextRedirect, unstable_rethrow } from 'next/navigation.js';
import { client } from './helpers/cart-client.mjs';
import { loadTs } from './helpers/load-ts.mjs';
import { A, I1, cartView } from './helpers/cart-fixtures.mjs';

// A real Next redirect control error, as the client action promise rejects with.
function redirectError(href){try{nextRedirect(href);}catch(error){return error;}assert.fail('redirect did not throw');}
const navigation=events=>({unstable_rethrow,useRouter:()=>({replace:href=>events.push(`replace:${href}`),push:href=>events.push(`push:${href}`),refresh:()=>events.push('refresh')})});
function formBoundary(values, errors) { return { useForm:()=>({register:()=>({}),handleSubmit:fn=>()=>fn(values),setError:(...args)=>errors.push(args),clearErrors(){},resetField(){},control:{},formState:{errors:{},isSubmitting:false}}),Controller:()=>null }; }

for(const target of ['/','/verify-email?email=visitor%40example.com'])test(`login redirect to ${target} is rethrown to Next without client navigation, refresh or a cart call`,async t=>{
  const events=[];const errors=[];const control=redirectError(target);
  const view=client('src/features/auth/login-form.tsx','LoginForm',{mocks:{
    'react-hook-form':formBoundary({email:'visitor@example.com',password:'Example!234'},errors),
    '@/app/(auth)/actions':{loginAction:async()=>{throw control;}},
    'next/navigation':navigation(events),
  }});t.after(()=>view.dispose());
  // The server redirect renders the target with the new session; CartBoundary receives it without router.refresh.
  await assert.rejects(view.tree().props.onSubmit(),error=>error===control);await setImmediate();
  assert.deepEqual([view.calls.enter,view.calls.retry,view.calls.add.length],[0,0,0]);assert.deepEqual(events,[]);assert.deepEqual(errors,[]);
});

test('a login transport failure still shows the existing retry message',async t=>{
  const errors=[];const view=client('src/features/auth/login-form.tsx','LoginForm',{mocks:{'react-hook-form':formBoundary({},errors),'@/app/(auth)/actions':{loginAction:async()=>{throw new TypeError('Failed to fetch');}},'next/navigation':navigation([])}});t.after(()=>view.dispose());
  await view.tree().props.onSubmit();assert.equal(errors.length,1);assert.equal(errors[0][0],'root');assert.match(errors[0][1].message,/다시 시도/);
});

test('login failure does not signal a successful cart authentication transition',async t=>{
  const errors=[];const view=client('src/features/auth/login-form.tsx','LoginForm',{mocks:{'react-hook-form':formBoundary({},errors),'@/app/(auth)/actions':{loginAction:async()=>({status:'error',message:'Invalid credentials'})}}});t.after(()=>view.dispose());
  await view.tree().props.onSubmit();assert.deepEqual([view.calls.enter,view.calls.retry,view.calls.add.length],[0,0,0]);assert.equal(errors.length,1);
});

for(const retry of [false,true])test(`${retry?'member retry':'OTP verification'} redirect is rethrown to Next without client navigation, refresh or a cart call`,async t=>{
  const events=[];const errors=[];const failure={ok:false,stage:'member',retryable:true,message:'다시 확인'};const control=redirectError('/');
  const view=client('src/features/auth/signup-otp-form.tsx','SignupOtpForm',{props:{email:'visitor@example.com',initialCodeRequested:!retry,...(retry?{initialMemberFailure:failure}:{})},mocks:{
    'react-hook-form':formBoundary({token:'123456'},errors),
    '@/app/(auth)/actions':{verifySignupOtpAction:async()=>{throw control;},retrySignupMemberAction:async()=>{throw control;}},
    'next/navigation':navigation(events),
  }});t.after(()=>view.dispose());
  await assert.rejects(retry?view.button('회원 상태 다시 확인').props.onClick():view.tree().props.onSubmit(),error=>error===control);await setImmediate();
  assert.deepEqual([view.calls.enter,view.calls.retry,view.calls.add.length],[0,0,0]);assert.deepEqual(events,[]);assert.deepEqual(errors,[]);
});

test('logout button is a plain form without cart commands',async t=>{
  let submissions=0;const action=async()=>{submissions++;};
  const view=client('src/features/auth/logout-button.tsx','LogoutButton',{props:{logoutAction:action},commands:{enterCart:()=>assert.fail('no cart command')},mocks:{react:{...React,useActionState:()=>[{message:'Logout failed'},action,false]}}});t.after(()=>view.dispose());
  assert.equal(view.tree().props.onSubmit,undefined);
  assert.equal(view.tree().props.action,action);await view.tree().props.action();assert.equal(submissions,1);
  assert.deepEqual([view.calls.enter,view.calls.retry,view.calls.add.length],[0,0,0]);
});

test('same-path logout switches the controller to guest and discards a late member response',async()=>{
  const {createCartStore}=loadTs('src/domains/cart/store.ts');const {createCartLocalAdapter}=loadTs('src/domains/cart/local.ts');const {createCartController}=loadTs('src/features/cart/cart-controller.ts');
  let raw=null;const store=createCartStore();const local=createCartLocalAdapter({storage:{getItem:()=>raw,setItem:(_,value)=>{raw=value;}}});
  let finish;const late=new Promise(resolve=>{finish=resolve;});let sent;
  const controller=createCartController({store,local,newId:()=> '40000000-0000-4000-8000-000000000002',notify:{info(){},error(){}},loadProducts:async()=>({cartItems:[],optionGroups:{}}),actions:{resolveAccess:async()=>({status:'guest'}),read:async()=>({status:'ok',cart:cartView()}),mutate:command=>{sent=command;return late;}}});
  controller.start({status:'member',userId:A});await controller.whenIdle();assert.equal(controller.adjustQuantity(I1,1),true);assert.ok(sent);
  controller.start({status:'guest'});await controller.whenIdle();
  assert.equal(store.getState().access.status,'guest');assert.equal(store.getState().cart.owner.kind,'guest');assert.deepEqual(store.getState().selectedIds,[]);
  finish({status:'ok',cart:cartView({revision:'999',operation:{requestId:sent.requestId,outcome:'applied',itemIdMap:{},notices:[]}})});await late;await controller.whenIdle();
  assert.equal(store.getState().cart.owner.kind,'guest');assert.equal(store.getState().busy,false);controller.dispose();
});
