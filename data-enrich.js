// Official data enrichment: OnBid detail + Seoul official sources. No observers/polling.
(() => {
  'use strict';
  const e=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money=n=>n!=null&&Number.isFinite(Number(n))?Number(n).toLocaleString('ko-KR')+'원':'미확인';
  const onbidLocalCache=new Map();

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
    const rows=[['면적',vals.areaSqm?Number(vals.areaSqm).toLocaleString('ko-KR')+'㎡':'추가 확인값 없음'],['계획 세대수',vals.units?Number(vals.units).toLocaleString('ko-KR')+'세대':'추가 확인값 없음'],['권리산정기준일',vals.rightsDate||'추가 확인값 없음'],['정비구역 지정일',vals.designationDate||'추가 확인값 없음']];
    const sec=document.createElement('section');sec.className='section official-enrich-section';
    sec.innerHTML=`<div class="section-head"><h2>서울시 공식자료 보강</h2><small>${changed?'미확인 값 반영':'확인 완료'}</small></div><div class="card"><div class="facts">${rows.map(([a,b])=>`<div class="fact"><span>${e(a)}</span><b>${e(b)}</b></div>`).join('')}</div><div class="notice" style="margin-top:10px;box-shadow:none"><b>출처</b> ${e(src)}<br>공식 페이지에서 항목명이 명확히 확인되는 값만 사용하며 추정값은 넣지 않습니다.</div></div>`;
    main.appendChild(sec);
  }

  const oldOpen=window.openDetail;
  if(typeof oldOpen==='function')window.openDetail=async function(id){await oldOpen(id);try{const d=await fetchJson('/api/seoul-official?id='+encodeURIComponent(id));const vals=d.official||{};let p;try{p=(dashboard?.projects||[]).find(x=>x.id===id)}catch{}let changed=false;if(p){for(const k of ['areaSqm','units','rightsDate','designationDate'])if((p[k]==null||p[k]==='')&&vals[k]!=null&&vals[k]!==''){p[k]=vals[k];changed=true}if(changed){try{renderDetail(p);applyFilter();renderNew()}catch{}}}appendOfficialBox(id,d,changed)}catch{const main=document.getElementById('detailMain');if(main){const sec=document.createElement('section');sec.className='section official-enrich-section';sec.innerHTML='<div class="notice"><b>서울시 공식자료</b><br>현재 자동 보강 조회에 실패했습니다. 기존 확인값은 그대로 유지합니다.</div>';main.appendChild(sec)}}};

  function setCardValue(card,selector,value){const el=card?.querySelector(selector);if(el)el.textContent=value}
  function setDetailExtra(card,x){const box=card?.querySelector('.onbid-detail-box');if(!box)return;box.innerHTML=`<div class="onbid-detail-extra"><span>토지면적<b>${x.landSqm?e(x.landSqm+'㎡'):'미제공'}</b></span><span>건물면적<b>${x.buildingSqm?e(x.buildingSqm+'㎡'):'미제공'}</b></span></div>`;}

  window.ensureOnbidDetail=async function(card){if(!card||card.dataset.detailState==='loading'||card.dataset.detailState==='loaded')return;const cltr=card.dataset.cltr||'',pbct=card.dataset.pbct||'';if(!cltr){card.dataset.detailState='error';return}card.dataset.detailState='loading';['.onbid-value-appraisal','.onbid-value-minimum','.onbid-value-discount','.onbid-value-end'].forEach(s=>setCardValue(card,s,'조회 중…'));try{const d=await fetchJson('/api/onbid-detail?cltrMngNo='+encodeURIComponent(cltr)+(pbct?'&pbctCdtnNo='+encodeURIComponent(pbct):''));const x=d.item||{};setCardValue(card,'.onbid-value-appraisal',x.appraisalAmount!=null?money(x.appraisalAmount):'미확인');setCardValue(card,'.onbid-value-minimum',x.minimumBidAmount!=null?money(x.minimumBidAmount):'미확인');setCardValue(card,'.onbid-value-discount',x.discountRate!=null?e(x.discountRate+'%'):'계산 불가');setCardValue(card,'.onbid-value-end',e(x.bidEnd||'미확인'));setDetailExtra(card,x);card.dataset.detailState='loaded'}catch(err){['.onbid-value-appraisal','.onbid-value-minimum','.onbid-value-discount','.onbid-value-end'].forEach(s=>setCardValue(card,s,'조회 실패'));const box=card.querySelector('.onbid-detail-box');if(box)box.innerHTML='<div class="notice error"><b>상세 API 조회 실패</b><br>'+e(err.message)+'</div>';card.dataset.detailState='error'}};

  window.loadOnbidDetail=async function(cltrEnc,pbctEnc,target){const card=target?.closest?.('.card')||target;if(!card)return;if(!card.dataset.cltr)card.dataset.cltr=decodeURIComponent(cltrEnc||'');if(!card.dataset.pbct)card.dataset.pbct=decodeURIComponent(pbctEnc||'');card.dataset.detailState='';return window.ensureOnbidDetail(card)};

  function onbidNotice(d){const notes=[];const errors=d.apiErrors||[];const coverage=d.scanCoverage;if(errors.length)notes.push(`재산유형 ${errors.length}개 조회 실패 · 성공한 유형만 표시`);if(coverage&&coverage.complete===false)notes.push('전국 목록 전체를 끝까지 확인하지 못한 유형이 있어 0건은 확정값이 아닙니다.');if(!notes.length)return '';return `<div class="notice" style="margin-bottom:10px"><b>온비드 조회 상태</b><br>${notes.map(e).join('<br>')}</div>`;}

  window.loadOnbidProject=async function(id){let p;try{p=(dashboard?.projects||[]).find(x=>x.id===id)}catch{}const stamp=document.getElementById('onbidStamp'),list=document.getElementById('onbidList');if(stamp)stamp.textContent=(p?.name||'')+' 조회 중…';if(list)list.innerHTML='<div class="loading">온비드 공매 조회 중…</div>';try{let d=onbidLocalCache.get(id);if(!d){d=await fetchJson('/api/onbid?id='+encodeURIComponent(id));onbidLocalCache.set(id,d)}const items=d.items||[],coverage=d.scanCoverage;if(stamp)stamp.textContent=(d.project?.name||'')+' · '+items.length+'건';if(!list)return;const warn=onbidNotice(d);const cards=items.length?items.map(x=>{const cltr=e(x.cltrMngNo||''),pbct=e(x.pbctCdtnNo||'');return `<article class="card" data-cltr="${cltr}" data-pbct="${pbct}" data-detail-state=""><div class="area">${e(x.address||'')}</div><div class="name" style="font-size:15px">${e(x.name||'온비드 부동산 공매')}</div><div class="facts"><div class="fact"><span>감정가</span><b class="onbid-value-appraisal">${x.appraisalAmount!=null?money(x.appraisalAmount):'미확인'}</b></div><div class="fact"><span>최저입찰가</span><b class="onbid-value-minimum">${x.minimumBidAmount!=null?money(x.minimumBidAmount):'미확인'}</b></div><div class="fact"><span>할인율</span><b class="onbid-value-discount">${x.discountRate!=null?e(x.discountRate+'%'):'미확인'}</b></div><div class="fact"><span>입찰 마감</span><b class="onbid-value-end">${e(x.bidEnd||'미확인')}</b></div></div><div class="onbid-detail-box">${(x.landSqm||x.buildingSqm)?`<div class="onbid-detail-extra"><span>토지면적<b>${x.landSqm?e(x.landSqm+'㎡'):'미제공'}</b></span><span>건물면적<b>${x.buildingSqm?e(x.buildingSqm+'㎡'):'미제공'}</b></span></div>`:''}</div><div class="actions"><a target="_blank" href="https://www.onbid.co.kr/">온비드 공식</a><a target="_blank" href="https://map.naver.com/p/search/${encodeURIComponent(x.address||'')}">지도</a></div></article>`}).join(''):`<div class="card"><div class="empty"><b>${coverage&&coverage.complete===false?'현재 조회 범위에서 일치 공매 없음':'현재 조회된 공매 0건'}</b><br>${e(d.project?.district||'')} ${e(d.project?.dong||'')} 기준입니다.${coverage&&coverage.complete===false?'<br>전체 페이지 조회가 완료되지 않아 온비드 공식 사이트에서 추가 확인이 필요합니다.':''}</div></div>`;list.innerHTML=warn+cards}catch(err){if(stamp)stamp.textContent='조회 오류';if(list)list.innerHTML='<div class="notice error"><b>온비드 조회 오류</b><br>'+e(err.message)+'</div>'}};

  const style=document.createElement('style');style.textContent=`.onbid-detail-extra{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.onbid-detail-extra span{display:block;background:#f7f7f7;border:1px solid #e7e7e7;border-radius:10px;padding:9px;font-size:9px;color:#777}.onbid-detail-extra b{display:block;margin-top:2px;font-size:11px;color:#222}`;document.head.appendChild(style);
})();