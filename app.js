'use strict';
const $=(q,root=document)=>root.querySelector(q);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={home:'⌂',news:'▤',events:'▦',waste:'▣',clubs:'♧',service:'✚',settings:'⚙',weather:'☀',search:'⌕',star:'☆',calendar:'▦',map:'⌾',arrow:'→'};
const sources={gemeinde:'https://www.gemeinde-wartenberg.de/',news:'https://www.gemeinde-wartenberg.de/alle-news.html',events:'https://www.gemeinde-wartenberg.de/kalenderdaten/alle-termine.html',clubs:'https://www.gemeinde-wartenberg.de/freizeit-tourismus-1/vereine.html',zav:'https://www.zav-online.de/gemeinde-wartenberg-termine',zavCalendar:'https://zav-online.projects.kicms.de/abfallkalender',waste:'https://www.wartenberg-info.de/abfallkalender/',service:'https://www.gemeinde-wartenberg.de/notruftafel/notfaelle-/-notdienste.html'};
let news=[{date:'2026-10-05',title:'Rathaus und Bauhof am 16. Oktober geschlossen',desc:'Die Gemeinde informiert über die Schließung von Rathaus und Bauhof am Freitag, 16. Oktober.',category:'Gemeinde'},{date:'2026-10-05',title:'Bundeswehr-Manöver vom 13. bis 15. Oktober',desc:'Informationen der Gemeinde zu einem Bundeswehr-Manöver im Zeitraum 13. bis 15. Oktober.',category:'Gemeinde'},{date:'2026-10-01',title:'Herbst ist da: Entsorgung von Laub',desc:'Die Gemeinde gibt Hinweise zum Umgang mit und zur Entsorgung von Herbstlaub.',category:'Umwelt'}].map((n,i)=>({...n,id:'n'+i,source:sources.news,sourceName:'Gemeinde Wartenberg',locality:'Wartenberg'}));
let eventsUpdatedAt='2026-10-11',eventsStatus='Redaktionelle Vorschau';
const newsSeed=news.slice();let newsUpdatedAt=null,newsSources=[],newsStatus='fallback',newsSource='Alle';
const NEWS_TOPICS=['Alle Themen','Rathaus & Politik','Kultur & Musik','Gemeinschaft & Ehrenamt','Familie & Soziales','Natur & Umwelt','Verkehr & Bauen','Blaulicht','Sport','Vogelsberg'];
let newsTopicFilter='Alle Themen',newsLimit=18,clubCategory='Alle',placeCategory='Alle',eventCategory='Alle',newsSort=read('newsSort','newest'),readerPreviousFocus=null;

