// OnBid compact board UI. No observers/polling.
(() => {
  'use strict';
  const REGION_MAP={
    '도심권':['종로구','중구','용산구'],
    '동북권':['성동구','광진구','동대문구','중랑구','성북구','강북구','도봉구','노원구'],
    '서북권':['은평구','서대문구','마포구'],
    '서남권':['양천구','강서구','구로구','금천구','영등포구','동작구','관악구'],
    '동남권':['서초구','강남구','송파구','강동구']
  };
  let region='전체',district='전체',resultFilter='전체';

  function currentProjects(){try{return dashboard?.projects||[]}catch{return []}}
  function byName(name){return currentProjects().find(p=>p.name===name)||null}
  function projectNameFromPick(el){return el.querySelector('.name')?.textContent?.trim()||''}

  function ensureProjectFilters(){
    const page=document.getElementById('onbidPage');
    const search=page?.querySelector('#onbidSearch')?.closest('.searchbox');
    if(!page||!search||document.getElementById('onbidBoardFilters'))return;
    const box=document.createElement('div');box.id='onbidBoardFilters';box.className='onbid-board-filters';
    box.innerHTML='<div class="onbid-filter-title">지역 카테고리</div><div id="onbidRegionChips" class="onbid-chiprow"></div><div id="onbidDistrictChips" class="onbid-chiprow sub"></div>';
    search.parentNode.insertBefore(box,search);
    renderRegionChips();renderDistrictChips();
  }
  function renderRegionChips(){
    const root=document.getElementById('onbidRegionChips');if(!root)return;
    const names=['전체',...Object.keys(REGION_MAP)];
    root.innerHTML=names.map(x=>`<button type="button" class="onbid-chip ${x===region?'on':''}" data-region="${x}">${x}</button>`).join('');
    root.querySelectorAll('button').forEach(b=>b.onclick=()=>{region=b.dataset.region;district='전체';renderRegionChips();renderDistrictChips();applyProjectFilters()});
  }
  function renderDistrictChips(){
    const root=document.getElementById('onbidDistrictChips');if(!root)return;
    let ds=[...new Set(currentProjects().map(p=>p.district).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
    if(region!=='전체')ds=ds.filter(d=>(REGION_MAP[region]||[]).includes(d));
    const names=['전체',...ds];
    root.innerHTML=names.map(x=>`<button type="button" class="onbid-chip ${x===district?'on':''}" data-district="${x}">${x}</button>`).join('');
    root.querySelectorAll('button').forEach(b=>b.onclick=()=>{district=b.dataset.district;renderDistrictChips();applyProjectFilters()});
  }
  function applyProjectFilters(){
    const q=(document.getElementById('onbidSearch')?.value||'').trim().toLowerCase();
    const root=document.getElementById('onbidProjectList');if(!root)return;
    let shown=0;
    root.querySelectorAll('.onbidpick').forEach(el=>{
      const p=byName(projectNameFromPick(el));
      const regionOk=region==='전체'||(p&&(REGION_MAP[region]||[]).includes(p.district));
      const districtOk=district==='전체'||p?.district===district;
      const qOk=!q||[p?.name,p?.district,p?.dong].join(' ').toLowerCase().includes(q);
      const ok=regionOk&&districtOk&&qOk;el.style.display=ok?'':'none';if(ok)shown++;
    });
    let count=document.getElementById('onbidProjectCount');
    if(!count){count=document.createElement('div');count.id='onbidProjectCount';count.className='onbid-count';root.parentNode.insertBefore(count,root)}
    count.textContent=`보이는 사업지 ${shown}개`;
  }

  function ensureResultFilters(){
    const list=document.getElementById('onbidList');if(!list)return;
    let box=document.getElementById('onbidResultFilters');
    if(!box){
      box=document.createElement('div');box.id='onbidResultFilters';box.className='onbid-result-filters';
      box.innerHTML='<div class="onbid-filter-title">공매 결과</div><div class="onbid-chiprow" id="onbidResultChips"></div>';
      list.parentNode.insertBefore(box,list);
    }
    const names=['전체','가격 확인','미확인','마감일 확인'];
    const chips=document.getElementById('onbidResultChips');
    chips.innerHTML=names.map(x=>`<button type="button" class="onbid-chip ${x===resultFilter?'on':''}" data-rf="${x}">${x}</button>`).join('');
    chips.querySelectorAll('button').forEach(b=>b.onclick=()=>{resultFilter=b.dataset.rf;ensureResultFilters();applyResultFilters()});
  }
  function classifyCard(card){
    const values=[...card.querySelectorAll('.fact b')].map(x=>(x.textContent||'').trim());
    const unknown=values.some(v=>/미확인|조회 실패|조회 중|계산 불가|미제공/.test(v));
    const appraisal=(card.querySelector('.onbid-value-appraisal')?.textContent||'').trim();
    const minimum=(card.querySelector('.onbid-value-minimum')?.textContent||'').trim();
    const end=(card.querySelector('.onbid-value-end')?.textContent||'').trim();
    const moneyOk=v=>/\d/.test(v)&&!/미확인|조회 실패|조회 중|미제공/.test(v);
    const hasPrice=moneyOk(appraisal)||moneyOk(minimum);
    const hasEnd=/\d/.test(end)&&!/미확인|조회 실패|조회 중|미제공/.test(end);
    return {unknown,hasPrice,hasEnd};
  }
  function compactResultCards(){
    const list=document.getElementById('onbidList');if(!list)return;
    list.querySelectorAll('article.card').forEach(card=>{
      if(card.dataset.onbidCompact)return;card.dataset.onbidCompact='1';card.classList.add('onbid-result-card','is-onbid-collapsed');
      const b=document.createElement('button');b.type='button';b.className='onbid-morebtn';b.textContent='펼치기';
      b.onclick=async()=>{
        const closed=card.classList.toggle('is-onbid-collapsed');
        b.textContent=closed?'펼치기':'접기';
        if(!closed&&typeof window.ensureOnbidDetail==='function'){
          await window.ensureOnbidDetail(card);
          applyResultFilters();
        }
      };
      (card.querySelector('.name')||card.firstElementChild||card).after(b);
    });
  }
  function applyResultFilters(){
    const list=document.getElementById('onbidList');if(!list)return;let shown=0;
    list.querySelectorAll('article.card').forEach(card=>{
      const c=classifyCard(card);let ok=true;
      if(resultFilter==='가격 확인')ok=c.hasPrice;
      if(resultFilter==='미확인')ok=c.unknown;
      if(resultFilter==='마감일 확인')ok=c.hasEnd;
      card.style.display=ok?'':'none';if(ok)shown++;
    });
    const stamp=document.getElementById('onbidStamp');if(stamp&&list.querySelector('article.card')){
      const base=(stamp.textContent||'').replace(/ · 필터 \d+건$/,'');stamp.textContent=base+` · 필터 ${shown}건`;
    }
  }
  function afterChooser(){ensureProjectFilters();renderDistrictChips();applyProjectFilters()}
  function afterResults(){ensureResultFilters();compactResultCards();applyResultFilters()}

  const oldChooser=window.renderOnbidChooser;
  if(typeof oldChooser==='function')window.renderOnbidChooser=function(...args){const r=oldChooser.apply(this,args);setTimeout(afterChooser,0);return r};
  const oldLoad=window.loadOnbidProject;
  if(typeof oldLoad==='function')window.loadOnbidProject=async function(...args){const r=await oldLoad.apply(this,args);setTimeout(afterResults,0);return r};

  const search=document.getElementById('onbidSearch');if(search)search.addEventListener('input',()=>setTimeout(applyProjectFilters,0));
  const clear=document.getElementById('clearOnbidSearch');if(clear)clear.addEventListener('click',()=>setTimeout(applyProjectFilters,0));

  const style=document.createElement('style');style.textContent=`
    .onbid-board-filters,.onbid-result-filters{margin:0 0 10px;padding:10px;background:#f8f8f8;border:1px solid #e4e4e4;border-radius:13px}
    .onbid-filter-title{font-size:10px;font-weight:900;color:#555;margin-bottom:7px}
    .onbid-chiprow{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}.onbid-chiprow::-webkit-scrollbar{display:none}
    .onbid-chiprow.sub{margin-top:7px;padding-top:7px;border-top:1px solid #e8e8e8}
    .onbid-chip{flex:0 0 auto;border:1px solid #d8d8d8;background:#fff;border-radius:999px;padding:7px 10px;font-size:10px;font-weight:850;color:#666;white-space:nowrap}
    .onbid-chip.on{background:#202124;color:#fff;border-color:#202124}.onbid-count{font-size:9px;color:#888;text-align:right;margin:6px 2px}
    .onbid-result-card{position:relative}.onbid-morebtn{position:absolute;right:12px;top:12px;border:1px solid #ddd;background:#fff;border-radius:999px;padding:6px 9px;font-size:10px;font-weight:850;color:#555}
    .onbid-result-card.is-onbid-collapsed .actions,.onbid-result-card.is-onbid-collapsed .onbid-detail-box{display:none!important}
    .onbid-result-card.is-onbid-collapsed .facts{grid-template-columns:repeat(2,1fr);margin-top:9px}
    .onbid-result-card .name{padding-right:66px}.onbid-result-filters{margin-top:2px}
    @media(max-width:420px){.onbid-chip{font-size:9px;padding:6px 9px}.onbid-morebtn{right:10px;top:10px}.onbid-result-card .fact{padding:8px}}
  `;document.head.appendChild(style);
  ensureProjectFilters();
})();
