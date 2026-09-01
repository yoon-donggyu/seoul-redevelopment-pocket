// Stable UI enhancements: no MutationObserver, no infinite polling
(() => {
  'use strict';
  const FAV_KEY='srp_favorites_v2';
  const COLLAPSE_KEY='srp_collapse_v2';
  const SNAP_KEY='srp_project_snapshot_v2';
  const HISTORY_KEY='srp_change_history_v2';
  let latestDashboard=null;
  let favoritesOnly=false;
  let sortMode='recent';

  const read=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??d}catch{return d}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
  const esc2=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const favs=()=>new Set(read(FAV_KEY,[]));
  const collapse=()=>read(COLLAPSE_KEY,{});
  const cardName=c=>c.querySelector('.name')?.textContent?.trim()||'';
  const cardKey=(root,c)=>root+'|'+cardName(c);
  const projectByName=n=>(latestDashboard?.projects||[]).find(p=>p.name===n)||null;

  function setCollapsed(rootId,card,closed,save=true){
    card.classList.toggle('is-collapsed',closed);
    const b=card.querySelector('.compact-toggle'); if(b)b.textContent=closed?'펼치기':'접기';
    if(save){const s=collapse();s[cardKey(rootId,card)]=closed;write(COLLAPSE_KEY,s)}
  }
  function toggleFav(name){const s=favs();s.has(name)?s.delete(name):s.add(name);write(FAV_KEY,[...s]);enhanceAll()}
  function enhanceCards(rootId){
    const root=document.getElementById(rootId); if(!root)return;
    const state=collapse(),fs=favs();
    root.querySelectorAll('article.card').forEach(card=>{
      if(!card.dataset.safeReady){
        card.dataset.safeReady='1';card.classList.add('compact-card');
        const toggle=document.createElement('button');toggle.type='button';toggle.className='compact-toggle';toggle.onclick=e=>{e.stopPropagation();setCollapsed(rootId,card,!card.classList.contains('is-collapsed'),true)};
        (card.querySelector('.name')||card.firstElementChild||card).after(toggle);
        const star=document.createElement('button');star.type='button';star.className='favbtn';star.onclick=e=>{e.stopPropagation();toggleFav(cardName(card))};card.appendChild(star);
      }
      const saved=state[cardKey(rootId,card)];setCollapsed(rootId,card,saved===undefined?true:!!saved,false);
      const star=card.querySelector('.favbtn');if(star){const on=fs.has(cardName(card));star.textContent=on?'★':'☆';star.classList.toggle('on',on)}
    });
  }
  function ensureHomeTools(){
    if(document.getElementById('homeTools'))return;
    const panel=document.querySelector('#home .filterpanel');if(!panel)return;
    const bar=document.createElement('div');bar.id='homeTools';bar.className='home-tools';
    bar.innerHTML='<button type="button" id="favOnlyBtn">☆ 관심만</button><label>정렬 <select id="projectSort"><option value="recent">최신 선정</option><option value="name">이름순</option><option value="area">면적 큰순</option><option value="district">자치구순</option></select></label>';
    panel.appendChild(bar);
    bar.querySelector('#favOnlyBtn').onclick=()=>{favoritesOnly=!favoritesOnly;sortHome()};
    bar.querySelector('#projectSort').onchange=e=>{sortMode=e.target.value;sortHome()};
  }
  function sortHome(){
    const root=document.getElementById('cards');if(!root)return;const fs=favs();const cards=[...root.querySelectorAll('article.card')];
    cards.forEach(c=>c.style.display=favoritesOnly&&!fs.has(cardName(c))?'none':'');
    cards.sort((a,b)=>{
      const A=projectByName(cardName(a))||{},B=projectByName(cardName(b))||{};
      const fav=(fs.has(B.name)?1:0)-(fs.has(A.name)?1:0);if(fav)return fav;
      if(sortMode==='name')return String(A.name||'').localeCompare(String(B.name||''),'ko');
      if(sortMode==='area')return Number(B.areaSqm||0)-Number(A.areaSqm||0);
      if(sortMode==='district')return String(A.district||'').localeCompare(String(B.district||''),'ko')||String(A.name||'').localeCompare(String(B.name||''),'ko');
      return String(B.selectedDate||'').localeCompare(String(A.selectedDate||''));
    }).forEach(c=>root.appendChild(c));
    const btn=document.getElementById('favOnlyBtn');if(btn){btn.classList.toggle('on',favoritesOnly);btn.textContent=favoritesOnly?'★ 관심만':'☆ 관심만'}
  }
  function ensureBottomBack(){
    const main=document.getElementById('detailMain');if(!main||main.querySelector('.detail-back-section'))return;
    if(main.querySelector('.loading'))return;
    const sec=document.createElement('section');sec.className='section detail-back-section';sec.innerHTML='<button type="button" class="bottom-backbtn">← 이전 화면으로 돌아가기</button>';
    sec.querySelector('button').onclick=()=>window.goBackFromDetail?.();main.appendChild(sec);
  }
  function updateFreshness(){
    const el=document.getElementById('updated'),iso=latestDashboard?.generatedAt;if(!el||!iso)return;const d=new Date(iso);if(isNaN(d))return;
    const m=Math.max(0,Math.floor((Date.now()-d.getTime())/60000));const ago=m<1?'방금':m<60?m+'분 전':m<1440?Math.floor(m/60)+'시간 전':Math.floor(m/1440)+'일 전';
    el.innerHTML='<span class="fresh-dot"></span> 데이터 '+ago+' · '+d.toLocaleString('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
  }

  function detectChanges(d){
    const cur={};(d?.projects||[]).forEach(p=>cur[p.id]={id:p.id,name:p.name,district:p.district,stage:p.stage||'',rightsDate:p.rightsDate||'',designationDate:p.designationDate||'',units:p.units??null,areaSqm:p.areaSqm??null});
    const prev=read(SNAP_KEY,null);if(!prev){write(SNAP_KEY,cur);return}
    const hist=read(HISTORY_KEY,[]);const add=x=>hist.unshift({...x,at:new Date().toISOString()});
    Object.values(cur).forEach(p=>{const o=prev[p.id];if(!o){add({type:'신규',projectId:p.id,name:p.name,district:p.district,detail:'새 사업지가 추가됐습니다.'});return}
      [['stage','진행단계'],['rightsDate','권리산정기준일'],['designationDate','구역지정일'],['units','계획 세대수'],['areaSqm','사업지 면적']].forEach(([f,l])=>{if(String(o[f]??'')!==String(p[f]??''))add({type:'변경',projectId:p.id,name:p.name,district:p.district,detail:l+' 변경',value:String(o[f]??'미확인')+' → '+String(p[f]??'미확인')})});
    });
    write(HISTORY_KEY,hist.slice(0,100));write(SNAP_KEY,cur);renderChanges();
  }
  function ensureChangesPage(){
    if(document.getElementById('changesPage'))return;
    const page=document.createElement('div');page.id='changesPage';page.className='page';page.innerHTML='<header><div class="eyebrow">SEOUL REDEVELOPMENT POCKET · CHANGES</div><h1>변경사항</h1><div class="sub">신규 사업지와 사업정보 변경만 빠르게 확인</div></header><section class="section"><div class="section-head"><h2>최근 변화</h2><button class="mini-action" id="clearChangeLog">기록 지우기</button></div><div id="changeList" class="list"></div></section>';
    document.querySelector('.wrap')?.appendChild(page);page.querySelector('#clearChangeLog').onclick=()=>{write(HISTORY_KEY,[]);renderChanges()};
    const nav=document.querySelector('.bottomnav');if(nav&&!nav.querySelector('[data-page="changesPage"]')){const gear=nav.querySelector('[data-page="statusPage"]');const b=document.createElement('button');b.dataset.page='changesPage';b.textContent='변경';b.onclick=()=>window.showPage?.('changesPage');nav.insertBefore(b,gear||null)}
  }
  function renderChanges(){
    ensureChangesPage();const list=document.getElementById('changeList');if(!list)return;const h=read(HISTORY_KEY,[]);
    list.innerHTML=h.length?h.map(x=>'<article class="card change-card"><div class="meta"><span>'+esc2(x.type)+' · '+esc2(x.district||'')+'</span><span>'+new Date(x.at).toLocaleDateString('ko-KR')+'</span></div><div class="name">'+esc2(x.name||'')+'</div><div class="subline">'+esc2(x.detail||'')+(x.value?'<br><b>'+esc2(x.value)+'</b>':'')+'</div>'+(x.projectId?'<button class="detailbtn" onclick="openDetail(\''+esc2(x.projectId)+'\')">사업지 보기</button>':'')+'</article>').join(''):'<div class="card"><div class="empty">아직 변경사항이 없습니다.</div></div>';
  }
  function mergeSourcesIntoStatus(){
    const dataBtn=document.querySelector('.bottomnav button[data-page="dataPage"]');if(dataBtn)dataBtn.remove();
    const data=document.getElementById('dataPage'),status=document.getElementById('statusPage');if(!data||!status||document.getElementById('statusSources'))return;
    const box=document.createElement('div');box.id='statusSources';box.innerHTML='<section class="section"><div class="section-head"><h2>공식 데이터 출처</h2><small>자료원</small></div></section>';
    [...data.querySelectorAll('section')].forEach(s=>box.appendChild(s));status.appendChild(box);data.remove();
  }
  function enhanceAll(){ensureHomeTools();enhanceCards('cards');enhanceCards('newList');enhanceCards('marketList');sortHome();ensureBottomBack();updateFreshness();renderChanges()}

  // Hook existing render functions. No observers, no polling loops.
  function wrap(name,after){const old=window[name];if(typeof old!=='function')return;window[name]=function(...args){const r=old.apply(this,args);try{after(...args)}catch(e){console.warn('safe-ui',name,e)}return r}}
  wrap('renderDashboard',d=>{latestDashboard=d;detectChanges(d);setTimeout(enhanceAll,0)});
  wrap('applyFilter',()=>setTimeout(()=>{enhanceCards('cards');sortHome()},0));
  wrap('renderNew',()=>setTimeout(()=>enhanceCards('newList'),0));
  wrap('renderMarket',()=>setTimeout(()=>enhanceCards('marketList'),0));
  wrap('renderDetail',()=>setTimeout(ensureBottomBack,0));
  const oldShow=window.showPage;if(typeof oldShow==='function')window.showPage=function(id){if(id==='dataPage')id='statusPage';const r=oldShow(id);if(id==='changesPage')renderChanges();return r};

  mergeSourcesIntoStatus();ensureChangesPage();renderChanges();setInterval(updateFreshness,60000);
})();