const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:820}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('sbr_lang','ja'));
  // Showcase protects progress and prevents online score submissions.
  await page.goto('http://127.0.0.1:4173/?showcase',{waitUntil:'domcontentloaded'});
  await page.locator('[data-t="hero"]').click();
  await page.evaluate(()=>{setBgm(false);ac();});
  await page.waitForFunction(()=>Object.keys(_sampleBuf).length===Object.keys(_sampleFiles).length);
  const rows=[];
  for(let i=0;i<10;i++){
   await page.evaluate(i=>{S.hero.click=i*10;renderCards();sndWeapon(false);},i);
   await page.waitForFunction(()=>Array.from(document.querySelectorAll('.weapon-card img')).every(i=>i.complete&&i.naturalWidth));
   rows.push(await page.evaluate(()=>({tier:weaponTier(),id:curWeapon().id,name:document.querySelector('.weapon-card .nm').textContent,icon:document.querySelector('.weapon-card>img').getAttribute('src'),cursor:field.style.cursor,voices:_sampleVoices.length})));
  }
  assert.equal(new Set(rows.map(r=>r.icon)).size,10);
  assert.equal(new Set(rows.map(r=>r.cursor)).size,10);
  await page.evaluate(()=>{S.hero.click=9;renderCards();});
  assert.match(await page.locator('.weapon-next').innerText(),/あと1回/);
  await page.locator('.weapon-card').click();
  assert.equal(await page.evaluate(()=>S.hero.click),10);
  assert.match(await page.locator('#weaponToast').innerText(),/アサシンダガー/);
  assert.equal(await page.locator('#weaponToast img').count(),1);
  await page.evaluate(()=>{S.hero.click=50;renderCards();for(let i=0;i<30;i++)playSample('blade',.6,1,0,'hero');setSe(false);});
  await page.waitForTimeout(200);
  const sound=await page.evaluate(()=>({gain:_sfxMaster.gain.value,voices:_sampleVoices.length,buffers:Object.keys(_sampleBuf)}));
  assert.ok(sound.gain<.001);assert.ok(sound.voices<=14);
  await page.screenshot({path:'promo-output/weapon-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(350);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:'promo-output/weapon-mobile.png'});
  await page.close();
  const gallery=await browser.newPage({viewport:{width:1100,height:650}});
  await gallery.setContent('<body style="background:#111923;color:#eee;font:15px system-ui;padding:24px"><h1>WEAPON EVOLUTION</h1><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px">'+rows.map(r=>`<div style="background:#23303e;padding:16px;text-align:center;border:1px solid #655332;border-radius:10px"><img style="width:120px;height:120px" src="http://127.0.0.1:4173/${r.icon}"><p>${r.name}</p></div>`).join('')+'</div></body>');
  await gallery.waitForFunction(()=>Array.from(document.images).every(i=>i.complete));
  await gallery.screenshot({path:'promo-output/weapon-lineup.png'});
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({weapons:rows.map(({cursor,...row})=>row),sound,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
