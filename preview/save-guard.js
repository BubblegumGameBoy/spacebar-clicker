/* A save belongs to the tab that last read or wrote this exact generation. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SaveGuard=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function create(storage,key,onConflict=()=>{}){let expected=null,blocked=false;try{expected=storage.getItem(key);}catch(_){}
  function check(){if(blocked)return false;let current;try{current=storage.getItem(key);}catch(_){return true;}if(current!==expected){blocked=true;onConflict();return false;}return true;}
  function write(value){if(!check())return false;storage.setItem(key,value);expected=String(value);return true;}
  return {check,write,get blocked(){return blocked;}};
 }
 function install(key){let guard;const show=()=>{const panel=document.createElement('div');panel.id='saveConflict';panel.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#15231ced;display:grid;place-content:center;padding:24px;color:#fff;text-align:center';const title=document.createElement('h2');title.textContent='別のタブで進行が保存されました';const text=document.createElement('p');text.textContent='このタブの進行を停止しました。最新の続きから再開してください。';const button=document.createElement('button');button.textContent='再読み込みして続ける';button.style.cssText='font:inherit;padding:14px';button.onclick=()=>location.reload();panel.append(title,text,button);document.body.append(panel);};
  guard=create(localStorage,key,show);window.addEventListener('storage',()=>guard.check());for(const type of ['pointerdown','pointerup','click','keydown'])document.addEventListener(type,event=>{if(event.target.closest?.('#saveConflict'))return;if(!guard.check()){event.preventDefault();event.stopImmediatePropagation();}},true);return guard;
 }
 return {create,install};
});
