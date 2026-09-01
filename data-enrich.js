// Official data enrichment: OnBid detail + Seoul official sources. No observers/polling.
(() => {
  'use strict';
  const e=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money=n=>n?Number(n).toLocaleString('ko-KR')+'원':'미확인';

  async function fetchJson(url){
    const r=await fetch(url,{cache:'no-store'}),text=await r.text();
    let d;try{d=JSON.parse(text)}catch{throw new Error('서버 응답 형식 오류')}
    if(!r.ok||d.ok===false)throw new Error(d.error||('HTTP '+r.status));
    return d;
  }

  function appendOfficialBox(id,d,changed){
    const main=document.getElementById('detailMain');if(!main)return;
    main.querySelector('.official-enrich-section')?.remove();
    const src=(d.sources||[]).filter(x=>x.ok).map(x=>x.type).join(' · ')||'서울시 공식자료';
    const vals=d.official||{};
    const rows=[
      ['면적',vals.areaSqm?Number(vals.areaSqm).toLocaleString('ko-KR')+'㎡':'추가 확인값 없음'],
      ['계획 세대수',vals.units?Number(vals.units).toLocaleString('ko-KR')+'세대':'추가 확인값 없음'],
      ['권리산정기준일',vals.rightsDate||'추가 확인값 없음'],
      ['정비구역 지정일',vals.designationDate||'추가 확인값 없음']
    ];
    const sec=document.createElement('section');sec.className='section official-enrich-section';
    sec.innerHTML=`<div class="section-head"><h2>서울시 공식자료 보강</h2><small>${changed?'미확인 값 반영':'확인 완료'}</small></div><div class="card"><div class="facts">${rows.map(([a,b])=>`<div class="fact"><span>${e(a)}</span><b>${e(b)}</b></div>`).join('')}</div><div class="notice" style="margin-top:10px;box-shadow:none"><b>출처</b> ${e(src)}<br>공식 페이지에서 항목명이 명확히 확인되는 값만 사용하며 추정값은 넣지 않습니다.</div></div>`;
    main.appendChild(sec);
  }

  const oldOpen=window.openDetail;
  if(typeof oldOpen==='function'){
    window.openDetail=async function(id){
      await oldOpen(id);
      try{
        const d=await fetchJson('/api/seoul-official?id='+encodeURIComponent(id));
        const vals=d.official||{};
        let p;
        try{p=(dashboard?.projects||[]).find(x=>x.id===id)}catch{}
        let changed=false;
        if(p){
          for(const k of ['areaSqm','units','rightsDate','designationDate']){
            if((p[k]==null||p[k]==='')&&vals[k]!=null&&vals[k]!==''){p[k]=vals[k];changed=true}
          }
          if(changed){try{renderDetail(p);applyFilter();renderNew()}catch{}}
        }
        appendOfficialBox(id,d,changed);
      }catch(err){
        const main=document.getElementById('detailMain');if(main){const sec=document.createElement('section');sec.className='section official-enrich-section';sec.innerHTML='<div class="notice"><b>서울시 공식자료</b><br>현재 자동 보강 조회에 실패했습니다. 기존 확인값은 그대로 유지합니다.</div>';main.appendChild(sec)}
      }
    };
  }

  window.loadOnbidDetail=async function(cltrEnc,pbctEnc,btn){
    const cltr=decodeURIComponent(cltrEnc||''),pbct=decodeURIComponent(pbctEnc||'');
    const card=btn?.closest('.card'),box=card?.querySelector('.onbid-detail-box');if(!box)return;
    btn.disabled=true;btn.textContent='상세 조회 중…';box.innerHTML='<div class="loading">온비드 상세 API 조회 중…</div>';
    try{
      const d=await fetchJson('/api/onbid-detail?cltrMngNo='+encodeURIComponent(cltr)+(pbct?'&pbctCdtnNo='+encodeURIComponent(pbct):''));
      const x=d.item||{};
      box.innerHTML=`<div class="facts"><div class="fact"><span>상세 감정가</span><b>${money(x.appraisalAmount)}</b></div><div class="fact"><span>상세 최저입찰가</span><b>${money(x.minimumBidAmount)}</b></div><div class="fact"><span>할인율</span><b>${x.discountRate!=null?e(x.discountRate+'%'):'계산 불가'}</b></div><div class="fact"><span>입찰 마감</span><b>${e(x.bidEnd||'상세 API 미제공')}</b></div><div class="fact"><span>토지면적</span><b>${x.landSqm?e(x.landSqm+'㎡'):'미제공'}</b></div><div class="fact"><span>건물면적</span><b>${x.buildingSqm?e(x.buildingSqm+'㎡'):'미제공'}</b></div></div>`;
      btn.textContent='상세 다시 조회';
    }catch(err){box.innerHTML='<div class="notice error"><b>상세 API 조회 실패</b><br>'+e(err.message)+'</div>';btn.textContent='상세 다시 조회'}
    finally{btn.disabled=false}
  };

  // Replace the old OnBid list call with the dedicated stable endpoint, then expose detail lookup per item.
  window.loadOnbidProject=async function(id){
    let p;try{p=(dashboard?.projects||[]).find(x=>x.id===id)}catch{}
    const stamp=document.getElementById('onbidStamp'),list=document.getElementById('onbidList');
    if(stamp)stamp.textContent=(p?.name||'')+' 조회 중…';if(list)list.innerHTML='<div class="loading">온비드 공매 조회 중…</div>';
    try{
      const d=await fetchJson('/api/onbid?id='+encodeURIComponent(id));const items=d.items||[];
      if(stamp)stamp.textContent=(d.project?.name||'')+' · '+items.length+'건';
      if(!list)return;
      const warn=(d.apiErrors||[]).length?'<div class="notice" style="margin-bottom:10px"><b>일부 온비드 요청 보정</b><br>목록 조회 중 일부 재산유형 응답 오류가 있었습니다.</div>':'';
      list.innerHTML=warn+(items.length?items.map(x=>{
        const c=encodeURIComponent(x.cltrMngNo||''),b=encodeURIComponent(x.pbctCdtnNo||'');
        return `<article class="card"><div class="area">${e(x.address||'')}</div><div class="name" style="font-size:15px">${e(x.name||'온비드 부동산 공매')}</div><div class="facts"><div class="fact"><span>감정가</span><b>${x.appraisalAmount?money(x.appraisalAmount):'목록 API 미제공'}</b></div><div class="fact"><span>최저입찰가</span><b>${x.minimumBidAmount?money(x.minimumBidAmount):'상세조회 필요'}</b></div><div class="fact"><span>할인율</span><b>${x.discountRate!=null?e(x.discountRate+'%'):'상세조회 필요'}</b></div><div class="fact"><span>입찰 마감</span><b>${e(x.bidEnd||'상세조회 필요')}</b></div></div><div class="actions"><a target="_blank" href="https://www.onbid.co.kr/">온비드 공식</a><a target="_blank" href="https://map.naver.com/p/search/${encodeURIComponent(x.address||'')}">지도</a><button class="btn" onclick="loadOnbidDetail('${c}','${b}',this)" ${x.cltrMngNo?'':'disabled'}>상세 API</button></div><div class="onbid-detail-box"></div></article>`
      }).join(''):`<div class="card"><div class="empty"><b>현재 조회된 공매 0건</b><br>${e(d.project?.district||'')} ${e(d.project?.dong||'')} 기준입니다.</div></div>`);
    }catch(err){if(stamp)stamp.textContent='조회 오류';if(list)list.innerHTML='<div class="notice error"><b>온비드 조회 오류</b><br>'+e(err.message)+'</div>'}
  };
})();
