// Overall UI optimization: compact home summary + combined OnBid/Court auction hub.
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
    sec.innerHTML='<div class="section-head"><h2>빠른 현황</h2><small>공식 확인값 기준</small></div><div class="quick-summary"><div><span>추적 사업지</span><b id="qsTotal">-</b></div><div><span>면적 확인</span><b id="qsArea">-</b></div><div><span>권리일 확인</span><b id="qsRights">-</b></div><div><span>구역지정일 확인</span><b id="qsDesignation">-</b></div></div>';
    notice.after(sec);
  }

  function renderSummary(d){
    ensureSummaryShell();
    const ps=d?.projects||[];
    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=String(v)};
    set('qsTotal',ps.length);
    set('qsArea',ps.filter(p=>p.areaSqm!=null&&p.areaSqm!=='').length);
    set('qsRights',ps.filter(p=>p.rightsDate).length);
    set('qsDesignation',ps.filter(p=>p.designationDate).length);
  }

  const oldRender=window.renderDashboard;
  if(typeof oldRender==='function'){
    window.renderDashboard=function(d){
      const r=oldRender.apply(this,arguments);
      try{renderSummary(d)}catch(e){console.warn('optimize summary',e)}
      return r;
    };
  }
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
      <div class="section-head"><h2>서울 아파트 법원 경매</h2><small>공식 사이트 연동 대기</small></div>
      <div class="card court-card">
        <div class="court-status"><b>현재 자동 데이터는 아직 없습니다.</b><span>대한민국 법원 경매정보는 현재 앱에서 공식 사이트 링크만 연결되어 있습니다.</span></div>
        <div class="court-chips"><span>서울</span><span>아파트</span><span>법원경매</span></div>
        <div class="notice" style="box-shadow:none;margin-top:10px"><b>왜 바로 수집하지 않나요?</b><br>공식 공개 Open API가 확인되기 전에는 임의 스크래핑으로 사건번호·최저가·매각기일을 가져오지 않습니다. 잘못된 경매정보를 보여주는 것보다 정확한 공식자료만 쓰는 것이 우선입니다.</div>
        <a class="court-link" href="https://www.courtauction.go.kr/" target="_blank" rel="noopener">대한민국 법원 경매정보에서 서울 아파트 조회</a>
      </div>`;
    page.appendChild(court);

    function setSource(source){
      sw.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.source===source));
      onbidSections.forEach(el=>el.style.display=source==='onbid'?'':'none');
      court.style.display=source==='court'?'':'none';
      if(title)title.textContent=source==='court'?'법원 경매':'온비드 공매';
      if(sub)sub.textContent=source==='court'?'서울 아파트 법원 경매는 현재 공식 사이트 조회를 연결합니다.':'사업지를 선택하면 해당 구·동의 온비드 공매를 조회합니다.';
    }
    sw.querySelectorAll('button').forEach(b=>b.onclick=()=>setSource(b.dataset.source));
  }

  function ensureBottomNav(){
    const nav=document.querySelector('.bottomnav');if(!nav)return;
    const data=nav.querySelector('[data-page="dataPage"]');if(data)data.remove();
    const onbid=nav.querySelector('[data-page="onbidPage"]');if(onbid)onbid.textContent='공매·경매';
  }

  ensureSummaryShell();
  ensurePropertyHub();
  ensureBottomNav();

  const style=document.createElement('style');
  style.textContent=`
    .quick-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
    .quick-summary>div{background:#fff;border:1px solid #ddd;border-radius:13px;padding:10px 8px;box-shadow:0 4px 14px rgba(0,0,0,.05)}
    .quick-summary span{display:block;font-size:9px;color:#777}.quick-summary b{display:block;font-size:18px;margin-top:2px}
    .source-switch{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#fff;border:1px solid #ddd;border-radius:14px;padding:5px}
    .source-switch button{border:0;background:transparent;border-radius:10px;padding:11px 8px;font-size:11px;font-weight:900;color:#777}
    .source-switch button.on{background:#222;color:#fff}
    .court-status b{display:block;font-size:15px}.court-status span{display:block;margin-top:4px;font-size:11px;color:#666;line-height:1.55}
    .court-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}.court-chips span{font-size:10px;font-weight:850;border:1px solid #ddd;background:#f7f7f7;border-radius:999px;padding:6px 9px}
    .court-link{display:block;margin-top:10px;border-radius:11px;background:#222;color:#fff;text-align:center;padding:12px 10px;font-size:11px;font-weight:900}
    .bottomnav{grid-template-columns:repeat(6,minmax(0,1fr)) 34px!important}
    @media(max-width:520px){.quick-summary{grid-template-columns:repeat(2,1fr)}.bottomnav button{font-size:7.8px!important}.bottomnav button[data-page="onbidPage"]{letter-spacing:-.6px}}
  `;
  document.head.appendChild(style);
})();
