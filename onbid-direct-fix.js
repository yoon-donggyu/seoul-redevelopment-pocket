// Restore reliable OnBid lookup by querying the selected project directly.
(() => {
  'use strict';

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money=n=>n!=null&&Number.isFinite(Number(n))?Number(n).toLocaleString('ko-KR')+'원':'미확인';
  function projectById(id){try{return (dashboard?.projects||[]).find(x=>x.id===id)||null}catch{return null}}

  window.loadOnbidProject=async function(id){
    const p=projectById(id);
    const stamp=document.getElementById('onbidStamp');
    const list=document.getElementById('onbidList');
    if(stamp)stamp.textContent=(p?.name||'')+' 조회 중…';
    if(list)list.innerHTML='<div class="loading">선택한 지역의 온비드 공매를 조회 중입니다.</div>';

    try{
      const u=new URL('/api/pocket',location.origin);
      u.searchParams.set('action','onbid');
      u.searchParams.set('id',id);
      const r=await fetch(u,{cache:'no-store'});
      const text=await r.text();
      let d;try{d=JSON.parse(text)}catch{throw new Error('온비드 서버 응답 형식 오류')}
      if(!r.ok)throw new Error(d.error||('HTTP '+r.status));

      const items=d.items||[];
      const errors=d.apiErrors||[];
      if(stamp)stamp.textContent=(d.project?.name||p?.name||'')+' · '+items.length+'건';
      if(!list)return;

      const warn=errors.length?`<div class="notice" style="margin-bottom:10px"><b>온비드 조회 상태</b><br>${errors.length}개 재산유형 조회 실패${errors[0]?.message?'<br>'+esc(errors[0].message):''}</div>`:'';
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
      </article>`).join(''):`<div class="card"><div class="empty"><b>${esc(d.project?.district||p?.district||'')} ${esc(d.project?.dong||p?.dong||'')} 현재 조회된 공매 없음</b>${errors.length?'<br>일부 재산유형 조회 실패가 있어 0건 확정값은 아닙니다.':''}</div></div>`;
      list.innerHTML=warn+cards;
    }catch(err){
      if(stamp)stamp.textContent='조회 오류';
      if(list)list.innerHTML=`<div class="notice error"><b>온비드 조회 오류</b><br>${esc(err.message||err)}</div>`;
    }
  };
})();
