// v7.2 compact UI + OnBid endpoint patch
(() => {
  function compactify(rootId){
    const root=document.getElementById(rootId); if(!root)return;
    root.querySelectorAll('article.card').forEach(card=>{
      if(card.dataset.compactReady)return;
      card.dataset.compactReady='1';
      card.classList.add('compact-card','is-collapsed');
      const title=card.querySelector('.name');
      const btn=document.createElement('button');
      btn.type='button'; btn.className='compact-toggle'; btn.textContent='펼치기';
      btn.onclick=e=>{e.stopPropagation();const closed=card.classList.toggle('is-collapsed');btn.textContent=closed?'펼치기':'접기'};
      (title||card.firstElementChild||card).after(btn);
    });
  }

  const observer=new MutationObserver(()=>{
    compactify('cards'); compactify('newList'); compactify('marketList');
    ensureBottomBack();
  });
  observer.observe(document.body,{childList:true,subtree:true});

  function ensureBottomBack(){
    const main=document.getElementById('detailMain'); if(!main||!main.children.length)return;
    if(main.querySelector('.detail-back-section'))return;
    const sec=document.createElement('section');
    sec.className='section detail-back-section';
    sec.innerHTML='<button type="button" class="bottom-backbtn">← 이전 화면으로 돌아가기</button>';
    sec.querySelector('button').onclick=()=>goBackFromDetail();
    main.appendChild(sec);
  }

  // 자료 탭은 별도 메뉴에서 제거하고 API·데이터 상태 페이지에 합친다.
  const dataBtn=document.querySelector('.bottomnav button[data-page="dataPage"]');
  if(dataBtn)dataBtn.remove();
  const dataPage=document.getElementById('dataPage');
  const statusPage=document.getElementById('statusPage');
  if(dataPage&&statusPage){
    const sourceSections=[...dataPage.querySelectorAll('section')];
    const group=document.createElement('div'); group.id='statusSourceGroup';
    const h=document.createElement('section'); h.className='section';
    h.innerHTML='<div class="section-head"><h2>공식 데이터 출처</h2><small>출처·연동 현황</small></div>';
    group.appendChild(h);
    sourceSections.forEach(s=>group.appendChild(s));
    statusPage.appendChild(group); dataPage.remove();
  }

  const oldShowPage=window.showPage;
  if(typeof oldShowPage==='function'){
    window.showPage=function(id){
      if(id==='dataPage')id='statusPage';
      oldShowPage(id);
      if(id==='statusPage')setTimeout(()=>{try{renderSources()}catch(e){}},40);
      setTimeout(()=>{compactify('cards');compactify('newList');compactify('marketList')},20);
    };
  }

  // 온비드: 새 전용 엔드포인트 사용. HTTP 400이면 서버에서 자동 폴백 처리.
  window.loadOnbidProject=async function(id,force=false){
    const p=(dashboard?.projects||[]).find(x=>x.id===id);
    document.getElementById('onbidStamp').textContent=(p?p.name:'')+' 조회 중…';
    document.getElementById('onbidList').innerHTML='<div class="loading">온비드 공매를 조회하는 중…</div>';
    try{
      const qs=new URLSearchParams({id,...(force?{force:'1'}:{})});
      const r=await fetch('/api/onbid?'+qs.toString(),{cache:'no-store'});
      const d=await r.json();
      if(!r.ok||d.ok===false)throw new Error(d.error||('HTTP '+r.status));
      const items=d.items||[];
      document.getElementById('onbidStamp').textContent=`${d.project?.name||''} · ${items.length}건`;
      const warn=(d.apiErrors||[]).length?`<div class="notice" style="margin-bottom:10px"><b>온비드 일부 요청 자동 보정</b><br>${d.queryMode==='fallback-local-filter'?'지역검색 400 오류를 전국조회 후 구·동 필터 방식으로 우회했습니다.':'일부 재산유형 응답 오류가 있습니다.'}</div>`:'';
      document.getElementById('onbidList').innerHTML=warn+(items.length?items.map(x=>`<article class="card"><div class="area">${esc(x.address||'')}</div><div class="name" style="font-size:15px">${esc(x.name||'온비드 부동산 공매')}</div><div class="facts"><div class="fact"><span>감정가</span><b>${x.appraisalAmount?fmt(Math.round(x.appraisalAmount/10000))+'만원':'목록 API 미제공'}</b></div><div class="fact"><span>최저입찰가</span><b>${x.minimumBidAmount?fmt(Math.round(x.minimumBidAmount/10000))+'만원':'목록 API 미제공'}</b></div><div class="fact"><span>할인율</span><b>${x.discountRate!=null?x.discountRate+'%':'계산 불가'}</b></div><div class="fact"><span>입찰 마감</span><b>${esc(x.bidEnd||'미제공')}</b></div></div><div class="actions"><a target="_blank" href="https://www.onbid.co.kr/">온비드 공식</a><a target="_blank" href="https://map.naver.com/p/search/${encodeURIComponent(x.address||'')}">지도</a><button class="btn" onclick="openDetail('${id}')">사업지 비교</button></div></article>`).join(''):`<div class="card"><div class="empty">${esc(d.project?.district||'')} ${esc(d.project?.dong||'')}에서 현재 조회된 공매가 없습니다.</div></div>`);
    }catch(e){
      document.getElementById('onbidStamp').textContent='조회 오류';
      document.getElementById('onbidList').innerHTML='<div class="notice error"><b>온비드 조회 오류</b><br>'+esc(e.message)+'</div>';
    }
  };

  setTimeout(()=>{compactify('cards');compactify('newList');compactify('marketList');ensureBottomBack()},100);
})();
