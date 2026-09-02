(() => {
  'use strict';

  const grid = document.querySelector('#guidePage .guide-grid');
  if (!grid || grid.dataset.groupedByTab === '1') return;

  const cards = [...grid.querySelectorAll(':scope > details.guide-card')];
  if (!cards.length) return;

  const textOf = card => (card.querySelector('summary')?.textContent || '').trim();
  const includesAny = (text, words) => words.some(word => text.includes(word));

  const groups = [
    {
      key: 'home',
      title: '🏠 홈 탭 가이드',
      desc: '내집마련 신호판 · 서울 집값 흐름 · 예산/면적 필터',
      words: ['내집마련 신호판', '서울 외곽 내집마련 보드', '전체 / 59㎡형 / 84㎡형', '4억 / 5억 / 6억 / 7억 이하', '데이터 신뢰도', '월 중간 거래가 / 평당가', '전월 대비 +3%', '왜 새로고침해도 데이터가 바로 안 바뀔', 'R-ONE 서울 집값 차트']
    },
    {
      key: 'new',
      title: '🆕 새사업지 · 재개발 가이드',
      desc: '사업지 진행상태 · 권리산정기준일 · 구역경계 · 변경사항',
      words: ['홈의 재개발 사업지', '미확인은 무슨 뜻', 'A·B·C·D 등급', '권리산정기준일', 'Polygon은', '사업구역 내부 / 인근 / 외부', '서울시 공식자료 보강', '새사업지 / 변경']
    },
    {
      key: 'market',
      title: '📊 실거래 탭 가이드',
      desc: '실제 거래가격 · 평당가 · 주변 시세 비교',
      words: ['실거래는 뭐예요', '평당가 중앙값은 뭐예요']
    },
    {
      key: 'auction',
      title: '⚖ 공매·경매 탭 가이드',
      desc: '온비드 공매 · 법원 경매 · 감정가 · 최저가 · 유찰 · 입찰 전 확인',
      words: ['온비드 공매는 뭐예요', '법원 경매', '사건번호 / 물건번호 / 중복', '감정가 / 최저매각가격 / 감정가 대비', '유찰 횟수', '매각기일 / 담당계', '최저가가 싸다고', '입찰 전에 꼭 확인할 서류', '재개발 Pocket에서는 경매', '감정가 / 최저입찰가', '할인율은 뭐예요', '상세조회 필요는 뭐예요']
    },
    {
      key: 'data',
      title: '🗂 자료 · API 상태 가이드',
      desc: '공식 데이터 출처와 연결 상태를 확인하는 메뉴',
      words: ['API·데이터 상태']
    },
    {
      key: 'common',
      title: '📖 공통 용어 가이드',
      desc: '앱 전체에서 자주 나오는 어려운 단어를 한 번에 확인',
      words: ['어려운 단어 한 번에 보기']
    }
  ];

  const buckets = new Map(groups.map(group => [group.key, []]));
  const other = [];

  for (const card of cards) {
    const title = textOf(card);
    const group = groups.find(item => includesAny(title, item.words));
    if (group) buckets.get(group.key).push(card);
    else other.push(card);
  }

  grid.innerHTML = '';
  grid.dataset.groupedByTab = '1';

  const appendGroup = (group, groupCards) => {
    if (!groupCards.length) return;
    const section = document.createElement('section');
    section.className = `guide-tab-group guide-tab-${group.key}`;
    section.innerHTML = `
      <div class="guide-tab-head">
        <h2>${group.title}</h2>
        <p>${group.desc}</p>
      </div>
      <div class="guide-tab-cards"></div>
    `;
    const holder = section.querySelector('.guide-tab-cards');
    groupCards.forEach(card => holder.appendChild(card));
    grid.appendChild(section);
  };

  groups.forEach(group => appendGroup(group, buckets.get(group.key)));

  if (other.length) {
    appendGroup({ key: 'etc', title: 'ℹ️ 기타 가이드', desc: '특정 탭에 묶이지 않는 공통 안내' }, other);
  }

  const style = document.createElement('style');
  style.textContent = `
    #guidePage .guide-grid{display:block!important}
    #guidePage .guide-tab-group{margin:0 0 20px}
    #guidePage .guide-tab-head{margin:0 2px 9px;padding:12px 14px;border-radius:14px;background:#202124;color:#fff}
    #guidePage .guide-tab-head h2{margin:0;font-size:15px;line-height:1.3;font-weight:900;color:#fff}
    #guidePage .guide-tab-head p{margin:5px 0 0;font-size:10px;line-height:1.5;color:#c9cbd0}
    #guidePage .guide-tab-cards{display:grid;gap:8px}
    #guidePage .guide-tab-group:last-child{margin-bottom:4px}
    @media(max-width:420px){
      #guidePage .guide-tab-head{padding:11px 12px;border-radius:13px}
      #guidePage .guide-tab-head h2{font-size:14px}
      #guidePage .guide-tab-head p{font-size:9.5px}
    }
  `;
  document.head.appendChild(style);
})();
