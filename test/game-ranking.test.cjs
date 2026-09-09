const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const ranking=source.slice(source.indexOf('function readStored('),source.indexOf('/* ===== I18N ===== */'));
const language=source.slice(source.indexOf('const validLanguage='),source.indexOf('function t(k,'));
function page(search='?lang=en',stored=null){
 const requests=[],nodes=new Map();
 const elem=()=>({textContent:'',style:{},children:[],_html:'',get innerHTML(){return this._html},set innerHTML(v){this._html=v;this.children=[]},append(...a){this.children.push(...a)},appendChild(a){this.children.push(a)}});
 const context=vm.createContext({URLSearchParams,location:{search},localStorage:{getItem(){if(stored===null)throw Error('blocked');return stored},setItem(){throw Error('blocked')}},
  crypto:{randomUUID:()=> 'test-id'},document:{createElement:elem,activeElement:null},
  $:id=>{if(!nodes.has(id))nodes.set(id,elem());return nodes.get(id)},
  fetch:url=>new Promise((resolve,reject)=>requests.push({url,resolve,reject})),
  setTimeout(){},clearTimeout(){},SHOWCASE:false,fmt:String
 });
 vm.runInContext(ranking+'\n'+language,context);
 return {requests,nodes,run:s=>vm.runInContext(s,context)};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('game ranking and language initialize when storage is blocked',()=>{
 const p=page();assert.equal(p.run('LANG'),'en');assert.equal(p.run('playerDamage'),0);assert.equal(p.run('playerId'),'test-id');
});
test('invalid saved language falls back to Japanese',()=>{assert.equal(page('?lang=invalid','toString').run('LANG'),'ja')});
test('game leaderboard ignores a late response for a different board',async()=>{
 const p=page();p.run('loadOnlineRanking()');p.run('rankBoard="power";onlineRankLoaded=false;loadOnlineRanking()');
 p.requests[1].resolve({ok:true,json:async()=>({rows:[{name:'Power',power:5000}]})});await settle();
 p.requests[0].resolve({ok:true,json:async()=>({rows:[{name:'Damage',damage:900}]})});await settle();
 assert.equal(p.nodes.get('#rankList').children[0].children[1].textContent,'Power');
 assert.match(p.nodes.get('#rankStatus').textContent,/Online leaderboard/);
});
test('power request failure clears old online data and gives English feedback',async()=>{
 const p=page();p.run('rankBoard="power";onlineRanks=[{name:"Old",power:4}];onlineRankLoaded=true;loadOnlineRanking()');
 p.requests[0].reject(Error('offline'));await settle();assert.equal(p.nodes.get('#rankList').children.length,0);
 assert.match(p.nodes.get('#rankStatus').textContent,/could not be loaded/);
});
