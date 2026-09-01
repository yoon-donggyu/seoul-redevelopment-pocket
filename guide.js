// In-app user guide. Static UI only; no observers or polling.
(() => {
  'use strict';
  if(document.getElementById('guidePage')) return;
  const page=document.createElement('div');
  page.id='guidePage';
  page.className='page';
  page.innerHTML=`
    <header>
      <div class="eyebrow">SEOUL REDEVELOPMENT POCKET · GUIDE</div>
      <h1>사용 가이드</h1>
      <div class="sub">처음 보는 사람도 바로 이해할 수 있는 화면 해석법</div>
    </header>

    <section class="section">
      <div class="notice"><b>가장 중요한 기준</b><br>실거래와 온비드 공매는 사업구역 Polygon/필지와 완전 매칭 전까지 <b>같은 법정동·지역의 참고 데이터</b>입니다. 화면에 보인다고 해서 반드시 사업구역 내부 물건이라는 뜻은 아닙니다.</div>
    </section>

    <section class="section guide-grid">
      <details class="card guide-card" open><summary>홈 화면은 어떻게 보나요?</summary><div class="guide-body"><b>사업지명</b> 아래에 진행단계, 면적, 계획 세대수, 권리산정기준일 등이 표시됩니다.<br><b>☆</b>는 관심사업지 저장, <b>관심만</b>은 즐겨찾기만 보기, 정렬은 최신선정·이름·면적·자치구 기준입니다.</div></details>
      <details class="card guide-card"><summary>`미확인`은 무슨 뜻인가요?</summary><div class="guide-body"><b>정보가 없다는 뜻이 아닙니다.</b> 현재 연결된 공식자료에서 명확한 값을 아직 확인하지 못했다는 뜻입니다. 앱은 모르는 값을 추측해서 채우지 않습니다.</div></details>
      <details class="card guide-card"><summary>A~D 참고 가성비 등급은?</summary><div class="guide-body">공식 투자등급이 아닙니다. 사업단계·거래량·데이터 완성도 등을 조합한 <b>앱 내부 참고점수</b>입니다. 매수 판단은 권리관계, 분담금, 사업성, 대지지분 등을 별도로 확인해야 합니다.</div></details>
      <details class="card guide-card"><summary>사업지 상세에서 무엇을 보나요?</summary><div class="guide-body">사업 개요 → 실거래 → 사업구역 경계 → 최근 실거래 순서로 보면 됩니다. 면적·세대수·권리산정기준일과 최근 거래 흐름을 함께 비교하는 화면입니다.</div></details>
      <details class="card guide-card"><summary>Polygon 확보 / 구역경계 대기는?</summary><div class="guide-body"><b>Polygon 확보</b>는 서울시 공간정보와 매칭된 사업구역 도형이 있다는 뜻입니다. <b>구역경계 대기</b>는 아직 정확한 경계를 연결하지 못한 상태입니다. 지도 경계는 참고용이며 법적 효력은 없습니다.</div></details>
      <details class="card guide-card"><summary>실거래 탭은 어떻게 해석하나요?</summary><div class="guide-body">국토부 API에서 <b>토지 / 연립·다세대 / 단독·다가구 / 아파트</b>를 나눠 조회합니다. 거래건수, 최근 거래일, 평당가 중앙값은 모두 현재 단계에서는 <b>법정동 참고값</b>입니다.</div></details>
      <details class="card guide-card"><summary>평당가 중앙값은?</summary><div class="guide-body">조회된 거래의 평당가를 순서대로 놓았을 때 가운데 값입니다. 일부 초고가·초저가 거래에 평균값이 크게 흔들리는 것을 줄이기 위해 사용합니다.</div></details>
      <details class="card guide-card"><summary>온비드 공매는 어떻게 보나요?</summary><div class="guide-body">사업지를 선택하면 같은 구·동 기준의 공매를 조회합니다. <b>감정가 / 최저입찰가 / 할인율 / 입찰마감</b>을 보고, 목록에 없는 정보는 <b>상세 API</b>로 추가 조회합니다. 주소와 지도를 반드시 같이 확인하세요.</div></details>
      <details class="card guide-card"><summary>`상세조회 필요` / `계산 불가`는?</summary><div class="guide-body"><b>상세조회 필요</b>는 온비드 목록 API에 해당 값이 없어 상세 API를 한 번 더 조회해야 한다는 뜻입니다. <b>계산 불가</b>는 감정가나 최저입찰가 중 하나가 없어 할인율을 계산하지 못한 상태입니다.</div></details>
      <details class="card guide-card"><summary>서울시 공식자료 보강은?</summary><div class="guide-body">현재 미확인인 면적·계획 세대수·권리산정기준일·구역지정일 등을 서울시 공식자료에서 다시 확인합니다. <b>공식 페이지에 명확하게 적힌 값만</b> 반영하며 추정값은 넣지 않습니다.</div></details>
      <details class="card guide-card"><summary>새사업지 / 변경 탭은?</summary><div class="guide-body"><b>새사업지</b>는 최근 선정 사업지를 빠르게 보는 화면입니다. <b>변경</b>은 신규 사업지, 진행단계, 권리산정기준일, 구역지정일, 세대수, 면적 변화 등을 이전 기준값과 비교해 보여줍니다.</div></details>
      <details class="card guide-card"><summary>⚙ API·데이터 상태는?</summary><div class="guide-body">Vercel 백엔드, 공공데이터 서비스키, 국토부 실거래, 온비드, 서울시 등 <b>어디서 데이터를 가져오는지와 연동상태</b>를 확인하는 화면입니다.</div></details>
      <details class="card guide-card"><summary>오류 문구는 어떻게 해석하나요?</summary><div class="guide-body"><b>HTTP 400</b>은 요청 파라미터 문제, <b>응답 형식 오류</b>는 API 대신 일반 오류페이지를 받은 경우, <b>현재 조회된 공매 0건</b>은 오류가 아니라 조건에 맞는 물건이 없다는 뜻입니다.</div></details>
    </section>

    <section class="section">
      <div class="card guide-final"><b>추천 확인 순서</b><div>변경 → 새사업지 → 관심사업지 상세 → 실거래 → 온비드 → 공식출처 재확인</div></div>
    </section>`;
  document.querySelector('.wrap')?.appendChild(page);

  const nav=document.querySelector('.bottomnav');
  if(nav && !nav.querySelector('[data-page="guidePage"]')){
    const gear=nav.querySelector('[data-page="statusPage"]');
    const b=document.createElement('button');
    b.dataset.page='guidePage';
    b.textContent='가이드';
    b.onclick=()=>window.showPage?.('guidePage');
    nav.insertBefore(b,gear||null);
  }

  const style=document.createElement('style');
  style.textContent=`
    .bottomnav{grid-template-columns:repeat(6,1fr) 34px!important}
    .guide-grid{display:grid;gap:8px}
    .guide-card{padding:0!important;overflow:hidden}
    .guide-card summary{list-style:none;cursor:pointer;padding:14px 16px;font-size:13px;font-weight:900;position:relative;padding-right:42px}
    .guide-card summary::-webkit-details-marker{display:none}
    .guide-card summary:after{content:'+';position:absolute;right:16px;top:12px;font-size:18px;color:#888}
    .guide-card[open] summary:after{content:'−'}
    .guide-card[open] summary{border-bottom:1px solid #ececec}
    .guide-body{padding:13px 16px 15px;font-size:11px;color:#5f5f5f;line-height:1.65}
    .guide-body b{color:#222}
    .guide-final{font-size:11px;line-height:1.7}.guide-final>b{display:block;font-size:13px;margin-bottom:4px}
    @media(max-width:420px){.bottomnav button{font-size:8px!important}.guide-card summary{font-size:12px}}
  `;
  document.head.appendChild(style);
})();
