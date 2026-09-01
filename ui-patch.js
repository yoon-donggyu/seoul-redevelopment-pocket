// v7.3 compact UI + favorites + sorting + OnBid endpoint
(() => {
  const FAV_KEY='srp_favorites_v1';
  const COLLAPSE_KEY='srp_collapse_v1';
  let favoritesOnly=false;
  let sortMode='recent';
  const readJSON=(k,fallback)=>{try{return JSON.parse(localStorage.getItem(k)||'')||fallback}catch{return fallback}};
  const saveJSON=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const favs=()=>new Set(readJSON(FAV_KEY,[]));
  const collapseState=()=>readJSON(COLLAPSE_KEY,{});
  const projectByName=name=>(dashboard?.projects||[]).find(p=>p.name===name)||null;

  function cardName(card){return card.querySelector('.name')?.textContent?.trim()||''}
  function cardKey(rootId,card){return rootId+'|'+cardName(card)}
  function setCollapsed(rootId,card,closed){
    card.classList.toggle('is-collapsed',closed);
    const btn=card.querySelector('.compact-toggle');if(btn)btn.textContent=closed?'펼치기':'접기';
    const s=collapseState();s[cardKey(rootId,card)]=closed;saveJSON(COLLAPSE_KEY,s);
  }
  function toggleFavorite(name){
    const s=favs();s.has(name)?s.delete(name):s.add(name);saveJSON(FAV_KEY,[...s]);refreshEnhancements();
  }
  function addFavoriteButton(card){
    if(card.querySelector('.favbtn'))return;
    const name=cardName(card);if(!name)return;
    const b=document.createElement('button');b.type='button';b.className='favbtn';b.title='관심 사업지';
    b.onclick=e=>{e.stopPropagation();toggleFavorite(name)};
    card.appendChild(b);
  }
  function updateFavoriteButton(card){
    const b=card.querySelector('.favbtn');if(!b)return;const on=favs().has(cardName(card));b.classList.toggle('on',on);b.textContent=on?'★':'☆';
  }
  function compactify(rootId){
    const root=document.getElementById(rootId); if(!root)return;
    const state=collapseState();
    root.querySelectorAll('article.card').forEach(card=>{
      if(!card.dataset.compactReady){
        card.dataset.compactReady='1';card.classList.add('compact-card');
        const title=card.querySelector('.name');const btn=document.createElement('button');
        btn.type='button';btn.className='compact-toggle';
        btn.onclick=e=>{e.stopPropagation();setCollapsed(rootId,card,!card.classList.contains('is-collapsed'))};
        (title||card.firstElementChild||card).after(btn);addFavoriteButton(card);
      }
      const saved=state[cardKey(rootId,card)];setCollapsed(rootId,card,saved===undefined?true:!!saved);updateFavoriteButton(card);
    });
  }

  function ensureHomeTools(){
    if(document.getElementById('homeTools'))return;
    const filter=document.querySelector('#home .filterpanel');if(!filter)return;
    const bar=document.createElement('div');bar.id='homeTools';bar.className='home-tools';
    bar.innerHTML='<button type="button" id="favOnlyBtn">☆ 관심만</button><label>정렬 <select id="projectSort"><option value="recent">최신 선정</option><option value="name">이름순</option><option value="area">면적 큰순</option><option value="district">자치구순</option></select></label>';
    filter.appendChild(bar);
    bar.querySelector('#favOnlyBtn').onclick=()=>{favoritesOnly=!favoritesOnly;refreshEnhancements()};
    bar.querySelector('#projectSort').onchange=e=>{sortMode=e.target.value;refreshEnhancements()};
  }
  function sortHomeCards(){
    const root=document.getElementById('cards');if(!root)return;
    const arr=[...root.querySelectorAll('article.card')];const fs=favs();
    arr.forEach(card=>{card.style.display=favoritesOnly&&!fs.has(cardName(card))?'none':''});
    arr.sort((a,b)=>{
      const A=projectByName(cardName(a))||{},B=projectByName(cardName(b))||{};
      const favDiff=(fs.has(B.name)?1:0)-(fs.has(A.name)?1:0);if(favDiff)return favDiff;
      if(sortMode==='name')return String(A.name||'').localeCompare(String(B.name||''),'ko');
      if(sortMode==='area')return Number(B.areaSqm||0)-Number(A.areaSqm||0);
      if(sortMode==='district')return String(A.district||'').localeCompare(String(B.district||''),'ko')||String(A.name||'').localeCompare(String(B.name||''),'ko');
      return String(B.selectedDate||'').localeCompare(String(A.selectedDate||''));
    }).forEach(x=>root.appendChild(x));
    const btn=document.getElementById('favOnlyBtn');if(btn){btn.classList.toggle('on',favoritesOnly);btn.textContent=favoritesOnly?'★ 관심만':'☆ 관심만'}
    const visible=arr.filter(x=>x.style.display!=='none').length;const count=document.getElementById('count');if(count&&favoritesOnly)count.textContent=`관심 ${visible}개`;
  }
  function updateFreshness(){
    const el=document.getElementById('updated');if(!el||!dashboard?.generatedAt)return;
    const d=new Date(dashboard.generatedAt);if(isNaN(d))return;
    const mins=Math.max(0,Math.round((Date.now()-d.getTime())/60000));
    const ago=mins<1?'방금':mins<60?`${mins}분 전`:mins<1440?`${Math.floor(mins/60)}시간 전`:`${Math.floor(mins/1440)}일 전`;
    el.innerHTML=`<span class="fresh-dot"></span> 데이터 ${ago} · ${d.toLocaleString('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}`;
  }
  function ensureBottomBack(){
    const main=document.getElementById('detailMain');if(!main||!main.children.length)return;
    if(main.querySelector('.detail-back-section'))return;
    const sec=document.createElement('section');sec.className='section detail-back-section';sec.innerHTML='<button type="button" class="bottom-backbtn">← 이전 화면으로 돌아가기</button>';
    sec.querySelector('button').onclick=()=>goBackFromDetail();main.appendChild(sec);
  }
  function refreshEnhancements(){
    ensureHomeTools();compactify('cards');compactify('newList');compactify('marketList');sortHomeCards();ensureBottomBack();updateFreshness();
  }

  const observer=new MutationObserver(()=>refreshEnhancements());observer.observe(document.body,{childList:true,subtree:true});
  setInterval(updateFreshness,60000);

  // 자료 탭은 메뉴에서 제거하고 API·데이터 상태 페이지에 합친다.
  const dataBtn=document.querySelector('.bottomnav button[data-page="dataPage"]');if(dataBtn)dataBtn.remove();
  const dataPage=document.getElementById('dataPage'),statusPage=document.getElementById('statusPage');
  if(dataPage&&statusPage){
    const sourceSections=[...dataPage.querySelectorAll('section')];const group=document.createElement('div');group.id='statusSourceGroup';
    const h=document.createElement('section');h.className='section';h.innerHTML='<div class="section-head"><h2>공식 데이터 출처</h2><small>출처·연동 현황</small></div>';group.appendChild(h);
    sourceSections.forEach(s=>group.appendChild(s));statusPage.appendChild(group);dataPage.remove();
  }

  const oldShowPage=window.showPage;
  if(typeof oldShowPage==='function')window.showPage=function(id){if(id==='dataPage')id='statusPage';oldShowPage(id);if(id==='statusPage')setTimeout(()=>{try{renderSources()}catch(e){}},40);setTimeout(refreshEnhancements,20)};

  // 온비드 전용 서버리스 엔드포인트. 오류와 0건을 명확히 구분.
  window.loadOnbidProject=async function(id,force=false){
    const p=(dashboard?.projects||[]).find(x=>x.id===id);document.getElementById('onbidStamp').textContent=(p?p.name:'')+' 조회 중…';
    document.getElementById('onbidList').innerHTML='<div class="loading">온비드 공매를 조회하는 중…</div>';
    try{
      const qs=new URLSearchParams({id,...(force?{force:'1'}:{})});const r=await fetch('/api/onbid?'+qs.toString(),{cache:'no-store'});const text=await r.text();
      let d;try{d=JSON.parse(text)}catch{throw new Error('온비드 서버 응답 형식 오류: '+text.slice(0,90))}
      if(!r.ok||d.ok===false)throw new Error(d.error||('HTTP '+r.status));const items=d.items||[];
      document.getElementById('onbidStamp').textContent=`${d.project?.name||''} · ${items.length}건`;
      const warn=(d.apiErrors||[]).length?`<div class="notice" style="margin-bottom:10px"><b>온비드 일부 요청 자동 보정</b><br>${d.queryMode==='fallback-local-filter'?'지역검색 오류를 전체조회 후 구·동 필터 방식으로 우회했습니다.':'일부 재산유형 응답 오류가 있습니다.'}</div>`:'';
      document.getElementById('onbidList').innerHTML=warn+(items.length?items.map(x=>`<article class="card"><div class="area">${esc(x.address||'')}</div><div class="name" style="font-size:15px">${esc(x.name||'온비드 부동산 공매')}</div><div class="facts"><div class="fact"><span>감정가</span><b>${x.appraisalAmount?fmt(Math.round(x.appraisalAmount/10000))+'만원':'목록 API 미제공'}</b></div><div class="fact"><span>최저입찰가</span><b>${x.minimumBidAmount?fmt(Math.round(x.minimumBidAmount/10000))+'만원':'목록 API 미제공'}</b></div><div class="fact"><span>할인율</span><b>${x.discountRate!=null?x.discountRate+'%':'계산 불가'}</b></div><div class="fact"><span>입찰 마감</span><b>${esc(x.bidEnd||'미제공')}</b></div></div><div class="actions"><a target="_blank" href="https://www.onbid.co.kr/">온비드 공식</a><a target="_blank" href="https://map.naver.com/p/search/${encodeURIComponent(x.address||'')}">지도</a><button class="btn" onclick="openDetail('${id}')">사업지 비교</button></div></article>`).join(''):`<div class="card"><div class="empty"><b>현재 조회된 공매 0건</b><br>${esc(d.project?.district||'')} ${esc(d.project?.dong||'')} 기준 현재 입찰중·예정 물건이 없습니다.</div></div>`);
    }catch(e){document.getElementById('onbidStamp').textContent='조회 오류';document.getElementById('onbidList').innerHTML='<div class="notice error"><b>온비드 조회 오류</b><br>'+esc(e.message)+'</div>'}
  };

  setTimeout(refreshEnhancements,100);
})();
