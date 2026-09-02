// Seoul Court Auction board integration
(() => {
  'use strict';

  const DATA_URL = 'https://raw.githubusercontent.com/yoon-donggyu/seoul-court-auction-pocket/main/court-auction-crawler/data/court-auctions.json';
  const SOURCE_HOME = 'https://yoon-donggyu.github.io/seoul-court-auction-pocket/';
  const COURT_SOURCE = 'https://www.courtauction.go.kr/';

  const REGION_MAP = {
    '도심권': ['종로구','중구','용산구'],
    '동북권': ['성동구','광진구','동대문구','중랑구','성북구','강북구','도봉구','노원구'],
    '서북권': ['은평구','서대문구','마포구'],
    '서남권': ['양천구','강서구','구로구','금천구','영등포구','동작구','관악구'],
    '동남권': ['서초구','강남구','송파구','강동구']
  };

  let payload = null;
  let region = '전체';
  let district = '전체';
  let query = '';
  let statusFilter = '전체';

  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money = v => {
    const n = Number(String(v ?? '').replace(/[^0-9]/g,''));
    return n ? `${n.toLocaleString('ko-KR')}원` : '미확인';
  };
  const extractDistrict = address => {
    const m = String(address || '').match(/서울(?:특별시|시)?\s*([가-힣]+구)/);
    return m?.[1] || '';
  };
  const normalizeDate = v => String(v || '').replace(/\//g,'.');

  function ensureUI() {
    const page = document.getElementById('onbidPage');
    if (!page || document.getElementById('courtAuctionSection')) return;

    const section = document.createElement('section');
    section.className = 'section';
    section.id = 'courtAuctionSection';
    section.innerHTML = `
      <div class="section-head"><h2>법원 경매</h2><small id="courtAuctionStamp">불러오는 중…</small></div>
      <div class="notice court-auction-notice"><b>대한민국 법원 경매정보</b><br>서울 5개 지방법원 경매 데이터를 자동 수집한 목록입니다. 기존 온비드 공매와 별도로 조회합니다.</div>
      <div class="court-auction-tools">
        <div class="court-auction-title">지역 카테고리</div>
        <div id="courtRegionChips" class="court-chiprow"></div>
        <div id="courtDistrictChips" class="court-chiprow sub"></div>
        <div class="searchbox court-searchbox"><input id="courtAuctionSearch" type="search" placeholder="주소 · 사건번호 · 용도 검색"><button id="clearCourtAuctionSearch" type="button">×</button></div>
        <div id="courtStatusChips" class="court-chiprow status"></div>
      </div>
      <div id="courtAuctionList" class="list"><div class="loading">법원 경매 데이터 불러오는 중…</div></div>
      <div class="court-auction-links"><a target="_blank" href="${SOURCE_HOME}">법원 경매 전용 화면</a><a target="_blank" href="${COURT_SOURCE}">대한민국 법원 경매정보</a></div>
    `;

    page.appendChild(section);
    document.getElementById('courtAuctionSearch')?.addEventListener('input', e => { query = e.target.value.trim().toLowerCase(); render(); });
    document.getElementById('clearCourtAuctionSearch')?.addEventListener('click', () => {
      const el = document.getElementById('courtAuctionSearch'); if (el) el.value = '';
      query = ''; render();
    });
    renderRegionChips();
    renderDistrictChips();
    renderStatusChips();
    load();
  }

  function activeItems() {
    return (payload?.items || []).filter(x => x.status !== '종료');
  }

  function renderRegionChips() {
    const root = document.getElementById('courtRegionChips'); if (!root) return;
    root.innerHTML = ['전체', ...Object.keys(REGION_MAP)].map(x => `<button class="court-chip ${region===x?'on':''}" data-v="${x}">${x}</button>`).join('');
    root.querySelectorAll('button').forEach(b => b.onclick = () => { region = b.dataset.v; district = '전체'; renderRegionChips(); renderDistrictChips(); render(); });
  }

  function renderDistrictChips() {
    const root = document.getElementById('courtDistrictChips'); if (!root) return;
    let ds = [...new Set(activeItems().map(x => extractDistrict(x.address)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
    if (region !== '전체') ds = ds.filter(d => (REGION_MAP[region] || []).includes(d));
    root.innerHTML = ['전체', ...ds].map(x => `<button class="court-chip ${district===x?'on':''}" data-v="${x}">${x}</button>`).join('');
    root.querySelectorAll('button').forEach(b => b.onclick = () => { district = b.dataset.v; renderDistrictChips(); render(); });
  }

  function renderStatusChips() {
    const root = document.getElementById('courtStatusChips'); if (!root) return;
    const names = ['전체','신규','변경','유효'];
    root.innerHTML = names.map(x => `<button class="court-chip ${statusFilter===x?'on':''}" data-v="${x}">${x}</button>`).join('');
    root.querySelectorAll('button').forEach(b => b.onclick = () => { statusFilter = b.dataset.v; renderStatusChips(); render(); });
  }

  function filtered() {
    return activeItems().filter(x => {
      const d = extractDistrict(x.address);
      const regionOk = region === '전체' || (REGION_MAP[region] || []).includes(d);
      const districtOk = district === '전체' || d === district;
      const statusOk = statusFilter === '전체' || x.status === statusFilter;
      const qOk = !query || [x.address,x.caseNumber,x.useType,x.court,x.saleStatus].join(' ').toLowerCase().includes(query);
      return regionOk && districtOk && statusOk && qOk;
    }).sort((a,b) => String(a.saleDate || '9999').localeCompare(String(b.saleDate || '9999')));
  }

  function renderCard(x) {
    const districtName = extractDistrict(x.address);
    const title = x.useType || '법원 경매 물건';
    const mapUrl = `https://map.naver.com/p/search/${encodeURIComponent(x.address || '')}`;
    const fail = x.failCount == null ? '미확인' : `${x.failCount}회`;
    return `<article class="card court-auction-card">
      <div class="area">${esc(districtName || x.court || '')} · ${esc(x.court || '')}</div>
      <div class="name">${esc(title)}</div>
      <div class="court-case">${esc(x.caseNumber || '')}${x.itemNumber ? ` · 물건 ${esc(x.itemNumber)}` : ''}</div>
      <div class="court-address">${esc(x.address || '주소 미확인')}</div>
      <div class="facts">
        <div class="fact"><span>감정가</span><b>${money(x.appraisalPrice)}</b></div>
        <div class="fact"><span>최저가</span><b>${money(x.minimumPrice)}</b></div>
        <div class="fact"><span>매각기일</span><b>${esc(normalizeDate(x.saleDate) || '미확인')}</b></div>
        <div class="fact"><span>유찰</span><b>${esc(fail)}</b></div>
      </div>
      <div class="typechips"><span class="typechip">${esc(x.status || '유효')}</span>${x.discountRate ? `<span class="typechip">감정가 대비 ${esc(x.discountRate)}%</span>` : ''}${x.saleStatus ? `<span class="typechip">${esc(x.saleStatus)}</span>` : ''}</div>
      <div class="actions"><a target="_blank" href="${mapUrl}">지도</a><a target="_blank" href="${SOURCE_HOME}">전용 화면</a><a target="_blank" href="${esc(x.sourceUrl || COURT_SOURCE)}">법원 원문</a></div>
    </article>`;
  }

  function render() {
    const root = document.getElementById('courtAuctionList'); if (!root) return;
    if (!payload) return;
    const items = filtered();
    const stamp = document.getElementById('courtAuctionStamp');
    if (stamp) stamp.textContent = `${items.length}/${activeItems().length}건 · ${payload.generatedAt ? payload.generatedAt.replace('T',' ').slice(0,16) : '갱신시각 미확인'}`;
    root.innerHTML = items.length ? items.map(renderCard).join('') : '<div class="empty">조건에 맞는 법원 경매 물건이 없습니다.</div>';
  }

  async function load() {
    const root = document.getElementById('courtAuctionList');
    try {
      const res = await fetch(`${DATA_URL}?t=${Date.now()}`, { cache:'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      payload = await res.json();
      if (!payload?.ok || !Array.isArray(payload.items)) throw new Error('데이터 형식 오류');
      renderRegionChips(); renderDistrictChips(); renderStatusChips(); render();
    } catch (e) {
      if (root) root.innerHTML = `<div class="notice error"><b>법원 경매 데이터 조회 오류</b><br>${esc(e.message)}</div>`;
      const stamp = document.getElementById('courtAuctionStamp'); if (stamp) stamp.textContent = '조회 실패';
    }
  }

  const style = document.createElement('style');
  style.textContent = `
    #courtAuctionSection{padding-bottom:22px}.court-auction-notice{margin-bottom:10px}
    .court-auction-tools{margin:0 0 10px;padding:10px;background:#f8f8f8;border:1px solid #e4e4e4;border-radius:13px}
    .court-auction-title{font-size:10px;font-weight:900;color:#555;margin-bottom:7px}.court-chiprow{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}.court-chiprow::-webkit-scrollbar{display:none}.court-chiprow.sub{margin-top:7px;padding-top:7px;border-top:1px solid #e8e8e8}.court-chiprow.status{margin-top:8px}.court-chip{flex:0 0 auto;border:1px solid #d8d8d8;background:#fff;border-radius:999px;padding:7px 10px;font-size:10px;font-weight:850;color:#666;white-space:nowrap}.court-chip.on{background:#202124;color:#fff;border-color:#202124}.court-searchbox{margin-top:9px}.court-auction-card .name{font-size:15px}.court-case{font-size:11px;font-weight:900;color:#555;margin-top:5px}.court-address{font-size:11px;color:#777;line-height:1.5;margin:5px 0 9px}.court-auction-links{display:flex;gap:7px;margin-top:9px}.court-auction-links a{flex:1;text-align:center;text-decoration:none;border:1px solid #ddd;background:#fff;color:#444;padding:9px;border-radius:10px;font-size:10px;font-weight:850}@media(max-width:420px){.court-chip{font-size:9px;padding:6px 9px}.court-auction-card .facts{grid-template-columns:repeat(2,1fr)}}
  `;
  document.head.appendChild(style);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureUI);
  else ensureUI();
})();
