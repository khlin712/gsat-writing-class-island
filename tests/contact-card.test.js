import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';import {CONTACTS,isLink} from '../dist/journey.js';
const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
function card(contacts=CONTACTS){const ctx=vm.createContext({CONTACTS:contacts,isLink,pending:()=>'<p>待提供</p>'});vm.runInContext(source.slice(source.indexOf('const escape='),source.indexOf('\n',source.indexOf('const escape=')))+source.slice(source.indexOf('function contactLink('),source.indexOf('function openStation(')),ctx);return ctx;}
test('服務台保留五個外連、推薦LINE，Classroom獨立於社群，缺資料不產生假連結',()=>{
 const ctx=card(),html=vm.runInContext("stationBody({id:'contact'})",ctx);assert.equal((html.match(/class="contact-link /g)||[]).length,5);for(const c of CONTACTS)assert.ok(html.includes(`href="${c.href}"`));assert.match(html,/aria-label="用 LINE 問老師，在新視窗開啟"/);assert.match(html,/社群[\s\S]*@0kh127/);assert.match(html,/課程資訊與寫作文章[\s\S]*Google Classroom/);assert.match(html,/加入班級需要邀請碼/);assert.equal((html.match(/在新視窗開啟/g)||[]).length,10);
 const empty=vm.runInContext("stationBody({id:'contact'})",card([]));assert.doesNotMatch(empty,/<a /);
 assert.doesNotMatch(vm.runInContext("contactLink({href:'javascript:alert(1)'},'bad','contact-primary')",ctx),/<a /);
 const escaped=vm.runInContext(`contactLink({label:'<img>',href:'https://example.com/?q="'},'ok','contact-primary')`,ctx);assert.match(escaped,/&lt;img&gt;/);assert.match(escaped,/&quot;/);
});
