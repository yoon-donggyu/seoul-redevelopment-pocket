// Change tracking for Seoul Redevelopment Pocket
(() => {
  const SNAP_KEY='srp_project_snapshot_v1';
  const HISTORY_KEY='srp_change_history_v1';
  const MARKET_KEY='srp_market_snapshot_v1';
  const ONBID_KEY='srp_onbid_snapshot_v1';
  const MAX_HISTORY=120;

  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch{return d}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
  const now=()=>new Date().toISOString();
  const safe=s=>String(s??'');
  const hesc=s=>safe(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function addChange(change){
    const hist=read(HISTORY_KEY,[]);
    const key=[change.type,change.projectId||'',change.detail||'',change.value||''].join('|');
    if(hist.some(x=>x.key===key && (Date.now()-new Date(x.at).getTime())<86400000)) return;
    hist.unshift({...change,key,at:now()});
    write(HISTORY_KEY,hist.slice(0,MAX_HISTORY));
    updateBadge();
  }

  function projectSnapshot(){
    const ps=window.dashboard?.projects||[];
    const out={};
    ps.forEach(p=>out[p.id]={id:p.id,name:p.name,district:p.district,dong:p.dong,stage:p.stage||'',rightsDate:p.rightsDate||'',designationDate:p.designationDate||'',selectedDate:p.selectedDate||'',units:p.units??null,areaSqm:p.areaSqm??null});
    return out;
  }

  function detectProjectChanges(){
    const cur=projectSnapshot();
    if(!Object.keys(cur).length)return;
    const prev=read(SNAP_KEY,null);
    if(!prev){write(SNAP_KEY,cur);return;}
    Object.values(cur).forEach(p=>{
      const old=prev[p.id];
      if(!old){addChange({type:'new',projectId:p.id,projectName:p.name,district:p.district,detail:'신규 사업지 추가',value:p.stage});return;}
      [['stage','진행단계'],['rightsDate','권리산정기준일'],['designationDate','구역지정일'],['units','계획 세대수'],['areaSqm','사업지 면적']].forEach(([field,label])=>{
        if(safe(old[field])!==safe(p[field]) && safe(p[field])) addChange({type:'project',projectId:p.id,projectName:p.name,district:p.district,detail:`${label} 변경`,value:`${safe(old[field])||'미확인'} → ${safe(p[field])}`});
      });
    });
    write(SNAP_KEY,cur);
  }

  function marketSignature(d){
    const p=d?.project,m=p?.market;if(!p||!m)return null;
    return {projectId:p.id,projectName:p.name,district:p.district,count:Number(m.count||0),latestDealDate:m.latestDealDate||'',latest:(m.recentDeals||[]).slice(0,5).map(x=>[x.type,x.dealDate,x.umdNm,x.jibun,x.buildingName,x.amountManwon,x.areaSqm].join('|'))};
  }
  function trackMarket(d){
    const sig=marketSignature(d);if(!sig)return;
    const all=read(MARKET_KEY,{}),old=all[sig.projectId];
    if(old){
      const added=Math.max(0,sig.count-Number(old.count||0));
      if(added>0 || (sig.latestDealDate&&sig.latestDealDate!==old.latestDealDate)) addChange({type:'market',projectId:sig.projectId,projectName:sig.projectName,district:sig.district,detail:'실거래 변화',value:added>0?`최근 조회 대비 ${added}건 증가`:`최근 거래일 ${sig.latestDealDate}`});
    }
    all[sig.projectId]=sig;write(MARKET_KEY,all);
  }

  function onbidSignature(d){
    const p=d?.project;if(!p)return null;
    const ids=(d.items||[]).map(x=>x.cltrMngNo||x.pbctCdtnNo||`${x.name}|${x.address}`).filter(Boolean).sort();
    return {projectId:p.id,projectName:p.name,district:p.district,count:ids.length,ids};
  }
  function trackOnbid(d){
    const sig=onbidSignature(d);if(!sig)return;
    const all=read(ONBID_KEY,{}),old=all[sig.projectId];
    if(old){
      const oldSet=new Set(old.ids||[]),added=sig.ids.filter(x=>!oldSet.has(x)).length;
      if(added>0)addChange({type:'onbid',projectId:sig.projectId,projectName:sig.projectName,district:sig.district,detail:'온비드 신규 공매',value:`최근 조회 대비 ${added}건 추가`});
    }
    all[sig.projectId]=sig;write(ONBID_KEY,all);
  }

  // Observe API responses without changing existing request flow.
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const r=await nativeFetch(input,init);
    try{
      const url=typeof input==='string'?input:(input?.url||'');
      if(r.ok && (url.includes('/api/onbid?') || (url.includes('/api/pocket')&&url.includes('action=project')))){
        r.clone().json().then(d=>{if(url.includes('/api/onbid?'))trackOnbid(d);else trackMarket(d);renderChanges()}).catch(()=>{});
      }
    }catch{}
    return r;
  };

  function ensureUI(){
    if(!document.getElementById('changesPage')){
      const page=document.createElement('div');page.id='changesPage';page.className='page';
      page.innerHTML='<header><div class="eyebrow">SEOUL REDEVELOPMENT POCKET · CHANGES</div><h1>변경사항</h1><div class="sub">새 사업지 · 단계 변경 · 실거래 · 온비드 변화만 모아보기</div></header><section class="section"><div class="change-summary" id="changeSummary"></div></section><section class="section"><div class="section-head"><h2>최근 변화</h2><button type="button" id="clearChanges" class="mini-action">기록 지우기</button></div><div id="changeList" class="list"></div></section>';
      document.querySelector('.wrap')?.appendChild(page);
      page.querySelector('#clearChanges').onclick=()=>{if(confirm('변경사항 기록만 지울까요?')){write(HISTORY_KEY,[]);renderChanges()}};
    }
    const nav=document.querySelector('.bottomnav');
    if(nav&&!nav.querySelector('[data-page="changesPage"]')){
      const gear=nav.querySelector('[data-page="statusPage"]');
      const b=document.createElement('button');b.dataset.page='changesPage';b.innerHTML='변경<span id="changeBadge" class="change-badge"></span>';
      b.onclick=()=>window.showPage('changesPage');nav.insertBefore(b,gear||null);
    }
  }

  function icon(type){return type==='new'?'＋':type==='market'?'₩':type==='onbid'?'공':type==='project'?'↻':'•'};
  function label(type){return type==='new'?'신규 사업지':type==='market'?'실거래':type==='onbid'?'온비드':type==='project'?'사업정보':'변경';}
  function ago(iso){const t=new Date(iso).getTime();if(!t)return '';const m=Math.floor((Date.now()-t)/60000);if(m<1)return '방금';if(m<60)return `${m}분 전`;const h=Math.floor(m/60);if(h<24)return `${h}시간 전`;return `${Math.floor(h/24)}일 전`;}
  function renderChanges(){
    ensureUI();detectProjectChanges();
    const hist=read(HISTORY_KEY,[]),list=document.getElementById('changeList'),sum=document.getElementById('changeSummary');if(!list||!sum)return;
    const counts={new:0,project:0,market:0,onbid:0};hist.forEach(x=>counts[x.type]=(counts[x.type]||0)+1);
    sum.innerHTML=`<div><b>${hist.length}</b><span>누적 변화</span></div><div><b>${counts.new||0}</b><span>신규</span></div><div><b>${counts.project||0}</b><span>사업정보</span></div><div><b>${(counts.market||0)+(counts.onbid||0)}</b><span>거래·공매</span></div>`;
    list.innerHTML=hist.length?hist.map(x=>`<article class="card change-card"><div class="change-icon">${icon(x.type)}</div><div class="change-body"><div class="meta"><span>${label(x.type)} · ${hesc(x.district||'')}</span><span>${ago(x.at)}</span></div><b>${hesc(x.projectName||'')}</b><p>${hesc(x.detail||'')}${x.value?`<br><strong>${hesc(x.value)}</strong>`:''}</p>${x.projectId?`<button type="button" class="change-open" onclick="openDetail('${hesc(x.projectId)}')">사업지 보기</button>`:''}</div></article>`).join(''):'<div class="card"><div class="empty">아직 기록된 변경사항이 없습니다.<br>현재 상태를 기준으로 다음 변화부터 표시합니다.</div></div>';
    updateBadge();
  }
  function updateBadge(){const b=document.getElementById('changeBadge'),n=read(HISTORY_KEY,[]).length;if(b){b.textContent=n?String(Math.min(n,99)):'';b.style.display=n?'inline-flex':'none';}}

  const wait=setInterval(()=>{if(window.dashboard?.projects?.length){clearInterval(wait);ensureUI();detectProjectChanges();renderChanges();}},250);
  setTimeout(()=>{ensureUI();updateBadge()},100);

  const oldShow=window.showPage;
  if(typeof oldShow==='function')window.showPage=function(id){oldShow(id);if(id==='changesPage')renderChanges();};
})();