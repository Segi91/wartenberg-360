'use strict';
/* Offline smoke test for the actual browser script, no npm packages required. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const app=fs.readFileSync('app.js','utf8');
const data=JSON.parse(fs.readFileSync('news.json','utf8'));
assert(data.version>=2,'Missing v2 news schema');
assert(Array.isArray(data.items)&&data.items.length>20,'Expected real news entries');
assert(data.items.filter(x=>x.locality==='Wartenberg'&&x.topic!=='Sport').length>=8,'Non-sport articles missing');
const curated=JSON.parse(fs.readFileSync('data/curated_news.json','utf8'));
assert(curated.items.length>=15,'Curated community sources missing');
for(const entry of curated.items) {
  assert(/^https:\/\//.test(entry.source),'Unsafe link: '+entry.title);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(entry.date),'Invalid date: '+entry.title);
}
function fakeElement() {
 return {
   value:'',textContent:'',innerHTML:'',hidden:false,style:{},
   classList:{add(){},remove(){},toggle(){}},
   addEventListener(){},focus(){},setSelectionRange(){},click(){},
   getAttribute(){return null}
 };
}
function launch(hash) {
 const elements={};
 const events={};
 const doc={
  body:fakeElement(),
  querySelector(selector){return elements[selector]||(elements[selector]=fakeElement());},
  addEventListener(name,callback){events[name]=callback;},
  createElement(){return fakeElement();}
 };
 const storage={};
 const store={getItem(k){return storage[k]??null;},setItem(k,v){storage[k]=v;},removeItem(k){delete storage[k];},
  key(i){return Object.keys(storage)[i]},get length(){return Object.keys(storage).length}};
 const location={hash:'#'+hash,protocol:'https:'};
 const win={location,matchMedia(){return {matches:false}},addEventListener(){},scrollTo(){}};
 const context=vm.createContext({
  document:doc,window:win,location,navigator:{},localStorage:store,
  console,Date,Intl,Math,JSON,Array,Map,Set,String,Number,Boolean,RegExp,
  URL,Blob,AbortSignal,setTimeout,clearTimeout,confirm:()=>false,
  fetch:async url=>{
    if(String(url).includes('news.json'))return {ok:true,json:async()=>data};
    throw Error('Offline-weather-test');
  }
 });
 vm.runInContext(app,context,{timeout:5000,filename:'app.js'});
 return {ctx:context,elements,events};
}
async function main(){
 const news=launch('news');
 await new Promise(r=>setTimeout(r,35));
 let html=news.elements['#content'].innerHTML;
 assert(html.includes('Was bewegt unsere Gemeinde?'),'News intro missing');
 assert(html.includes('Gemeinschaft &amp; Ehrenamt')||html.includes('Gemeinschaft & Ehrenamt'),'Community category missing');
 assert(html.includes('Kultur &amp; Musik')||html.includes('Kultur & Musik'),'Culture category missing');
 assert(html.includes('data-news-topic='),'Topic filters missing');
 assert(html.includes('Abseits des Spielfelds'),'Non-sport highlights missing');
 assert(html.includes('SG Landenhausen')||html.includes('Sport'),'Sport still accessible');
 assert(html.includes('news-card'),'News cards absent');
 const click=news.events['click'];
 assert(typeof click==='function','Click navigation missing');
 const topicBtn={getAttribute:n=>n==='data-news-topic'?'Kultur & Musik':null,hasAttribute:n=>n==='data-news-topic',dataset:{}};
 click({target:{closest:()=>topicBtn}});
 html=news.elements['#content'].innerHTML;
 assert(html.includes('Kultur &amp; Musik')||html.includes('Kultur & Musik'),'Topic selection does not render');
 const scopeBtn={getAttribute:n=>n==='data-news-scope'?'Alle':null,hasAttribute:n=>n==='data-news-scope',dataset:{}};
 click({target:{closest:()=>scopeBtn}});
 html=news.elements['#content'].innerHTML;
 assert(html.includes('Gesamter Vogelsberg'),'Regional switch broken');
 const home=launch('home');
 await new Promise(r=>setTimeout(r,35));
 const homeHtml=home.elements['#content'].innerHTML;
 assert(homeHtml.includes('Schön, dass du'),'Home hero missing');
 assert(homeHtml.includes('Aus unserem Dorfleben'),'Community digest missing');
 assert(homeHtml.includes('news-card'),'Home news cards missing');
 console.log('OK: '+data.items.length+' Nachrichten, '+curated.items.length+' geprüfte Links; News/Filter/Home gerendert.');
}
main().catch(err=>{console.error(err);process.exitCode=1;});