let events=[['2026-10-15','2026-10-17','Kirmes in Angersbach','Angersbach','Kultur','Kirmesclub Angersbach'],['2026-10-24',null,'Liederabend zum 135-jährigen Bestehen des MGV','Landenhausen','Musik','MGV Landenhausen'],['2026-11-14',null,'Beutelchesessen','Landenhausen','Gemeinschaft','VdK Landenhausen'],['2026-11-21',null,'Jahresabschlussessen','Angersbach','Gemeinschaft','Obst- und Gartenbauverein Angersbach'],['2026-11-28',null,'Adventsfeier','Landenhausen','Gemeinschaft','VdK Landenhausen'],['2026-11-28',null,'Adventskranzwickeln','Landenhausen','Kultur','Obst- und Gartenbauverein Landenhausen'],['2026-12-04',null,'Weihnachtsfeier','Landenhausen','Gemeinschaft','Landfrauenverein Landenhausen'],['2026-12-12',null,'Weihnachtskonzert','Landenhausen','Musik','MGV und Musikverein Landenhausen']].map((a,i)=>({id:'e'+i,start:a[0],end:a[1]||a[0],title:a[2],location:a[3],category:a[4],organizer:a[5],source:sources.events}));
const wasteTypes={Restmüll:{color:'#6c747b',bg:'#e9edf0',icon:'▣'},Bio:{color:'#836043',bg:'#f4e8db',icon:'♣'},'Gelbe Tonne':{color:'#ad8826',bg:'#faf0c5',icon:'▤'},Papier:{color:'#417bad',bg:'#dfedf9',icon:'▥'}};
const wastes=[['2026-10-13','Restmüll'],['2026-10-19','Bio'],['2026-10-28','Gelbe Tonne'],['2026-11-02','Bio'],['2026-11-03','Papier'],['2026-11-11','Restmüll'],['2026-11-16','Bio'],['2026-11-25','Gelbe Tonne'],['2026-12-01','Papier'],['2026-12-08','Restmüll'],['2026-12-11','Bio'],['2026-12-21','Gelbe Tonne'],['2026-12-28','Bio']].map((a,i)=>({id:'w'+i,date:a[0],type:a[1],source:sources.waste}));
const clubs=[["Angersbach Aktiv e.V.","Angersbach","Gemeinschaft","https://www.angersbach-aktiv.de/","Der Verein Angersbach Aktiv ist Teil des gesellschaftlichen und ehrenamtlichen Lebens in Angersbach. Die offizielle Vereinsübersicht führt ihn als örtliche Organisation."],["Angersbacher Netzwerk Familie, Beruf, Freizeit (FBF)","Angersbach","Soziales",null,"Das Netzwerk FBF widmet sich den Themen Familie, Beruf und Freizeit in Angersbach und ist als Gruppe in der Gemeinde gelistet."],["Stamm Zugvögel Wartenberg (Pfadfinder)","Angersbach","Jugend",null,"Der Pfadfinderstamm Zugvögel Wartenberg gehört zur örtlichen Kinder- und Jugendarbeit im Bund der Pfadfinderinnen und Pfadfinder."],["Carneval Club Zeppe Angersbach","Angersbach","Kultur","https://www.cc-zeppe.de/","Der Carneval Club Zeppe Angersbach gehört zum örtlichen Karneval und Brauchtum. Er ist im offiziellen Gemeindeverzeichnis verzeichnet."],["Freiwillige Feuerwehr Angersbach","Angersbach","Feuerwehr","https://www.feuerwehr-angersbach.de/","Die Freiwillige Feuerwehr Angersbach ist eine örtliche Feuerwehreinheit. Neben dem Einsatzdienst gibt es eine eigene Jugendfeuerwehr."],["Fördergemeinschaft zur Rettung der Burgruine Wartenberg","Angersbach","Geschichte",null,"Die Fördergemeinschaft setzt sich für die Erhaltung der Burgruine Wartenberg ein. Sie ist ein Beispiel für langfristiges ehrenamtliches Engagement für die Ortsgeschichte."],["Förderverein der Mittelpunktschule Angersbach e.V.","Angersbach","Jugend",null,"Der Förderverein der Mittelpunktschule Angersbach unterstützt Anliegen rund um den Schulstandort. Er ist über die Gemeinde und die Schule auffindbar."],["HIPPO Promotion Sports Club e.V.","Angersbach","Sport","https://www.hippopromotion.de/","Der HIPPO Promotion Sports Club ist dem Reitsport und dem sportlichen Angebot in Angersbach zugeordnet."],["Heimat- und Verkehrsverein Wartenberg","Angersbach","Gemeinschaft",null,"Der Heimat- und Verkehrsverein gehört zum lokalen Vereinsleben mit Bezug zur Heimat- und Ortskultur."],["Historisches Bildarchiv Angersbach e.V.","Angersbach","Geschichte","https://bildarchiv-angersbach.jimdo.com/","Das historische Bildarchiv beschäftigt sich mit der Bildgeschichte von Angersbach und der Dokumentation der Ortsvergangenheit."],["Interessengemeinschaft Ahle Bulldogge us Angeschbach oh Lannehuse","Angersbach","Tradition","https://www.ahle-bulldogge.de/","Diese Interessengemeinschaft widmet sich historischen Traktoren und der Pflege technischer Traditionen in Angersbach und Landenhausen."],["Karate-Dojo Wartenberg e.V.","Angersbach","Sport","https://www.koerperzentrum-wartenberg.de/","Das Karate-Dojo Wartenberg ist dem Kampfsport zugeordnet und im Vereinsverzeichnis der Gemeinde geführt."],["Kirmesclub Angersbach","Angersbach","Kultur","https://www.kirmesclub-angersbach.de/","Der Kirmesclub Angersbach gehört zum örtlichen Brauchtum und organisiert beziehungsweise begleitet Kirmesaktivitäten."],["Linedance Crazy Thunderbirds","Angersbach","Kultur",null,"Die Crazy Thunderbirds sind eine Linedance-Gruppe aus dem örtlichen Kultur- und Freizeitangebot."],["Obst- und Gartenbauverein Angersbach","Angersbach","Natur",null,"Der Obst- und Gartenbauverein Angersbach ist Teil der örtlichen Garten- und Naturtradition."],["Reservistenkameradschaft Lauterbach/Wartenberg","Angersbach","Gemeinschaft",null,"Die Reservistenkameradschaft Lauterbach/Wartenberg ist im Vereinsverzeichnis als gemeinschaftliche Organisation aufgeführt."],["Schützenverein Angersbach","Angersbach","Sport","https://www.sv-angersbach.de/","Der Schützenverein Angersbach ist dem Schießsport und dem traditionellen örtlichen Vereinswesen zuzuordnen."],["Therapiehunde Osthessen e.V.","Angersbach","Soziales","https://www.therapiehunde-osthessen.de/","Therapiehunde Osthessen ist eine Organisation rund um tiergestützte Begleitung und soziales Engagement."],["Trachten- und Volkstanzgruppe Angersbach","Angersbach","Kultur",null,"Die Trachten- und Volkstanzgruppe Angersbach verbindet örtliche Tanz- und Brauchtumstraditionen."],["Turnverein Angersbach (TVA)","Angersbach","Sport","https://www.tv-angersbach.de/","Der Turnverein Angersbach ist ein Mehrsparten-Sportverein. Die Gemeinde listet eigene Abteilungen etwa für Tennis, Tischtennis, Handball und Leichtathletik."],["Uganda Friends e.V.","Angersbach","Soziales",null,"Uganda Friends ist ein im Wartenberger Verzeichnis geführter Verein mit sozialem beziehungsweise internationalem Engagement."],["VdK Ortsverband Angersbach","Angersbach","Soziales",null,"Der Sozialverband VdK ist über einen Ortsverband in Angersbach vertreten."],["Verein der Vogelfreunde Angersbach","Angersbach","Natur",null,"Die Vogelfreunde Angersbach gehören zum örtlichen Vereinsleben mit Schwerpunkt auf Vögeln und Natur."],["Verein für Deutsche Schäferhunde – OG Wartenberg","Angersbach","Natur","https://www.sv-ogwartenberg.de/","Die Ortsgruppe Wartenberg des Vereins für Deutsche Schäferhunde gehört zum kynologischen Vereinsleben."],["Vocalensemble Contraste","Angersbach","Musik","https://www.wartenberg-evangelisch.de/","Vocalensemble Contraste ist dem Chorgesang und der musikalischen Kultur zuzuordnen."],["Freiwillige Feuerwehr Landenhausen","Landenhausen","Feuerwehr","https://www.feuerwehr-landenhausen.de/","Die Freiwillige Feuerwehr Landenhausen ist eine örtliche Feuerwehreinheit. Auch hier ist eine Jugendfeuerwehr aktiv."],["Jugendfeuerwehr Landenhausen","Landenhausen","Jugend","https://www.feuerwehr-landenhausen.de/","Die Jugendfeuerwehr Landenhausen ist eine Nachwuchsgruppe innerhalb der örtlichen Freiwilligen Feuerwehr."],["Hilfsgemeinschaft Landenhausen","Landenhausen","Soziales",null,"Die Hilfsgemeinschaft Landenhausen ist Teil des sozialen und gemeinschaftlichen Engagements im Ortsteil."],["Jugendorganisation Bauwagen Landenhausen","Landenhausen","Jugend",null,"Der Bauwagen Landenhausen ist eine örtliche Jugendorganisation, die unter anderem im Veranstaltungskalender als Kirmesveranstalter auftritt."],["Kulturverein Landenhausen e.V.","Landenhausen","Kultur","https://kulturverein-landenhausen.de/","Der Kulturverein Landenhausen organisiert kulturelle Aktivitäten. Bekannt sind unter anderem der Kunstspaziergang und die Florinale."],["Landfrauenverein Landenhausen","Landenhausen","Gemeinschaft",null,"Die Landfrauen Landenhausen gehören zum örtlichen Vereins- und Gemeinschaftsleben und erscheinen als Veranstalter im Gemeindekalender."],["Musikverein Landenhausen","Landenhausen","Musik","https://www.musikverein-landenhausen.de/","Der Musikverein Landenhausen gehört zur örtlichen Musiktradition und wirkt an Konzerten und musikalischen Gemeinschaftsveranstaltungen mit."],["Männergesangverein 1891 Landenhausen e.V.","Landenhausen","Musik","https://www.mgv-landenhausen.de/","Der Männergesangverein Landenhausen blickt auf eine lange Geschichte des Chorgesangs zurück. Für 2026 ist ein Liederabend zum 135-jährigen Bestehen angekündigt."],["Obst- und Gartenbauverein Landenhausen","Landenhausen","Natur","https://www.ogvlandenhausen.de/","Der Obst- und Gartenbauverein Landenhausen ist Teil der Garten- und Naturkultur. Im Veranstaltungskalender stehen unter anderem gemeinsame Vereinsaktionen."],["Reit- und Fahrverein Landenhausen","Landenhausen","Sport","https://www.ruf-landenhausen.de/","Der Reit- und Fahrverein Landenhausen gehört zum örtlichen Pferde- und Reitsport."],["Sportgemeinschaft Landenhausen","Landenhausen","Sport","https://www.sg-landenhausen.de/","Die Sportgemeinschaft Landenhausen ist ein Mehrspartenverein, der unter anderem Fußball, Garde, Leichtathletik, Schützen und Tischtennis umfasst."],["VdK Ortsverband Landenhausen","Landenhausen","Soziales","https://www.vdk.de/","Der VdK-Ortsverband Landenhausen gehört zum sozialen Vereinsleben und tritt auch als Veranstalter gemeinsamer Termine auf."],["Förderverein Schwimmbad Landenhausen e.V.","Landenhausen","Gemeinschaft","https://www.gemeinde-wartenberg.de/freizeit-tourismus-1/sport-und-freizeit/freibad-landenhausen.html","Der Förderverein Schwimmbad Landenhausen unterstützt zusätzliche Ausstattung und Aktionen des örtlichen Freibads. Betreiber des Freibads bleibt die Gemeinde Wartenberg."],["Jugendfeuerwehr Angersbach","Angersbach","Jugend","https://www.feuerwehr-angersbach.de/","Die Jugendfeuerwehr Angersbach ist der Nachwuchsbereich der Freiwilligen Feuerwehr Angersbach."],["TV Angersbach – Abteilung Handball","Angersbach","Sport","https://www.hsg-vulkan-vogelsberg.de/","Diese Abteilung des Turnvereins Angersbach gehört zum örtlichen Handballangebot."],["TV Angersbach – Abteilung Jugendfußball","Angersbach","Jugend","https://www.fsg-wartenberg.de/","Die Jugendfußball-Abteilung des Turnvereins Angersbach ist dem fußballerischen Nachwuchs zuzuordnen."],["TV Angersbach – Abteilung Leichtathletik","Angersbach","Sport","https://www.tv-angersbach.de/","Die Leichtathletik-Abteilung bietet eine Sportgruppe innerhalb des Turnvereins Angersbach."],["TV Angersbach – Abteilung Tennis","Angersbach","Sport","https://www.tv-angersbach.de/","Die Tennis-Abteilung gehört zum sportlichen Angebot des Turnvereins Angersbach."],["TV Angersbach – Abteilung Tischtennis","Angersbach","Sport","https://www.tv-angersbach.de/","Die Tischtennis-Abteilung ist innerhalb des Turnvereins Angersbach angesiedelt."],["SG Landenhausen – Abteilung Fußball","Landenhausen","Sport","https://www.fsg-wartenberg.de/","Die Fußball-Abteilung der Sportgemeinschaft Landenhausen gehört zum örtlichen Fußballangebot."],["SG Landenhausen – Abteilung Garde","Landenhausen","Kultur","https://www.sg-landenhausen.de/","Die Garde-Abteilung ist eine Sparte der Sportgemeinschaft Landenhausen mit Bezug zu Tanz und Vereinsleben."],["SG Landenhausen – Abteilung Leichtathletik","Landenhausen","Sport","https://www.sg-landenhausen.de/","Die Leichtathletik-Abteilung gehört zu den in der Gemeinde aufgeführten Sparten der Sportgemeinschaft Landenhausen."],["SG Landenhausen – Abteilung Schützen","Landenhausen","Sport","https://www.sg-landenhausen.de/","Die Schützen-Abteilung der Sportgemeinschaft Landenhausen gehört zum örtlichen Schießsport."],["SG Landenhausen – Abteilung Tischtennis","Landenhausen","Sport","https://www.sg-landenhausen.de/","Die Tischtennis-Abteilung ist eine der Sportsparten der Sportgemeinschaft Landenhausen."]].map((a,i)=>({id:'c'+i,title:a[0],location:a[1],category:a[2],source:sources.clubs,website:a[3]||null,description:a[4]||''}));
let places=[["Rathaus Wartenberg","Angersbach","Verwaltung","Landenhäuser Straße 11, 36367 Wartenberg","Bürgerservice und Gemeindeverwaltung.","https://www.gemeinde-wartenberg.de/"],["Wartenberg Oval","Angersbach","Veranstaltungen","Stangenweg 26, 36367 Wartenberg","Saal, Kultur- und Veranstaltungszentrum.","https://www.gemeinde-wartenberg.de/freizeit-tourismus-1/veranstaltungsraeume/-plaetze.html"],["Burgruine Wartenberg","Angersbach","Ausflugsziel","Burgruine Wartenberg, 36367 Wartenberg","Historisches Ausflugsziel bei Angersbach.","https://www.gemeinde-wartenberg.de/freizeit-tourismus-1/veranstaltungsraeume/-plaetze.html"],["Info- und Raststation Burgruine","Angersbach","Ausflugsziel","Burgruine Wartenberg, 36367 Wartenberg","Rast- und Infostation am Vulkanradweg.","https://www.gemeinde-wartenberg.de/freizeit-tourismus-1/veranstaltungsraeume/-plaetze.html"],["Grillplatz Angersbach","Angersbach","Freizeit","Hainigweg, 36367 Wartenberg","Grillplatz im Ortsteil Angersbach.","https://www.gemeinde-wartenberg.de/freizeit-tourismus-1/veranstaltungsraeume/-plaetze.html"],["Grundschule Wartenberg","Angersbach","Familie","Schillerstraße 1, 36367 Wartenberg","Schulstandort in Angersbach.","https://www.gemeinde-wartenberg.de/freizeit-tourismus-1/vereine.html"],["Freiwillige Feuerwehr Angersbach","Angersbach","Sicherheit","In den Fetzwiesen 18, 36367 Wartenberg","Standort der Freiwilligen Feuerwehr.","https://www.gemeinde-wartenberg.de/freizeit-tourismus-1/vereine.html"],["Gemeinschaftsraum Landenhausen","Landenhausen","Veranstaltungen","Mittelstraße 10, 36367 Wartenberg","Raum für Feiern und Veranstaltungen.","https://www.gemeinde-wartenberg.de/freizeit-tourismus-1/veranstaltungsraeume/-plaetze.html"],["Freibad Landenhausen","Landenhausen","Freizeit","Am Sportzentrum 3, 36367 Wartenberg","Freibad für Familien. Saisonzeiten vor Besuch prüfen.","https://www.gemeinde-wartenberg.de/freizeit-tourismus-1/sport-und-freizeit/freibad-landenhausen.html"],["Freiwillige Feuerwehr Landenhausen","Landenhausen","Sicherheit","Mittelstraße 10 A, 36367 Wartenberg","Standort der Freiwilligen Feuerwehr.","https://www.gemeinde-wartenberg.de/freizeit-tourismus-1/vereine.html"]].map((v,i)=>({id:'p'+i,title:v[0],location:v[1],category:v[2],address:v[3],description:v[4],source:v[5]}));
let placesUpdatedAt='2026-10-11',placesStatus='Redaktioneller Startbestand',placeLimit=24;
let placeViewMode=read('placeViewMode','map'),placeCoordinates={},placeMapItems=[],placeMapSelected=null;
if(!['map','list'].includes(placeViewMode))placeViewMode='map';
const pages=[['home','Übersicht','⌂'],['news','Nachrichten','▤'],['events','Veranstaltungen','▦'],['waste','Abfallkalender','▣'],['clubs','Vereine','♧'],['places','Ortsführer','⌾'],['service','Service & Notruf','✚'],['weather','Wetter','☀'],['settings','Einstellungen','⚙']];
const now=()=>new Date();const dateObj=s=>new Date(s+'T12:00:00');const fmt=(s,opt={day:'numeric',month:'long',year:'numeric'})=>dateObj(s).toLocaleDateString('de-DE',opt);const dayKey=()=>new Date().toLocaleDateString('sv-SE');
function read(key,fallback){try{const x=JSON.parse(localStorage.getItem('w360:'+key));return x??fallback}catch{return fallback}}function save(key,val){try{localStorage.setItem('w360:'+key,JSON.stringify(val))}catch{}}
let settings=read('settings',{location:'Angersbach',theme:'system'}),fav=read('favorites',[]),weatherCache=read('weather',null),weather=null,current='home',filter='Alle',search='',eventMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1),onlyFavorites=false,monthSelected=null;
if(!settings || typeof settings!=='object' || Array.isArray(settings)) settings={location:'Angersbach',theme:'system'};
if(!Array.isArray(fav)) fav=[];
if(!weatherCache || typeof weatherCache!=='object') weatherCache=null;
function applyTheme(){document.body.classList.toggle('dark',settings.theme==='dark'||(settings.theme==='system'&&window.matchMedia?.('(prefers-color-scheme:dark)').matches))}applyTheme();
function go(page){if(!pages.some(p=>p[0]===page))page='home';current=page;filter=page==='news'?'Wartenberg':'Alle';if(page==='clubs')clubCategory='Alle';if(page==='events')eventCategory='Alle';if(page==='places'){placeCategory='Alle';placeLimit=24;}if(page==='news'){newsTopicFilter='Alle Themen';newsLimit=18;}search='';onlyFavorites=false;monthSelected=null;location.hash=page;render();window.scrollTo({top:0,behavior:'instant'})}
const button=(label,p='home',kind='primary-btn')=>`<button class="${kind}" data-nav="${p}">${esc(label)} <span>→</span></button>`;
const link=(href,label)=>`<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
function sectionTitle(title,linkPage=null){return `<div class="section-head"><h2 class="section-title">${esc(title)}</h2>${linkPage?`<button class="link-button" data-nav="${linkPage}">Alle anzeigen →</button>`:''}</div>`}
function heading(kicker,title,desc){return `<div class="page-heading"><div><div class="page-eyebrow">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(desc)}</p></div></div>`}
function empty(msg){return `<div class="empty-state"><div style="font-size:28px">⌕</div><h3>Keine Treffer</h3><p>${esc(msg)}</p></div>`}
function legacyECard(e){const f=fav.includes(e.id);return `<article class="card event-card"><div class="date-tile"><strong>${fmt(e.start,{day:'2-digit'})}</strong><span>${fmt(e.start,{month:'short'}).toUpperCase()}</span></div><div class="list-card-main"><h3>${esc(e.title)}</h3><div class="small-meta">⌾ ${esc(e.location)} · ${esc(e.category)}${e.end!==e.start?' · bis '+fmt(e.end,{day:'numeric',month:'short'}):''}</div><div class="source-mention">${esc(e.organizer)} · <a href="${e.source}" target="_blank" rel="noopener">Quelle ↗</a></div></div><div class="event-actions"><button class="tiny-action" data-ics="${e.id}" title="Termin als ICS herunterladen">▦</button><button class="star-btn ${f?'active':''}" data-fav="${e.id}" aria-label="${f?'Favorit entfernen':'Als Favorit speichern'}" title="Favorit">${f?'★':'☆'}</button></div></article>`}
function legacyNCard(n){const by=n.sourceName||'Gemeinde Wartenberg';const where=n.locality||'Wartenberg';return `<article class="card news-card"><div class="news-meta-row"><span class="soft-tag">${esc(n.category||'Lokales')}</span><span class="news-date">${fmt(n.date)}</span></div><h3>${esc(n.title)}</h3>${n.desc?`<p>${esc(n.desc)}</p>`:''}<div class="source-footer"><span>${esc(by)} · ${esc(where)}${n.via?' · '+esc(n.via):''}</span>${link(n.source,n.via==='Google News'?'Artikel öffnen':'Originalmeldung')}</div></article>`}
function legacyCCard(c){const f=fav.includes(c.id);return `<article class="card club-card"><div class="club-top"><div class="club-logo">${c.category==='Feuerwehr'?'✚':c.category==='Musik'?'♫':c.category==='Natur'?'♧':'✦'}</div><button class="star-btn ${f?'active':''}" data-fav="${c.id}" title="Favorit">${f?'★':'☆'}</button></div><h3>${esc(c.title)}</h3><div class="small-meta">⌾ ${esc(c.location)} · ${esc(c.category)}</div><div class="source-mention">${link(c.source,'Vereinsquelle öffnen')}</div></article>`}
function wasteItem(w){const meta=wasteTypes[w.type];return `<article class="schedule-item"><div class="schedule-left"><div class="bin-color-dot" style="background:${meta.color}"></div><div><strong>${esc(w.type)}</strong><span>Vorschau · ${fmt(w.date,{weekday:'long'})}</span></div></div><div class="schedule-date">${fmt(w.date,{day:'2-digit',month:'short',year:'numeric'})}</div></article>`}
function weatherCode(code){if(code==null)return ['–','Keine Daten'];if(code===0)return ['☀️','Sonnig'];if(code<=3)return ['⛅','Bewölkt'];if(code<=48)return ['🌫️','Nebel'];if(code<=67)return ['🌧️','Regen'];if(code<=77)return ['🌨️','Schnee'];if(code<=82)return ['🌦️','Schauer'];if(code<=86)return ['❄️','Schnee'];return ['⛈️','Gewitter']}
function actualWeather(){return weather||weatherCache?.data||null}
function homeOfficialBulletins(){
 const recent=news.filter(n=>n.sourceId==='gemeinde'&&n.via==='Amtliche Website'&&n.officialExcerpt
      &&(Date.now()-new Date(n.date+'T12:00:00').getTime())<=45*86400000)
     .sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,2);
 if(!recent.length)return "";
 return `<section class="v22-municipal-brief"><div class="v2-section-title"><h2>Aktuelles aus dem Rathaus</h2><span>Mitteilungen der Gemeinde Wartenberg</span></div><div class="v22-municipal-grid">${recent.map(n=>`<article class="v22-municipal-item"><div class="v22-municipal-date">${fmt(n.date,{day:'numeric',month:'short',year:'numeric'})}</div><h3>${esc(n.title)}</h3><p>${esc(n.officialExcerpt)}</p>${link(n.source,"Amtliche Mitteilung ↗")}</article>`).join('')}</div></section>`;
}
function viewHome(){const upcoming=events.filter(e=>e.end>=dayKey()).slice(0,4),nextWaste=wastes.find(w=>w.date>=dayKey()),w=actualWeather(),wc=weatherCode(w?.current?.weather_code);return `<div class="hero"><div class="hero-info">✧ DEIN ORT. DEIN TAG.</div><h1>Schön, dass du<br>hier bist<span style="color:#d4a565">.</span></h1><p>Alles Wichtige aus Angersbach und Landenhausen. An einem Ort, immer griffbereit.</p><div class="hero-actions">${button('Was ist los?','events')}${button('Gemeindenachrichten','news','secondary-btn')}</div></div><div class="grid-overview"><section class="card metric-card"><div class="card-top"><span class="card-label">Wetter in ${esc(settings.location)}</span><span class="tiny-icon">☀</span></div><div class="weather-hero"><div class="weather-emoji">${wc[0]}</div><div><div class="big-number">${w?Math.round(w.current.temperature_2m)+'°':'–'}</div><div class="metric-sub">${esc(wc[1])}</div></div></div><div class="card-footer"><span>${w?'Wind '+Math.round(w.current.wind_speed_10m)+' km/h':'Online-Wetter wird geladen'}${weather?' · Live':weatherCache?' · letzter Stand':''}</span><button data-nav="weather">Vorhersage →</button></div></section><section class="card metric-card"><div class="card-top"><span class="card-label">Nächste Müllabfuhr</span><span class="tiny-icon">▣</span></div>${nextWaste?`<div><div class="date-big">${fmt(nextWaste.date,{day:'numeric',month:'short'})}</div><div class="metric-sub">${esc(nextWaste.type)} · Vorschau</div></div>`:'<div class="metric-sub">Keine weiteren Termine in den hinterlegten Daten.</div>'}<div class="card-footer"><span>Offizielle Straße beim ZAV prüfen</span><button data-nav="waste">Kalender →</button></div></section><section class="card metric-card"><div class="card-top"><span class="card-label">Als Nächstes vor Ort</span><span class="tiny-icon">▦</span></div>${upcoming.length?`<div><div class="date-big">${fmt(upcoming[0].start,{day:'numeric',month:'short'})}</div><div class="metric-sub clamped">${esc(upcoming[0].title)}</div></div>`:'<div class="metric-sub">Keine weiteren erfassten Veranstaltungen.</div>'}<div class="card-footer"><span>${upcoming[0]?esc(upcoming[0].location):'Weitere Termine online'}</span><button data-nav="events">Entdecken →</button></div></section></div>${homeOfficialBulletins()}<div class="v2-home-shortcuts"><button type="button" data-nav="news">▤ Nachrichten aus dem Ort →</button><button type="button" data-nav="clubs">♧ Alle Vereine →</button><button type="button" data-nav="places">⌾ Ortsführer →</button></div><div class="page-section">${sectionTitle('Das steht als Nächstes an','events')}<div class="list-cards">${upcoming.length?upcoming.map(eCard).join(''):empty('Weitere Termine direkt bei der Gemeinde prüfen.')}</div></div><div class="page-section">${sectionTitle('Aus unserem Dorfleben','news')}<div class="news-grid">${homeDigest().map(nCard).join('')}</div><p class="source-mention">${esc(newsFreshness())} · Meldungen aus öffentlichen RSS-/Nachrichtenindizes mit Quellenlinks.</p></div><div class="page-section"><div class="strip">ⓘ Diese App ist ein unabhängiges Projekt. Wetter wird live abgerufen; Nachrichten werden bei verfügbarem Feed automatisch aktualisiert. Termine werden mit dem Gemeindekalender abgeglichen, soweit die Quelle erreichbar ist. Die Abfallvorschau ist redaktionell erfasst. ${link(sources.gemeinde,'Offizielles Gemeindeportal')}</div></div>`}
function newsFreshness(){if(!newsUpdatedAt)return 'Redaktioneller Startbestand vom 11.10.2026 · erste automatische Aktualisierung steht aus';const t=new Date(newsUpdatedAt);if(!Number.isFinite(t.getTime()))return 'Aktualisierungszeitpunkt unbekannt';const age=Date.now()-t.getTime();return 'News-Stand: '+t.toLocaleString('de-DE',{dateStyle:'medium',timeStyle:'short'})+' Uhr'+(newsStatus==='cache'?' · zwischengespeichert':age>6*3600000?' · Daten möglicherweise veraltet':' · automatischer Abruf etwa alle 2 Stunden');}
function legacyNewsSourcePanel(){const all=[['gemeinde','Gemeinde Wartenberg',sources.news],['kreis','Vogelsbergkreis','https://www.vogelsbergkreis.de/'],['polizei','Polizeipräsidium Osthessen','https://www.presseportal.de/blaulicht/nr/43558'],['oberhessen','Oberhessen-live','https://www.oberhessen-live.de/vogelsberg/'],['osthessen','Osthessen News','https://osthessen-news.de/'],['fulda','Fuldaer Zeitung','https://www.fuldaerzeitung.de/vogelsberg/'],['la','Lauterbacher Anzeiger','https://www.lauterbacher-anzeiger.de/vogelsbergkreis/wartenberg/'],['winfo','Wartenberg-iNFO','https://www.wartenberg-info.de/']];return `<details class="card news-sources"><summary>Quellenstatus · 8 Nachrichtenanbieter</summary><div class="source-status-grid">${all.map(([id,name,url])=>{const x=newsSources.find(v=>v.id===id);return `<div class="source-status-item"><strong>${esc(name)}</strong><small>${x?(x.count?esc(x.count+' Meldungen · '+x.mode):'Aktuell keine abrufbaren Artikel'):'Abrufstatus noch nicht verfügbar'}</small>${link(url,'Quelle öffnen')}</div>`}).join('')}</div><p class="source-mention">Gespeichert werden nur Titel, Datum und Links aus öffentlichen Feeds oder Nachrichtenindizes. Es werden keine ganzen Zeitungsartikel oder fremde Bilder übernommen. Beim Lauterbacher Anzeiger können einzelne Originalartikel ein Abo erfordern.</p></details>`}
function legacyViewNews(){const labels=['Alle','Wartenberg','Gemeinde','Vogelsberg','Blaulicht','Vereine','Verkehr'];const publishers=[...new Set(news.map(n=>n.sourceName||'Gemeinde Wartenberg'))].sort();const arr=news.filter(n=>(filter==='Alle'||n.category===filter||filter==='Wartenberg'&&n.locality==='Wartenberg')&&(newsSource==='Alle'||(n.sourceName||'Gemeinde Wartenberg')===newsSource)&&[n.title,n.desc,n.category,n.sourceName,n.locality].join(' ').toLocaleLowerCase('de').includes(search.toLocaleLowerCase('de'))).sort((a,b)=>((b.locality==='Wartenberg')-(a.locality==='Wartenberg'))||String(b.publishedAt||b.date).localeCompare(String(a.publishedAt||a.date)));return `${heading('Immer informiert','Nachrichten','Direkt aus Wartenberg, Angersbach und Landenhausen. Unter „Alle“ findest du weitere Nachrichten aus dem Vogelsbergkreis.')}<div class="strip">ⓘ ${esc(newsFreshness())}. <button type="button" class="text-button" data-news-refresh>Neu laden ↻</button></div><div class="toolbar news-toolbar"><div class="filters">${labels.map(v=>`<button class="chip ${filter===v?'active':''}" data-filter="${v}">${v}</button>`).join('')}</div><label class="news-source-select"><span>Nachrichtenquelle</span><select class="select" data-news-source aria-label="Nachrichtenquelle"><option value="Alle">Alle Quellen</option>${publishers.map(name=>`<option value="${esc(name)}" ${newsSource===name?'selected':''}>${esc(name)}</option>`).join('')}</select></label>${searchBox()}</div><div class="news-results-caption">${arr.length} Artikel · Links führen zur Originalquelle oder zum Nachrichtenindex</div><div class="news-grid">${arr.length?arr.map(nCard).join(''):empty('Keine Meldungen für diese Auswahl. Du kannst die Quellen unten direkt öffnen.')}</div>${newsSourcePanel()}`}
function searchBox(){return `<label class="search-field">⌕ <input id="page-search" value="${esc(search)}" placeholder="In dieser Rubrik suchen ..." aria-label="Rubrik durchsuchen"></label>`}
function viewEvents(){
 const regions=['Alle','Angersbach','Landenhausen','Wartenberg'];
 const categories=['Alle',...new Set(events.map(e=>e.category))].sort((a,b)=>a==='Alle'?-1:b==='Alle'?1:a.localeCompare(b,'de'));
 const regionEvents=events.filter(e=>filter==='Alle'||e.location===filter);
 const active=regionEvents.filter(e=>(eventCategory==='Alle'||e.category===eventCategory)
    &&(!onlyFavorites||fav.includes(e.id))
    &&[e.title,e.organizer,e.location,e.category,e.description].join(' ').toLocaleLowerCase('de').includes(search.toLocaleLowerCase('de')));
 const shown=active.filter(e=>monthSelected?(e.start<=monthSelected&&e.end>=monthSelected):e.end>=dayKey())
    .sort((a,b)=>a.start.localeCompare(b.start)||a.title.localeCompare(b.title,'de'));
 const m=eventMonth,start=new Date(m.getFullYear(),m.getMonth(),1),offset=(start.getDay()+6)%7,days=new Date(m.getFullYear(),m.getMonth()+1,0).getDate();
 const cal=['Mo','Di','Mi','Do','Fr','Sa','So'].map(x=>`<div class="cal-weekday">${x}</div>`).join('')+
   Array.from({length:offset},()=>'<span></span>').join('')+
   Array.from({length:days},(_,i)=>{
     const y=m.getFullYear(),mo=String(m.getMonth()+1).padStart(2,'0'),key=`${y}-${mo}-${String(i+1).padStart(2,'0')}`;
     return `<button type="button" class="cal-day ${active.some(e=>e.start<=key&&e.end>=key)?'has-event':''} ${key===dayKey()?'today':''} ${key===monthSelected?'selected':''}" data-select-day="${key}">${i+1}</button>`;
   }).join('');
 const age=eventsUpdatedAt && /^\d{4}-\d{2}-\d{2}$/.test(eventsUpdatedAt)?
   Math.floor((Date.now()-new Date(eventsUpdatedAt+'T12:00:00').getTime())/86400000):null;
 const freshness=age!==null&&age>7?' · Stand ist älter als eine Woche':"";
 return `${heading('Alle Termine im Überblick','Veranstaltungen','Veranstaltungen, Treffen und Konzerte aus dem Gemeindekalender.')}
    <div class="v22-event-info"><span>▦ ${esc(eventsStatus)}</span><span>Geprüft: ${esc(eventsUpdatedAt||'unbekannt')}${freshness}</span><button type="button" class="text-button" data-events-refresh>↻ Aktualisieren</button></div>
    <div class="toolbar"><div class="filters">${regions.map(v=>`<button type="button" class="chip ${filter===v?'active':''}" data-filter="${v}">${esc(v)}</button>`).join('')}<button type="button" class="chip ${onlyFavorites?'active':''}" data-only-favs="true">★ Merkliste</button></div>${searchBox()}</div>
    <div class="v22-event-categories"><div class="v2-topic-chips" role="group" aria-label="Veranstaltungskategorie">${categories.map(c=>`<button type="button" class="v2-topic-chip ${eventCategory===c?'active':''}" data-event-category="${esc(c)}">${esc(c)} <span>${regionEvents.filter(e=>e.end>=dayKey()&&(c==='Alle'||e.category===c)).length}</span></button>`).join('')}</div></div>
    <div class="calendar-layout"><div class="card calendar-panel"><div class="calendar-top"><strong>${m.toLocaleDateString('de-DE',{month:'long',year:'numeric'})}</strong><div class="calendar-arrows"><button data-cal="-1" aria-label="Vorheriger Monat">‹</button><button data-cal="1" aria-label="Nächster Monat">›</button></div></div><div class="cal-grid">${cal}</div>${monthSelected?`<button class="link-button" data-clear-day="true" style="margin-top:14px">Tagesauswahl zurücksetzen ×</button>`:''}<div class="divider"></div><div class="small-meta">Tage mit Markierung enthalten erfasste Termine. Änderungen bitte beim Veranstalter prüfen.</div></div>
    <div><div class="section-head"><h2 class="section-title">${monthSelected?'Am '+fmt(monthSelected):'Kommende Veranstaltungen'}</h2><span class="badge">${shown.length} Termine</span></div><div class="event-stack">${shown.length?shown.map(eCard).join(''):empty('Für diese Auswahl sind keine Termine im Kalender hinterlegt.')}</div><div class="source-mention">${esc(eventsStatus)} · ${events.length} Termine im Bestand · ${link(sources.events,'Offizieller Gemeindekalender')}</div></div></div>`;
}
function viewWaste(){const future=wastes.filter(x=>x.date>=dayKey()),types=Object.keys(wasteTypes);return `${heading('Entsorgung & Recycling','Abfallkalender','Nächste Leerungen auf einen Blick – mit offiziellen Quellen.')}<div class="strip">⚠ Die folgenden Termine sind eine veröffentlichte <b>Vorschau</b> für Wartenberg. Verbindlich sind die straßenbezogenen Termine des ZAV. ${link(sources.zavCalendar,'Straße beim ZAV auswählen')}</div><div class="waste-grid">${types.map(type=>{const meta=wasteTypes[type],next=future.find(w=>w.type===type);return `<section class="card bin-card"><div class="bin-circle" style="background:${meta.bg};color:${meta.color}">${meta.icon}</div><strong>${esc(type)}</strong><div class="bin-date">${next?fmt(next.date,{day:'numeric',month:'short'}):'–'}</div><div class="bin-sub">${next?'Nächste erfasste Vorschau':'Keine weiteren Daten'}</div></section>`}).join('')}</div><div class="page-section">${sectionTitle('Alle erfassten Leerungen')}<div class="toolbar"><div class="filters">${['Alle',...types].map(v=>`<button class="chip ${filter===v?'active':''}" data-filter="${v}">${v}</button>`).join('')}</div><a class="secondary-btn" href="${sources.zavCalendar}" target="_blank" rel="noopener noreferrer">Offizieller Abfallkalender ↗</a></div><div class="schedule-list">${future.filter(w=>filter==='Alle'||w.type===filter).map(wasteItem).join('')||empty('Keine weiteren Termine erfasst.')}</div><p class="source-mention">Vorschau: ${link(sources.waste,'Wartenberg-iNFO')}; amtliche Auskunft: ${link(sources.zav,'ZAV')}.</p></div>`}
function legacyViewClubs(){const arr=clubs.filter(c=>(filter==='Alle'||c.location===filter)&&(!onlyFavorites||fav.includes(c.id))&&[c.title,c.category,c.location].join(' ').toLocaleLowerCase('de').includes(search.toLocaleLowerCase('de')));return `${heading('Miteinander vor Ort','Unsere Vereine','Entdecke das Ehrenamt und die Gemeinschaft in Wartenberg.')}<div class="toolbar"><div class="filters">${['Alle','Angersbach','Landenhausen'].map(v=>`<button class="chip ${filter===v?'active':''}" data-filter="${v}">${v}</button>`).join('')}<button class="chip ${onlyFavorites?'active':''}" data-only-favs="true">★ Gemerkte</button></div>${searchBox()}</div><div class="clubs-grid">${arr.length?arr.map(cCard).join(''):empty('Keine passenden Vereine gefunden.')}</div><p class="source-mention">Auswahl aus dem Gemeinde- und Veranstaltungskontext; nicht vollständig. ${link(sources.clubs,'Offizielle Vereinsübersicht öffnen')}</p>`}
function viewService(){return `${heading('Gut zu wissen','Service & Notruf','Wichtige Kontakte und Informationen auf einen Blick.')}<div class="service-grid">${[['112','Rettungsdienst & Feuerwehr'],['110','Polizei'],['116117','Ärztlicher Bereitschaftsdienst']].map(a=>`<section class="card emergency-card"><div class="emergency-icon">✚</div><strong>${a[0]}</strong><p>${a[1]}</p><a href="tel:${a[0]}">Jetzt anrufen →</a></section>`).join('')}</div><div class="contact-grid"><section class="card contact-card"><h3>Rathaus Wartenberg</h3><p>Landenhäuser Straße 11<br>36367 Wartenberg<br>Telefon: 06641 9698-0<br>E-Mail: info@gemeinde-wartenberg.de</p><div class="contact-actions"><a class="primary-btn" href="tel:+49664196980">☎ Anrufen</a><a class="secondary-btn" href="mailto:info@gemeinde-wartenberg.de">✉ E-Mail</a><a class="secondary-btn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=Landenh%C3%A4user+Stra%C3%9Fe+11+36367+Wartenberg">⌾ Karte</a></div></section><section class="card contact-card"><h3>Öffnungszeiten Rathaus</h3><table class="hours-table"><tbody>${[['Mo','07:30–12:00 · 13:00–16:30'],['Di','07:30–12:00 · 13:00–16:30'],['Mi','07:30–12:00'],['Do','07:30–12:00 · 13:00–18:00'],['Fr','07:30–13:00']].map(a=>`<tr><th>${a[0]}</th><td>${a[1]}</td></tr>`).join('')}</tbody></table><p class="source-mention">Terminvereinbarung beachten. Änderungen auf ${link(sources.gemeinde,'Gemeindewebseite')} prüfen.</p></section></div><div class="page-section"><div class="strip">ℹ Bei akuten Notfällen 112 beziehungsweise 110 wählen. Diese App ersetzt keine Warn- oder Notrufdienste. ${link(sources.service,'Notdienste der Gemeinde')}</div></div>`}
function viewWeather(){const w=actualWeather(),wc=weatherCode(w?.current?.weather_code);return `${heading('Die Aussichten','Wetter in Wartenberg','Live-Daten von Open-Meteo, ohne Anmeldung oder kostenpflichtige API.')}<div class="card card-pad"><div class="card-top"><span class="card-label">${esc(settings.location)} · Aktuelles Wetter</span><span class="pill-note">${weather?'● Live':weatherCache?'◷ Gespeicherter Stand':'○ Keine Daten'}</span></div><div class="weather-hero" style="margin:25px 0"><span class="weather-emoji" style="font-size:66px">${wc[0]}</span><div><div class="big-number" style="font-size:53px">${w?Math.round(w.current.temperature_2m)+'°C':'–'}</div><div class="metric-sub">${esc(wc[1])}</div></div></div><p class="helper">${w?`Wind ${Math.round(w.current.wind_speed_10m)} km/h · Letzter Abruf: ${new Date(weatherCache?.updated||Date.now()).toLocaleString('de-DE')}`:'Der Wetterdienst ist gerade nicht erreichbar oder die Seite wurde lokal ohne Netz geöffnet.'}</p><button class="secondary-btn" data-refresh-weather="true">↻ Wetter neu laden</button></div><div class="page-section">${sectionTitle('7-Tage-Vorhersage')}<div class="weather-days">${w?.daily?.time?.map((day,i)=>{const cond=weatherCode(w.daily.weather_code[i]);return `<div class="weather-day"><strong>${fmt(day,{weekday:'short'})}</strong><span class="emoji">${cond[0]}</span><div class="temps">${Math.round(w.daily.temperature_2m_max[i])}° / ${Math.round(w.daily.temperature_2m_min[i])}°</div><div class="rain">☂ ${w.daily.precipitation_probability_max?.[i]??'–'}%</div></div>`}).join('')||empty('Die Wetterprognose wird geladen.')}</div></div><p class="source-mention">Quelle: ${link('https://open-meteo.com/','Open-Meteo')} · Wetterprognosen können sich ändern.</p>`}
function viewSettings(){return `${heading('Deine App','Einstellungen','Passe Wartenberg 360 an deine Wünsche an.')}<div class="settings-grid"><section class="card settings-card"><h3>Deine Region</h3><p>Wähle deinen Ortsteil für die Wetteranzeige.</p><div class="settings-control"><div><strong>Ortsteil</strong><p>Angersbach oder Landenhausen</p></div><select class="select" data-setting="location"><option ${settings.location==='Angersbach'?'selected':''}>Angersbach</option><option ${settings.location==='Landenhausen'?'selected':''}>Landenhausen</option></select></div><div class="settings-control"><div><strong>Design</strong><p>Helles oder dunkles Farbschema</p></div><select class="select" data-setting="theme"><option value="system" ${settings.theme==='system'?'selected':''}>System</option><option value="light" ${settings.theme==='light'?'selected':''}>Hell</option><option value="dark" ${settings.theme==='dark'?'selected':''}>Dunkel</option></select></div><div class="settings-control"><div><strong>Dein Nachrichtenschwerpunkt</strong><p>Die Startseite passt sich deinen Interessen an; alle Themen bleiben im Nachrichtenbereich sichtbar.</p></div><select class="select" data-setting="newsFocus"><option value="balanced" ${(settings.newsFocus||'balanced')==='balanced'?'selected':''}>Ausgewogen</option><option value="community" ${settings.newsFocus==='community'?'selected':''}>Kultur & Vereine</option><option value="civic" ${settings.newsFocus==='civic'?'selected':''}>Rathaus & Alltag</option><option value="sport" ${settings.newsFocus==='sport'?'selected':''}>Lokalsport</option></select></div></section><section class="card settings-card"><h3>Datenschutz & Speicher</h3><p>Deine Favoriten und Einstellungen bleiben lokal in deinem Browser. Es gibt keine Anmeldung und kein Tracking durch diese App.</p><div class="settings-control"><div><strong>${fav.length} gespeicherte Favoriten</strong><p>Auf diesem Gerät gespeichert</p></div><button class="secondary-btn" data-clear="favorites">Favoriten löschen</button></div><div class="settings-control"><div><strong>Lokale Daten zurücksetzen</strong><p>Auch Wetter-Cache und Einstellungen entfernen</p></div><button class="secondary-btn" data-clear="all">Zurücksetzen</button></div></section></div><div class="page-section"><div class="about-header"><h2>Transparent. Regional. Praktisch.</h2><p>Wartenberg 360 ist ein unabhängiges Bürgerprojekt und kein offizielles Angebot der Gemeinde Wartenberg. Nachrichten werden, soweit technisch möglich, alle zwei Stunden automatisch über RSS-Feeds und Nachrichtenindizes aktualisiert. Zusätzlich ergänzen wir belegte ältere Ortsberichte zu Kultur, Ehrenamt, Familie und Politik. Manche Vereine bieten keine frei abrufbare Schnittstelle und sind daher nur als Quellen verlinkt. Die Quellen und der Datenstand sind sichtbar. Veranstaltungen werden regelmäßig mit dem offiziellen Gemeindekalender abgeglichen, soweit die Website erreichbar ist. Die Abfallvorschau ist redaktionell; maßgeblich bleiben die straßenbezogenen Termine des ZAV.</p></div>${sectionTitle('Unsere Datenquellen')}<section class="card card-pad"><div class="source-list">${[['Gemeinde Wartenberg – offizielle Webseite',sources.gemeinde],['Aktuelle Nachrichten',sources.news],['Vogelsbergkreis','https://www.vogelsbergkreis.de/'],['Polizeipräsidium Osthessen','https://www.presseportal.de/blaulicht/nr/43558'],['Oberhessen-live','https://www.oberhessen-live.de/vogelsberg/'],['Osthessen News','https://osthessen-news.de/'],['Fuldaer Zeitung','https://www.fuldaerzeitung.de/vogelsberg/'],['Lauterbacher Anzeiger – Wartenberg','https://www.lauterbacher-anzeiger.de/vogelsbergkreis/wartenberg/'],['Kulturverein Landenhausen','https://kulturverein-landenhausen.de/'],['Wartenberg-iNFO','https://www.wartenberg-info.de/'],['Offizieller Veranstaltungskalender',sources.events],['Vereine und Initiativen',sources.clubs],['Abfallkalender des ZAV',sources.zavCalendar],['Veröffentlichte Abfallvorschau',sources.waste],['Notdienste und Bereitschaftsdienst',sources.service],['Open-Meteo – Wetterdaten','https://open-meteo.com/']].map(a=>`<div class="source-row"><span>${esc(a[0])}</span>${link(a[1],'Öffnen')}</div>`).join('')}</div></section></div><div class="page-section"><div class="strip">ⓘ Offline-Nutzung nach einmaligem Besuch über HTTPS: App-Oberfläche und lokale Startinhalte stehen im Cache zur Verfügung. Für neue Wetterdaten wird eine Internetverbindung benötigt.</div></div>`}
function topicOf(n) {
  if (n.topic) return n.topic;
  const c = n.category || "";
  if (c==="Vereine") return /spiel|tr[aä]ner|liga|tor|sg landenhausen|tv angersbach/i.test(n.title) ? "Sport" : "Gemeinschaft & Ehrenamt";
  if (c==="Verkehr") return "Verkehr & Bauen";
  if (c==="Gemeinde") return "Rathaus & Politik";
  if (c==="Vogelsberg") return "Vogelsberg";
  return c || "Vogelsberg";
}
function localNews(n) {
  return n.locality==="Wartenberg" || Boolean(n.editorial);
}
function newerFirst(a,b) {
  return String(b.publishedAt||b.date).localeCompare(String(a.publishedAt||a.date));
}
function homeDigest() {
 const local=news.filter(localNews).sort(newerFirst);
 if(!local.length)return news.slice().sort(newerFirst).slice(0,4);
 const focus=settings.newsFocus||'balanced';
 let list=[];
 if(focus==='community') list=local.filter(n=>['Kultur & Musik','Gemeinschaft & Ehrenamt','Familie & Soziales','Natur & Umwelt'].includes(topicOf(n)));
 else if(focus==='civic')list=local.filter(n=>['Rathaus & Politik','Verkehr & Bauen','Blaulicht','Natur & Umwelt'].includes(topicOf(n)));
 else if(focus==='sport')list=local.filter(n=>topicOf(n)==='Sport');
 else list=local.filter(n=>topicOf(n)!=='Sport');
 const chosen=[], topics=new Set();
 for(const n of list){if(topics.has(topicOf(n)))continue;chosen.push(n);topics.add(topicOf(n));if(chosen.length>=3)break}
 for(const n of list){if(chosen.length>=3)break;if(!chosen.includes(n))chosen.push(n)}
 const remaining=local.filter(n=>!chosen.includes(n));
 if(focus==='balanced'){
   const sport=remaining.find(n=>topicOf(n)==='Sport');
   if(sport)chosen.push(sport);
 }
 for(const n of remaining){if(chosen.length>=4)break;if(!chosen.includes(n))chosen.push(n)}
 return chosen.slice(0,4);
}
function storyTag(n) {
  const old=(Date.now()-new Date(n.date+"T12:00:00").getTime())>(n.sourceId==='gemeinde'?30:50)*86400000;
  return old?"Archiv":n.editorial?"Quellengeprüft":"Aktuelle Meldung";
}
function hasReadableNews(n) {
  const summary=String(n?.desc||'').trim();
  const articleText=String(n?.body||'').trim();
  // Nur redaktionell bzw. selbst verfasste Inhalte in den internen Lesemodus aufnehmen.
  const curated=n?.summaryType==='Redaktionelle Zusammenfassung' || n?.editorial===true;
  const officialStarter=n?.sourceId==='gemeinde' && n?.id?.startsWith('n');
  return (curated || officialStarter) && summary.length>=60 || (curated && articleText.length>=80);
}
function nCardV2(n) {
  const by=n.sourceName||"Gemeinde Wartenberg",topic=topicOf(n),where=n.locality||"Vogelsberg";
  const isFav=fav.includes(n.id);
  const canRead=hasReadableNews(n);
  const mark=storyTag(n);
  const paywall=n.sourceId==="la"?" · teilweise kostenpflichtig":"";
  const safeUrl=String(n.source||"");
  const sourceLink=link(safeUrl,"Originalquelle ↗");
  return `<article class="card news-card v2-news-card" ${canRead?`data-reader-card="news" data-reader-id="${esc(n.id)}"`:""}>
      <div class="news-meta-row"><span class="soft-tag topic-pill">${esc(topic)}</span><span class="news-date">${fmt(n.date)}</span></div>
      <div class="v2-article-context"><span>⌾ ${esc(where)}</span><span class="dot-separator">•</span><span>${n.via==='Amtliche Website'?'Gemeindemeldung · '+esc(mark):esc(mark)}</span></div>
      <h3>${esc(n.title)}</h3>${n.desc && canRead?`<p>${esc(n.desc)}</p>`:n.sourceId==='gemeinde' && n.officialExcerpt?`<p class="v22-official-excerpt">${esc(n.officialExcerpt)}</p>`:""}
      <div class="source-footer"><span>${esc(by)}${paywall}</span>
        <div class="v2-news-actions">${canRead?`<button type="button" class="v2-read-button" data-reader="news" data-reader-id="${esc(n.id)}" aria-label="Zusammenfassung in der App lesen">Kurzfassung lesen</button>`:""}<button class="star-btn ${isFav?"active":""}" data-fav="${esc(n.id)}" title="${isFav?"Merkliste: entfernen":"Für später merken"}" aria-label="${isFav?"Nachricht aus Merkliste entfernen":"Nachricht merken"}">${isFav?"★":"☆"}</button>${sourceLink}</div>
      </div>
    </article>`;
}

function newsPanelV2() {
  const sourcesList=[["gemeinde","Gemeinde Wartenberg",sources.news],["la","Lauterbacher Anzeiger","https://www.lauterbacher-anzeiger.de/vogelsbergkreis/wartenberg/"],["winfo","Wartenberg-iNFO","https://www.wartenberg-info.de/"],["kulturverein","Kulturverein Landenhausen","https://kulturverein-landenhausen.de/"],["oberhessen","Oberhessen-live","https://www.oberhessen-live.de/vogelsberg/"],["kreis","Vogelsbergkreis","https://www.vogelsbergkreis.de/"],["polizei","Polizeipräsidium Osthessen","https://www.presseportal.de/blaulicht/nr/43558"],["osthessen","Osthessen News","https://osthessen-news.de/"],["fulda","Fuldaer Zeitung","https://www.fuldaerzeitung.de/vogelsberg/"]];
  return `<details class="card news-sources v2-sources"><summary>Transparenz & Quellen · ${sourcesList.length} Nachrichtenanbieter</summary>
    <div class="source-status-grid">${sourcesList.map(([id,name,url])=>{const st=newsSources.find(x=>x.id===id);const stored=news.filter(n=>n.sourceId===id).length;let state=stored?stored+" verlinkte Meldungen"+(st?.count?" · "+st.mode:""):"Zurzeit keine gespeicherten Meldungen";return `<div class="source-status-item"><strong>${esc(name)}</strong><small>${esc(state)}</small>${link(url,"Quelle öffnen")}</div>`}).join("")}</div>
    <p class="source-mention">Automatische Suche ungefähr alle zwei Stunden, soweit erreichbar. Zusätzlich werden ältere, von Hand quellengeprüfte Ortsberichte archiviert. Datum und Originalquelle stehen auf jeder Karte. Die App kopiert keine Zeitungs-Volltexte oder Pressebilder; einzelne Artikel können hinter einer Bezahlschranke liegen.</p></details>`;
}
function viewNewsV2() {
  const scope=filter==="Alle"?"Alle":"Wartenberg";
  const scoped=news.filter(n=>scope==="Alle"||localNews(n));
  const publishers=[...new Set(news.map(n=>n.sourceName||"Gemeinde Wartenberg"))].sort((a,b)=>a.localeCompare(b,"de"));
  const counts=NEWS_TOPICS.slice(1).map(t=>({topic:t,n:scoped.filter(x=>topicOf(x)===t).length}));
  const localCount=news.filter(localNews).length;
  let filtered=scoped.filter(n=>(newsTopicFilter==="Alle Themen"||topicOf(n)===newsTopicFilter)
      &&(newsSource==="Alle"||(n.sourceName||"Gemeinde Wartenberg")===newsSource)
      &&(!onlyFavorites||fav.includes(n.id))
      &&[n.title,n.desc,topicOf(n),n.sourceName,n.locality].join(" ").toLocaleLowerCase("de").includes(search.toLocaleLowerCase("de"))).sort(sortNewsCompare);
  const spotlightActive=scope==="Wartenberg"&&newsTopicFilter==="Alle Themen"&&newsSource==="Alle"&&!search&&!onlyFavorites;
  const highlights=[];
  if(spotlightActive) {
    const seen=new Set();
    for(const a of filtered) {
      if(topicOf(a)==="Sport"||seen.has(topicOf(a)))continue;
      highlights.push(a);seen.add(topicOf(a));
      if(highlights.length===3)break;
    }
    filtered=filtered.filter(n=>!highlights.includes(n));
  }
  const renderList=filtered.slice(0,newsLimit);
  return `${heading("Deine Gemeinde. Deine Themen.","Nachrichten aus Wartenberg","Echte Ortsmeldungen: Rathaus, Kultur, Vereine, Familie und Sport. Der restliche Vogelsberg bleibt separat erreichbar.")}
    <section class="v2-news-intro">
       <div><div class="v2-eyebrow">WARTENBERG 360 · VERSION 2.2</div><h2>Aktuelles aus Wartenberg</h2><p>Nachrichten und Informationen aus Angersbach und Landenhausen.</p>
         <div class="v2-live-note">◷ ${esc(newsFreshness())} <button class="text-button" data-news-refresh type="button">↻ Aktualisieren</button></div></div>
       <div class="v2-intro-stats"><strong>${localCount}</strong><span>Ortsmeldungen<br>mit Quellenlink</span></div>
    </section>
    <div class="v2-scope-bar" role="group" aria-label="Nachrichtenregion">
        <button type="button" class="v2-scope ${scope==="Wartenberg"?"active":""}" data-news-scope="Wartenberg">⌂ Direkt aus Wartenberg <span>${localCount}</span></button>
        <button type="button" class="v2-scope ${scope==="Alle"?"active":""}" data-news-scope="Alle">◉ Gesamter Vogelsberg <span>${news.length}</span></button>
    </div>
    <section class="v2-topic-section"><div class="v2-section-title"><h2>Themen entdecken</h2></div>
      <div class="v2-topic-chips" role="group" aria-label="Nachrichtenthema"><button type="button" data-news-topic="Alle Themen" class="v2-topic-chip ${newsTopicFilter==="Alle Themen"?"active":""}">Alle Themen <span>${scoped.length}</span></button>
      ${counts.map(v=>`<button type="button" data-news-topic="${esc(v.topic)}" class="v2-topic-chip ${newsTopicFilter===v.topic?"active":""}">${esc(v.topic)} <span>${v.n}</span></button>`).join("")}</div>
    </section>
    <div class="toolbar news-toolbar v2-toolbar">
      <label class="news-source-select"><span>Nachrichtenquelle</span><select class="select" data-news-source aria-label="Nachrichtenquelle"><option value="Alle">Alle Quellen</option>${publishers.map(name=>`<option value="${esc(name)}" ${newsSource===name?"selected":""}>${esc(name)}</option>`).join("")}</select></label>
      <label class="news-source-select"><span>Sortierung</span><select class="select" data-news-sort aria-label="Nachrichten nach Datum sortieren"><option value="newest" ${newsSort==="newest"?"selected":""}>Neueste zuerst</option><option value="oldest" ${newsSort==="oldest"?"selected":""}>Älteste zuerst</option></select></label> ${searchBox()} <button type="button" class="chip ${onlyFavorites?"active":""} data-only-favs="true" aria-label="Gemerkte Nachrichten anzeigen">★ Merkliste</button>
    </div>
    ${highlights.length?`<div class="page-section v2-feature-section"><div class="v2-section-title"><h2>Aus dem Gemeindeleben</h2><span>Aktuelle Meldungen aus verschiedenen Bereichen</span></div><div class="v2-feature-grid">${highlights.map((n,i)=>`<div class="${i===0?"v2-feature-lead":""}">${nCard(n)}</div>`).join("")}</div></div>`:""}
    <div class="page-section"><div class="v2-section-title"><h2>${newsTopicFilter==="Alle Themen"?(scope==="Wartenberg"?"Weitere Nachrichten vor Ort":"Nachrichten aus der Region"):esc(newsTopicFilter)}</h2><span>${filtered.length+highlights.length} passende Artikel</span></div>
      <div class="news-grid">${renderList.length?renderList.map(nCard).join(""):highlights.length?"":empty("Für diese Auswahl wurden keine weiteren Meldungen gefunden. Wähle eine andere Kategorie oder Quelle.")}</div>
      ${filtered.length>newsLimit?`<button type="button" class="v2-load-more" data-news-more>Weitere ${Math.min(18,filtered.length-newsLimit)} Nachrichten anzeigen ↓</button>`:""}
    </div>
    ${newsPanelV2()}`;
}
function normalizeClientNews(obj) {
  if(!obj||!Array.isArray(obj.items))return [];
  return obj.items.filter(n=>n&&typeof n.title==="string"&&typeof n.source==="string"&&/^https:\/\//.test(n.source)&&/^\d{4}-\d{2}-\d{2}$/.test(n.date)).slice(0,260);
}
function viewClubsV2() {
  const cats=["Alle",...new Set(clubs.map(c=>c.category))].sort((a,b)=>a==="Alle"?-1:b==="Alle"?1:a.localeCompare(b,"de"));
  const countHere=clubs.filter(c=>filter==="Alle"||c.location===filter).length;
  const arr=clubs.filter(c=>(filter==="Alle"||c.location===filter)
     &&(clubCategory==="Alle"||c.category===clubCategory)
     &&(!onlyFavorites||fav.includes(c.id))
     &&[c.title,c.category,c.location].join(" ").toLocaleLowerCase("de").includes(search.toLocaleLowerCase("de")));
  return `${heading("Engagement verbindet","Vereine & Initiativen","Musik, Kultur, Jugend, Ehrenamt, Natur und Sport – das Vereinsleben aus beiden Ortsteilen.")}
  <section class="v2-club-intro"><div><span class="v2-eyebrow">VEREINSLEBEN IN WARTENBERG</span><h2>Vereine und Initiativen</h2><p>Einträge aus der offiziellen Vereinsübersicht, ergänzt um weitere örtliche Gruppen und Abteilungen.</p></div><div class="v2-club-stat"><strong>${clubs.length}</strong><span>Vereine & Gruppen</span></div></section>
  <div class="toolbar"><div class="filters">${["Alle","Angersbach","Landenhausen"].map(v=>`<button type="button" class="chip ${filter===v?"active":""}" data-filter="${v}">${esc(v)}</button>`).join("")}<button type="button" class="chip ${onlyFavorites?"active":""}" data-only-favs="true">★ Gemerkte</button></div>${searchBox()}</div>
  <div class="v2-club-categories"><div class="v2-section-title"><h2>Aktivitäten entdecken</h2><span>${countHere} Einträge im ausgewählten Ortsteil</span></div><div class="v2-topic-chips">${cats.map(c=>`<button type="button" class="v2-topic-chip ${clubCategory===c?"active":""}" data-club-topic="${esc(c)}">${esc(c)} <span>${clubs.filter(x=>(filter==="Alle"||x.location===filter)&&(c==="Alle"||x.category===c)).length}</span></button>`).join("")}</div></div>
  <div class="v2-section-title" style="margin:24px 0 14px"><h2>Alle passenden Vereine</h2><span>${arr.length} Einträge</span></div>
  <div class="clubs-grid">${arr.length?arr.map(cCard).join(""):empty("Keine Vereine für diese Auswahl. Versuche einen anderen Ortsteil oder Bereich.")}</div>
  <p class="source-mention">Verzeichnis nach dem offiziellen Stand der Gemeinde, ohne Gewähr für Mitgliederzahlen oder Ansprechpartner. ${link(sources.clubs,"Offizielle Vereinsübersicht")} · ${link("https://kulturverein-landenhausen.de/","Kulturverein Landenhausen")}</p>`;
}
function viewClubs(){return viewClubsV2()}
function placeIcon(category){
 return {
 "Sehenswürdigkeiten":"🏰","Wandern & Radfahren":"🥾","Natur & Aussicht":"🌳",
 "Kultur & Treffen":"🎭","Freizeit & Sport":"🏊","Spielplätze":"🛝",
 "Essen & Trinken":"🍽️","Einkaufen":"🛍️","Gesundheit":"⚕️",
 "Öffentliche Einrichtungen":"🏛️","Mobilität":"🚉",
 "Defibrillatoren":"❤️","Entsorgung":"♻️"
 }[category]||"⌾";
}
function validPlaceData(obj){
 if(!obj||!Array.isArray(obj.items))return [];
 const permitted=new Set(["Angersbach","Landenhausen","Beide Ortsteile"]);
 const ids=new Set(),seen=new Set();
 return obj.items.filter(p=>{
  if(!p||typeof p.id!=="string"||typeof p.title!=="string"||typeof p.location!=="string"||
  typeof p.category!=="string"||typeof p.description!=="string"||
  typeof p.source!=="string"||!/^https:\/\//i.test(p.source)||p.title.trim().length<3||
  !permitted.has(p.location)||ids.has(p.id))return false;
  const k=(p.title+"|"+p.location).toLocaleLowerCase("de").replace(/[^a-z0-9äöüß]/g,"");
  if(seen.has(k))return false;
  ids.add(p.id);seen.add(k);
  return true;
 }).slice(0,250).map(p=>({
  id:p.id,title:p.title.slice(0,160),location:p.location,category:p.category,
  address:typeof p.address==="string"&&p.address.includes("36367 Wartenberg")?p.address.slice(0,230):null,
  description:p.description.slice(0,700),source:p.source,
  kind:["route","landmark"].includes(p.kind)?p.kind:"place"
 }));
}
function validatedMapCoordinates(data){
 if(!data||typeof data!=="object"||!data.byId||typeof data.byId!=="object")return {};
 const result={};
 for(const [key,c] of Object.entries(data.byId)){
  if(!/^ort-\d{3}$/.test(key)||!c)continue;
  const lat=Number(c.lat),lon=Number(c.lon);
  if(Number.isFinite(lat)&&Number.isFinite(lon)&&lat>50.575&&lat<50.665
     &&lon>9.395&&lon<9.55&&["house","street","landmark"].includes(c.precision)){
   result[key]={lat,lon,precision:c.precision};
  }
 }
 return result;
}
async function updatePlaceCoordinates(){
 try{
  const response=await fetch('./data/place_coordinates.json?v='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(13000)});
  if(!response.ok)throw Error('Kartenkoordinaten nicht erreichbar');
  const data=await response.json();
  const next=validatedMapCoordinates(data);
  if(!Object.keys(next).length)throw Error('Keine überprüfbaren Koordinaten');
  placeCoordinates=next;
  save('placeCoordinatesCache',next);
 }catch(err){
  placeCoordinates=validatedMapCoordinates({byId:read('placeCoordinatesCache',{})});
 }
 if(current==='places'&&placeViewMode==='map')render();
}
async function updatePlaces(){
 try{
  const response=await fetch("./data/places.json?v="+Date.now(),{cache:"no-store",signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error("Ortsführer nicht erreichbar");
  const obj=await response.json(),valid=validPlaceData(obj);
  if(valid.length<15)throw Error("Ortsführer-Daten unvollständig");
  places=valid;placesUpdatedAt=obj.verifiedAt||null;placesStatus="Quellengeprüfter Ortsführer";
  save("placesCache",{items:valid,verifiedAt:placesUpdatedAt});
 }catch(err){
  const cache=read("placesCache",null);
  const cached=validPlaceData(cache);
  if(cached.length>=15){places=cached;placesUpdatedAt=cache.verifiedAt||"unbekannt";placesStatus="Zwischengespeicherter Ortsführer";}
  else placesStatus="Redaktionelle Startauswahl";
 }
 if(current==="places")render();
}
function placeMapSwitcher(items){
 const located=items.filter(p=>!!placeCoordinates[p.id]).length;
 const onMap=placeViewMode==="map";
 return `<section class="w360-place-switch-row" aria-label="Ortsführer-Darstellung">
    <div class="w360-place-switch" role="group" aria-label="Ansicht auswählen">
     <button type="button" data-place-view="map" aria-pressed="${onMap}" class="${onMap?"active":""}">🗺️ Karte</button>
     <button type="button" data-place-view="list" aria-pressed="${!onMap}" class="${!onMap?"active":""}">▤ Liste</button>
    </div><span>${located} von ${items.length} Orten verortet · ${items.length-located} ohne sicheren Kartenpunkt</span>
  </section>`;
}
function placeMapMarkup(items){
 const plotted=items.filter(p=>!!placeCoordinates[p.id]);
 const unplotted=items.filter(p=>!placeCoordinates[p.id]);
 const rows=[...plotted,...unplotted];
 return `<section class="w360-place-map-section" aria-label="Karte mit allen Orten des Ortsführers">
 <div class="w360-place-map-caption"><div><strong>Wartenberg auf einen Blick</strong><span>Angersbach und Landenhausen entdecken</span></div><p>Orte mit überprüftem Standort sind markiert; Wanderwege und weitere Einträge ohne verlässliche Koordinaten stehen daneben in der Übersicht.</p></div>
 <div class="w360-map-layout">
   <div class="w360-map-frame"><div id="w360-map" aria-label="Interaktive Karte von Wartenberg mit Standortmarkierungen" role="application"></div>
     <div class="w360-map-gesture">Karte verschieben: ziehen · Zoomen: + / − · Ort auswählen: rechts oder unten antippen</div></div>
   <aside id="w360-map-sidebar" class="w360-map-sidebar" aria-label="Alle passenden Orte">
      <div class="w360-map-sidebar-heading"><strong>${items.length} Orte im Filter</strong><span>${plotted.length} Orte verortet · ${unplotted.length} ohne genaue Position</span></div>
      <div class="w360-map-location-list">${rows.length?rows.map(p=>{
       const loc=placeCoordinates[p.id];
       const precision=loc?(loc.precision==="house"?"Hausnummer geprüft":loc.precision==="landmark"?"Belegter Standort":"Straßenposition, ungefähr"):"Keine sichere Position";
       const title=`<span class="w360-map-icon" aria-hidden="true">${placeIcon(p.category)}</span><span class="w360-map-row-label"><strong>${esc(p.title)}</strong><small>${esc(p.location)} · ${esc(precision)}</small></span>`;
       return `<article class="w360-map-side-item ${loc?"has-location":"not-located"}" data-place-row="${esc(p.id)}">
        ${loc?`<button type="button" class="w360-map-select" data-map-focus="${esc(p.id)}" aria-label="${esc(p.title)} auf der Karte anzeigen" aria-pressed="false">${title}<span class="w360-map-focus-icon" aria-hidden="true">⌖</span></button>`:
        `<div class="w360-map-row-static">${title}</div>`}
        <div class="w360-map-row-actions">${loc&&p.address?link("https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(p.address),"Adresse prüfen"):""}${link(p.source,p.kind==="route"?"Wegverlauf":"Details")}</div>
       </article>`;
      }).join(""):empty("Keine passenden Orte gefunden.")}</div>
   </aside>
 </div>
 <p class="w360-map-notice">Kartenmaterial: © OpenStreetMap-Mitwirkende (ODbL). Die Karte benötigt Internet, die Ortsliste nicht. Es wird kein Gerätestandort abgefragt. Ein Straßenmarker kann ungenau sein; die Originalquelle bleibt maßgeblich.</p>
 </section>`;
}
function viewPlaces(){
 const categoryOrder=["Alle","Sehenswürdigkeiten","Natur & Aussicht","Wandern & Radfahren",
 "Freizeit & Sport","Spielplätze","Kultur & Treffen","Essen & Trinken",
 "Einkaufen","Gesundheit","Öffentliche Einrichtungen","Mobilität","Defibrillatoren","Entsorgung"];
 const cats=categoryOrder.filter(c=>c==="Alle"||places.some(p=>p.category===c));
 const matchesArea=p=>filter==="Alle"||p.location===filter||p.location==="Beide Ortsteile";
 const local=places.filter(matchesArea);
 const needle=search.toLocaleLowerCase("de").trim();
 const matching=local.filter(p=>
  (placeCategory==="Alle"||p.category===placeCategory)
  &&(!onlyFavorites||fav.includes(p.id))
  &&[p.title,p.location,p.category,p.address||"",p.description].join(" ").toLocaleLowerCase("de").includes(needle));
 const sorted=matching.slice().sort((a,b)=>categoryOrder.indexOf(a.category)-categoryOrder.indexOf(b.category)||a.title.localeCompare(b.title,"de"));
 const visible=sorted.slice(0,placeLimit);
 placeMapItems=sorted;
 const countCat=c=>local.filter(p=>c==="Alle"||p.category===c).length;
 const localCounts={Angersbach:places.filter(p=>p.location==="Angersbach").length,
 Landenhausen:places.filter(p=>p.location==="Landenhausen").length};
 return `${heading("Angersbach & Landenhausen","Ortsführer","Sehenswürdigkeiten, Ausflüge, Freizeitangebote, Gastronomie und Einrichtungen vor Ort.")}
 <section class="v3-place-hero">
  <div class="v3-place-heading"><span class="v2-eyebrow">ENTDECKE WARTENBERG</span>
  <h2>Das gibt es bei uns.</h2>
  <p>Von der Burgruine und den Wanderwegen bis zum Spielplatz, Wochenmarkt, Gasthaus und zur Arztpraxis: Wähle aus, was dich interessiert.</p></div>
  <div class="v3-place-stats"><div><strong>${places.length}</strong><span>Orte und Angebote</span></div>
   <div><strong>${localCounts.Angersbach}</strong><span>Angersbach</span></div><div><strong>${localCounts.Landenhausen}</strong><span>Landenhausen</span></div></div>
 </section>
 <div class="toolbar v3-place-toolbar"><div class="filters">${["Alle","Angersbach","Landenhausen"].map(v=>`<button type="button" class="chip ${filter===v?"active":""}" data-filter="${v}">${esc(v)}</button>`).join("")}<button type="button" class="chip ${onlyFavorites?"active":""}" data-only-favs="true">★ Gemerkte</button></div>${searchBox()}</div>
 <section class="v3-place-categories"><div class="v2-section-title"><h2>Was möchtest du entdecken?</h2><span>${cats.length-1} Themenbereiche</span></div>
  <div class="v2-topic-chips v2-place-cats">${cats.map(c=>`<button type="button" class="v2-topic-chip ${placeCategory===c?"active":""}" data-place-topic="${esc(c)}"><span class="v3-place-topic-emoji" aria-hidden="true">${c==="Alle"?"⌾":placeIcon(c)}</span> ${esc(c)} <span>${countCat(c)}</span></button>`).join("")}</div></section>
 ${placeMapSwitcher(sorted)}
 <div class="w360-place-display ${placeViewMode==="map"?"is-map":"is-list"}">
  ${placeViewMode==="map"?placeMapMarkup(sorted):""}
  <div class="w360-place-list-content">
 <div class="v2-section-title v3-place-result-title"><h2>${placeCategory==="Alle"?"Orte entdecken":esc(placeCategory)}</h2><span>${matching.length} Einträge ${onlyFavorites?"· Merkliste":""}</span></div>
 <div class="v2-places-grid v3-places-grid">${visible.length?visible.map(p=>{
   const hasAddress=!!p.address,canMap=hasAddress&&p.kind!=="route";
   const sourceLabel=p.kind==="route"?"Route und Beschreibung":p.kind==="landmark"?"Standortinformation":"Quelle und Details";
   return `<article class="card v2-place-card v3-place-card">
    <div class="v3-place-top"><span class="v3-place-pictogram" aria-hidden="true">${placeIcon(p.category)}</span>
    <button type="button" class="star-btn ${fav.includes(p.id)?"active":""}" data-fav="${esc(p.id)}" aria-label="${fav.includes(p.id)?"Ort aus Merkliste entfernen":"Ort merken"}">${fav.includes(p.id)?"★":"☆"}</button></div>
    <span class="soft-tag">${esc(p.category)}</span><h3>${esc(p.title)}</h3>
    <p>${esc(p.description)}</p>
    <div class="v2-place-location">⌾ ${esc(p.location)}${hasAddress?` · ${esc(p.address)}`:" · Lage oder Einstieg in der Quellenbeschreibung"}</div>
    <div class="v2-place-actions">${canMap?link("https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(p.address),"Karten-Suche"):""}${link(p.source,sourceLabel)}</div>
   </article>`;
 }).join(""):empty("Für diese Auswahl gibt es keine Einträge. Versuche einen anderen Ortsteil, Suchbegriff oder Themenbereich.")}</div>
 ${matching.length>visible.length?`<div class="v3-place-more"><button type="button" class="v2-more-button" data-place-more="true">Weitere Orte anzeigen (${matching.length-visible.length} verbleibend) ↓</button></div>`:""}
 </div></div>
 <p class="source-mention">Stand: ${esc(placesUpdatedAt||"unbekannt")} · ${esc(placesStatus)}. Karte und Liste greifen auf denselben Ortsbestand zurück. Für Wege und Punkte ohne gesicherte Adresse gibt es bewusst keine erfundenen Marker. Öffnungszeiten, Zugänglichkeit und Detailadressen bitte beim Anbieter prüfen.</p>`;
}

function nCard(n){return nCardV2(n)}
function viewNews(){return viewNewsV2()}
function sortNewsCompare(a,b) {
  const av=String(a.publishedAt||a.date),bv=String(b.publishedAt||b.date);
  return newsSort==='oldest'?av.localeCompare(bv):bv.localeCompare(av);
}
function articleSymbol(topic) {
  const chars={
    "Rathaus & Politik":"🏛️","Kultur & Musik":"🎶","Gemeinschaft & Ehrenamt":"🤝",
    "Familie & Soziales":"👨‍👩‍👧","Natur & Umwelt":"🌿",
    "Verkehr & Bauen":"🚧","Blaulicht":"🚒","Sport":"⚽","Vogelsberg":"🗞️"
  };
  return chars[topic]||"🗞️";
}
function readerNews(n){
 const topic=topicOf(n),detail=String(n.body||"").trim(),short=String(n.desc||"").trim();
 const textPieces=[short,detail].filter(Boolean);
 const published=fmt(n.date);
 const sourceName=n.sourceName||"Nachrichtenquelle";
 const age=storyTag(n);
 const textBody=textPieces.map(t=>`<p>${esc(t)}</p>`).join("");
 const photo= n.image && n.imageLicense && /^https:\/\//.test(n.image)
    ?`<figure class="reader-image"><img src="${esc(n.image)}" alt="${esc(n.imageAlt||"Bild zur Nachricht")}" loading="lazy"/><figcaption>${esc(n.imageCredit||"Bild")}, Lizenz: ${esc(n.imageLicense)}</figcaption></figure>`
    :`<div class="reader-illustration" aria-label="Symbolbild zur Rubrik ${esc(topic)}"><span aria-hidden="true">${articleSymbol(topic)}</span><small>Symbolbild · kein Originalfoto</small></div>`;
 return `<div class="reader-eyebrow">${esc(topic)} · ${esc(age)}</div><h1 id="reader-title">${esc(n.title)}</h1>
 <div class="reader-byline"><span>📅 ${esc(published)}</span><span>⌾ ${esc(n.locality||"Vogelsberg")}</span><span>📰 ${esc(sourceName)}</span></div>
 ${photo}
 <div class="reader-text"><h2>Das Wichtigste im Überblick</h2>${textBody}
 ${textPieces.length?'<p class="reader-small-print">Dies ist eine eigenständig verfasste Kurzfassung, nicht der Original- oder Volltext des Artikels. Für alle Details bitte die Originalquelle öffnen.</p>':""}</div>
 <div class="reader-sourcebox"><div><strong>Originalquelle: ${esc(sourceName)}</strong><p>Der vollständige Text und gegebenenfalls Originalfotos stehen beim Herausgeber. Manche Artikel sind nur mit Abonnement lesbar.</p></div>${link(n.source,"Originalartikel lesen")}</div>`;
}
function normalizedClubName(value){
 return String(value||'').toLocaleLowerCase('de')
  .replace(/ß/g,'ss').replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue')
  .replace(/[^a-z0-9]/g,'');
}
const clubAliasRules={
 'Kirmesclub Angersbach':['kirmesclub angersbach'],
 'Kulturverein Landenhausen e.V.':['kulturverein landenhausen'],
 'Männergesangverein 1891 Landenhausen e.V.':['männergesangsverein landenhausen','männergesangverein landenhausen','mgv landenhausen'],
 'Musikverein Landenhausen':['musikverein landenhausen'],
 'VdK Ortsverband Landenhausen':['vdk landenhausen','vdk-ortsverband landenhausen'],
 'VdK Ortsverband Angersbach':['vdk angersbach'],
 'Sportgemeinschaft Landenhausen':['sportgemeinschaft landenhausen','sg landenhausen'],
 'Turnverein Angersbach (TVA)':['turnverein angersbach','tv angersbach'],
 'Obst- und Gartenbauverein Angersbach':['obst- und gartenbauverein angersbach'],
 'Obst- und Gartenbauverein Landenhausen':['obst- und gartenbauverein landenhausen'],
 'Landfrauenverein Landenhausen':['landfrauenverein landenhausen'],
 'Förderverein Schwimmbad Landenhausen e.V.':['förderverein schwimmbad landenhausen','förderverein für das freibad landenhausen','freibad landenhausen gegründet'],
 'Freiwillige Feuerwehr Landenhausen':['freiwillige feuerwehr landenhausen'],
 'Freiwillige Feuerwehr Angersbach':['freiwillige feuerwehr angersbach'],
 'Schützenverein Angersbach':['schützenverein angersbach'],
 'Fördergemeinschaft zur Rettung der Burgruine Wartenberg':['fördergemeinschaft burgruine wartenberg','fördergemeinschaft zur rettung der burgruine'],
 'SG Landenhausen – Abteilung Schützen':['schützenabteilung sportgemeinschaft landenhausen'],
 'SG Landenhausen – Abteilung Fußball':['sg landenhausen','sportgemeinschaft landenhausen fußball'],
 'SG Landenhausen – Abteilung Tischtennis':['sportgemeinschaft landenhausen tischtennis'],
 'TV Angersbach – Abteilung Tischtennis':['tv angersbach tischtennis']
};
function clubAliases(c){
 const aliases=(clubAliasRules[c.title]||[]).slice();
 const generic=c.title.replace(/\s+e\.?\s*v\.?$/i,'').replace(/\s*\([^)]*\)/g,'').replace(/\s*[–-]\s*Abteilung\s+.+$/i,'').trim();
 if(generic.length>12)aliases.push(generic);
 return [...new Set(aliases.map(normalizedClubName).filter(x=>x.length>=10))];
}
function relatedClubEvents(c){
 const aliases=clubAliases(c);
 return events.filter(e=>e.end>=dayKey() && aliases.some(a=>{
   const org=normalizedClubName(e.organizer),title=normalizedClubName(e.title);
   return org.includes(a) || (a.length>13 && title.includes(a));
 })).sort((a,b)=>a.start.localeCompare(b.start)).slice(0,5);
}
function relatedClubNews(c){
 const aliases=clubAliases(c);
 return news.filter(n=>n.locality==='Wartenberg' && aliases.some(a=>{
   const title=normalizedClubName(n.title);
   return title.includes(a);
 })).sort((a,b)=>String(b.publishedAt||b.date).localeCompare(String(a.publishedAt||a.date))).slice(0,4);
}

function clubDescription(c){
 const category=c.category||"Gemeinschaft";
 const descriptions={
   "Musik":"Musik und gemeinschaftliches Musizieren prägen diesen Verein beziehungsweise diese Gruppe.",
   "Kultur":"Der Eintrag gehört zum kulturellen und traditionellen Vereinsleben in Wartenberg.",
   "Geschichte":"Hier stehen die Ortsgeschichte und die Pflege historischer Traditionen im Mittelpunkt.",
   "Gemeinschaft":"Die Gruppe ist Teil des gemeinschaftlichen Dorflebens und der ehrenamtlichen Arbeit.",
   "Soziales":"Der Eintrag ist dem sozialen Engagement und gegenseitigen Unterstützen in der Region zuzuordnen.",
   "Feuerwehr":"Die Feuerwehr und ihre Unterstützer sind ein wichtiger Bestandteil des örtlichen Brand- und Katastrophenschutzes.",
   "Jugend":"Die Gruppe gehört zur Kinder-, Jugend- oder Nachwuchsarbeit vor Ort.",
   "Natur":"Die Gruppe beschäftigt sich mit Natur, Gärten oder Tieren – je nach Vereinsausrichtung.",
   "Sport":"Die Abteilung beziehungsweise der Verein gehört zum örtlichen Sportangebot.",
   "Tradition":"Die Gruppe widmet sich örtlichem Brauchtum und der Bewahrung von Traditionen."
 };
 return c.description||descriptions[category]||"Ein Verein oder eine Initiative in der Gemeinde Wartenberg.";
}
function readerClub(c){
 const website=c.website&&/^https:\/\//.test(c.website)?c.website:null;
 const related=relatedClubEvents(c),articles=relatedClubNews(c);
 return `<div class="reader-eyebrow">Vereinsverzeichnis · ${esc(c.location)}</div>
 <h1 id="reader-title">${esc(c.title)}</h1>
 <div class="reader-byline"><span>⌾ ${esc(c.location)}</span><span>♧ ${esc(c.category)}</span></div>
 <div class="reader-text"><h2>Verein und Aktivitäten</h2><p>${esc(clubDescription(c))}</p>
 <div class="v22-club-quickfacts"><div><strong>Ortsteil</strong><span>${esc(c.location)}</span></div><div><strong>Bereich</strong><span>${esc(c.category)}</span></div><div><strong>Kommende Termine</strong><span>${related.length}</span></div></div></div>
 ${related.length?`<section class="v22-reader-related"><h2>Termine des Vereins</h2><div class="v22-related-list">${related.map(e=>`<button type="button" data-reader="event" data-reader-id="${esc(e.id)}"><span class="v22-related-date">${fmt(e.start,{day:'2-digit',month:'short'})}</span><span><strong>${esc(e.title)}</strong><small>${esc(e.organizer)}</small></span><span>›</span></button>`).join('')}</div></section>`:`<p class="v22-reader-noevents">Aktuell sind keine weiteren Termine dieses Vereins im Gemeindekalender erfasst.</p>`}
 ${articles.length?`<section class="v22-reader-related"><h2>Nachrichten zum Verein</h2><div class="v22-related-list">${articles.map(n=>`<div class="v22-related-news"><span class="v22-related-date">${fmt(n.date,{day:'2-digit',month:'short'})}</span><span><strong>${esc(n.title)}</strong><small>${esc(n.sourceName||'Originalquelle')}</small></span>${hasReadableNews(n)?`<button type="button" data-reader="news" data-reader-id="${esc(n.id)}">Lesen</button>`:link(n.source,'Quelle ↗')}</div>`).join('')}</div></section>`:''}
 <div class="reader-sourcebox"><div><strong>Kontakte und weitere Informationen</strong><p>Verbindliche Ansprechpartner, Angebote und Trainingszeiten stehen beim Verein oder in der offiziellen Vereinsübersicht.</p></div><div class="v22-club-links">${website?link(website,"Vereinswebsite ↗"):""}${link(c.source||sources.clubs,"Gemeindeverzeichnis ↗")}</div></div>`;
}
function readerEvent(e){
 const period=e.end && e.end!==e.start?fmt(e.start)+" bis "+fmt(e.end):fmt(e.start);
 const desc=e.description||`Dieser Termin wurde im Gemeindekalender für ${period} aufgeführt. Weitere Angaben zu Ort, Uhrzeit und Teilnahme bitte beim Veranstalter erfragen.`;
 return `<div class="reader-eyebrow">Veranstaltung · ${esc(e.category)}</div>
 <h1 id="reader-title">${esc(e.title)}</h1>
 <div class="reader-byline"><span>📅 ${esc(period)}</span><span>⌾ ${esc(e.location)}</span></div>
 <div class="reader-illustration" aria-label="Symbolbild zur Veranstaltung"><span aria-hidden="true">📅</span><small>Veranstaltung in Wartenberg</small></div>
 <div class="reader-text"><h2>Informationen zum Termin</h2><p>${esc(desc)}</p>
 <p><strong>Veranstalter:</strong> ${esc(e.organizer||"Nicht angegeben")}<br><strong>Ortsteil:</strong> ${esc(e.location||"Bitte prüfen")}<br><strong>Termin:</strong> ${esc(period)}</p>
 <div class="reader-note"><strong>Hinweis zu Uhrzeit und Treffpunkt</strong><p>Genaue Anfangszeiten und Veranstaltungsorte sind nur dort angegeben, wo sie in der Quelle verlässlich erfasst wurden. Bitte erkundige dich vor dem Besuch beim Veranstalter.</p></div></div>
 <div class="reader-sourcebox"><div><strong>Offizieller Veranstaltungskalender</strong><p>Für mögliche Terminänderungen, Anmeldung und weitere Details ist der Veranstalter maßgeblich.</p></div>${link(e.source||sources.events,"Originaltermin öffnen")}</div>`;
}
function openReader(type,id){
  const list=type==='news'?news:type==='club'?clubs:type==='event'?events:null;
  const item=list?.find(v=>v.id===id);
  if(!item || (type==='news' && !hasReadableNews(item)))return;
  const el=$('#reader-modal'),content=$('#reader-content');
  if(!el||!content)return;
  const output=type==='news'?readerNews(item):type==='club'?readerClub(item):readerEvent(item);
  readerPreviousFocus=document.activeElement||null;
  content.innerHTML=output;
  el.hidden=false;
  document.body.style.overflow='hidden';
  const close=$('#reader-close');if(close?.focus)close.focus();
}
function closeReader(){
  const el=$('#reader-modal');
  if(!el||el.hidden)return;
  el.hidden=true;
  document.body.style.overflow='';
  if(readerPreviousFocus?.focus)readerPreviousFocus.focus();
  readerPreviousFocus=null;
}
function eCard(e) {
 const f=fav.includes(e.id);
 const brief=e.description?`<p class="v2-event-preview">${esc(e.description.slice(0,180))}${e.description.length>180?' …':''}</p>`:"";
 return `<article class="card event-card" data-reader-card="event" data-reader-id="${esc(e.id)}">
 <div class="date-tile"><strong>${fmt(e.start,{day:'2-digit'})}</strong><span>${fmt(e.start,{month:'short'}).toUpperCase()}</span></div>
 <div class="list-card-main"><h3>${esc(e.title)}</h3>
 <div class="small-meta">⌾ ${esc(e.location)} · ${esc(e.category)}${e.end!==e.start?' · bis '+fmt(e.end,{day:'numeric',month:'short'}):''}</div>
 <div class="source-mention">${esc(e.organizer)}</div>${brief}</div>
 <div class="event-actions"><button type="button" class="v2-read-button" data-reader="event" data-reader-id="${esc(e.id)}">Details</button>
 <button class="tiny-action" data-ics="${esc(e.id)}" title="Termin als Kalenderdatei herunterladen">▦</button>
 <button class="star-btn ${f?'active':''}" data-fav="${esc(e.id)}" aria-label="${f?'Favorit entfernen':'Als Favorit speichern'}" title="Favorit">${f?'★':'☆'}</button></div></article>`;
}
function cCard(c) {
 const f=fav.includes(c.id),next=relatedClubEvents(c)[0];
 return `<article class="card club-card" data-reader-card="club" data-reader-id="${esc(c.id)}">
 <div class="club-top"><div class="club-logo">${c.category==='Feuerwehr'?'✚':c.category==='Musik'?'♫':c.category==='Natur'?'♧':'✦'}</div>
 <button class="star-btn ${f?'active':''}" data-fav="${esc(c.id)}" title="Favorit" aria-label="Verein merken">${f?'★':'☆'}</button></div>
 <h3>${esc(c.title)}</h3><div class="small-meta">⌾ ${esc(c.location)} · ${esc(c.category)}</div>
 ${next?`<div class="v22-club-next"><strong>Nächster Termin</strong><span>${fmt(next.start,{day:'numeric',month:'short'})} · ${esc(next.title)}</span></div>`:""}
 <div class="source-mention v2-club-actions"><button type="button" class="v2-read-button" data-reader="club" data-reader-id="${esc(c.id)}">Verein ansehen</button>
 ${c.website?link(c.website,'Website ↗'):''}</div></article>`;
}
function validEventData(obj){
 if(!obj||!Array.isArray(obj.items))return [];
 return obj.items.filter(e=>e&&typeof e.title==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(e.start)&&/^\d{4}-\d{2}-\d{2}$/.test(e.end||e.start)&&typeof e.location==='string'&&typeof e.organizer==='string').slice(0,500).map((e,i)=>({
  id:String(e.id||'online-event-'+i),title:e.title.slice(0,220),start:e.start,end:e.end||e.start,location:e.location,category:e.category||'Veranstaltung',organizer:e.organizer,
  description:typeof e.description==='string'?e.description.slice(0,900):'',source:typeof e.source==='string'&&/^https:\/\//.test(e.source)?e.source:sources.events
 }));
}
async function updateEvents(){
 try{
  const response=await fetch('./data/events.json?v='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error('Keine Termindaten');
  const obj=await response.json(),valid=validEventData(obj);
  if(!valid.length)throw Error('Keine gültigen Veranstaltungen');
  events=valid;eventsUpdatedAt=obj.checkedAt||null;eventsStatus=obj.syncMode?'Amtlicher Gemeindekalender · automatisch abgeglichen':'Gemeindekalender · redaktionell erfasst';save('eventsCache',{items:valid,checkedAt:eventsUpdatedAt});
 }catch(e){
  const cached=read('eventsCache',null);
  if(cached&&Array.isArray(cached.items)&&cached.items.length){events=validEventData(cached);eventsUpdatedAt=cached.checkedAt||'unbekannt';eventsStatus='Zwischengespeichert';}
  else eventsStatus='Redaktionelle Vorschau';
 }
 if(current==='home'||current==='events'||current==='clubs')render();
}
const views={home:viewHome,news:viewNews,events:viewEvents,waste:viewWaste,clubs:viewClubs,places:viewPlaces,service:viewService,weather:viewWeather,settings:viewSettings};
function render(){if(window.WartenbergMap)window.WartenbergMap.destroy();const nav=pages.map(p=>`<button type="button" class="nav-link ${current===p[0]?'active':''}" data-nav="${p[0]}"><span style="font-size:20px;line-height:1;width:21px;text-align:center">${p[2]}</span>${esc(p[1])}</button>`).join('');$('#desktop-nav').innerHTML=nav;const mobile=['home','news','events','waste','clubs'].map(x=>pages.find(p=>p[0]===x)).map(p=>`<button class="${current===p[0]?'active':''}" data-nav="${p[0]}"><span style="font-size:21px">${p[2]}</span><span>${p[0]==='events'?'Termine':p[0]==='waste'?'Abfall':esc(p[1])}</span></button>`).join('');$('#mobile-nav').innerHTML=mobile;$('#crumb').textContent=pages.find(p=>p[0]===current)?.[1]||'Übersicht';$('#header-day').textContent=new Date().toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'});try{$('#content').innerHTML=views[current]();if(current==='places'&&placeViewMode==='map'&&window.WartenbergMap){window.WartenbergMap.render({items:placeMapItems,coordinates:placeCoordinates,initialFocus:placeMapSelected});}}catch(err){console.error('Wartenberg 360: Ansicht konnte nicht gerendert werden',err);$('#content').innerHTML='<div class="card card-pad"><h2>Inhalte vorübergehend nicht verfügbar</h2><p>Bitte die Seite neu laden oder über die Navigation eine andere Rubrik öffnen.</p></div>';}}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>el.classList.remove('show'),2500)}
function ics(e){const dt=s=>s.replaceAll('-','');const next=s=>{const d=dateObj(s);d.setDate(d.getDate()+1);return d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')};const clean=s=>String(s).replace(/[\\;,\n]/g,' ').trim();const text=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Wartenberg 360//DE','BEGIN:VEVENT','UID:w360-'+e.id+'@wartenberg360','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'').replace('Z','Z'),'DTSTART;VALUE=DATE:'+dt(e.start),'DTEND;VALUE=DATE:'+next(e.end),'SUMMARY:'+clean(e.title),'LOCATION:'+clean(e.location+', 36367 Wartenberg'),'DESCRIPTION:'+clean('Uhrzeit nicht veröffentlicht. Veranstalter: '+e.organizer+'. Quelle: '+e.source),'URL:'+e.source,'END:VEVENT','END:VCALENDAR'].join('\r\n');const url=URL.createObjectURL(new Blob([text],{type:'text/calendar;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Wartenberg360-'+e.start+'.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);toast('Kalenderdatei heruntergeladen')}
async function updateWeather(){const loc=settings.location==='Landenhausen'?[50.607,9.472]:[50.627,9.445];try{const url=`https://api.open-meteo.com/v1/forecast?latitude=${loc[0]}&longitude=${loc[1]}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=7&timezone=Europe%2FBerlin`;const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('API');const data=await response.json();if(!Number.isFinite(data.current?.temperature_2m)||!Array.isArray(data.daily?.time))throw Error('Daten');weather=data;weatherCache={data,location:settings.location,updated:new Date().toISOString()};save('weather',weatherCache);if(current==='home'||current==='weather')render()}catch{weather=null;if(current==='home'||current==='weather')render();}}
async function updateNews(){try{const response=await fetch('./news.json?v='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('News-Serverantwort');const obj=await response.json();if(!obj||!Array.isArray(obj.items))throw Error('News-Format');const valid=normalizeClientNews(obj);if(valid.length){news=valid;newsUpdatedAt=obj.updatedAt||null;newsSources=Array.isArray(obj.sources)?obj.sources:[];newsStatus='live';save('newsCache',{items:valid,updatedAt:newsUpdatedAt,sources:newsSources});}else{news=newsSeed;newsUpdatedAt=null;newsSources=Array.isArray(obj.sources)?obj.sources:[];newsStatus='fallback';}if(current==='home'||current==='news'||current==='clubs')render();}catch{const cached=read('newsCache',null);if(cached&&Array.isArray(cached.items)&&cached.items.length){news=cached.items;newsUpdatedAt=cached.updatedAt;newsSources=cached.sources||[];newsStatus='cache';}else{news=newsSeed;newsUpdatedAt=null;newsStatus='fallback';}if(current==='home'||current==='news'||current==='clubs')render();}}

function searchOpen(){const el=$('#search-modal');el.hidden=false;document.body.style.overflow='hidden';$('#search-input').value='';searchResults('');$('#search-input').focus()}
function searchClose(){$('#search-modal').hidden=true;document.body.style.overflow=''}
function searchResults(query){const q=query.toLocaleLowerCase('de').trim();const all=[...news.map(n=>({title:n.title,sub:'Nachricht · '+(n.sourceName||n.category),page:'news'})),...events.map(e=>({title:e.title,sub:'Veranstaltung · '+e.location,page:'events'})),...clubs.map(c=>({title:c.title,sub:'Verein · '+c.location,page:'clubs'})),...places.map(p=>({title:p.title,sub:'Ortsführer · '+p.location,page:'places'})),...pages.map(p=>({title:p[1],sub:'Bereich',page:p[0]}))];const items=all.filter(x=>(x.title+' '+x.sub).toLocaleLowerCase('de').includes(q)).slice(0,12);$('#search-results').innerHTML=items.map(x=>`<button class="search-result" data-search-go="${x.page}"><span style="color:var(--accent);font-size:22px">⌕</span><span><strong>${esc(x.title)}</strong><span>${esc(x.sub)}</span></span></button>`).join('')||empty('Probiere einen anderen Suchbegriff.');}
document.addEventListener('click',e=>{
  if(e.target.id==='reader-modal'){closeReader();return}
  const close=e.target.closest('#reader-close');if(close?.id==='reader-close'){closeReader();return}
  const button=e.target.closest('button');
  if(button?.hasAttribute('data-reader')){openReader(button.getAttribute('data-reader'),button.getAttribute('data-reader-id'));return}
  if(!e.target.closest('a,button')){const card=e.target.closest('[data-reader-card]');if(card){openReader(card.getAttribute('data-reader-card'),card.getAttribute('data-reader-id'));return}}
  const target=button;if(!target)return;if(target.hasAttribute('data-map-focus')){const id=target.getAttribute('data-map-focus');placeMapSelected=id;if(window.WartenbergMap)window.WartenbergMap.focus(id);return}if(target.hasAttribute('data-place-view')){placeViewMode=target.getAttribute('data-place-view')==='list'?'list':'map';placeMapSelected=null;save('placeViewMode',placeViewMode);render();return}if(target.hasAttribute('data-place-more')){placeLimit+=24;render();return}if(target.hasAttribute('data-place-topic')){placeCategory=target.getAttribute('data-place-topic');placeLimit=24;placeMapSelected=null;render();return}if(target.hasAttribute('data-event-category')){eventCategory=target.getAttribute('data-event-category');render();return}if(target.hasAttribute('data-events-refresh')){toast('Gemeindetermine werden neu geladen');updateEvents();return}if(target.hasAttribute('data-club-topic')){clubCategory=target.getAttribute('data-club-topic');render();return}if(target.hasAttribute('data-news-scope')){filter=target.getAttribute('data-news-scope');newsLimit=18;render();return}if(target.hasAttribute('data-news-topic')){newsTopicFilter=target.getAttribute('data-news-topic');newsLimit=18;render();return}if(target.hasAttribute('data-news-more')){newsLimit+=18;render();return}if(target.hasAttribute('data-news-refresh')){toast('Gespeicherte Nachrichten werden neu geladen');updateNews();return}if(target.dataset.nav){go(target.dataset.nav);return}if(target.dataset.filter){filter=target.dataset.filter;if(current==='places'){placeLimit=24;placeMapSelected=null;}render();return}if(target.dataset.fav){const id=target.dataset.fav;fav=fav.includes(id)?fav.filter(f=>f!==id):[...fav,id];save('favorites',fav);render();toast(fav.includes(id)?'Zu Favoriten hinzugefügt':'Aus Favoriten entfernt');return}if(target.dataset.ics){const item=events.find(ev=>ev.id===target.dataset.ics);if(item)ics(item);return}if(target.dataset.cal){eventMonth=new Date(eventMonth.getFullYear(),eventMonth.getMonth()+Number(target.dataset.cal),1);monthSelected=null;render();return}if(target.dataset.selectDay){monthSelected=target.dataset.selectDay;render();return}if(target.dataset.clearDay){monthSelected=null;render();return}if(target.dataset.onlyFavs){onlyFavorites=!onlyFavorites;if(current==='places'){placeLimit=24;placeMapSelected=null;}render();return}if(target.dataset.refreshWeather){toast('Wetterdaten werden abgerufen');updateWeather();return}if(target.dataset.clear){if(!confirm('Möchtest du die lokalen Daten wirklich löschen?'))return;if(target.dataset.clear==='all'){Object.keys(localStorage).filter(k=>k.startsWith('w360:')).forEach(k=>localStorage.removeItem(k));settings={location:'Angersbach',theme:'system'};fav=[];weatherCache=null;weather=null;applyTheme()}else{fav=[];save('favorites',[])}render();toast('Lokale Daten gelöscht');return}if(target.dataset.searchGo){searchClose();go(target.dataset.searchGo);return}});
document.addEventListener('change',e=>{if(e.target.matches('[data-news-sort]')){newsSort=e.target.value;save('newsSort',newsSort);newsLimit=18;render();return}if(e.target.matches('[data-news-source]')){newsSource=e.target.value;render();return}if(e.target.matches('[data-setting]')){settings[e.target.dataset.setting]=e.target.value;save('settings',settings);applyTheme();render();if(e.target.dataset.setting==='location'){weather=null;weatherCache=weatherCache?.location===settings.location?weatherCache:null;updateWeather()}}});
document.addEventListener('input',e=>{if(e.target.id==='search-input'){searchResults(e.target.value);return}if(e.target.id==='page-search'){search=e.target.value;const position=e.target.selectionStart;render();const next=$('#page-search');if(next){next.focus();next.setSelectionRange(position,position)}}});
$('#global-search').textContent='⌕';$('#header-settings').textContent='⚙';$('#close-search').textContent='×';$('#search-symbol').textContent='⌕';$('#global-search').addEventListener('click',searchOpen);$('#header-settings').addEventListener('click',()=>go('settings'));$('#close-search').addEventListener('click',searchClose);$('#search-modal').addEventListener('click',e=>{if(e.target.id==='search-modal')searchClose()});$('#footer-sources').addEventListener('click',()=>go('settings'));$('#open-source-sidebar').addEventListener('click',()=>go('settings'));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeReader();searchClose()};if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();searchOpen()}});
current=location.hash.slice(1)||'home';if(!views[current])current='home';if(current==='news'){filter='Wartenberg';newsTopicFilter='Alle Themen';}window.addEventListener('hashchange',()=>{const p=location.hash.slice(1);if(views[p]&&current!==p){current=p;filter=p==='news'?'Wartenberg':'Alle';if(p==='news'){newsTopicFilter='Alle Themen';newsLimit=18;}if(p==='clubs')clubCategory='Alle';if(p==='events')eventCategory='Alle';if(p==='places'){placeCategory='Alle';placeLimit=24;}render()}});render();updateWeather();updateNews();updateEvents();updatePlaces();updatePlaceCoordinates();if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./service-worker.js').catch(()=>{});