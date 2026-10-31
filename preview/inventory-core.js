/* Quick slots are preferences. Selecting a blueprint never grants or spends stock. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.InventoryCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const ITEMS=Object.freeze({hand:{name:'採集・運搬',hint:'木・岩は押して採集。資材はつかんで運ぶ。空き地をドラッグで移動。',glyph:'✋'},axe:{name:'斧',hint:'木を押して伐採。落ちた資材はつかんで運べる。',glyph:'斧'},pickaxe:{name:'つるはし',hint:'岩・鉱脈を押して採掘。落ちた資材はつかんで運べる。',glyph:'⛏'},blower:{name:'送風機',recipe:'blower',glyph:'風'},belt:{name:'コンベア',recipe:'belt',glyph:'▰'},fence:{name:'誘導柵',recipe:'fence',glyph:'柵'},hopper:{name:'集積口',recipe:'hopper',glyph:'▽'},platform:{name:'受け土台',recipe:'platform',glyph:'▦'},loader:{name:'積み込み機',recipe:'loader',glyph:'⇧'},broom:{name:'箒',recipe:'broom',glyph:'箒'},magnet:{name:'磁石',recipe:'magnet',glyph:'∩'}});
 const DEFAULT=Object.freeze(['hand','blower','broom','belt','fence','hopper','platform','loader','magnet']);
 function slots(raw){const result=['hand'];for(const id of Array.isArray(raw)?raw:[])if(DEFAULT.includes(id)&&!result.includes(id))result.push(id);for(const id of DEFAULT)if(!result.includes(id))result.push(id);return result.slice(0,9);}
 function assign(raw,id,index=1){const next=slots(raw);if(!DEFAULT.includes(id)||id==='hand')return next;const from=next.indexOf(id),at=Math.max(1,Math.min(8,Math.floor(Number(index)||1)));if(from===at)return next;next.splice(from,1);next.splice(at,0,id);return next;}
 function canGather(id,type){return id==='hand'?['wood','stone','iron','food'].includes(type):id==='axe'?type==='wood':id==='pickaxe'?['stone','iron'].includes(type):id==='hand'&&type==='food';}
 return {ITEMS,DEFAULT,slots,assign,canGather};
});
