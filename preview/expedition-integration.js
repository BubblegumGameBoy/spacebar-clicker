/* Connect persistent squads with the existing direct placement and worksite. */
window.ExpeditionIntegration=(()=>{
 'use strict';
 function settleFormation(){
  const bodies=ArmyView.sim.soldiers,assign=ExpeditionCore.assignments(S),nodes=SupplyFactory.state.nodes,home=OutpostCore.WORLD.home;
  const legal=(p,q)=>q.x>20&&q.x<940&&q.y>110&&q.y<515&&!((q.x-home.x)**2+(q.y-home.y)**2<65**2)&&!nodes.some(n=>Math.hypot(q.x-n.x,q.y-n.y)<(n.radius||16)+p.r+3)&&!bodies.some(v=>v!==p&&Math.hypot(v.x-q.x,v.y-q.y)<p.r+v.r+3)&&(p.u.worker?!!SupplyFactory.nearby(q,SupplyFactory.resourceTypeForWorker(p.id)):Outpost.covers(q,p.u));
  for(const a of assign.filter(a=>!a.pending).sort((a,b)=>a.member-b.member)){const p=bodies.find(p=>p.id===a.id&&p.index===a.index);if(!p||a.member===0)continue;const g=ExpeditionCore.groupFor(S,a.id,a.index);if(legal(p,p))continue;const node=p.u.worker&&SupplyFactory.nearby(g.anchor,SupplyFactory.resourceTypeForWorker(p.id)),center=node||g.anchor;if(!center)continue;
   for(let i=0;i<600;i++){const angle=i*2.399963+g.key*.27,r=p.u.worker?40+(i%24):18+Math.sqrt(i)*5,q={x:center.x+Math.cos(angle)*r,y:center.y+Math.sin(angle)*r};if(legal(p,q)){p.x=q.x;p.y=q.y;g.positions[a.member]={...q};break;}}
  }BattleControl.invalidate?.();
 }
 function refresh(){if(!window.__OUTPOST_BUILD__)return;SupplyFactory.ensureFarm?.();ArmyView.reloadFormation();settleFormation();renderCards();updateHud();BattleControl.restore();SupplyFactory.translate();Outpost.update();OutpostTutorial?.sync(true);window.ExpeditionUI?.sync();save();}
 function reposition(key){const g=ExpeditionCore.groups(S).find(g=>g.key===Number(key));if(!g?.active)return false;const a=ExpeditionCore.assignments(S).find(a=>a.groupKey===g.key&&!a.pending);if(!a)return false;return BattleControl.selectGroup(g.key);}
 function boot(){if(!window.__OUTPOST_BUILD__)return;ExpeditionCore.ensure(S);SupplyFactory.ensureFarm?.();ExpeditionUI.boot();renderCards();if(S.expedition.awaitingDecision&&S.outpost.result)setTimeout(()=>ExpeditionUI.showResult(S.outpost.result),200);}
 return {boot,refresh,reposition};
})();
ExpeditionIntegration.boot();
