const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const root = path.resolve(__dirname, '../master-brokers');
const data = () => import(pathToFileURL(path.join(root, 'data.mjs')));

test('public prototype relationships and filters use only the selected portfolio', async () => {
  const {people, prospects, filterProspects} = await data();
  assert.equal(people[0].code, 'MD');
  const workIds = new Set();
  for (const p of prospects) {
    assert.ok(people.some(x => x.id === p.owner));
    assert.ok(people.some(x => x.id === p.nextOwner));
    assert.ok(p.events.length);
    for (const w of p.works) { assert.ok(!workIds.has(w.id)); workIds.add(w.id); }
  }
  assert.deepEqual(filterProspects({owner:'eduardo'}).map(x=>x.id), ['horizonte','valenzuela']);
  assert.deepEqual(filterProspects({owner:'alejandro',query:'NÓRTE'}).map(x=>x.id), ['alameda']);
  assert.deepEqual(filterProspects({owner:'franco',responsible:'alejandro'}).map(x=>x.id), ['encino']);
  assert.equal(filterProspects({owner:'franco',responsible:'eduardo'}).length, 0);
  assert.deepEqual(filterProspects({owner:'eduardo',status:'En pausa'}).map(x=>x.id), ['valenzuela']);
});

test('public entry is self-contained, clearly a sample, and cannot call CRM or store credentials', () => {
  const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
  const source = ['index.html','app.mjs','data.mjs','style.css'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
  assert.match(html,/Acceso público/);
  assert.match(html,/datos de ejemplo/);
  assert.match(html,/conexión con expedientes reales está pendiente/);
  assert.doesNotMatch(source,/portero\.js|shell\.js|script\.google\.com|localStorage|sessionStorage|XMLHttpRequest|\bfetch\s*\(/);
  assert.doesNotMatch(html,/Espacio privado|Sólo tu cuenta|\.chatgpt\.site/);
});
