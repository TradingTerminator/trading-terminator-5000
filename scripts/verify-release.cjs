const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const html=fs.readFileSync('v7-test.html','utf8');assert.match(html,/<title>[^<]*7\.36/);assert.match(html,/script-src 'self'/);assert.ok(!html.includes('script-src \'unsafe-inline\''));
for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){assert.equal(match[2].trim(),'');const src=match[1].match(/src="([^"]+)"/)[1];assert.ok(!src.startsWith('http'));const code=fs.readFileSync(src);new vm.Script(code.toString());assert.ok(match[1].includes('sha384-'+crypto.createHash('sha384').update(code).digest('base64')));}
for(const p of ['index.html','v7-Test.html','v6.html']){const text=fs.readFileSync(p,'utf8');assert.match(text,/url=\.\/v7-test.html/);assert.ok(!text.includes('supabase'));}
const manifest=JSON.parse(fs.readFileSync('release-integrity.json'));for(const [p,h] of Object.entries(manifest.files))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),h);
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size,'duplicate static DOM IDs');
console.log('Release syntax, CSP, SRI, canonical redirects and file hashes verified.');
