// In-app user guide. Easy Korean + expandable explanations. No observers/polling.
(() => {
  'use strict';
  if(document.getElementById('guidePage')) return;
  const page=document.createElement('div');
  page.id='guidePage';
  page.className='page';
  page.innerHTML=`
    <header>
      <div class="eyebrow">SEOUL REDEVELOPMENT POCKET · EASY GUIDE</div>
      <h1>쉬운 사용 가이드</h1>
      <div class="sub">모르는 단어가 있어도 괜찮아요. 궁금한 것만 눌러보세요.</div>
    </header>

    <section class="section">
      <div class="notice"><b>이 앱은 이렇게 보면 돼요</b><br>서울의 재개발 사업지가 지금 어디까지 진행됐는지 보고, 주변 실거래와 온비드 공매를 같이 비교하는 앱입니다.<br><br><b>중요:</b> 실거래와 공매 물건이 화면에 보여도, 아직은 그 물건이 재개발 구역 안에 있다고 100% 뜻하는 것은 아닙니다.</div>
    </section>

    <section class="section guide-grid">
      <details class="card guide-card"><summary>🏠 홈 화면은 뭐예요?</summary><div class="guide-body">여러 재개발 사업지를 한눈에 보는 첫 화면이에요.<br><br><b>사업지명</b> = 재개발을 준비하거나 진행하는 곳의 이름<br><b>진행단계</b> = 일이 얼마나 진행됐는지<br><b>면적</b> = 사업지 크기<br><b>세대수</b> = 새로 지을 집의 수<br><br><span class="word">☆ 관심사업지</span> 자주 보고 싶은 곳에 별표를 해두는 기능이에요.</div></details>

      <details class="card guide-card"><summary>❓ `미확인`은 무슨 뜻이에요?</summary><div class="guide-body"><b>없는 정보라는 뜻이 아니에요.</b><br>서울시나 공식자료에서 아직 정확한 숫자나 날짜를 찾지 못했다는 뜻이에요.<br><br>예를 들어 `세대수 미확인`이면 아직 앱이 공식자료에서 정확한 세대수를 확인하지 못한 상태예요.<br><br><b>앱은 모르는 값을 마음대로 만들어 넣지 않습니다.</b></div></details>

      <details class="card guide-card"><summary>⭐ A·B·C·D 가성비 등급은 뭐예요?</summary><div class="guide-body">여러 사업지를 쉽게 비교하려고 앱 안에서 만든 <b>참고 점수</b>예요.<br><br>A라고 무조건 좋은 투자라는 뜻도 아니고, D라고 나쁜 곳이라는 뜻도 아니에요.<br><br><span class="word">투자</span> 돈을 넣어서 나중에 더 큰 이익을 기대하는 행동이에요.<br><br>실제 집을 살 때는 분담금, 권리관계, 대지지분 같은 것도 따로 확인해야 해요.</div></details>

      <details class="card guide-card"><summary>📋 사업지 상세는 무엇을 봐요?</summary><div class="guide-body">한 사업지를 자세히 보는 화면이에요.<br><br>① 사업지 크기<br>② 계획 세대수<br>③ 지금 진행단계<br>④ 권리산정기준일<br>⑤ 주변 실거래<br>⑥ 지도에 표시된 구역 경계<br><br>이 순서대로 보면 이해하기 쉬워요.</div></details>

      <details class="card guide-card"><summary>📅 권리산정기준일이 뭐예요?</summary><div class="guide-body">아주 쉽게 말하면 <b>“언제까지 가지고 있던 집이나 땅을 권리로 인정할지 보는 기준 날짜”</b>예요.<br><br>재개발에서는 중요한 날짜라서 집이나 땅을 살 때 꼭 확인해야 하는 항목 중 하나예요.<br><br>정확한 권리 인정 여부는 개별 물건마다 다를 수 있으니 실제 계약 전에는 공식 고시와 전문가 확인이 필요해요.</div></details>

      <details class="card guide-card"><summary>🗺 Polygon / 구역경계는 뭐예요?</summary><div class="guide-body"><b>Polygon(폴리곤)</b>은 지도에서 재개발 구역을 둘러싼 선 모양이에요.<br><br>쉽게 말하면 운동장에 선을 그어서 <b>“여기부터 여기까지가 이 사업지예요”</b>라고 표시하는 것과 같아요.<br><br><b>Polygon 확보</b> = 구역 모양을 지도에 연결함<br><b>구역경계 대기</b> = 아직 정확한 모양을 연결하지 못함<br><br>앱의 지도는 참고용이며 법적으로 확정하는 문서는 아니에요.</div></details>

      <details class="card guide-card"><summary>💰 실거래는 뭐예요?</summary><div class="guide-body">실제로 집이나 땅이 얼마에 팔렸는지 정부에 신고된 거래예요.<br><br>앱에서는 <b>토지 / 연립·다세대 / 단독·다가구 / 아파트</b>를 나눠서 봐요.<br><br>지금은 같은 동네의 거래를 참고해서 보여주기 때문에, 화면에 나온 거래가 반드시 재개발 구역 안의 거래라는 뜻은 아니에요.</div></details>

      <details class="card guide-card"><summary>📊 평당가 중앙값은 뭐예요?</summary><div class="guide-body">거래 가격을 싼 순서부터 비싼 순서까지 줄 세웠을 때 <b>가운데 있는 가격</b>이에요.<br><br>예: 1000만원, 1100만원, 1200만원, 5000만원이면 평균은 비싼 거래 하나 때문에 크게 올라가요. 중앙값은 가운데 값을 사용해서 보통 가격을 보기 더 편해요.<br><br><span class="word">평당가</span> 1평(약 3.3㎡)당 얼마인지 나타낸 가격이에요.</div></details>

      <details class="card guide-card"><summary>🏷 온비드 공매는 뭐예요?</summary><div class="guide-body">국가나 공공기관 등이 가지고 있는 부동산을 인터넷으로 입찰해서 파는 곳이 <b>온비드</b>예요.<br><br>앱에서는 관심 재개발 사업지 주변에 공매 물건이 있는지 찾아보는 용도로 사용해요.<br><br><b>중요:</b> 공매 물건이 재개발 구역 안에 있는지는 주소와 지도를 꼭 다시 확인해야 해요.</div></details>

      <details class="card guide-card"><summary>💵 감정가 / 최저입찰가는 뭐예요?</summary><div class="guide-body"><b>감정가</b> = 전문가가 물건의 가치를 평가한 금액<br><b>최저입찰가</b> = 지금 입찰할 때 최소한 이 정도부터 써야 하는 금액<br><br>예: 감정가 1억원, 최저입찰가 7천만원이면 감정가보다 낮은 가격부터 입찰이 시작되는 거예요.</div></details>

      <details class="card guide-card"><summary>📉 할인율은 뭐예요?</summary><div class="guide-body">감정가와 비교해서 최저입찰가가 얼마나 내려왔는지 보여주는 숫자예요.<br><br>예: 감정가 1억원 → 최저입찰가 8천만원이면 약 20% 낮아진 상태예요.<br><br>할인율이 크다고 무조건 좋은 물건은 아니에요. 권리문제나 물건 상태도 꼭 확인해야 해요.</div></details>

      <details class="card guide-card"><summary>🔎 `상세조회 필요`는 뭐예요?</summary><div class="guide-body">온비드에서 처음 가져오는 간단한 목록에는 모든 정보가 들어있지 않을 수 있어요.<br><br>이때 <b>상세 API</b> 버튼을 누르면 최저입찰가, 입찰기간 같은 정보를 한 번 더 자세히 가져와요.<br><br><span class="word">API</span> 두 컴퓨터가 서로 정보를 주고받는 통로라고 생각하면 쉬워요.</div></details>

      <details class="card guide-card"><summary>🧮 `계산 불가`는 무슨 뜻이에요?</summary><div class="guide-body">필요한 숫자가 하나 빠져 있어서 계산할 수 없다는 뜻이에요.<br><br>예를 들어 할인율을 계산하려면 <b>감정가 + 최저입찰가</b>가 둘 다 필요한데 하나가 없으면 `계산 불가`라고 표시해요.</div></details>

      <details class="card guide-card"><summary>🏢 서울시 공식자료 보강은 뭐예요?</summary><div class="guide-body">앱에서 `미확인`으로 남아 있는 값을 서울시 공식자료에서 다시 찾아보는 기능이에요.<br><br>주로 <b>면적 / 세대수 / 권리산정기준일 / 정비구역 지정일</b>을 다시 확인해요.<br><br>서울시 공식페이지에 정확하게 적혀 있는 값만 사용하고, 비슷해 보이는 숫자를 억지로 넣지 않아요.</div></details>

      <details class="card guide-card"><summary>🆕 새사업지 / 변경 탭은 뭐예요?</summary><div class="guide-body"><b>새사업지</b> = 최근 새로 선정된 재개발 사업지를 모아서 보는 곳<br><br><b>변경</b> = 전에 봤을 때와 비교해서 달라진 내용을 모아보는 곳<br><br>예: 세대수 변경, 면적 변경, 진행단계 변경, 새로운 사업지 추가</div></details>

      <details class="card guide-card"><summary>⚙ API·데이터 상태는 뭐예요?</summary><div class="guide-body">앱이 데이터를 제대로 가져오고 있는지 보는 점검 화면이에요.<br><br>예를 들어 국토부 실거래, 온비드, 서울시 자료가 연결되어 있는지 확인할 수 있어요.<br><br>평소에는 자주 볼 필요 없고, 데이터가 이상할 때 확인하면 됩니다.</div></details>

      <details class="card guide-card"><summary>🚨 오류 문구는 어떻게 봐요?</summary><div class="guide-body"><b>현재 조회된 공매 0건</b> = 오류가 아니라 물건이 없는 상태<br><br><b>HTTP 400</b> = 앱이 API에 보낸 요청이 맞지 않는 상태<br><br><b>응답 형식 오류</b> = 받아야 할 데이터 대신 오류페이지 같은 다른 내용이 온 상태<br><br><b>API 오류</b>가 떠도 다른 데이터까지 전부 틀렸다는 뜻은 아니에요.</div></details>

      <details class="card guide-card"><summary>📖 어려운 단어 한 번에 보기</summary><div class="guide-body glossary">
        <div><b>재개발</b><span>오래된 동네를 정비해서 새 집과 도로 등을 만드는 사업</span></div>
        <div><b>사업지</b><span>재개발을 진행하는 지역</span></div>
        <div><b>세대수</b><span>집의 개수</span></div>
        <div><b>권리산정기준일</b><span>재개발 권리를 판단할 때 중요한 기준 날짜</span></div>
        <div><b>Polygon</b><span>지도에서 사업구역을 둘러싸는 선</span></div>
        <div><b>실거래</b><span>실제로 사고판 가격</span></div>
        <div><b>평당가</b><span>1평당 가격</span></div>
        <div><b>감정가</b><span>전문가가 평가한 물건 가격</span></div>
        <div><b>최저입찰가</b><span>입찰을 시작할 수 있는 최소 가격</span></div>
        <div><b>공매</b><span>공공기관 등이 인터넷 입찰로 물건을 파는 것</span></div>
        <div><b>API</b><span>컴퓨터끼리 데이터를 주고받는 통로</span></div>
        <div><b>Vercel</b><span>이 앱을 인터넷에서 실행해 주는 서버 서비스</span></div>
      </div></details>
    </section>

    <section class="section">
      <div class="card guide-final"><b>처음에는 이것만 보면 돼요</b><div>변경사항 확인 → 새사업지 보기 → 관심지역 별표 → 사업지 상세 보기 → 실거래 확인 → 공매 확인</div></div>
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
    .guide-card summary{list-style:none;cursor:pointer;padding:13px 15px;font-size:12.5px;font-weight:900;position:relative;padding-right:42px;line-height:1.45}
    .guide-card summary::-webkit-details-marker{display:none}
    .guide-card summary:after{content:'+';position:absolute;right:16px;top:10px;font-size:18px;color:#888}
    .guide-card[open] summary:after{content:'−'}
    .guide-card[open] summary{border-bottom:1px solid #ececec;background:#fafafa}
    .guide-body{padding:13px 15px 15px;font-size:11.5px;color:#5f5f5f;line-height:1.75}
    .guide-body b{color:#222}
    .guide-body .word{display:block;margin-top:10px;padding:8px 10px;border-radius:9px;background:#f5f5f5;color:#555}
    .glossary{display:grid;gap:7px}.glossary>div{background:#f7f7f7;border:1px solid #e8e8e8;border-radius:10px;padding:9px 10px}.glossary b{display:block;font-size:11px}.glossary span{display:block;margin-top:2px;font-size:10.5px;color:#707070}
    .guide-final{font-size:11px;line-height:1.7}.guide-final>b{display:block;font-size:13px;margin-bottom:4px}
    @media(max-width:420px){.bottomnav button{font-size:7.8px!important}.guide-card summary{font-size:12px}.guide-body{font-size:11px}}
  `;
  document.head.appendChild(style);
})();
