// Merge restored official Seoul polygon packs into the existing boundaryData once.
(() => {
  'use strict';
  const EXTRA=['/data/project_boundaries_extra_1.geojson','/data/project_boundaries_extra_2.geojson','/data/project_boundaries_extra_3.geojson'];
  let promise=null;
  function loadExtras(){
    if(promise)return promise;
    promise=Promise.all(EXTRA.map(u=>fetch(u,{cache:'no-store'}).then(r=>r.ok?r.json():({features:[]})).catch(()=>({features:[]}))))
      .then(parts=>{
        const extras=parts.flatMap(x=>x?.features||[]);
        const base=(typeof boundaryData!=='undefined'&&boundaryData?.features)?boundaryData:{type:'FeatureCollection',features:[]};
        const map=new Map((base.features||[]).map(f=>[f.properties?.projectId,f]));
        extras.forEach(f=>{const id=f.properties?.projectId;if(id&&!map.has(id))map.set(id,f)});
        boundaryData={...base,meta:{...(base.meta||{}),matchedCount:map.size,trackedCount:43,restoredAt:'2026-09-01'},features:[...map.values()]};
        return boundaryData;
      });
    return promise;
  }
  const oldRender=window.renderDashboard;
  if(typeof oldRender==='function'){
    window.renderDashboard=function(...args){
      const r=oldRender.apply(this,args);
      loadExtras().then(()=>{
        try{if(typeof applyFilter==='function')applyFilter();if(typeof renderNew==='function')renderNew();if(typeof renderMarket==='function')renderMarket()}catch(e){console.warn('polygon rerender',e)}
      });
      return r;
    };
  }
  loadExtras();
})();
