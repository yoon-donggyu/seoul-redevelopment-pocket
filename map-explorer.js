// MapLibre WebGL project explorer. The current polygon bundle is small, so it is
// cached once and filtered by viewport. Replace MAP_DATA_URL with an MVT/PMTiles
// source when the feature count grows beyond a few thousand; UI code can remain.
(() => {
  'use strict';
  const MAP_DATA_URLS=['/data/project_boundaries.geojson','/data/project_boundaries_extra_1.geojson','/data/project_boundaries_extra_2.geojson','/data/project_boundaries_extra_3.geojson'];
  const EMPTY={type:'FeatureCollection',features:[]};
  let map=null,allPolygons=[],selectedDistrict='전체',query='',loaded=false,detailBoundaryMap=null;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const projects=()=>Array.isArray(window.dashboard?.projects)?window.dashboard.projects:(typeof dashboard!=='undefined'&&Array.isArray(dashboard?.projects)?dashboard.projects:[]);
  const byId=id=>projects().find(p=>String(p.id)===String(id));
  const baseStyle={version:8,sources:{osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© OpenStreetMap contributors'}},layers:[{id:'osm',type:'raster',source:'osm',minzoom:0,maxzoom:19}]};

  function polygonCenter(feature){
    const points=[];const walk=x=>Array.isArray(x?.[0])?x.forEach(walk):points.push(x);
    walk(feature?.geometry?.coordinates||[]);if(!points.length)return null;
    const sx=points.reduce((s,p)=>s+Number(p[0]||0),0),sy=points.reduce((s,p)=>s+Number(p[1]||0),0);
    return [sx/points.length,sy/points.length];
  }
  function hydrate(feature){const id=feature.properties?.projectId,p=byId(id)||{};return {...feature,properties:{...feature.properties,projectId:id,name:p.name||feature.properties?.name||'사업지',district:p.district||'',dong:p.dong||'',stage:p.stage||'미확인',score:p._score||0}}}
  function matches(f){const p=f.properties||{},q=query.trim().toLowerCase();return(selectedDistrict==='전체'||p.district===selectedDistrict)&&(!q||[p.name,p.district,p.dong,p.stage].join(' ').toLowerCase().includes(q))}
  function pointsFor(features){return{type:'FeatureCollection',features:features.map(f=>({type:'Feature',geometry:{type:'Point',coordinates:polygonCenter(f)},properties:f.properties})).filter(f=>f.geometry.coordinates)}}
  function visibleFeatures(){const filtered=allPolygons.filter(matches);if(!map)return filtered;const b=map.getBounds();return filtered.filter(f=>{const c=polygonCenter(f);return c&&b.contains(c)})}
  function syncSources(){
    if(!map?.isStyleLoaded())return;const filtered=allPolygons.filter(matches),visible=visibleFeatures();
    map.getSource('projects')?.setData({type:'FeatureCollection',features:filtered});
    map.getSource('project-points')?.setData(pointsFor(visible));
    const count=document.getElementById('mapCount');if(count)count.textContent=`화면 ${visible.length}곳 · 전체 ${filtered.length}곳`;
  }
  function buildFilters(){const root=document.getElementById('mapDistrictFilters');if(!root)return;const values=['전체',...new Set(allPolygons.map(f=>f.properties?.district).filter(Boolean))].sort((a,b)=>a==='전체'?-1:b==='전체'?1:a.localeCompare(b,'ko'));root.innerHTML=values.map(x=>`<button class="districtchip ${x===selectedDistrict?'on':''}" data-map-district="${esc(x)}">${esc(x)}</button>`).join('');root.querySelectorAll('button').forEach(b=>b.onclick=()=>{selectedDistrict=b.dataset.mapDistrict;buildFilters();syncSources()})}
  async function loadFeatures(){
    const parts=await Promise.all(MAP_DATA_URLS.map(u=>fetch(u,{cache:'force-cache'}).then(r=>r.ok?r.json():EMPTY).catch(()=>EMPTY)));
    const seen=new Set();allPolygons=parts.flatMap(x=>x.features||[]).map(hydrate).filter(f=>{const id=f.properties?.projectId;if(!id||seen.has(id))return false;seen.add(id);return true});loaded=true;buildFilters();
  }
  function sheetHTML(p){return `<div class="sheet-handle"></div><div class="sheet-top"><div><span>${esc(p.district||'')} · ${esc(p.dong||'')}</span><h2>${esc(p.name||'사업지')}</h2></div><span class="stage">${esc(p.stage||'미확인')}</span></div><div class="sheet-facts"><div><span>면적</span><b>${p.areaSqm?Number(p.areaSqm).toLocaleString('ko-KR')+'㎡':'미확인'}</b></div><div><span>계획 세대수</span><b>${p.units?Number(p.units).toLocaleString('ko-KR')+'세대':'미확인'}</b></div><div><span>권리산정일</span><b>${esc(p.rightsDate||'미확인')}</b></div></div><button class="sheet-detail" data-project-id="${esc(p.id)}">상세 정보 보기</button>`}
  function selectProject(id){const p=byId(id);if(!p)return;const sheet=document.getElementById('mapSheet');sheet.innerHTML=sheetHTML(p);sheet.classList.add('open');sheet.querySelector('.sheet-detail').onclick=()=>window.openDetail?.(p.id);const feature=allPolygons.find(f=>String(f.properties?.projectId)===String(id));if(feature){const c=polygonCenter(feature);map.easeTo({center:c,zoom:Math.max(map.getZoom(),15),duration:500})}}
  async function init(){
    if(map||!window.maplibregl)return;if(!loaded)await loadFeatures();
    map=new maplibregl.Map({container:'projectMap',style:baseStyle,center:[126.978,37.5665],zoom:10.3,minZoom:8,maxZoom:19,attributionControl:false});
    map.addControl(new maplibregl.NavigationControl({showCompass:false}),'bottom-right');map.addControl(new maplibregl.AttributionControl({compact:true}),'top-right');
    map.on('load',()=>{
      map.addSource('projects',{type:'geojson',data:EMPTY});map.addSource('project-points',{type:'geojson',data:EMPTY,cluster:true,clusterMaxZoom:14,clusterRadius:46});
      map.addLayer({id:'project-fill',type:'fill',source:'projects',minzoom:12,paint:{'fill-color':['case',['>=',['get','score'],80],'#067647',['>=',['get','score'],65],'#2563eb','#b54708'],'fill-opacity':.18}});
      map.addLayer({id:'project-line',type:'line',source:'projects',minzoom:11,paint:{'line-color':'#1f2937','line-width':['interpolate',['linear'],['zoom'],11,1,16,3]}});
      map.addLayer({id:'clusters',type:'circle',source:'project-points',filter:['has','point_count'],paint:{'circle-color':'#202124','circle-radius':['step',['get','point_count'],17,10,22,30,28],'circle-stroke-color':'#fff','circle-stroke-width':3}});
      map.addLayer({id:'cluster-count',type:'symbol',source:'project-points',filter:['has','point_count'],layout:{'text-field':['get','point_count_abbreviated'],'text-size':12},paint:{'text-color':'#fff'}});
      map.addLayer({id:'project-point',type:'circle',source:'project-points',filter:['!',['has','point_count']],'paint':{'circle-color':'#fff','circle-radius':8,'circle-stroke-color':'#202124','circle-stroke-width':4}});
      map.on('click','clusters',e=>{const f=e.features?.[0],source=map.getSource('project-points');source.getClusterExpansionZoom(f.properties.cluster_id).then(z=>map.easeTo({center:f.geometry.coordinates,zoom:z}))});
      map.on('click','project-point',e=>selectProject(e.features?.[0]?.properties?.projectId));map.on('click','project-fill',e=>selectProject(e.features?.[0]?.properties?.projectId));
      ['clusters','project-point','project-fill'].forEach(id=>{map.on('mouseenter',id,()=>map.getCanvas().style.cursor='pointer');map.on('mouseleave',id,()=>map.getCanvas().style.cursor='')});
      map.on('moveend',syncSources);syncSources();
    });
  }
  async function detailMap(feature){
    const el=document.getElementById('boundaryMap');if(!el||!window.maplibregl||!feature)return;if(detailBoundaryMap)detailBoundaryMap.remove();
    detailBoundaryMap=new maplibregl.Map({container:el,style:baseStyle,interactive:true,attributionControl:false});detailBoundaryMap.on('load',()=>{detailBoundaryMap.addSource('boundary',{type:'geojson',data:feature});detailBoundaryMap.addLayer({id:'boundary-fill',type:'fill',source:'boundary',paint:{'fill-color':'#2563eb','fill-opacity':.18}});detailBoundaryMap.addLayer({id:'boundary-line',type:'line',source:'boundary',paint:{'line-color':'#202124','line-width':3}});const coords=[];const walk=x=>Array.isArray(x?.[0])?x.forEach(walk):coords.push(x);walk(feature.geometry.coordinates);const b=coords.reduce((box,p)=>box.extend(p),new maplibregl.LngLatBounds(coords[0],coords[0]));detailBoundaryMap.fitBounds(b,{padding:30,maxZoom:16,duration:0})})
  }
  document.addEventListener('click',e=>{if(e.target.closest('[data-page="mapPage"],[data-go="mapPage"]'))setTimeout(()=>init().then(()=>map?.resize()),0)});
  const input=document.getElementById('mapSearch');let timer;input?.addEventListener('input',e=>{clearTimeout(timer);timer=setTimeout(()=>{query=e.target.value||'';syncSources()},180)});document.getElementById('clearMapSearch')?.addEventListener('click',()=>{query='';if(input)input.value='';syncSources()});
  document.getElementById('mapLocate')?.addEventListener('click',()=>navigator.geolocation?.getCurrentPosition(pos=>map?.easeTo({center:[pos.coords.longitude,pos.coords.latitude],zoom:15}),()=>alert('현재 위치를 확인할 수 없습니다.'),{enableHighAccuracy:false,timeout:7000}));
  const oldRender=window.renderDashboard;if(typeof oldRender==='function')window.renderDashboard=function(){const r=oldRender.apply(this,arguments);if(loaded){allPolygons=allPolygons.map(hydrate);buildFilters();syncSources()}return r};
  const oldDetail=window.renderDetail;if(typeof oldDetail==='function')window.renderDetail=function(p){const r=oldDetail.apply(this,arguments);setTimeout(()=>detailMap(allPolygons.find(f=>String(f.properties?.projectId)===String(p.id))).catch(()=>{}),90);return r};
})();
