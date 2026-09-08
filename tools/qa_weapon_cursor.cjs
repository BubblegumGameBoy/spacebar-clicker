const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

// Test the actual cursor builder in isolation: no game saves or ranking writes.
(async()=>{
 const url=process.argv[2];
 const source=url?await (await fetch(url)).text():readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const bodies=source.match(/const WEAPON_CURSOR_BODIES=(\{[^\r\n]+\});/);
 const builder=source.match(/function updateWeaponCursor\(\)\{[\s\S]*?\n\}/);
 assert.ok(bodies&&builder,'Cursor implementation present');
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage();
  await page.setContent('<div id="field" style="width:600px;height:400px;background:#17202b"></div>');
  await page.addScriptTag({content:`const WEAPON_CURSOR_BODIES=${bodies[1]};let _cursorWeapon='';let selectedWeapon;const field=document.getElementById('field');function curWeapon(){return {id:selectedWeapon};}${builder[0]}`});
  const results=await page.evaluate(async()=>{
   const rows=[];
   for(const id of Object.keys(WEAPON_CURSOR_BODIES)){
    selectedWeapon=id;updateWeaponCursor();
    const cursor=getComputedStyle(field).cursor;
    const uri=cursor.match(/url\("([^"]+)"\)/)?.[1];
    if(!uri)throw new Error(id+': cursor URL missing');
    const xml=new DOMParser().parseFromString(decodeURIComponent(uri.split(',')[1]),'image/svg+xml');
    if(xml.querySelector('parsererror'))throw new Error(id+': invalid SVG');
    const img=new Image();img.src=uri;await img.decode();
    const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;
    const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
    const pixels=ctx.getImageData(0,0,32,32).data;
    let visible=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>0)visible++;
    rows.push({id,width:img.naturalWidth,height:img.naturalHeight,visible,cursor});
   }
   return rows;
  });
  assert.equal(results.length,10);
  assert.equal(new Set(results.map(r=>r.cursor)).size,10);
  for(const r of results){assert.equal(r.width,32);assert.equal(r.height,32);assert.ok(r.visible>20&&r.visible<1024,r.id+': visible weapon on transparent background');}
  const game=await browser.newPage();
  await game.route('**/api/leaderboard**',route=>route.abort());
  const gameUrl=new URL(url||pathToFileURL(path.join(__dirname,'../index.html')).href);
  gameUrl.searchParams.set('showcase','');
  await game.goto(gameUrl.href,{waitUntil:'domcontentloaded'});
  await game.waitForFunction(()=>typeof updateWeaponCursor==='function'&&typeof S!=='undefined');
  const applied=await game.evaluate(async()=>{
   const cursors=[];
   for(let tier=0;tier<10;tier++){
    S.hero.click=tier*10;renderCards();
    const cursor=getComputedStyle(document.getElementById('field')).cursor;
    const uri=cursor.match(/url\("([^"]+)"\)/)?.[1];
    if(!uri)throw new Error('Missing game cursor at tier '+tier);
    const img=new Image();img.src=uri;await img.decode();
    cursors.push(cursor);
   }
   return new Set(cursors).size;
  });
  assert.equal(applied,10,'All weapon tiers update the actual game field');
  console.log(JSON.stringify({source:url||'local',gameFieldTiers:applied,passed:results.map(({cursor,...r})=>r)},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
