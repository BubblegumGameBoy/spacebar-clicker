const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const url=new URL(process.argv[2]||pathToFileURL(path.join(__dirname,'../index.html')).href);url.searchParams.set('showcase','');
  const page=await browser.newPage({viewport:{width:1100,height:820}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/**',r=>r.abort());
  await page.goto(url.href,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{chooseLang('ja');setBgm(false);setSe(false);S.owned=zeroUnits();renderUnits();});
  // Load images before timing short swings; production asset downloads can exceed a swing.
  await page.evaluate(()=>Promise.all(WEAPONS.map(w=>{const img=new Image();img.src=weaponIcon(w);return img.decode();})));
  const field=await page.locator('#field').boundingBox();const x=field.width*.58,y=field.height*.55;
  await page.mouse.move(x,y);
  assert.equal(await page.locator('#field').evaluate(e=>getComputedStyle(e).cursor),'none');
  const kinds=[];
  for(let i=0;i<10;i++){
   await page.evaluate(i=>{S.hero.click=i*10;renderCards();},i);
   await page.mouse.click(x,y);
   const state=await page.evaluate(async()=>{
    const img=document.querySelector('#weaponPointer img');
    const a=img.getAnimations()[0];if(!a)throw new Error('No weapon animation');
    a.pause();a.currentTime=70;
    return {kind:weaponPointer.dataset.kind,id:weaponPointer.dataset.weapon,transform:getComputedStyle(img).transform,frames:a.effect.getKeyframes().length};
   });
   assert.ok(state.frames>=3);assert.notEqual(state.transform,'none');kinds.push(state.kind);
  }
  assert.deepEqual([...new Set(kinds)].sort(),['heavy','slash','thrust']);
  await page.evaluate(()=>{S.hero.click=30;renderCards();animateWeaponAttack({x:58,y:55},true);weaponPointer.querySelectorAll('*').forEach(el=>el.getAnimations().forEach(a=>{a.pause();a.currentTime=70;}));});
  await page.screenshot({path:path.join(__dirname,'../promo-output/weapon-motion.png')});
  await page.evaluate(()=>{for(let i=0;i<40;i++)animateWeaponAttack({x:58,y:55});});
  assert.equal(await page.locator('#weaponPointer').count(),1);
  assert.ok(await page.locator('#weaponPointer').evaluate(e=>e.getAnimations({subtree:true}).length)<=3);
  await page.mouse.move(x,field.height+30);
  assert.ok(!(await page.locator('#weaponPointer').evaluate(e=>e.classList.contains('visible'))));
  assert.notEqual(await page.locator('#field').evaluate(e=>getComputedStyle(e).cursor),'none');
  await page.keyboard.press('Space');
  assert.ok(await page.locator('#weaponPointer').evaluate(e=>e.classList.contains('visible')));
  await page.waitForTimeout(400);
  assert.ok(!(await page.locator('#weaponPointer').evaluate(e=>e.classList.contains('visible'))));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>animateWeaponAttack({x:58,y:55}));
  assert.equal(await page.locator('#weaponPointer').evaluate(e=>e.getAnimations({subtree:true}).length),1);
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await mobile.route('**/api/**',r=>r.abort());
  await mobile.goto(url.href,{waitUntil:'domcontentloaded'});
  await mobile.evaluate(()=>{chooseLang('ja');setBgm(false);setSe(false);});
  const mf=await mobile.locator('#field').boundingBox();
  await mobile.touchscreen.tap(mf.width*.6,mf.height*.6);
  assert.ok(await mobile.locator('#weaponPointer').evaluate(e=>e.classList.contains('visible')));
  assert.ok(!(await mobile.locator('#field').evaluate(e=>e.classList.contains('weapon-pointer-active'))));
  await mobile.waitForTimeout(420);
  assert.ok(!(await mobile.locator('#weaponPointer').evaluate(e=>e.classList.contains('visible'))));
  assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({source:url.href,weapons:10,motionKinds:kinds,rapidInput:'bounded',keyboard:'passed',touch:'passed',reducedMotion:'passed',errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
