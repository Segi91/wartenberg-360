/* Wartenberg 360 – standalone free interactive map for the locally verified town guide.
 * Leaflet 1.9.4, OSM cartography. No live geocoding, GPS or API key.
 * Only entries with independently sourced coordinates may become map markers.
 * 90/90 entries remain accessible in the source-backed list/sidebar.
 */
(function(global) {
  "use strict";
  const CENTER=[50.619,9.462];
  const TILE_URL="https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  const ATTRIBUTION='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap-Mitwirkende</a>';
  const icons={
    "Sehenswürdigkeiten":"🏰","Wandern & Radfahren":"🥾","Natur & Aussicht":"🌳",
    "Kultur & Treffen":"🎭","Freizeit & Sport":"🏊","Spielplätze":"🛝",
    "Essen & Trinken":"🍽️","Einkaufen":"🛍️","Gesundheit":"⚕️",
    "Öffentliche Einrichtungen":"🏛️","Mobilität":"🚉","Defibrillatoren":"❤️","Entsorgung":"♻️"
  };
  let currentMap=null;
  let idToMarker=new Map();
  let itemById=new Map();
  let mapElements=null;
  let currentItems=[];
  let chosenId=null;

  function htmlEscape(value) {
    return String(value==null?"":value).replace(/[&<>"']/g,ch=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[ch]));
  }
  function coordinatesFor(item, coords) {
    const c=coords&&coords[item.id];
    if (!c) return null;
    const lat=Number(c.lat),lon=Number(c.lon);
    if (!Number.isFinite(lat)||!Number.isFinite(lon)||lat<=50.575||lat>=50.665||lon<=9.395||lon>=9.550) return null;
    if (!["house","street","landmark"].includes(c.precision)) return null;
    return {lat,lon,precision:c.precision};
  }
  function pinIcon(category,n) {
    const emoji=icons[category]||"⌾";
    const extra=n>1?'<span class="w360-pin-count">'+n+'</span>':"";
    return global.L.divIcon({
      className:"w360-div-pin",
      html:'<span class="w360-pin-body" aria-hidden="true"><span>'+emoji+"</span>"+extra+"</span>",
      iconSize:[45,51],iconAnchor:[22,47],popupAnchor:[0,-43],
    });
  }
  function mapLink(item) {
    if (!item.address) return "";
    return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(item.address);
  }
  function groupPopup(items,coords) {
    // A shared address may contain several services (e.g. AED and fire station).
    return '<div class="w360-popup"><div class="w360-popup-heading">'+items.length+
      (items.length===1?" Ort":" Orte")+" an diesem Kartenpunkt</div>"+
      items.map(item=>{
        const pos=coordinatesFor(item,coords);
        const exact=pos&&pos.precision==="house";
        const label=pos&&pos.precision==="landmark"
          ?"Belegter Standort"
          :exact?"Hausnummer bestätigt":"Position nur straßengenau – Adresse prüfen";
        const map=mapLink(item);
        return '<section class="w360-popup-entry"><div class="w360-popup-tag">'+htmlEscape(item.category)+"</div>"+
          '<strong>'+htmlEscape(item.title)+"</strong>"+
          '<p>'+htmlEscape(item.address||item.location)+'</p>'+
          '<small>'+htmlEscape(label)+'</small>'+
          '<div class="w360-popup-actions">'+
          (map?'<a target="_blank" rel="noopener noreferrer" href="'+htmlEscape(map)+'">Adresse prüfen ↗</a>':"")+
          '<a target="_blank" rel="noopener noreferrer" href="'+htmlEscape(item.source)+'">Quelle ↗</a>'+
          "</div></section>";
      }).join("")+"</div>";
  }
  function setSelected(id) {
    chosenId=id;
    const side=global.document.getElementById("w360-map-sidebar");
    if (!side) return;
    side.querySelectorAll("[data-map-focus]").forEach(node=>{
      const selected=node.getAttribute("data-map-focus")===id;
      node.classList.toggle("selected",selected);
      node.setAttribute("aria-pressed",String(selected));
    });
  }
  function focus(id) {
    const marker=idToMarker.get(id);
    if(!marker||!currentMap)return false;
    const item=itemById.get(id);
    const coords=marker.getLatLng();
    currentMap.setView(coords,Math.max(currentMap.getZoom(),15),{animate:true});
    marker.openPopup();
    setSelected(id);
    const side=global.document.getElementById("w360-map-sidebar");
    if (side&&item) {
      const node=Array.from(side.querySelectorAll("[data-map-focus]")).find(n=>n.getAttribute("data-map-focus")===id);
      if(node&&typeof node.scrollIntoView==="function")node.scrollIntoView({block:"nearest",behavior:"smooth"});
    }
    // On narrow displays the map is ABOVE the list: return it to view when
    // a list item is tapped, instead of opening an invisible popup above.
    const narrow=typeof global.matchMedia==="function"&&global.matchMedia("(max-width:790px)").matches;
    if(narrow){
      const mapNode=global.document.getElementById("w360-map");
      if(mapNode&&typeof mapNode.scrollIntoView==="function")mapNode.scrollIntoView({behavior:"smooth",block:"center"});
    }
    return true;
  }
  function destroy() {
    idToMarker.clear();itemById.clear();chosenId=null;
    if(currentMap) {
      try{currentMap.off();currentMap.remove();}catch(e){ /* old DOM was removed */ }
      currentMap=null;
    }
  }
  function render({items,coordinates,initialFocus}={}) {
    destroy();
    currentItems=Array.isArray(items)?items.slice():[];
    const el=global.document.getElementById("w360-map");
    if(!el)return {displayed:0,missing:currentItems.length};
    if(!global.L) {
      el.innerHTML='<div class="w360-map-unavailable"><strong>Karte gerade nicht verfügbar</strong>'+
       '<p>Für die Kartenansicht wird eine Internetverbindung benötigt. Die vollständige Ortsliste und ihre Quellen sind weiterhin erreichbar.</p></div>';
      return {displayed:0,missing:currentItems.length};
    }
    try{
      currentMap=global.L.map(el,{
        center:CENTER,zoom:12,scrollWheelZoom:false,zoomControl:true,
        tap:false,maxZoom:19,preferCanvas:false
      });
      global.L.tileLayer(TILE_URL,{
        maxZoom:19,attribution:ATTRIBUTION,
        crossOrigin:false,updateWhenIdle:true,keepBuffer:1
      }).addTo(currentMap);
      const groups=new Map();
      for(const item of currentItems) {
        itemById.set(item.id,item);
        const c=coordinatesFor(item,coordinates);
        if (!c) continue;
        // Group colocated records without shifting pins or inventing locations.
        const key=c.lat.toFixed(6)+","+c.lon.toFixed(6);
        if(!groups.has(key))groups.set(key,{lat:c.lat,lon:c.lon,items:[]});
        groups.get(key).items.push(item);
      }
      const markers=[];
      for(const g of groups.values()) {
        const marker=global.L.marker([g.lat,g.lon],{
          icon:pinIcon(g.items[0].category,g.items.length),
          title:g.items.map(x=>x.title).join(", "),
          keyboard:true,alt:g.items.map(x=>x.title).join(", ")
        }).addTo(currentMap);
        marker.bindPopup(groupPopup(g.items,coordinates),{
          maxWidth:325,minWidth:210,autoPan:true,closeButton:true
        });
        for(const item of g.items)idToMarker.set(item.id,marker);
        marker.on("click",()=>setSelected(g.items[0].id));
        markers.push(marker);
      }
      if (markers.length>1) {
        currentMap.fitBounds(global.L.featureGroup(markers).getBounds().pad(.13),{maxZoom:15,animate:false});
      } else if(markers.length===1) {
        currentMap.setView(markers[0].getLatLng(),14,{animate:false});
      }
      if(initialFocus && idToMarker.has(initialFocus)) {
        focus(initialFocus);
      }
      if(typeof global.requestAnimationFrame==="function"){
        global.requestAnimationFrame(()=>{if(currentMap)currentMap.invalidateSize()});
      }
      return {displayed:idToMarker.size,missing:currentItems.length-idToMarker.size,markers:markers.length};
    }catch(err){
      try{destroy()}catch(e){}
      el.innerHTML='<div class="w360-map-unavailable"><strong>Karte konnte nicht geladen werden</strong><p>Die Ortsliste bleibt verfügbar. Bitte versuche es später erneut.</p></div>';
      if(global.console)global.console.error("Wartenberg-Karte:",err);
      return {displayed:0,missing:currentItems.length};
    }
  }
  global.WartenbergMap=Object.freeze({render,destroy,focus,coordinatesFor});
})(window);
