// Deterministic visual checks, not a performance benchmark.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const output = process.env.HERO_QA_OUTPUT || "/tmp/knud-burst-particles";
await mkdir(output, {recursive:true});
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", e => errors.push(e.message));
const results = [];
try {
  await page.goto(process.env.HERO_QA_URL || "http://localhost:3000");
  await page.locator('.hero-motion[data-running="true"]').waitFor();
  for (const [width,height] of [[1920,1080],[1350,900],[1024,1366],[1020,1370],[600,980],[400,860]]) {
    await page.setViewportSize({width,height});
    await page.waitForTimeout(100);
    let originalScale;
    let originalTailPath;
    for(const time of [0,400,800,1100,1180,1330,1420,1550,1740,1950,2100,2500,2900,3300,3700]) {
      const state = await page.evaluate(time => {
        const root=document.querySelector(".hero-motion");
        root.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=time;});
        const scene=[...root.querySelectorAll(".hero-scene")].find(e=>getComputedStyle(e).display!=="none");
        const tail=scene.querySelector(".hero-fuse");
        const box=tail.getBoundingClientRect();
        const pivot=new DOMPoint(Number(tail.dataset.pivotX),Number(tail.dataset.pivotY)).matrixTransform(tail.getScreenCTM());
        const matrix=tail.getCTM();
        return {
          tail:[box.x,box.y,box.width,box.height],
          tailFits:box.left>=0 && box.right<=innerWidth && box.top>=0,
          tailPath:getComputedStyle(tail.querySelector(".hero-tail-shape")).d,
          pivot:[pivot.x,pivot.y],
          tailScale:Math.hypot(matrix.a,matrix.b),
          tailOpacity:getComputedStyle(tail).opacity,
          mask:tail.getAttribute("mask"),
          response:[".hero-lion",".hero-spray",".hero-ignite"].map(s=>getComputedStyle(scene.querySelector(s)).transform),
          igniteScale:new DOMMatrix(getComputedStyle(scene.querySelector('.hero-ignite')).transform).a,
          igniteBounds:(()=>{const b=scene.querySelector('.hero-ignite').getBoundingClientRect(); return {left:b.left,right:b.right,top:b.top};})(),
          particles:[...scene.querySelectorAll(".hero-burst-particles")].map(g=>[...g.querySelectorAll("path")].filter(p=>getComputedStyle(p).display!=="none").length),
          visible:[...scene.querySelectorAll(".hero-burst-particles")].map(g=>[...g.querySelectorAll("path")].filter(p=>getComputedStyle(p).display!=="none" && Number(getComputedStyle(p).opacity)>0.1).length),
          follow:[...scene.querySelectorAll(".hero-burst-particles")].map(g=>[...g.querySelectorAll(".hero-burst-particle-follow")].filter(p=>getComputedStyle(p).display!=="none" && Number(getComputedStyle(p).opacity)>0.1).length),
          delays:[...scene.querySelectorAll(".hero-burst")].map(e=>getComputedStyle(e).animationDelay),
          duration:getComputedStyle(scene.querySelector(".hero-burst")).animationDuration,
          overflow:document.documentElement.scrollWidth>innerWidth,
          obsolete:scene.querySelectorAll(".hero-fuse-effects,.hero-fuse-erase").length
        };
      },time);
      originalScale ??= state.tailScale;
      originalTailPath ??= state.tailPath;
      assert.ok(Math.abs(state.tailScale-originalScale)<0.0001,"tail does not stretch");
      assert.equal(state.tailPath,originalTailPath,"tail path stays unchanged");
      assert.equal(state.tailOpacity,"1");
      assert.ok(state.tailFits,"tail stays inside the viewport throughout the wag");
      if(time===0) {
        assert.ok(state.response[0]==="none" || state.response[0].includes("matrix(1, 0, 0, 1, 0, 0)"),"lion starts from its original pose");
        assert.ok(state.response[1]==="none" || state.response[1].includes("matrix(1, 0, 0, 1, 0, 0)"),"spray starts from its original pose");
      }
      if(time===1330) {
        assert.notEqual(state.response[0],"none","lion recoils at the burst");
        assert.notEqual(state.response[1],"none","spray recoils at the burst");
      }
      assert.ok(state.igniteBounds.left>=0 && state.igniteBounds.right<=width && state.igniteBounds.top>=0,"logo stays inside viewport at impact");
      if(time===1100) assert.ok(state.igniteScale<1,"logo anticipates the burst");
      if(time===1420) assert.ok(state.igniteScale>1.01,"logo expands at the burst");
      if(time===2100) assert.ok(Math.abs(state.igniteScale-1)<0.0001,"logo settles without repeated bounce");
      assert.equal(state.mask,null);
      assert.equal(state.obsolete,0);
      assert.equal(state.overflow,false);
      assert.equal(state.duration,"3.8s");
      assert.deepEqual(state.particles,Array(3).fill(width<=600 || height>width ? 6 : 11));
      assert.deepEqual(state.delays,["0s","0.13s","0.26s"]);
      if(time===1550) assert.ok(state.visible.every(n=>n>=4));
      if(time===1740) assert.ok(state.follow.every(n=>n>=2));
      if(time===2100) assert.ok(state.visible.every(n=>n===0));
      results.push({width,height,time,...state});
      if([0,1100,1330,1550,1740].includes(time)) await page.screenshot({path:output+"/"+width+"-"+time+".png"});
    }
  }
  await page.emulateMedia({reducedMotion:"reduce"});
  assert.equal(await page.locator(".hero-motion").evaluate(e=>e.getAnimations({subtree:true}).length),0);
  assert.deepEqual(errors,[]);
  await writeFile(output+"/results.json",JSON.stringify(results,null,2));
  console.log("PASS: unchanged tail shape, lion/spray recoil, logo impact, local particles, six viewports, reduced motion, no page errors");
} finally { await browser.close(); }
