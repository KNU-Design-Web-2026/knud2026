import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output=process.env.HERO_QA_OUTPUT || '/tmp/knud-header-boundary';
await mkdir(output,{recursive:true});
const browser=await chromium.launch();
try {
  const page=await browser.newPage();
  const results=[];
  for(const [width,height] of [[1512,800],[1024,1100],[768,900],[400,700]]) {
    await page.setViewportSize({width,height});
    await page.goto(process.env.HERO_QA_URL || 'http://localhost:3000', {waitUntil:'domcontentloaded'});
    await page.waitForTimeout(350);
    const before=await page.evaluate(()=>({hero:document.querySelector('#main-hero').getBoundingClientRect().top,headerHit:!!document.elementFromPoint(200,30)?.closest('header')}));
    assert.equal(before.hero,0);
    assert.ok(before.headerHit,'visible header owns pointer input');
    await page.evaluate(()=>window.scrollTo(0,80));
    await page.waitForTimeout(300);
    // Reproduce the reported slow return: each scroll change stays below 8px.
    for(let y=75;y>=20;y-=5) {await page.evaluate(y=>window.scrollTo(0,y),y);await page.waitForTimeout(40);}
    const hit=await page.evaluate(()=>({opacity:getComputedStyle(document.querySelector('header')).opacity,target:document.elementFromPoint(200,30)?.id}));
    assert.equal(hit.opacity,'0');
    assert.equal(hit.target,'main-spray-zone','hidden header area is sprayable');
    await page.mouse.click(200,30);
    await page.waitForTimeout(100);
    const painted=await page.evaluate(()=>{
      const c=document.querySelector('#main-hero canvas'),r=c.getBoundingClientRect();
      const sx=c.width/r.width,sy=c.height/r.height;
      const data=c.getContext('2d').getImageData(Math.round((180-r.left)*sx),Math.round((10-r.top)*sy),Math.round(40*sx),Math.round(40*sy)).data;
      return data.some((v,i)=>i%4===3&&v>0);
    });
    assert.ok(painted,'actual Canvas pixels appear above the former hero boundary');
    await page.screenshot({path:`${output}/${width}-hidden-painted.png`});
    await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(300);
    assert.ok(await page.evaluate(()=>!!document.elementFromPoint(200,30)?.closest('header')),'header regains input on return');
    await page.screenshot({path:`${output}/${width}-header-restored.png`});
    results.push({width,height,before,hit,painted});
  }
  await writeFile(`${output}/results.json`,JSON.stringify(results,null,2));
  console.log('PASS: four widths, slow scroll return, actual Canvas pixels, restored header input');
}finally{await browser.close();}
