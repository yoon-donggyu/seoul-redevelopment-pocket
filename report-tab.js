(() => {
  'use strict';

  const REPORT_URL = 'https://yoon-donggyu.github.io/seoul-redevelopment-report.html?utm_source=chatgpt.com';
  const wrap = document.querySelector('.wrap');
  const nav = document.querySelector('.bottomnav');
  if (!wrap || !nav || document.getElementById('reportPage')) return;

  const page = document.createElement('div');
  page.id = 'reportPage';
  page.className = 'page';
  page.innerHTML = `
    <header>
      <div class="eyebrow">SEOUL REDEVELOPMENT POCKET · REPORT</div>
      <h1>재개발 리포트</h1>
      <div class="sub">서울 재개발 종합 리포트를 앱 안에서 바로 확인합니다.</div>
      <div class="toolbar" style="margin-top:10px">
        <a class="btn dark" href="${REPORT_URL}" target="_blank" rel="noopener" style="text-decoration:none">새창으로 보기</a>
      </div>
    </header>
    <section class="section report-frame-section">
      <iframe id="redevelopmentReportFrame" class="report-frame" title="서울 재개발 리포트" loading="lazy" src="${REPORT_URL}"></iframe>
      <div class="report-fallback notice">
        리포트가 화면에 표시되지 않으면 <a href="${REPORT_URL}" target="_blank" rel="noopener">새창으로 보기</a>를 눌러주세요.
      </div>
    </section>
  `;
  wrap.appendChild(page);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.dataset.page = 'reportPage';
  btn.textContent = '리포트';

  const guideBtn = nav.querySelector('button[data-page="guidePage"]');
  if (guideBtn) nav.insertBefore(btn, guideBtn);
  else nav.appendChild(btn);

  btn.onclick = () => {
    if (typeof window.showPage === 'function') window.showPage('reportPage');
    else {
      document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
      page.classList.add('active');
      document.querySelectorAll('.bottomnav button').forEach(b => b.classList.toggle('on', b === btn));
      window.scrollTo(0, 0);
    }
  };

  const style = document.createElement('style');
  style.textContent = `
    .bottomnav{grid-template-columns:repeat(7,1fr) 34px!important}
    #reportPage .report-frame-section{padding:10px 8px 78px}
    #reportPage .report-frame{display:block;width:100%;height:calc(100vh - 190px);min-height:620px;border:1px solid #dedede;border-radius:14px;background:#fff}
    #reportPage .report-fallback{margin-top:9px;font-size:10px;line-height:1.5}
    #reportPage .report-fallback a{color:#202124;font-weight:900}
    @media(max-width:420px){
      .bottomnav button{font-size:7.2px!important;padding-left:2px!important;padding-right:2px!important}
      #reportPage .report-frame{height:calc(100vh - 178px);min-height:560px;border-radius:12px}
    }
  `;
  document.head.appendChild(style);
})();
