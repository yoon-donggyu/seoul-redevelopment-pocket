(() => {
  'use strict';

  const grid = document.querySelector('#guidePage .guide-grid');
  if (!grid) return;

  // 예전에 법원경매가 연동 대기 상태일 때 사용하던 안내는 제거합니다.
  [...grid.querySelectorAll('details')].forEach(card => {
    const title = card.querySelector('summary')?.textContent || '';
    if (title.includes('법원 경매는 왜 대기예요?')) card.remove();
  });

  const cards = `
    <details class="card guide-card"><summary>⚖ 법원 경매 화면은 어떻게 보면 돼요?</summary><div class="guide-body">현재 앱의 <b>공매·경매 → 법원 경매</b>에서 서울 5개 지방법원의 경매 물건을 볼 수 있어요.<br><br>기본 조회범위는 <b>조회일 기준 향후 2주 매각기일</b>이고, 지역·자치구·주소·사건번호·용도·신규/변경/유효 상태로 좁혀볼 수 있어요.<br><br>앱에서 후보를 찾은 뒤 마지막 확인은 반드시 <b>대한민국 법원 경매정보 원문</b>에서 하세요.</div></details>

    <details class="card guide-card"><summary>🧭 법원 경매는 이 순서로 보면 쉬워요</summary><div class="guide-body"><b>1. 지역</b>을 먼저 고릅니다.<br><b>2. 용도</b>가 아파트·다세대·토지 중 무엇인지 봅니다.<br><b>3. 감정가와 최저매각가격</b> 차이를 봅니다.<br><b>4. 유찰 횟수</b>와 매각기일을 확인합니다.<br><b>5. 주소와 면적</b>으로 실제 시세와 비교합니다.<br><b>6. 괜찮아 보이면 법원 원문</b>에서 권리관계와 서류를 다시 확인합니다.<br><br>처음부터 사건번호나 어려운 법률용어를 모두 볼 필요는 없고, <b>가격 → 위치 → 유찰 → 권리관계</b> 순서로 보면 편해요.</div></details>

    <details class="card guide-card"><summary>🆔 사건번호 / 물건번호 / 중복은 뭐예요?</summary><div class="guide-body"><b>사건번호</b>는 법원 경매 건의 고유 번호예요. 예: 2025타경12345<br><br><b>물건번호</b>는 한 사건 안에 여러 부동산이 있을 때 각각을 구분하는 번호예요.<br><br><b>중복</b> 표시가 있으면 법원 원문에서 여러 사건번호가 함께 연결되어 표시된 경우예요. 단순히 앱 데이터가 두 번 들어간 뜻으로 보지 말고, 반드시 원문의 사건 관계를 확인하세요.</div></details>

    <details class="card guide-card"><summary>💰 감정가 / 최저매각가격 / 감정가 대비는?</summary><div class="guide-body"><b>감정가</b> = 감정평가사가 평가한 기준 가격<br><b>최저매각가격</b> = 현재 회차에서 입찰할 수 있는 최저 기준 가격<br><b>감정가 대비</b> = 최저매각가격이 감정가의 몇 %인지 보여주는 값<br><br>예를 들어 감정가가 <b>2억 6,300만원</b>, 최저매각가격이 <b>1억 6,832만원</b>, 감정가 대비가 <b>64%</b>라면 최저가가 감정가의 64%라는 뜻이에요.<br><br><b>주의:</b> 감정가 대비 64%는 “64% 할인”이 아닙니다. 할인 폭으로 보면 약 <b>36% 낮아진 상태</b>예요.</div></details>

    <details class="card guide-card"><summary>📉 유찰 횟수는 뭐예요?</summary><div class="guide-body">정해진 매각기일에 낙찰되지 않고 다음 회차로 넘어간 횟수예요.<br><br>보통 유찰될수록 다음 회차의 최저매각가격이 낮아질 수 있어요. 하지만 <b>유찰이 많다고 무조건 싸고 좋은 물건은 아닙니다.</b><br><br>점유 문제, 권리관계, 물건 상태, 입지, 특수조건 등으로 입찰이 계속 안 된 것일 수도 있으니 유찰 횟수가 많을수록 원인을 더 자세히 확인해야 해요.</div></details>

    <details class="card guide-card"><summary>📅 매각기일 / 담당계는?</summary><div class="guide-body"><b>매각기일</b>은 실제 입찰이 진행되는 날짜예요.<br><br><b>담당계</b>는 해당 사건을 담당하는 법원 경매계예요. 사건 문의나 원문 확인 시 참고할 수 있어요.<br><br>매각기일은 변경·연기·취소될 수 있으므로 입찰 직전에는 앱 날짜만 보지 말고 법원 원문에서 다시 확인하세요.</div></details>

    <details class="card guide-card"><summary>⚠️ 최저가가 싸다고 바로 입찰하면 안 되는 이유</summary><div class="guide-body">경매는 단순히 <b>시세보다 싸게 사는 쇼핑</b>이 아니에요.<br><br>낙찰 후에도 인수해야 하는 권리가 있는지, 누가 점유하고 있는지, 임차인의 대항력·배당관계가 어떤지, 건물과 토지 권리가 정상인지 등을 확인해야 합니다.<br><br>특히 너무 싸 보이는 물건은 가격만 보지 말고 <b>왜 여러 번 유찰됐는지</b>부터 확인하는 습관이 좋아요.</div></details>

    <details class="card guide-card"><summary>📑 입찰 전에 꼭 확인할 서류는?</summary><div class="guide-body">후보 물건을 골랐다면 최소한 아래 자료는 법원 원문에서 다시 확인하세요.<br><br><b>매각물건명세서</b> = 임차인·점유관계·인수사항 등 핵심 조건<br><b>현황조사서</b> = 실제 점유 및 현장 조사 내용<br><b>감정평가서</b> = 물건 상태·면적·평가 근거<br><b>등기사항전부증명서</b> = 소유권·근저당·가압류 등 등기 권리관계<br><br>필요하면 건축물대장, 토지대장, 전입세대·체납관리비 등도 추가 확인해야 해요. 앱은 <b>후보 찾기용</b>이고 권리분석을 대신하지 않습니다.</div></details>

    <details class="card guide-card"><summary>🏙 재개발 Pocket에서는 경매를 어떻게 활용해요?</summary><div class="guide-body">재개발 사업지를 보다가 주변에 경매로 나온 물건이 있는지 함께 비교하는 용도로 쓰면 좋아요.<br><br><b>1.</b> 관심 재개발 사업지·자치구 확인<br><b>2.</b> 공매·경매 → 법원 경매에서 같은 지역 검색<br><b>3.</b> 감정가·최저가·유찰횟수 확인<br><b>4.</b> 실거래 탭에서 주변 실제 거래가격 비교<br><b>5.</b> 가격 메리트가 있어 보이는 물건만 법원 원문에서 권리분석<br><br>즉 <b>재개발 정보 + 실거래 + 경매가격</b>을 같이 보는 비교 도구로 사용하면 됩니다.</div></details>
  `;

  const onbidCard = [...grid.querySelectorAll('details')].find(card =>
    (card.querySelector('summary')?.textContent || '').includes('온비드 공매는 뭐예요?')
  );

  if (onbidCard) onbidCard.insertAdjacentHTML('afterend', cards);
  else grid.insertAdjacentHTML('beforeend', cards);
})();
