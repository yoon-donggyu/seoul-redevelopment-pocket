// In-app easy guide. Static guide page is created in index.html; this file fills the content.
(() => {
  'use strict';
  const page=document.getElementById('guidePage');
  if(!page) return;

  page.innerHTML=`
    <header>
      <div class="eyebrow">SEOUL REDEVELOPMENT POCKET · EASY GUIDE</div>
      <h1>쉬운 사용 가이드</h1>
      <div class="sub">궁금한 항목만 누르면 쉬운 설명이 펼쳐집니다.</div>
    </header>
    <section class="section">
      <div class="notice"><b>이 앱은 이렇게 보면 돼요</b><br>서울 재개발 사업지가 어디까지 진행됐는지 보고, 주변 실거래와 온비드 공매를 같이 비교하는 앱입니다.<br><br><b>중요:</b> 실거래나 공매가 보인다고 해서 그 물건이 재개발 구역 안에 있다고 100% 뜻하는 것은 아닙니다.</div>
    </section>
    <section class="section guide-grid">
      <details class="card guide-card"><summary>🏠 홈 화면은 뭐예요?</summary><div class="guide-body">여러 재개발 사업지를 한눈에 보는 첫 화면이에요.<br><br><b>사업지명</b> = 재개발을 진행하는 곳의 이름<br><b>진행단계</b> = 일이 얼마나 진행됐는지<br><b>면적</b> = 사업지 크기<br><b>세대수</b> = 새로 지을 집의 수<br><br><b>☆</b>는 자주 보고 싶은 사업지를 저장하는 버튼이에요.</div></details>
      <details class="card guide-card"><summary>❓ 미확인은 무슨 뜻이에요?</summary><div class="guide-body"><b>정보가 없다는 뜻이 아니에요.</b><br>공식자료에서 아직 정확한 숫자나 날짜를 확인하지 못했다는 뜻이에요.<br><br>앱은 모르는 값을 마음대로 만들어 넣지 않습니다.</div></details>
      <details class="card guide-card"><summary>⭐ A·B·C·D 등급은 뭐예요?</summary><div class="guide-body">사업지를 쉽게 비교하려고 앱 안에서 만든 <b>참고 점수</b>예요.<br><br>A라고 무조건 좋은 투자라는 뜻도 아니고, D라고 무조건 나쁜 곳이라는 뜻도 아니에요.</div></details>
      <details class="card guide-card"><summary>📅 권리산정기준일은 뭐예요?</summary><div class="guide-body">쉽게 말하면 <b>재개발 권리를 판단할 때 중요하게 보는 기준 날짜</b>예요.<br><br>집이나 땅을 살 때 매우 중요한 항목이라 실제 계약 전에는 공식 고시를 다시 확인해야 해요.</div></details>
      <details class="card guide-card"><summary>🗺 Polygon은 뭐예요?</summary><div class="guide-body"><b>Polygon(폴리곤)</b>은 지도에서 재개발 사업구역을 둘러싸는 선이에요.<br><br>운동장에 선을 그어 “여기부터 여기까지”라고 표시하는 것과 비슷해요.<br><br><b>Polygon 확보</b> = 구역 모양 연결 완료<br><b>구역경계 대기</b> = 아직 정확한 모양을 연결하지 못함</div></details>
      <details class="card guide-card"><summary>💰 실거래는 뭐예요?</summary><div class="guide-body">집이나 땅이 <b>실제로 얼마에 팔렸는지</b> 정부에 신고된 거래예요.<br><br>현재는 같은 동네의 참고 거래라서 화면에 나온 거래가 반드시 재개발 구역 안의 거래라는 뜻은 아니에요.</div></details>
      <details class="card guide-card"><summary>📊 평당가 중앙값은 뭐예요?</summary><div class="guide-body">거래 가격을 싼 순서부터 비싼 순서로 놓았을 때 <b>가운데에 있는 가격</b>이에요.<br><br><b>평당가</b> = 1평(약 3.3㎡)당 가격이에요.</div></details>
      <details class="card guide-card"><summary>🏷 온비드 공매는 뭐예요?</summary><div class="guide-body">국가나 공공기관 등이 부동산을 인터넷 입찰로 파는 곳이 <b>온비드</b>예요.<br><br>앱에서는 관심 사업지 주변에 공매 물건이 있는지 확인하는 데 사용해요.</div></details>
      <details class="card guide-card"><summary>💵 감정가 / 최저입찰가는?</summary><div class="guide-body"><b>감정가</b> = 전문가가 평가한 물건 가격<br><b>최저입찰가</b> = 현재 입찰을 시작할 수 있는 최소 가격<br><br>예: 감정가 1억원, 최저입찰가 8천만원이면 8천만원 이상부터 입찰할 수 있다는 뜻이에요.</div></details>
      <details class="card guide-card"><summary>📉 할인율은 뭐예요?</summary><div class="guide-body">감정가보다 최저입찰가가 얼마나 낮아졌는지 보여주는 숫자예요.<br><br>감정가 1억원 → 최저입찰가 8천만원이면 약 20% 낮은 상태예요.<br><br>할인율이 높다고 무조건 좋은 물건은 아니에요.</div></details>
      <details class="card guide-card"><summary>🔎 상세조회 필요는 뭐예요?</summary><div class="guide-body">온비드의 간단한 목록에는 모든 정보가 없을 수 있어요.<br><br><b>상세 API</b>를 누르면 최저입찰가, 입찰기간 같은 정보를 한 번 더 자세히 가져옵니다.<br><br><b>API</b> = 컴퓨터끼리 정보를 주고받는 통로라고 생각하면 쉬워요.</div></details>
      <details class="card guide-card"><summary>🧮 계산 불가는 무슨 뜻이에요?</summary><div class="guide-body">계산에 필요한 숫자가 빠져 있다는 뜻이에요.<br><br>예를 들어 할인율은 감정가와 최저입찰가가 둘 다 있어야 계산할 수 있어요.</div></details>
      <details class="card guide-card"><summary>🏢 서울시 공식자료 보강은?</summary><div class="guide-body">앱에 <b>미확인</b>으로 남아 있는 면적, 세대수, 권리산정기준일 등을 서울시 공식자료에서 다시 찾는 기능이에요.<br><br>공식자료에서 정확히 확인되는 값만 사용합니다.</div></details>
      <details class="card guide-card"><summary>🆕 새사업지 / 변경은 뭐예요?</summary><div class="guide-body"><b>새사업지</b> = 최근 새로 선정된 사업지 모음<br><br><b>변경</b> = 전에 봤을 때와 달라진 내용 모음<br><br>예: 세대수, 면적, 진행단계, 권리산정기준일 변경</div></details>
      <details class="card guide-card"><summary>⚙ API·데이터 상태는?</summary><div class="guide-body">국토부 실거래, 온비드, 서울시 자료 등이 제대로 연결되어 있는지 확인하는 점검 화면이에요.<br><br>평소에는 자주 볼 필요 없어요.</div></details>
      <details class="card guide-card"><summary>📖 어려운 단어 한 번에 보기</summary><div class="guide-body glossary">
        <div><b>재개발</b><span>오래된 동네를 새롭게 정비하는 사업</span></div>
        <div><b>사업지</b><span>재개발을 진행하는 지역</span></div>
        <div><b>세대수</b><span>집의 개수</span></div>
        <div><b>권리산정기준일</b><span>재개발 권리를 판단할 때 중요한 날짜</span></div>
        <div><b>Polygon</b><span>지도에서 사업구역을 둘러싸는 선</span></div>
        <div><b>실거래</b><span>실제로 사고판 가격</span></div>
        <div><b>평당가</b><span>1평당 가격</span></div>
        <div><b>감정가</b><span>전문가가 평가한 가격</span></div>
        <div><b>최저입찰가</b><span>입찰을 시작할 수 있는 최소 가격</span></div>
        <div><b>공매</b><span>공공기관 등이 인터넷 입찰로 물건을 파는 것</span></div>
        <div><b>API</b><span>컴퓨터끼리 정보를 주고받는 통로</span></div>
      </div></details>
    </section>`;

  const btn=document.querySelector('.bottomnav button[data-page="guidePage"]');
  if(btn) btn.onclick=()=>window.showPage?.('guidePage');

  const style=document.createElement('style');
  style.textContent=`
    .bottomnav{grid-template-columns:repeat(6,1fr) 34px!important}
    .guide-grid{display:grid;gap:8px}.guide-card{padding:0!important;overflow:hidden}
    .guide-card summary{list-style:none;cursor:pointer;padding:14px 42px 14px 16px;font-size:13px;font-weight:900;position:relative}
    .guide-card summary::-webkit-details-marker{display:none}.guide-card summary:after{content:'+';position:absolute;right:16px;top:11px;font-size:19px;color:#888}
    .guide-card[open] summary:after{content:'−'}.guide-card[open] summary{border-bottom:1px solid #ececec}
    .guide-body{padding:13px 16px 15px;font-size:11px;color:#5f5f5f;line-height:1.7}.guide-body b{color:#222}
    .glossary{display:grid;gap:7px}.glossary>div{display:grid;grid-template-columns:105px 1fr;gap:8px;border-bottom:1px solid #eee;padding-bottom:6px}.glossary span{color:#666}
    @media(max-width:420px){.bottomnav button{font-size:7.8px!important}.guide-card summary{font-size:12px}.glossary>div{grid-template-columns:88px 1fr}}
  `;
  document.head.appendChild(style);
})();
