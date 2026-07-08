const { chromium } = require('playwright-core');
(async()=>{
  const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
  const p = await b.newPage();
  await p.setContent('<canvas id=c></canvas>');
  const r = await p.evaluate(()=>{const gl=document.getElementById('c').getContext('webgl2');return gl? gl.getParameter(gl.VERSION): 'NO WEBGL2';});
  console.log('WEBGL2:', r);
  await b.close();
})().catch(e=>{console.error('ERR', e.message)});
