/* Resource properties shared by harvesting, hand tools and delivery. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MaterialsCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const definitions=Object.freeze({wood:Object.freeze({name:'木材',source:'木',mass:1,work:3,worker:'woodcutter'}),stone:Object.freeze({name:'石材',source:'岩',mass:2.5,work:5,worker:'miner'}),food:Object.freeze({name:'食料',source:'畑',mass:.6,work:1,worker:'farmer'}),iron:Object.freeze({name:'鉄鉱石',source:'鉄鉱脈',mass:4.5,work:12,worker:'miner',magnetic:true})});
 const resources=Object.freeze(Object.keys(definitions)),types=Object.freeze([...resources,'gold']);
 const known=type=>Object.hasOwn(definitions,type),name=type=>definitions[type]?.name||type;
 const workerMatches=(worker,type)=>definitions[type]?.worker===(typeof worker==='object'?worker.id:worker);
 const matchesSource=(requested,type)=>requested===type||requested==='stone'&&type==='iron';
 const conveyorBonus=camp=>(camp?.cart?1.25:1)*(camp?.ironMotor?1.35:1);
 return {definitions,resources,types,known,name,workerMatches,matchesSource,conveyorBonus};
});
