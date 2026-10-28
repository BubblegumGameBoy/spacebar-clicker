/* Recipes reveal cards; construction and placement remain the player's work. */
window.ProgressionCards={buildCost(id){
 const unit=typeof UNITS!=='undefined'&&UNITS.find(u=>u.id===id);
 if(unit)return window.ExpeditionCore?.slotQuote(S,id)?.cost;
 return {broom:{wood:6,stone:2},blower:{wood:4},fence:{wood:1,note:{ja:'長さ24ごと',en:'Per 24 length',zh:'每24长度'}},belt:{wood:1,note:{ja:'長さ48ごと',en:'Per 48 length',zh:'每48长度'}},platform:{wood:8,stone:4},hopper:{wood:10,stone:4},loader:{wood:12,stone:6}}[id];
}};
window.ProgressionIntegration=(()=>{
 function refresh(){if(typeof S!=='object')return;ProgressionCore.ensure(S);window.SupplyFactory?.ensureFarm?.();if(typeof renderCards==='function')renderCards();if(typeof updateHud==='function')updateHud();window.SupplyFactory?.translate?.();window.OutpostTutorial?.sync?.(true);window.HarvestSkills?.sync?.();if(typeof save==='function')save();}
 function mark(id){const button=document.querySelector('[data-recruit="'+id+'"], [data-equipment="'+id+'"], [data-gadget="'+id+'"]'),card=button?.closest('.card');if(card){card.classList.add('recipe-new-card');setTimeout(()=>card.classList.remove('recipe-new-card'),8000);}return button;}
 window.addEventListener('progression:learned',e=>{if(e.detail?.kind==='project'){if(typeof renderUnits==='function')renderUnits();window.Outpost?.update?.();}refresh();if(e.detail?.recipe){mark(e.detail.recipe);}});
 window.addEventListener('progression:show-card',e=>{refresh();const button=mark(e.detail.recipe);if(button){button.scrollIntoView({block:'center',inline:'center',behavior:'smooth'});button.focus({preventScroll:true});}});
 // A fresh game deliberately starts with no recipes. Migration runs once for earned legacy cards.
 refresh();
 return {refresh};
})();
