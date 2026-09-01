// In-app easy guide. Keep this file updated whenever app features change.
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
      <div class="notice"><b>이 앱의 목표</b><br>서울 아파트 집값이 어떻게 움직이는지 보고, 실거래·재개발·공매·경매를 함께 비교해서 <b>내집마련 후보를 쉽게 찾는 앱</b>입니다.<br><br><b>중요:</b> 화면의 등급이나 변화율 하나만 보고 집을 사면 안 돼요. 후보를 고른 뒤 실제 단지와 권리관계를 다시 확인하는 용도입니다.</div>
    </section>
    <section class="section guide-grid">
      <details class="card guide-card"><summary>🚦 내집마련 신호판은 뭐예요?</summary><div class="guide-body">홈 위쪽에서 가장 먼저 보는 곳이에요.<br><br><b>서울 집값 흐름</b> = 한국부동산원 공식 지수<br><b>공매·경매</b> = 싸게 살 기회를 찾는 메뉴 연결 상태<br><b>재개발 정보 완성도</b> = 공식 확인값이 얼마나 채워졌는지<br><b>관심 사업지</b> = ☆로 저장한 곳의 수</div></details>
      <details class="card guide-card"><summary>🏙 서울 외곽 내집마련 보드는 뭐예요?</summary><div class="guide-body">서울에서 상대적으로 가격 부담이 낮은 지역을 찾기 쉽게 만든 비교판이에요.<br><br>현재는 강북·도봉·노원·중랑·성북·은평·강서·구로·금천·관악·양천·강동 등 12개 자치구의 <b>국토부 아파트 실거래</b>를 같은 방식으로 비교합니다.<br><br><b>가격부담 낮음</b> = 서울 전체에서 싸다는 뜻이 아니라, 이 12개 지역끼리 비교했을 때 상대적으로 평당 실거래가가 낮다는 뜻이에요.</div></details>
      <details class="card guide-card"><summary>💵 월 중간 거래가 / 평당가는?</summary><div class="guide-body"><b>월 중간 거래가</b>는 그 달에 신고된 아파트 거래금액을 낮은 순서부터 놓았을 때 가운데 가격이에요.<br><br><b>평당 실거래 중앙값</b>은 아파트 크기가 달라도 비교하기 쉽도록 1평당 가격으로 바꾼 뒤 가운데 값을 사용한 숫자예요.<br><br>특정 아파트 한 채의 시세는 아니에요.</div></details>
      <details class="card guide-card"><summary>📈 전월 대비 +3% 같은 숫자는?</summary><div class="guide-body">지난달에 거래된 아파트들의 <b>평당가 중앙값</b>과 이번 달 중앙값을 비교한 숫자예요.<br><br>+면 이번 달 신고거래가 더 높았고, -면 더 낮았다는 뜻이에요.<br><br><b>주의:</b> 같은 아파트만 반복해서 비교한 공식 가격지수는 아니기 때문에 거래된 아파트 구성이 달라지면 숫자가 크게 움직일 수 있어요.</div></details>
      <details class="card guide-card"><summary>📉 R-ONE 서울 집값 차트는?</summary><div class="guide-body">한국부동산원의 <b>서울 아파트 공식 가격지수</b> 흐름이에요.<br><br>내집마련 보드의 실거래 중앙값 변화와 달리, 서울 아파트 시장 전체의 움직임을 보기 위한 공식 지수예요.<br><br>그래서 <b>서울 전체 분위기는 R-ONE</b>, <b>지역별 실제 거래가격은 내집마련 보드</b>로 나눠서 보면 쉬워요.</div></details>
      <details class="card guide-card"><summary>🏠 홈의 재개발 사업지는 뭐예요?</summary><div class="guide-body">신속통합기획이나 정비사업을 추적하는 곳이에요.<br><br><b>사업지명</b> = 재개발을 진행하는 곳의 이름<br><b>진행단계</b> = 일이 얼마나 진행됐는지<br><b>면적</b> = 사업지 크기<br><b>세대수</b> = 새로 지을 집의 수<br><br><b>☆</b>는 자주 보고 싶은 사업지를 저장하는 버튼이에요.</div></details>
      <details class="card guide-card"><summary>❓ 미확인은 무슨 뜻이에요?</summary><div class="guide-body"><b>정보가 없다는 뜻이 아니에요.</b><br>공식자료에서 아직 정확한 숫자나 날짜를 확인하지 못했다는 뜻이에요.<br><br>앱은 모르는 값을 마음대로 만들어 넣지 않습니다.</div></details>
      <details class="card guide-card"><summary>⭐ A·B·C·D 등급은 뭐예요?</summary><div class="guide-body">재개발 사업지를 쉽게 비교하려고 앱 안에서 만든 <b>참고 점수</b>예요.<br><br>A라고 무조건 좋은 투자라는 뜻도 아니고, D라고 무조건 나쁜 곳이라는 뜻도 아니에요.</div></details>
      <details class="card guide-card"><summary>📅 권리산정기준일은 뭐예요?</summary><div class="guide-body">쉽게 말하면 <b>재개발 권리를 판단할 때 중요하게 보는 기준 날짜</b>예요.<br><br>집이나 땅을 살 때 매우 중요한 항목이라 실제 계약 전에는 공식 고시를 다시 확인해야 해요.</div></details>
      <details class="card guide-card"><summary>🗺 Polygon은 뭐예요?</summary><div class="guide-body"><b>Polygon(폴리곤)</b>은 지도에서 재개발 사업구역을 둘러싸는 선이에요.<br><br>운동장에 선을 그어 “여기부터 여기까지”라고 표시하는 것과 비슷해요.<br><br><b>Polygon 확보</b> = 구역 모양 연결 완료<br><b>구역경계 대기</b> = 아직 정확한 모양을 연결하지 못함</div></details>
      <details class="card guide-card"><summary>📍 사업구역 내부 / 인근 / 외부는?</summary><div class="guide-body">VWorld가 주소를 지도 좌표로 바꾸고, 그 점이 재개발 Polygon 안에 있는지 비교한 결과예요.<br><br><b>사업구역 내부</b> = Polygon 안쪽<br><b>경계 인근</b> = 구역선에서 약 200m 안쪽의 주변<br><b>구역 외부</b> = 그보다 멀리 있는 물건<br><br>공간정보는 참고자료이므로 법적 경계확인 대신 사용할 수는 없어요.</div></details>
      <details class="card guide-card"><summary>💰 실거래는 뭐예요?</summary><div class="guide-body">집이나 땅이 <b>실제로 얼마에 팔렸는지</b> 정부에 신고된 거래예요.<br><br>Polygon 판정이 없는 곳은 같은 동네 참고 거래이고, Polygon이 연결된 곳은 주소 좌표를 이용해 내부/주변 여부를 추가로 확인할 수 있어요.</div></details>
      <details class="card guide-card"><summary>📊 평당가 중앙값은 뭐예요?</summary><div class="guide-body">거래 가격을 싼 순서부터 비싼 순서로 놓았을 때 <b>가운데에 있는 가격</b>이에요.<br><br><b>평당가</b> = 1평(약 3.3㎡)당 가격이에요.</div></details>
      <details class="card guide-card"><summary>🏷 온비드 공매는 뭐예요?</summary><div class="guide-body">국가나 공공기관 등이 부동산을 인터넷 입찰로 파는 곳이 <b>온비드</b>예요.<br><br>앱에서는 관심 사업지 주변에 공매 물건이 있는지 확인하고, 상세 API로 감정가·최저입찰가·마감일을 더 확인해요.</div></details>
      <details class="card guide-card"><summary>⚖ 법원 경매는 왜 대기예요?</summary><div class="guide-body">법원 아파트 경매도 자동으로 보여주는 것이 목표예요.<br><br>다만 현재 일반 공개 Open API가 바로 제공되는 구조가 아니라 법원행정처에 <b>연계 API 사용 문의</b>를 넣은 상태예요. 공식 연동 방법이 확인되면 사건번호·감정가·최저가·유찰횟수·매각기일을 연결할 예정이에요.</div></details>
      <details class="card guide-card"><summary>💵 감정가 / 최저입찰가는?</summary><div class="guide-body"><b>감정가</b> = 전문가가 평가한 물건 가격<br><b>최저입찰가</b> = 현재 입찰을 시작할 수 있는 최소 가격<br><br>예: 감정가 1억원, 최저입찰가 8천만원이면 8천만원 이상부터 입찰할 수 있다는 뜻이에요.</div></details>
      <details class="card guide-card"><summary>📉 할인율은 뭐예요?</summary><div class="guide-body">감정가보다 최저입찰가가 얼마나 낮아졌는지 보여주는 숫자예요.<br><br>감정가 1억원 → 최저입찰가 8천만원이면 약 20% 낮은 상태예요.<br><br>할인율이 높다고 무조건 좋은 물건은 아니에요.</div></details>
      <details class="card guide-card"><summary>🔎 상세조회 필요는 뭐예요?</summary><div class="guide-body">온비드의 간단한 목록에는 모든 정보가 없을 수 있어요.<br><br><b>상세 API</b>를 누르면 최저입찰가, 입찰기간 같은 정보를 한 번 더 자세히 가져옵니다.<br><br><b>API</b> = 컴퓨터끼리 정보를 주고받는 통로라고 생각하면 쉬워요.</div></details>
      <details class="card guide-card"><summary>🏢 서울시 공식자료 보강은?</summary><div class="guide-body">앱에 <b>미확인</b>으로 남아 있는 면적, 세대수, 권리산정기준일 등을 서울시 공식자료에서 다시 찾는 기능이에요.<br><br>공식자료에서 정확히 확인되는 값만 사용합니다.</div></details>
      <details class="card guide-card"><summary>🆕 새사업지 / 변경은 뭐예요?</summary><div class="guide-body"><b>새사업지</b> = 최근 새로 선정된 사업지 모음<br><br><b>변경</b> = 전에 봤을 때와 달라진 내용 모음<br><br>예: 세대수, 면적, 진행단계, 권리산정기준일 변경</div></details>
      <details class="card guide-card"><summary>⚙ API·데이터 상태는?</summary><div class="guide-body">국토부 실거래, R-ONE, VWorld, 온비드, 서울시 자료 등이 제대로 연결되어 있는지 확인하는 점검 화면이에요.<br><br>평소에는 자주 볼 필요 없어요.</div></details>
      <details class="card guide-card"><summary>📖 어려운 단어 한 번에 보기</summary><div class="guide-body glossary">
        <div><b>재개발</b><span>오래된 동네를 새롭게 정비하는 사업</span></div>
        <div><b>사업지</b><span>재개발을 진행하는 지역</span></div>
        <div><b>세대수</b><span>집의 개수</span></div>
        <div><b>권리산정기준일</b><span>재개발 권리를 판단할 때 중요한 날짜</span></div>
        <div><b>Polygon</b><span>지도에서 사업구역을 둘러싸는 선</span></div>
        <div><b>실거래</b><span>실제로 사고판 가격</span></div>
        <div><b>평당가</b><span>1평당 가격</span></div>
        <div><b>중앙값</b><span>숫자를 순서대로 놓았을 때 가운데 값</span></div>
        <div><b>R-ONE</b><span>한국부동산원의 공식 부동산 통계 서비스</span></div>
        <div><b>VWorld</b><span>주소·지도·공간정보를 제공하는 국가 공간정보 서비스</span></div>
        <div><b>감정가</b><span>전문가가 평가한 가격</span></div>
        <div><b>최저입찰가</b><span>입찰을 시작할 수 있는 최소 가격</span></div>
        <div><b>공매</b><span>공공기관 등이 인터넷 입찰로 물건을 파는 것</span></div>
        <div><b>경매</b><span>법원이 부동산 등을 입찰로 매각하는 절차</span></div>
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
