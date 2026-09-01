// Overall UI optimization: beginner-friendly homebuying dashboard + combined OnBid/Court auction hub.
(() => {
  'use strict';

  function ensureSummaryShell(){
    if(document.getElementById('quickSummary')) return;
    const home=document.getElementById('home');
    const notice=home?.querySelector('.section .notice')?.closest('.section');
    if(!home||!notice) return;
    const sec=document.createElement('section');
    sec.className='section';
    sec.id='quickSummary';
    sec.innerHTML=`
      <div class="section-head"><h2>내집마련 신호판</h2><small>처음엔 이것만 보세요</small></div>
      <div class="home-signal-grid">
        <article class="signal-card signal-market">
          <div class="signal-top"><span>서울 집값 흐름</span><b class="signal-badge wait">연동대기</b></div>
          <strong id="marketSignalText">R-ONE 준비 중</strong>
          <small>연동 후 월간 상승·보합·하락과 차트 표시</small>
          <div class="signal-track"><i style="width:0%"></i></div>
        </article>
        <article class="signal-card">
          <div class="signal-top"><span>공매 · 경매</span><b class="signal-badge ok">1/2 연결</b></div>
          <strong>온비드 ✓ · 법원경매 대기</strong>
          <small>싸게 살 기회를 찾는 메뉴</small>
          <div class="mini-bars"><i style="width:50%"></i></div>
        </article>
        <article class="signal-card">
          <div class="signal-top"><span>재개발 정보 완성도</span><b id="dataCompleteBadge" class="signal-badge">-</b></div>
          <strong id="dataCompleteText">계산 중…</strong>
          <small>면적·세대수·권리일·구역지정일 기준</small>
          <div class="mini-bars"><i id="dataCompleteBar" style="width:0%"></i></div>
        </article>
        <article class="signal-card">
          <div class="signal-top"><span>관심 사업지</span><b class="signal-badge">내 목록</b></div>
          <strong id="favSignalText">0곳</strong>
          <small>☆ 표시한 사업지만 빠르게 확인</small>
          <div class="signal-link" id="favSignalBtn">관심만 보기 →</div>
        </article>
      </div>
      <details class="signal-help"><summary>이 숫자를 어떻게 보면 되나요?</summary><div>집값 흐름은 <b>한국부동산원 공식지수</b>가 연결된 뒤 실제 수치만 표시합니다. 공매·경매는 싸다고 바로 좋은 물건이 아니므로 주소·권리관계·최저입찰가를 함께 봐야 합니다. 재개발 완성도는 투자점수가 아니라 <b>공식 확인값이 얼마나 채워졌는지</b> 보여주는 숫자입니다.</div></details>`;
    notice.after(sec);
    const favBtn=sec.querySelector('#favSignalBtn');
    if(favBtn)favBtn.onclick=()=>{const b=document.getElementById('favOnlyBtn');if(b)b.click();document.getElementById('cards')?.scrollIntoView({behavior:'smooth',block:'start'})};
  }

  function renderSummary(d){
    ensureSummaryShell();
    const ps=d?.projects||[];
    const fields=['areaSqm','units','rightsDate','designationDate'];
    const possible=Math.max(1,ps.length*fields.length);
    let filled=0;
    ps.forEach(p=>fields.forEach(k=>{if(p?.[k]!=null&&p[k]!=='')filled++}));
    const pct=Math.round(filled/possible*100);
    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=String(v)};
    set('dataCompleteBadge',pct+'%');
    set('dataCompleteText',filled.toLocaleString('ko-KR')+' / '+possible.toLocaleString('ko-KR')+' 항목 확인');
    const bar=document.getElementById('dataCompleteBar');if(bar)bar.style.width=pct+'%';
    let favCount=0;try{favCount=JSON.parse(localStorage.getItem('srp_favorites_v2')||'[]').length||0}catch{}
    set('favSignalText',favCount+'곳');
  }

  const oldRender=window.renderDashboard;
  if(typeof oldRender==='function'){
    window.renderDashboard=function(d){
      const r=oldRender.apply(this,arguments);
      try{renderSummary(d)}catch(e){console.warn('optimize summary',e)}
      return r;
    };
  }
  ensureSummaryShell();
  try{if(typeof dashboard!=='undefined'&&dashboard?.projects)renderSummary(dashboard)}catch{}

  function ensurePropertyHub(){
    const page=document.getElementById('onbidPage');
    if(!page||document.getElementById('propertySourceSwitch')) return;

    const navBtn=document.querySelector('.bottomnav button[data-page="onbidPage"]');
    if(navBtn) navBtn.textContent='공매·경매';

    const header=page.querySelector('header');
    const title=header?.querySelector('h1');
    const sub=header?.querySelector('.sub');
    if(title) title.textContent='공매 · 경매';
    if(sub) sub.textContent='온비드 공매와 법원 경매를 한곳에서 구분해서 봅니다.';

    const sw=document.createElement('section');
    sw.className='section';
    sw.id='propertySourceSwitch';
    sw.innerHTML='<div class="source-switch"><button class="on" data-source="onbid">온비드 공매</button><button data-source="court">법원 경매</button></div>';
    header.after(sw);

    const onbidSections=[...page.children].filter(el=>el.tagName==='SECTION'&&el.id!=='propertySourceSwitch');
    onbidSections.forEach(el=>el.classList.add('onbid-source-section'));

    const court=document.createElement('section');
    court.className='section court-auction-section';
    court.style.display='none';
    court.innerHTML=`
      <div class="section-head"><h2>서울 아파트 법원 경매</h2><small>공식 API 연동 대기</small></div>
      <div class="card court-card">
        <div class="court-status"><b>현재 자동 경매목록은 아직 없습니다.</b><span>법원 공식 사법정보공유포털의 일반 오픈 API는 추후 제공 예정이고, 현재 연계 API는 별도 문의가 필요한 상태입니다.</span></div>
        <div class="court-chips"><span>서울</span><span>아파트</span><span>법원경매</span><span>공식자료 우선</span></div>
        <div class="auction-steps"><div><b>1</b><span>사건번호</span></div><div><b>2</b><span>감정가</span></div><div><b>3</b><span>최저가</span></div><div><b>4</b><span>매각기일</span></div></div>
        <div class="notice" style="box-shadow:none;margin-top:10px"><b>자동연동되면 이렇게 보여줄 예정</b><br>감정가 대비 최저가 할인율, 유찰횟수, 매각기일 D-day, 해당 아파트 최근 실거래와의 가격 차이까지 한 카드에서 비교합니다.</div>
        <a class="court-link" href="https://www.courtauction.go.kr/" target="_blank" rel="noopener">대한민국 법원 경매정보에서 직접 조회</a>
      </div>`;
    page.appendChild(court);

    function setSource(source){
      sw.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.source===source));
      onbidSections.forEach(el=>el.style.display=source==='onbid'?'':'none');
      court.style.display=source==='court'?'':'none';
      if(title)title.textContent=source==='court'?'법원 경매':'온비드 공매';
      if(sub)sub.textContent=source==='court'?'서울 아파트 법원 경매 · 공식 자동연동 준비 중':'사업지를 선택하면 해당 구·동의 온비드 공매를 조회합니다.';
    }
    sw.querySelectorAll('button').forEach(b=>b.onclick=()=>setSource(b.dataset.source));
  }

  function ensureBottomNav(){
    const nav=document.querySelector('.bottomnav');if(!nav)return;
    const data=nav.querySelector('[data-page="dataPage"]');if(data)data.remove();
    const onbid=nav.querySelector('[data-page="onbidPage"]');if(onbid)onbid.textContent='공매·경매';
  }

  ensurePropertyHub();
  ensureBottomNav();

  const style=document.createElement('style');
  style.textContent=`
    .home-signal-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .signal-card{background:#fff;border:1px solid #ddd;border-radius:15px;padding:12px;box-shadow:0 4px 14px rgba(0,0,0,.05);min-height:116px}
    .signal-top{display:flex;align-items:center;justify-content:space-between;gap:8px}.signal-top>span{font-size:10px;color:#666;font-weight:850}
    .signal-card strong{display:block;font-size:14px;line-height:1.35;margin-top:8px}.signal-card small{display:block;font-size:9px;color:#777;line-height:1.45;margin-top:4px}
    .signal-badge{font-size:8.5px;border:1px solid #ddd;border-radius:999px;padding:4px 6px;background:#f7f7f7;color:#555;white-space:nowrap}.signal-badge.ok{color:#067647}.signal-badge.wait{color:#8a5a00}
    .mini-bars,.signal-track{height:6px;background:#ececec;border-radius:99px;overflow:hidden;margin-top:11px}.mini-bars i,.signal-track i{display:block;height:100%;background:#333;border-radius:99px;transition:width .25s ease}
    .signal-link{font-size:10px;font-weight:900;margin-top:12px;cursor:pointer}.signal-help{margin-top:8px;background:#fff;border:1px solid #ddd;border-radius:13px;padding:0 12px}.signal-help summary{padding:10px 0;font-size:10px;font-weight:900;cursor:pointer}.signal-help div{border-top:1px solid #eee;padding:10px 0 12px;font-size:10px;color:#666;line-height:1.6}.signal-help b{color:#222}
    .source-switch{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#fff;border:1px solid #ddd;border-radius:14px;padding:5px}
    .source-switch button{border:0;background:transparent;border-radius:10px;padding:11px 8px;font-size:11px;font-weight:900;color:#777}.source-switch button.on{background:#222;color:#fff}
    .court-status b{display:block;font-size:15px}.court-status span{display:block;margin-top:4px;font-size:11px;color:#666;line-height:1.55}
    .court-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}.court-chips span{font-size:10px;font-weight:850;border:1px solid #ddd;background:#f7f7f7;border-radius:999px;padding:6px 9px}
    .auction-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:11px}.auction-steps div{background:#f7f7f7;border:1px solid #e7e7e7;border-radius:10px;padding:8px 4px;text-align:center}.auction-steps b{display:block;font-size:13px}.auction-steps span{display:block;font-size:8px;color:#777;margin-top:2px}
    .court-link{display:block;margin-top:10px;border-radius:11px;background:#222;color:#fff;text-align:center;padding:12px 10px;font-size:11px;font-weight:900}
    .bottomnav{grid-template-columns:repeat(6,minmax(0,1fr)) 34px!important}
    @media(max-width:520px){.home-signal-grid{grid-template-columns:1fr 1fr}.signal-card{padding:10px;min-height:110px}.signal-card strong{font-size:12px}.bottomnav button{font-size:7.8px!important}.bottomnav button[data-page="onbidPage"]{letter-spacing:-.6px}}
  `;
  document.head.appendChild(style);
})();