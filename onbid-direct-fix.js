// Static OnBid dataset: generated once daily by GitHub Actions, filtered locally.
(() => {
  'use strict';
  let DATA=null,DATA_PROMISE=null;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money=n=>n!=null&&Number.isFinite(Number(n))?Number(n).toLocaleString('ko-KR')+'원':'미확인';
  function projectById(id){try{return (dashboard?.projects||[]).find(x=>x.id===id)||null}catch{return null}}
  function match(x,p){const blob=[x.address,x.sido,x.district,x.dong,x.name].join(' ');return !!p&&blob.includes(p.district)&&blob.includes(p.dong)}
  async function loadData(){
    if(DATA)return DATA;if(DATA_PROMISE)return DATA_PROMISE;
    DATA_PROMISE=(async()=>{
      const r=await fetch('/data/onbid-auctions.json',{cache:'no-cache'}),text=await r.text();
      let d;try{d=JSON.parse(text)}catch{throw new Error('온비드 저장 데이터 형식 오류')}
      if(!r.ok||d.ok===false)throw new Error(d.error||('HTTP '+r.status));
      DATA=d;return d;
    })().finally(()=>DATA_PROMISE=null);
    return DATA_PROMISE;
  }
  function render(p,d){
    const stamp=document.getElementById('onbidStamp'),list=document.getElementById('onbidList');
    const items=(d.items||[]).filter(x=>match(x,p)).sort((a,b)=>String(a.bidEnd||'9999').localeCompare(String(b.bidEnd||'9999'))),errors=d.apiErrors||[];
    const generated=d.generatedAt?new Date(d.generatedAt):null;
    const dateText=generated&&!Number.isNaN(generated.getTime())?generated.toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'갱신 대기';
    if(stamp)stamp.textContent=(p?.name||'')+' · '+items.length+'건 · '+dateText;if(!list)return;
    if(d.ready===false){list.innerHTML='<div class="notice"><b>온비드 데이터 자동수집 준비 중</b><br>새벽 1시 자동 갱신용 저장 데이터를 생성하고 있습니다.</div>';return}
    const warn=errors.length||d.scanCoverage?.complete===false?`<div class="notice" style="margin-bottom:10px"><b>온비드 수집 상태</b><br>일부 페이지 수집 실패가 있어 결과가 완전하지 않을 수 있습니다.${errors[0]?.message?'<br>'+esc(errors[0].message):''}</div>`:'';
    const cards=items.length?items.map(x=>`<article class="card" data-cltr="${esc(x.cltrMngNo||'')}" data-pbct="${esc(x.pbctCdtnNo||'')}" data-detail-state=""><div class="area">${esc(x.address||'')}</div><div class="name" style="font-size:15px">${esc(x.name||'온비드 부동산 공매')}</div><div class="facts"><div class="fact"><span>감정가</span><b class="onbid-value-appraisal">${money(x.appraisalAmount)}</b></div><div class="fact"><span>최저입찰가</span><b class="onbid-value-minimum">${money(x.minimumBidAmount)}</b></div><div class="fact"><span>할인율</span><b class="onbid-value-discount">${x.discountRate!=null?esc(x.discountRate+'%'):'미확인'}</b></div><div class="fact"><span>입찰 마감</span><b class="onbid-value-end">${esc(x.bidEnd||'미확인')}</b></div></div><div class="onbid-detail-box"></div><div class="actions"><a target="_blank" href="https://www.onbid.co.kr/">온비드 공식</a><a target="_blank" href="https://map.naver.com/p/search/${encodeURIComponent(x.address||'')}">지도</a></div></article>`).join(''):`<div class="card"><div class="empty"><b>${esc(p?.district||'')} ${esc(p?.dong||'')} 현재 조회된 공매 없음</b>${warn?'<br>수집 상태가 완전하지 않아 0건 확정값은 아닙니다.':''}</div></div>`;
    list.innerHTML=warn+cards;
  }
  window.loadOnbidProject=async function(id){
    const p=projectById(id),stamp=document.getElementById('onbidStamp'),list=document.getElementById('onbidList');
    if(stamp)stamp.textContent=(p?.name||'')+' 확인 중…';if(list)list.innerHTML='<div class="loading">저장된 온비드 데이터를 확인 중입니다.</div>';
    try{const d=await loadData();render(p,d)}catch(err){if(stamp)stamp.textContent='조회 오류';if(list)list.innerHTML=`<div class="notice error"><b>온비드 데이터 조회 오류</b><br>${esc(err.message||err)}</div>`}
  };
})();
