// OnBid project query: only the selected district/dong is sent to the browser.
// The archived daily dataset remains in the repository, but mobile devices no
// longer download the current ~47 MB file.
(() => {
  'use strict';
  const CACHE=new Map();
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money=n=>n!=null&&Number.isFinite(Number(n))?Number(n).toLocaleString('ko-KR')+'원':'미확인';
  function projectById(id){try{return (dashboard?.projects||[]).find(x=>x.id===id)||null}catch{return null}}
  async function query(id){
    if(CACHE.has(id))return CACHE.get(id);
    const url=new URL('/api/pocket',location.origin);url.searchParams.set('action','onbid');url.searchParams.set('id',id);
    const promise=fetch(url,{cache:'default'}).then(async r=>{const text=await r.text();let d;try{d=JSON.parse(text)}catch{throw new Error('온비드 응답 형식 오류')}if(!r.ok||d.ok===false)throw new Error(d.error||`HTTP ${r.status}`);return d}).catch(e=>{CACHE.delete(id);throw e});
    CACHE.set(id,promise);return promise;
  }
  function render(p,d){
    const stamp=document.getElementById('onbidStamp'),list=document.getElementById('onbidList'),items=d.items||[],errors=d.apiErrors||[];
    if(stamp)stamp.textContent=`${p?.name||''} · ${items.length}건 · 방금 조회`;if(!list)return;
    const warn=errors.length?`<div class="notice" style="margin-bottom:10px"><b>일부 자료원 조회 지연</b><br>현재 결과가 완전하지 않을 수 있습니다.</div>`:'';
    const cards=items.length?items.map(x=>`<article class="card" data-cltr="${esc(x.cltrMngNo||'')}" data-pbct="${esc(x.pbctCdtnNo||'')}" data-detail-state=""><div class="area">${esc(x.address||'')}</div><div class="name" style="font-size:15px">${esc(x.name||'온비드 부동산 공매')}</div><div class="facts"><div class="fact"><span>감정가</span><b>${money(x.appraisalAmount)}</b></div><div class="fact"><span>최저입찰가</span><b>${money(x.minimumBidAmount)}</b></div><div class="fact"><span>할인율</span><b>${x.discountRate!=null?esc(x.discountRate+'%'):'미확인'}</b></div><div class="fact"><span>입찰 마감</span><b>${esc(x.bidEnd||'미확인')}</b></div></div><div class="onbid-detail-box"></div><div class="actions"><a target="_blank" rel="noopener" href="https://www.onbid.co.kr/">온비드 공식</a><a target="_blank" rel="noopener" href="https://map.naver.com/p/search/${encodeURIComponent(x.address||'')}">지도</a></div></article>`).join(''):`<div class="card"><div class="empty"><b>${esc(p?.district||'')} ${esc(p?.dong||'')} 현재 조회된 공매 없음</b><br>공공 API의 현재 조회 범위 기준입니다.</div></div>`;
    list.innerHTML=warn+cards;
  }
  window.loadOnbidProject=async function(id){
    const p=projectById(id),stamp=document.getElementById('onbidStamp'),list=document.getElementById('onbidList');
    if(stamp)stamp.textContent=(p?.name||'')+' 확인 중…';if(list)list.innerHTML='<div class="loading">선택 지역의 온비드 자료만 불러오는 중…</div>';
    try{render(p,await query(id))}catch(err){if(stamp)stamp.textContent='조회 오류';if(list)list.innerHTML=`<div class="notice error"><b>온비드 데이터 조회 오류</b><br>${esc(err.message||err)}</div>`}
  };
})();
