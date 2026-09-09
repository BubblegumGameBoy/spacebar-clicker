const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../ranking.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function page(search='?lang=en') {
  const nodes = new Map(), requests=[];
  const element=()=>({textContent:'',innerHTML:'',style:{},children:[],attrs:{},append(...a){this.children.push(...a)},appendChild(a){this.children.push(a)},replaceChildren(...a){this.children=a},setAttribute(k,v){this.attrs[k]=v},addEventListener(){}});
  const ctx=vm.createContext({ URLSearchParams, location:{search}, localStorage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}},
    document:{documentElement:{},getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)},createElement:element,querySelectorAll(){return []}},
    window:{addEventListener(){}},setInterval(){},fetch(url){return new Promise((resolve,reject)=>requests.push({url,resolve,reject}))} });
  vm.runInContext(source,ctx);
  return {nodes,requests,run:code=>vm.runInContext(code,ctx)};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('large damage retains its full exponent',()=>{
  const p=page(); assert.equal(p.run('fmt(1e36)'),'1.00e+36'); assert.equal(p.run('fmt(1234)'),'1.23K');
});
test('prototype property names are not languages',()=>{
  const p=page('?lang=toString'); assert.equal(p.run('LANG'),'ja');
});
test('late damage response cannot overwrite power; loading removes old rows',async()=>{
  const p=page(); p.requests[0].resolve({ok:true,json:async()=>({rows:[{name:'Damage player',damage:1234}]})}); await settle();
  p.run('loadRanking()');
  p.run('setBoard("power")');
  assert.equal(p.nodes.get('rows').children.length,0);
  assert.match(p.requests[2].url,/limit=100&board=power/);
  p.requests[2].resolve({ok:true,json:async()=>({rows:[{name:'Power player',power:6000}]})}); await settle();
  p.requests[1].resolve({ok:true,json:async()=>({rows:[{name:'Old damage',damage:999}]})}); await settle();
  assert.equal(p.nodes.get('rows').children[0].children[1].textContent,'Power player');
  assert.equal(p.nodes.get('rows').children[0].children[2].textContent,'6,000');
});
test('power failure clears rows without a local damage fallback',async()=>{
  const p=page(); p.run('setBoard("power")'); p.requests[1].reject(Error('offline')); await settle();
  assert.equal(p.nodes.get('rows').children.length,0); assert.match(p.nodes.get('empty').textContent,/could not be loaded/);
  p.requests[0].reject(Error('old offline')); await settle();
});
