// Overall UI optimization: beginner-friendly homebuying dashboard + clean OnBid/Court auction tabs.
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
          <div class="signal-top"><span>공매 · 경매</span><b class="signal-badge ok">2/2 연결</b></div>
          <strong>온비드 ✓ · 법원경매 ✓</strong>
          <small>공매와 법원 경매를 탭으로 나눠 확인</small>
          <div class="mini-bars"><i style="width:100%"></i></div>
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
    if(favBtn) favBtn.onclick=()=>{const b=document.getElementById('favOnlyBtn');if(b)b.click();document.getElementById('cards')?.scrollIntoView({behavior:'smooth',block:'start'})};
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
    if(!page) return;

    const navBtn=document.querySelector('.bottomnav button[data-page="onbidPage"]');
    if(navBtn) navBtn.textContent='공매·경매';

    const header=page.querySelector('header');
    const title=header?.querySelector('h1');
    const sub=header?.querySelector('.sub');

    let sw=document.getElementById('propertySourceSwitch');
    if(!sw){
      sw=document.createElement('section');
      sw.className='section';
      sw.id='propertySourceSwitch';
      sw.innerHTML='<div class="source-switch"><button class="on" data-source="onbid">온비드 공매</button><button data-source="court">법원 경매</button></div>';
      header?.after(sw);
    }

    // court-auction-ui.js가 만든 실제 법원 경매 섹션만 court 탭으로 사용한다.
    const court=document.getElementById('courtAuctionSection');
    if(court){
      court.classList.add('court-source-section');
      court.classList.remove('onbid-source-section');
    }

    // 온비드 원본 3개 섹션(안내/사업지선택/조회결과)만 온비드 탭에 포함한다.
    const onbidSections=[...page.children].filter(el=>
      el.tagName==='SECTION' &&
      el.id!=='propertySourceSwitch' &&
      el.id!=='courtAuctionSection' &&
      !el.classList.contains('court-auction-section')
    );
    onbidSections.forEach(el=>el.classList.add('onbid-source-section'));

    // 이전 버전이 생성하던 가짜 "연동 대기" 법원 섹션이 남아 있으면 제거한다.
    page.querySelectorAll('.court-auction-section').forEach(el=>{
      if(el.id!=='courtAuctionSection') el.remove();
    });

    function setSource(source){
      sw.querySelectorAll('button[data-source]').forEach(b=>b.classList.toggle('on',b.dataset.source===source));
      onbidSections.forEach(el=>{el.style.display=source==='onbid'?'':'none'});
      if(court) court.style.display=source==='court'?'':'none';

      if(source==='court'){
        if(title) title.textContent='법원 경매';
        if(sub) sub.textContent='서울 5개 지방법원 경매 데이터를 조회합니다.';
      }else{
        if(title) title.textContent='온비드 공매';
        if(sub) sub.textContent='사업지를 선택하면 해당 구·동의 온비드 공매를 조회합니다.';
        try{ if(typeof window.renderOnbidChooser==='function') window.renderOnbidChooser(); }catch(e){ console.warn('onbid chooser',e); }
      }
    }

    sw.querySelectorAll('button[data-source]').forEach(b=>b.onclick=()=>setSource(b.dataset.source));
    setSource('onbid');
    window.setAuctionSource=setSource;
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
    .source-switch button{border:0;background:transparent;border-radius:10px;padding:11px 8px;font-size:11px;font-weight:900;color:#777;cursor:pointer}.source-switch button.on{background:#222;color:#fff}
    .bottomnav{grid-template-columns:repeat(6,minmax(0,1fr)) 34px!important}
    @media(max-width:520px){.home-signal-grid{grid-template-columns:1fr 1fr}.signal-card{padding:10px;min-height:110px}.signal-card strong{font-size:12px}.bottomnav button{font-size:7.8px!important}.bottomnav button[data-page="onbidPage"]{letter-spacing:-.6px}}
  `;
  document.head.appendChild(style);
})();