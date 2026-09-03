(() => {
  'use strict';

  const nav = document.querySelector('.bottomnav');
  const bottom = document.querySelector('.bottom');
  if (!nav || !bottom || nav.dataset.compactNav === '1') return;

  nav.dataset.compactNav = '1';

  nav.innerHTML = `
    <button type="button" class="compact-nav-item on" data-go="home"><span class="compact-nav-icon">⌂</span><span>홈</span></button>
    <button type="button" class="compact-nav-item" data-go="newPage"><span class="compact-nav-icon">▦</span><span>사업지</span></button>
    <button type="button" class="compact-nav-item" data-go="market"><span class="compact-nav-icon">↗</span><span>실거래</span></button>
    <button type="button" class="compact-nav-item" data-go="onbidPage"><span class="compact-nav-icon">⚖</span><span>공매·경매</span></button>
    <button type="button" class="compact-nav-item" id="moreNavBtn"><span class="compact-nav-icon">•••</span><span>더보기</span></button>
  `;

  const sheet = document.createElement('div');
  sheet.id = 'moreNavSheet';
  sheet.className = 'more-nav-wrap';
  sheet.innerHTML = `
    <div class="more-nav-backdrop" data-close-more></div>
    <div class="more-nav-sheet" role="dialog" aria-modal="true" aria-label="더보기 메뉴">
      <div class="more-nav-handle"></div>
      <div class="more-nav-title">더보기</div>
      <div class="more-nav-grid">
        <button type="button" data-more-go="reportPage"><b>▤</b><span>재개발 리포트</span><small>종합 리포트 보기</small></button>
        <button type="button" data-more-go="dataPage"><b>▣</b><span>공식 자료</span><small>데이터 출처 확인</small></button>
        <button type="button" data-more-go="guidePage"><b>?</b><span>가이드</span><small>앱 사용법 보기</small></button>
        <button type="button" data-more-go="statusPage"><b>⚙</b><span>데이터 상태</span><small>API 연결 점검</small></button>
      </div>
      <button type="button" class="more-nav-close" data-close-more>닫기</button>
    </div>
  `;
  document.body.appendChild(sheet);

  const primaryPages = new Set(['home','newPage','market','onbidPage']);
  const moreBtn = document.getElementById('moreNavBtn');

  function currentPage() {
    return document.querySelector('.page.active')?.id || 'home';
  }

  function syncActive() {
    const active = currentPage();
    nav.querySelectorAll('[data-go]').forEach(btn => btn.classList.toggle('on', btn.dataset.go === active));
    if (moreBtn) moreBtn.classList.toggle('on', !primaryPages.has(active));
  }

  function closeMore() {
    sheet.classList.remove('open');
    document.body.classList.remove('more-nav-open');
  }

  function openMore() {
    sheet.classList.add('open');
    document.body.classList.add('more-nav-open');
  }

  function go(page) {
    if (!document.getElementById(page)) return;
    if (typeof window.showPage === 'function') window.showPage(page);
    else {
      document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
      document.getElementById(page)?.classList.add('active');
      window.scrollTo(0,0);
    }
    closeMore();
    requestAnimationFrame(syncActive);
  }

  nav.querySelectorAll('[data-go]').forEach(btn => btn.addEventListener('click', () => go(btn.dataset.go)));
  moreBtn?.addEventListener('click', openMore);
  sheet.querySelectorAll('[data-more-go]').forEach(btn => btn.addEventListener('click', () => go(btn.dataset.moreGo)));
  sheet.querySelectorAll('[data-close-more]').forEach(el => el.addEventListener('click', closeMore));

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMore(); });
  new MutationObserver(syncActive).observe(document.querySelector('.wrap') || document.body, {subtree:true, attributes:true, attributeFilter:['class']});
  syncActive();

  const style = document.createElement('style');
  style.textContent = `
    .bottom{padding:8px 12px calc(8px + env(safe-area-inset-bottom));background:linear-gradient(to top,rgba(237,237,237,.99),rgba(237,237,237,.92));border-top:0}
    .bottomnav{display:grid!important;grid-template-columns:repeat(5,1fr)!important;gap:4px!important;padding:5px!important;background:rgba(255,255,255,.96)!important;border:1px solid rgba(0,0,0,.08)!important;border-radius:20px!important;overflow:visible!important;box-shadow:0 7px 28px rgba(0,0,0,.13)!important}
    .bottomnav .compact-nav-item{min-width:0!important;border:0!important;border-radius:15px!important;background:transparent!important;color:#777!important;padding:7px 2px 6px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:2px!important;font-size:9px!important;font-weight:850!important;line-height:1.05!important;white-space:nowrap!important}
    .bottomnav .compact-nav-item.on{background:#202124!important;color:#fff!important}
    .compact-nav-icon{height:17px;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;line-height:1}
    #moreNavBtn .compact-nav-icon{font-size:13px;letter-spacing:1px}
    .more-nav-wrap{position:fixed;z-index:70;inset:0;display:none;align-items:flex-end;justify-content:center}
    .more-nav-wrap.open{display:flex}
    .more-nav-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.34);backdrop-filter:blur(2px)}
    .more-nav-sheet{position:relative;width:min(720px,100%);background:#f4f4f4;border-radius:24px 24px 0 0;padding:10px 14px calc(16px + env(safe-area-inset-bottom));box-shadow:0 -12px 35px rgba(0,0,0,.18);animation:moreNavUp .18s ease-out}
    .more-nav-handle{width:38px;height:4px;border-radius:99px;background:#c7c7c7;margin:0 auto 10px}
    .more-nav-title{font-size:17px;font-weight:950;margin:0 2px 11px;color:#222}
    .more-nav-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
    .more-nav-grid button{border:1px solid #dedede;background:#fff;border-radius:15px;padding:13px;text-align:left;color:#222;box-shadow:0 3px 10px rgba(0,0,0,.04)}
    .more-nav-grid b{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9px;background:#f0f0f0;font-size:14px;margin-bottom:8px}
    .more-nav-grid span{display:block;font-size:12px;font-weight:900}
    .more-nav-grid small{display:block;font-size:9px;color:#888;margin-top:3px;line-height:1.4}
    .more-nav-close{width:100%;margin-top:9px;border:0;background:#202124;color:#fff;border-radius:13px;padding:12px;font-size:11px;font-weight:900}
    body.more-nav-open{overflow:hidden}
    @keyframes moreNavUp{from{transform:translateY(16px);opacity:.7}to{transform:translateY(0);opacity:1}}
    @media(max-width:420px){
      .bottom{padding-left:9px;padding-right:9px}
      .bottomnav .compact-nav-item{font-size:8.5px!important;padding-top:6px!important;padding-bottom:6px!important}
      .compact-nav-icon{font-size:14px}
      .more-nav-sheet{padding-left:12px;padding-right:12px}
    }
  `;
  document.head.appendChild(style);
})();
