const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({headless:true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}: {})});
  try {
    for (const width of [320,390,1440]) {
      const context = await browser.newContext({viewport:{width,height:980}});
      const page = await context.newPage();
      const errors=[], requests=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/*',async route=>{
        const u=new URL(route.request().url()); requests.push(u.href);
        const name=path.basename(u.pathname)||'index.html';
        if(u.origin!=='https://preview.test'||!['index.html','app.mjs','data.mjs','style.css'].includes(name)) return route.abort();
        await route.fulfill({body:await fs.readFile(path.resolve(__dirname,'../master-brokers',name)),contentType:name.endsWith('.mjs')?'text/javascript':name.endsWith('.css')?'text/css':'text/html'});
      });
      const overflow=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);
      await page.goto('https://preview.test/index.html');
      await page.getByRole('heading',{name:'Personas primero. Negocios conectados.'}).waitFor();
      assert.match(await page.locator('.team-row').first().innerText(),/Alejandro Puebla/);
      await overflow();
      await page.locator('.team-row').first().click();
      await page.getByRole('heading',{name:'Mi cartera',exact:true}).waitFor();
      assert.equal(await page.locator('.prospect-row').count(),2);
      await page.getByRole('searchbox').fill('norte');
      assert.equal(await page.locator('.prospect-row').count(),1);
      await page.getByRole('searchbox').fill('no existe');
      await page.getByText('No hay coincidencias.',{exact:true}).waitFor();
      await page.getByRole('button',{name:'Limpiar filtros'}).first().click();
      await page.getByLabel('Responsable del siguiente paso').selectOption('eduardo');
      assert.equal(await page.locator('.prospect-row').count(),0);
      await page.getByRole('button',{name:'Limpiar filtros'}).first().click();
      await page.getByRole('link',{name:'Abrir expediente de Grupo Alameda',exact:true}).click();
      await page.getByRole('heading',{name:'Grupo Alameda',exact:true}).waitFor();
      assert.equal(await page.locator('.work-card').count(),2);
      await overflow();
      await page.getByRole('tab',{name:/Avances/}).click();
      await page.locator('.timeline .event').first().waitFor();
      assert.equal(await page.locator('.timeline .event').count(),3);
      await page.getByText('↗ Consultar fuente',{exact:true}).first().click();
      await page.getByRole('tab',{name:/PPP y documentos/}).click();
      await page.getByRole('heading',{name:'Terreno norte',exact:true}).waitFor();
      await overflow();
      await page.goto('https://preview.test/index.html#/prospecto/horizonte/material/hor-bodega');
      await page.getByRole('heading',{name:'Bodegas de proximidad',exact:true}).waitFor();
      assert.equal(await page.locator('.ppp-preview').count(),2);
      await overflow();
      await page.getByRole('button',{name:'Prototipo · datos de ejemplo',exact:true}).click();
      assert.equal(await page.locator('dialog').evaluate(x=>x.open),true);
      await page.getByRole('button',{name:'Entendido',exact:true}).click();
      assert.equal(await page.locator('dialog').evaluate(x=>x.open),false);
      await page.goto('https://preview.test/index.html#/cartera/eduardo');
      await page.getByLabel('Estatus del prospecto').selectOption('En pausa');
      assert.equal(await page.locator('.prospect-row').count(),1);
      await overflow();
      assert.deepEqual(errors,[]);
      assert.ok(requests.every(u=>u.startsWith('https://preview.test/')));
      await page.goto('https://preview.test/index.html');
      await page.locator('.team-row').first().waitFor();
      if(process.env.PREVIEW_SCREENSHOTS) await page.screenshot({path:`/tmp/master-brokers-public-${width}.png`,fullPage:true,animations:'disabled'});
      await context.close();
      console.log(`Public prototype ${width}px: anonymous routes, filters, history, PPP, dialog and overflow PASS`);
    }
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
