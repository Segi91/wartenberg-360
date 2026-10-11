'use strict';
/* Offline smoke test for the actual browser script, no npm packages required. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const app=fs.readFileSync('app.js','utf8');
const data=JSON.parse(fs.readFileSync('news.json','utf8'));
const eventData=JSON.parse(fs.readFileSync('data/events.json','utf8'));
const placesData=JSON.parse(fs.readFileSync('data/places.json','utf8'));
assert(placesData.items.length>=80,'Place guide unexpectedly small');
assert(new Set(placesData.items.map(x=>x.id)).size===placesData.items.length,'Duplicated place IDs');
assert(new Set(placesData.items.map(x=>x.location+'|'+x.title)).size===placesData.items.length,'Duplicated venue names in locality');
assert(placesData.items.every(x=>x.source.startsWith('https://')),'Missing trustworthy source for a place');
assert(placesData.items.every(x=>x.address===null||x.address.endsWith('36367 Wartenberg')),'Unverified town address');

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
    if(String(url).includes('data/events.json'))return {ok:true,json:async()=>eventData};
    if(String(url).includes('data/places.json'))return {ok:true,json:async()=>placesData};
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
 assert(html.includes('Aktuelles aus Wartenberg'),'News intro missing');
 assert(html.includes('Gemeinschaft &amp; Ehrenamt')||html.includes('Gemeinschaft & Ehrenamt'),'Community category missing');
 assert(html.includes('Kultur &amp; Musik')||html.includes('Kultur & Musik'),'Culture category missing');
 assert(html.includes('data-news-topic='),'Topic filters missing');
 assert(html.includes('Aus dem Gemeindeleben'),'Local-news highlights missing');
 assert(html.includes('SG Landenhausen')||html.includes('Sport'),'Sport still accessible');
 assert(html.includes('news-card'),'News cards absent');
 assert(html.includes('Neueste zuerst')&&html.includes('Älteste zuerst'),'News date sorting not available');
 assert(!html.includes('nicht nur Fußball')&&!html.includes('Abseits des Spielfelds')&&!html.includes('Alle Vereine, nicht nur Sport'),'Unwanted football comparison text still present');
 assert(html.includes('data-reader="news"'),'In-app article reading action absent');
 assert(!html.includes('Zu dieser Meldung liegt noch keine eigenständig formulierte Zusammenfassung vor.'),'Old empty reader warning still present');
 const newestWithSummary=data.items.find(n=>(n.summaryType==='Redaktionelle Zusammenfassung'||n.editorial)&&String(n.desc||'').length>=60);
 const withoutSummary=data.items.find(n=>!n.desc&&!n.body);
 assert(newestWithSummary&&withoutSummary,'Need a sample article with/without summary');
 assert(html.includes('Kurzfassung lesen'),'Summarized story must have reader action');

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
 const recentOfficial=data.items.some(n=>n.sourceId==='gemeinde'&&n.via==='Amtliche Website'&&n.officialExcerpt&&(Date.now()-new Date(n.date+'T12:00:00').getTime())<=45*86400000);
 if(recentOfficial)assert(homeHtml.includes('Aktuelles aus dem Rathaus'),'Recent municipal notices missing on homepage');
 const clubPage=launch('clubs');
 await new Promise(r=>setTimeout(r,20));
 const clubsHTML=clubPage.elements['#content'].innerHTML;
 assert(clubsHTML.includes('Vereine &amp; Initiativen')||clubsHTML.includes('Vereine & Initiativen'),'Club directory missing');
 assert(clubsHTML.includes('Kulturverein Landenhausen'),'Culture club missing');
 assert(clubsHTML.includes('Schützenverein Angersbach'),'Schützenverein missing');
 assert(clubsHTML.includes('Jugendfeuerwehr Angersbach'),'Official youth group missing');
 assert(clubsHTML.includes('SG Landenhausen – Abteilung Tischtennis'),'Club section missing');
 assert(clubsHTML.includes('data-reader="club"'),'Club in-app details unavailable');
 const upcomingAssociation=vm.runInContext('clubs.some(c=>relatedClubEvents(c).length>0)',clubPage.ctx);
 if(upcomingAssociation)assert(clubsHTML.includes('Nächster Termin'),'Related club events should appear on club cards');
 const placesPage=launch('places');
 await new Promise(r=>setTimeout(r,20));
 const placesHTML=placesPage.elements['#content'].innerHTML;
 assert(placesHTML.includes('Ortsführer'),'Place guide missing');
 assert(placesData.items.some(p=>p.title==='Wartenberg Oval'),'Verified venue missing from expanded data');
 assert(placesData.items.some(p=>p.title==='Freibad Landenhausen'),'Verified pool missing from expanded data');
 assert(placesHTML.includes('90')&&placesHTML.includes('Orte und Angebote'),'Guide total count missing');
 assert(placesHTML.includes('data-place-more'),'Progressive discovery button missing');
 assert(placesHTML.includes('Essen &amp; Trinken')||placesHTML.includes('Essen & Trinken'),'Restaurants filter missing');
 assert(placesHTML.includes('Gesundheit'),'Healthcare filter missing');
 assert(placesHTML.includes('Wandern &amp; Radfahren')||placesHTML.includes('Wandern & Radfahren'),'Trails filter missing');
 assert(vm.runInContext('places.length',placesPage.ctx)===placesData.items.length,'All verified places must load');
 const placeClick=placesPage.events['click'];
 const placeBtn={hasAttribute:n=>n==='data-place-topic',getAttribute:n=>n==='data-place-topic'?'Essen & Trinken':null,dataset:{},id:''};
 placeClick({target:{id:'',closest:()=>placeBtn}});
 const gastroHtml=placesPage.elements['#content'].innerHTML;
 assert(gastroHtml.includes('Bej Jerje')&&gastroHtml.includes('DorfBräuHaus'),'Gastronomy filter broken');
 assert(!gastroHtml.includes('Spielplatz Krombergsweg'),'Filter includes unrelated places');
 const routeBtn={hasAttribute:n=>n==='data-place-topic',getAttribute:n=>n==='data-place-topic'?'Wandern & Radfahren':null,dataset:{},id:''};
 placeClick({target:{id:'',closest:()=>routeBtn}});
 const routesHtml=placesPage.elements['#content'].innerHTML;
 assert(routesHtml.includes('Sonnenweg der Poesie'),'Verified official hiking route absent');
 assert(!routesHtml.includes('Karten-Suche'),'Hiking routes without verified entry coordinates must not offer misleading map links');

 const remaining=['events','waste','service','weather','settings'];
 for(const page of remaining){
   const v=launch(page);
   await new Promise(r=>setTimeout(r,10));
   const h=v.elements['#content'].innerHTML;
   assert(h.length>250,'Page empty: '+page);
   assert(!h.includes('Inhalte vorübergehend nicht verfügbar'),'Rendering failed: '+page);
 }
 const ev=launch('events');
 await new Promise(r=>setTimeout(r,40));
 const eventHtml=ev.elements['#content'].innerHTML;
 assert(eventHtml.includes('Seniorennachmittag')||eventHtml.includes('Weihnachtsmarkt'),'Additional official December events missing');
 assert(eventHtml.includes('data-reader="event"'),'Event in-app details missing');
 assert(eventHtml.includes('data-event-category'),'Event topic filters missing');
 assert(eventHtml.includes('Geprüft:'),'Calendar freshness indicator missing');
 const articlePage=launch('news');
 await new Promise(r=>setTimeout(r,40));
 const articleClick=articlePage.events['click'];
 const openBtn={id:'',dataset:{},hasAttribute:n=>n==='data-reader',getAttribute:n=>n==='data-reader'?'news':n==='data-reader-id'?'curated-v2-02':null};
 articleClick({target:{id:'',closest(sel){return sel==='button'||sel==='a,button'?openBtn:null;}}});
 assert(articlePage.elements['#reader-modal'].hidden===false,'Article reader did not open');
 assert(articlePage.elements['#reader-content'].innerHTML.includes('Bundeswehr'),'Article content not displayed in reader');
 assert(!articlePage.elements['#reader-content'].innerHTML.includes('Zu dieser Meldung liegt noch keine eigenständig formulierte Zusammenfassung vor.'),'Placeholder must not appear');
 const noSummaryPage=launch('news');
 await new Promise(r=>setTimeout(r,40));
 const noSummaryClick=noSummaryPage.events['click'];
 const blocked={id:'',dataset:{},hasAttribute:n=>n==='data-reader',getAttribute:n=>n==='data-reader'?'news':n==='data-reader-id'?withoutSummary.id:null};
 noSummaryClick({target:{id:'',closest(sel){return sel==='button'||sel==='a,button'?blocked:null;}}});
 assert(!noSummaryPage.elements['#reader-modal'] || noSummaryPage.elements['#reader-modal'].hidden!==false,'Unsummarized news must not open an empty reader');

 const clubsReader=launch('clubs');
 const clubClick=clubsReader.events['click'];
 const openClub={id:'',dataset:{},hasAttribute:n=>n==='data-reader',getAttribute:n=>n==='data-reader'?'club':n==='data-reader-id'?'c0':null};
 clubClick({target:{id:'',closest(sel){return sel==='button'||sel==='a,button'?openClub:null;}}});
 assert(clubsReader.elements['#reader-content'].innerHTML.includes('Angersbach Aktiv'),'Club profile not shown');
 const evReader=launch('events');
 await new Promise(r=>setTimeout(r,40));
 const eventClick=evReader.events['click'];
 const openEvent={id:'',dataset:{},hasAttribute:n=>n==='data-reader',getAttribute:n=>n==='data-reader'?'event':n==='data-reader-id'?eventData.items[0].id:null};
 eventClick({target:{id:'',closest(sel){return sel==='button'||sel==='a,button'?openEvent:null;}}});
 assert(evReader.elements['#reader-content'].innerHTML.includes('Kirmes'),'Event details not shown');
 console.log('OK: '+data.items.length+' Meldungen, '+eventData.items.length+' Termine, Leser und Vereinsverzeichnis; alle 9 Seiten gerendert.');
}
main().catch(err=>{console.error(err);process.exitCode=1;});