/* Quick slots are preferences. Selecting a blueprint never grants or spends stock. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.InventoryCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const ITEMS=Object.freeze({hand:{name:'手',hint:'資材をつかんで運ぶ・麦を収穫。空き地はドラッグで移動。',glyph:'✋'},axe:{name:'斧',hint:'木を押して伐採。落ちた資材はつかんで運べる。',glyph:'斧'},pickaxe:{name:'つるはし',hint:'岩・鉱脈を押して採掘。落ちた資材はつかんで運べる。',glyph:'⛏'},blower:{name:'送風機',recipe:'blower',glyph:'風'},belt:{name:'コンベア',recipe:'belt',glyph:'▰'},fence:{name:'誘導柵',recipe:'fence',glyph:'柵'},hopper:{name:'集積口',recipe:'hopper',glyph:'▽'},platform:{name:'受け土台',recipe:'platform',glyph:'▦'},loader:{name:'積み込み機',recipe:'loader',glyph:'⇧'},broom:{name:'箒',recipe:'broom',glyph:'箒'},magnet:{name:'磁石',recipe:'magnet',glyph:'∩'}});
 const DEFAULT=Object.freeze(['hand','axe','pickaxe','blower','belt','hopper','loader','broom','magnet']);
 function slots(raw){const seen=new Set();return DEFAULT.map((fallback,i)=>{let id=Array.isArray(raw)&&ITEMS[raw[i]]?raw[i]:fallback;if(i<3)id=DEFAULT[i];if(seen.has(id))id=DEFAULT.find(k=>!seen.has(k))||null;seen.add(id);return id;});}
 function assign(raw,id,index=3){const next=slots(raw);if(!ITEMS[id])return next;const found=next.indexOf(id);if(found>=0)return next;const at=Math.max(3,Math.min(8,Math.floor(Number(index)||3)));next[at]=id;return next;}
 function canGather(id,type){return id==='axe'?type==='wood':id==='pickaxe'?['stone','iron'].includes(type):id==='hand'&&type==='food';}
 return {ITEMS,DEFAULT,slots,assign,canGather};
});
