// Minimal UI/app doubles for state-transition regressions. Browser tests cover real controls.
import {mountLearning} from '../../src/learning.js';
import {createNotebook,snapshot} from '../../src/notebook.js';
import {DEFAULT} from '../../src/model.js';
export function mount(seed=createNotebook(),initial=DEFAULT){
 const keys=['document','localStorage','fetch','setInterval','addEventListener'],original=new Map(keys.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 const nodes=new Map(),intervals=[],created=[];let raw=JSON.stringify(seed),w=snapshot(initial),motion={angle:0,velocity:0};
 class Element {
  constructor(){this.handlers={};this.textContent='';this.value='';this.innerHTML='';this.dataset={};}
  addEventListener(type,fn){this.handlers[type]=fn;}
  setAttribute(){} append(){} showModal(){} close(){}
  querySelector(selector){return selector==='.mini-controls'?null:node(selector);}
  querySelectorAll(){return [];}
 }
 function node(selector){if(!nodes.has(selector))nodes.set(selector,new Element());return nodes.get(selector);}
 const globals={document:{querySelector:node,createElement:tag=>{const el=new Element();el.tag=tag;created.push(el);return el;}},localStorage:{getItem:()=>raw,setItem:(_,v)=>{raw=v;}},fetch:()=>Promise.resolve({json:()=>Promise.resolve({id:'synthetic-regression'})}),setInterval:fn=>{intervals.push(fn);return 1;},addEventListener:()=>{}};
 for(const [key,value]of Object.entries(globals))Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});
 const app={get:()=>structuredClone(w),load:v=>{w=structuredClone(v);},math(){},mathVisible:()=>false,hold:()=>{w.held=true;motion={angle:0,velocity:0};},release:()=>{w.held=false;},motion:()=>motion,notice(){}};
 const api=mountLearning(app),click=action=>created.find(el=>el.tag==='nav').handlers.click({target:{closest:()=>({dataset:{lab:action}})}});
 return {api,node,click,read:()=>JSON.parse(raw),get:()=>structuredClone(w),app,setMotion:m=>{motion=m;},set:next=>{const before=w.state;w.state={...next};api.changed(before,next,w.held);},tick:()=>{const now=Date.now;Date.now=()=>now()+1000;try{intervals[0]();}finally{Date.now=now;}},dispose:()=>{for(const [k,d]of original)d?Object.defineProperty(globalThis,k,d):delete globalThis[k];}};
}
