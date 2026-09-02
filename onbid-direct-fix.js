// Fast OnBid project lookup with 24h browser cache.
(() => {
  'use strict';

  const TTL=24*60*60*1000;
  const MEM=new Map();
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money=n=>n!=null&&Number.isFinite(Number(n))?Number(n).toLocaleString('ko-KR')+'원':'미확인';
  function projectById(id){try{return (dashboard?.projects||[]).find(x=>x.id===id)||null}catch{return null}}
  function cacheKey(id){return 'srp_onbid_'+id}
  function readCache(id){
    if(MEM.has(id))return MEM.get(id);
    try{const v=JSON.parse(sessionStorage.getItem(cacheKey(id))||'null');if(v&&Date.now()-v.at<TTL&&v.data){MEM.set(id,v.data);return v.data}}catch{}
    return null;
  }
  function writeCache(id,data){MEM.set(id,data);try{sessionStorage.setItem(cacheKey(id),JSON.stringify({at:Date.now(),data}))}catch{}}

  function render(id,p,d){
    const stamp=document.getElementById('onbidStamp');
    const list=document.getElementById('onbidList');
    const items=d.items||[],errors=d.apiErrors||[];
    if(stamp)stamp.textContent=(d.project?.name||p?.name||'')+' · '+items.length+'건';
    if(!list)return;
    const warn=errors.length?`<div class="notice" style="margin-bottom:10px"><b>온비드 조회 상태</b><br>${errors.length}개 페이지 조회 실패${errors[0]?.message?'<br>'+esc(errors[0].message):''}</div>`:'';
    const cards=items.length?items.map(x=>`<article class="card" data-cltr="${esc(x.cltrMngNo||'')}" data-pbct="${esc(x.pbctCdtnNo||'')}" data-detail-state="">
      <div class="area">${esc(x.address||'')}</div>
      <div class="name" style="font-size:15px">${esc(x.name||'온비드 부동산 공매')}</div>
      <div class="facts">
        <div class="fact"><span>감정가</span><b class="onbid-value-appraisal">${money(x.appraisalAmount)}</b></div>
        <div class="fact"><span>최저입찰가</span><b class="onbid-value-minimum">${money(x.minimumBidAmount)}</b></div>
        <div class="fact"><span>할인율</span><b class="onbid-value-discount">${x.discountRate!=null?esc(x.discountRate+'%'):'미확인'}</b></div>
        <div class="fact"><span>입찰 마감</span><b class="onbid-value-end">${esc(x.bidEnd||'미확인')}</b></div>
      </div>
      <div class="onbid-detail-box"></div>
      <div class="actions"><a target="_blank" href="https://www.onbid.co.kr/">온비드 공식</a><a target="_blank" href="https://map.naver.com/p/search/${encodeURIComponent(x.address||'')}">지도</a></div>
    </article>`).join(''):`<div class="card"><div class="empty"><b>${esc(d.project?.district||p?.district||'')} ${esc(d.project?.dong||p?.dong||'')} 현재 조회된 공매 없음</b>${errors.length?'<br>일부 페이지 조회 실패가 있어 0건 확정값은 아닙니다.':''}</div></div>`;
    list.innerHTML=warn+cards;
  }

  window.loadOnbidProject=async function(id){
    const p=projectById(id),stamp=document.getElementById('onbidStamp'),list=document.getElementById('onbidList');
    const cached=readCache(id);
    if(cached){render(id,p,cached);return}
    if(stamp)stamp.textContent=(p?.name||'')+' 조회 중…';
    if(list)list.innerHTML='<div class="loading">온비드 전체 자료를 빠르게 조회 중입니다. 첫 조회 후에는 같은 세션에서 즉시 표시됩니다.</div>';
    try{
      const u=new URL('/api/onbid',location.origin);u.searchParams.set('id',id);
      const r=await fetch(u,{cache:'default'}),text=await r.text();
      let d;try{d=JSON.parse(text)}catch{throw new Error('온비드 서버 응답 형식 오류')}
      if(!r.ok||d.ok===false)throw new Error(d.error||('HTTP '+r.status));
      writeCache(id,d);render(id,p,d);
    }catch(err){
      if(stamp)stamp.textContent='조회 오류';
      if(list)list.innerHTML=`<div class="notice error"><b>온비드 조회 오류</b><br>${esc(err.message||err)}</div>`;
    }
  };
})();
