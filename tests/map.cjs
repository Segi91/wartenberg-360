'use strict';
/* Isolated interactive map tests: no Internet, no map tile downloads. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const script=fs.readFileSync('place-map.js','utf8');
const venues=JSON.parse(fs.readFileSync('data/places.json','utf8')).items;
const geo=JSON.parse(fs.readFileSync('data/place_coordinates.json','utf8'));
const coords=geo.byId;
assert.equal(venues.length,90,'Map includes all 90 records');
assert(Object.keys(coords).length>=1,'At least one verified position required');
const allowed=new Set(['street','house','landmark']);
const byId=new Set(venues.map(p=>p.id));
for(const [id,c] of Object.entries(coords)){
 assert(byId.has(id),'Unknown map ID: '+id);
 assert(c.lat>50.575&&c.lat<50.665&&c.lon>9.395&&c.lon<9.55,'Bad Wartenberg coordinate for '+id);
 assert(allowed.has(c.precision),'Coordinate has no accuracy statement: '+id);
}
const noCoordinates=venues.filter(p=>!coords[p.id]);
assert(noCoordinates.length>=20,'Unknown hiking places should be kept out of the map, not assigned random pins');
assert(noCoordinates.some(p=>p.category==='Wandern & Radfahren'),'Unknown hiking routes should remain unpinned');

let wasRemoved=0,allMarkers=[],popupMarkup=[];
function fakeMap(){
 return {
  off(){},remove(){wasRemoved++},invalidateSize(){},getZoom(){return 13},
  fitBounds(){},setView(){},
 };
}
function mockLeaflet(){
 return {
  map(node,options){assert(node);return fakeMap()},
  tileLayer(uri,options){
   assert.equal(uri,'https://tile.openstreetmap.org/{z}/{x}/{y}.png');
   assert(options.attribution.includes('OpenStreetMap'),'Missing visible OSM attribution');
   return {addTo(){return this}};
  },
  divIcon(opts){return opts},
  marker(pos,opts){
   let callbacks={},popupHtml;
   const o={
    pos,options:opts,
    addTo(){allMarkers.push(o);return o},
    bindPopup(html){popupHtml=html;popupMarkup.push(html);return o},
    on(name,fn){callbacks[name]=fn;return o},
    getLatLng(){return {lat:pos[0],lng:pos[1]}},
    openPopup(){return o},
  };
   return o;
  },
  featureGroup(markers){return {getBounds(){return {pad(){return this}}}}}
 };
}
const mapElement={innerHTML:''};
const selectedNodes=[];
const side={
 querySelectorAll(){
  return selectedNodes;
 }
};
const doc={
 getElementById(id){return id==='w360-map'?mapElement:id==='w360-map-sidebar'?side:null}
};
const win={document:doc,L:mockLeaflet(),console,requestAnimationFrame(cb){cb()}};
vm.runInNewContext(script,{window:win},{filename:'place-map.js',timeout:4000});
const map=win.WartenbergMap;
assert(map&&typeof map.render==='function','Map interface not registered');
const outcome=map.render({items:venues,coordinates:coords});
assert.equal(outcome.displayed,Object.keys(coords).length,'Every known coordinate must belong to a displayed entry');
assert.equal(outcome.missing,90-outcome.displayed,'Unlocated items are retained');
assert(allMarkers.length<=outcome.displayed,'Shared exact coordinates should be combined into one pin');
assert(allMarkers.length>5,'Expected multiple physically distinct locations');
assert(popupMarkup.length>0,'Location markers require detail popups');
assert(map.focus('ort-001'),'Grounded Burgruine marker should be selectable');
assert.equal(map.focus(noCoordinates[0].id),false,'Unlocated hiking route must not focus a false marker');
const suspicious={
 id:'fake',title:'<script>alert(1)</script>',location:'Angersbach',
 category:'Gesundheit',address:'Mühlstraße 13, 36367 Wartenberg',
 description:'<img src=x onerror=alert(1)>',
 source:'https://www.gemeinde-wartenberg.de/alle-news.html'
};
allMarkers=[];popupMarkup=[];
const mixed=map.render({items:[suspicious],coordinates:{fake:{lat:50.627,lon:9.445,precision:'street'}}});
assert.equal(mixed.displayed,1);
assert(popupMarkup[0].includes('&lt;script&gt;'),'Sanitize third-party place names in Leaflet popups');
assert(!popupMarkup[0].includes('<script>'),'Never inject script tags into a popup');
assert(wasRemoved>=1,'Re-render must release prior Leaflet map instance');
map.destroy();
assert(wasRemoved>=2,'Leaving map should release map instance');

const offlineElement={innerHTML:''};
const offlineWin={document:{getElementById(id){return id==='w360-map'?offlineElement:null}},console};
vm.runInNewContext(script,{window:offlineWin},{filename:'place-map.js',timeout:4000});
const offline=offlineWin.WartenbergMap.render({items:venues,coordinates:coords});
assert.equal(offline.displayed,0,'Without Leaflet should use graceful fallback');
assert(offlineElement.innerHTML.includes('Karte gerade nicht verfügbar'),'List should remain usable if map library is blocked');
console.log('OK: '+venues.length+' records, '+Object.keys(coords).length+
 ' verified coordinates, '+noCoordinates.length+' without invented pins, Leaflet tests and offline fallback.');
