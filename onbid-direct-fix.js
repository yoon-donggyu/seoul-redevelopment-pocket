// Shared OnBid dataset: one cached fetch per day, filter locally by project.
(() => {
  'use strict';
  let ALL=null,ALL_PROMISE=null;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
  const money=n=>n!=null&&Number.isFinite(Number(n))?Number(n).toLocaleString('ko-KR')+'원':'미확인';
  function projectById(id){try{return (dashboard?.projects||[]).find(x=>x.id===id)||null}catch{return null}}
  function match(x,p){const blob=[x.address,x.sido,x.district,x.dong,x.name].join(' ');return !!p&&blob.includes(p.district)&&blob.includes(p.dong)}
  async function loadAll(){
    if(ALL)return ALL;if(ALL_PROMISE)return ALL_PROMISE;
    ALL_PROMISE=(async()=>{const r=await fetch('/api/onbid?all=1',{cache:'default'}),text=await r.text();let d;try{d=JSON.parse(text)}catch{throw new Error('온비드 서버 응답 형식 오류')}if(!r.ok||d.ok===false)throw new Error(d.error||('HTTP '+r.status));ALL=d;return d})().finally(()=>ALL_PROMISE=null);
    return ALL_PROMISE;
  }
  function render(p,d){
    const stamp=document.getElementById('onbidStamp'),list=document.getElementById('onbidList');
    const items=(d.items||[]).filter(x=>match(x,p)).sort((a,b)=>String(a.bidEnd||'9999').localeCompare(String(b.bidEnd||'9999'))),errors=d.apiErrors||[];
    if(stamp)stamp.textContent=(p?.name||'')+' · '+items.length+'건';if(!list)return;
    const warn=errors.length?`<div class="notice" style="margin-bottom:10px"><b>온비드 조회 상태</b><br>일부 자료 조회 실패 ${errors.length}건${errors[0]?.message?'<br>'+esc(errors[0].message):''}</div>`:'';
    const cards=items.length?items.map(x=>`<article class="card" data-cltr="${esc(x.cltrMngNo||'')}" data-pbct="${esc(x.pbctCdtnNo||'')}" data-detail-state=""><div class="area">${esc(x.address||'')}</div><div class="name" style="font-size:15px">${esc(x.name||'온비드 부동산 공매')}</div><div class="facts"><div class="fact"><span>감정가</span><b>${money(x.appraisalAmount)}</b></div><div class="fact"><span>최저입찰가</span><b>${money(x.minimumBidAmount)}</b></div><div class="fact"><span>할인율</span><b>${x.discountRate!=null?esc(x.discountRate+'%'):'미확인'}</b></div><div class="fact"><span>입찰 마감</span><b>${esc(x.bidEnd||'미확인')}</b></div></div><div class="actions"><a target="_blank" href="https://www.onbid.co.kr/">온비드 공식</a><a target="_blank" href="https://map.naver.com/p/search/${encodeURIComponent(x.address||'')}">지도</a></div></article>`).join(''):`<div class="card"><div class="empty"><b>${esc(p?.district||'')} ${esc(p?.dong||'')} 현재 조회된 공매 없음</b>${errors.length?'<br>일부 자료 조회 실패가 있어 0건 확정값은 아닙니다.':''}</div></div>`;
    list.innerHTML=warn+cards;
  }
  window.loadOnbidProject=async function(id){
    const p=projectById(id),stamp=document.getElementById('onbidStamp'),list=document.getElementById('onbidList');
    if(stamp)stamp.textContent=(p?.name||'')+' 조회 중…';if(list)list.innerHTML='<div class="loading">온비드 공매 자료를 불러오는 중입니다. 하루 1회 갱신 데이터를 사용합니다.</div>';
    try{const d=await loadAll();render(p,d)}catch(err){if(stamp)stamp.textContent='조회 오류';if(list)list.innerHTML=`<div class="notice error"><b>온비드 조회 오류</b><br>${esc(err.message||err)}</div>`}
  };
})();
