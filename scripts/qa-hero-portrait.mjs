import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output = process.env.HERO_QA_OUTPUT || '/tmp/knud-hero-portrait';
await mkdir(output, {recursive:true});
const browser = await chromium.launch();
try {
  const page = await browser.newPage({reducedMotion:'reduce'});
  const results=[];
  for (const [width,height,expected] of [[1024,1366,1020],[1032,1376,1020],[834,1194,1020],[768,1024,1020],[1366,1024,1920],[1024,768,1350],[1350,900,1350],[1440,900,1920]]) {
    await page.setViewportSize({width,height});
    await page.goto(process.env.HERO_QA_URL || 'http://localhost:3000');
    const state=await page.evaluate(()=>{
      const hero=document.querySelector('#main-hero');
      const scene=[...document.querySelectorAll('.hero-scene')].find(el=>getComputedStyle(el).display!=='none');
      return {scene:scene.className,gap:hero.getBoundingClientRect().bottom-scene.getBoundingClientRect().bottom,scrollWidth:document.documentElement.scrollWidth};
    });
    assert.ok(state.scene.includes(`hero-scene-${expected}`),JSON.stringify({width,height,state}));
    assert.ok(state.scrollWidth<=width);
    if(width>1020&&height>width)assert.ok(Math.abs(state.gap)<2,`portrait bottom gap ${state.gap}`);
    if(width===1024&&height===1366)await page.screenshot({path:`${output}/ipad-pro.png`,fullPage:true});
    results.push({width,height,...state});
  }
  await writeFile(`${output}/results.json`,JSON.stringify(results,null,2));
  console.log('PASS: 8 portrait/landscape sizes; iPad Pro scene-bottom gap <2px');
} finally {await browser.close();}
