// Beginner-friendly Seoul outer-district homebuying board. Official transaction data only.
(() => {
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const moneyMan=n=>Number.isFinite(Number(n))?Math.round(Number(n)).toLocaleString('ko-KR')+'만원':'미확인';
  const pct=n=>Number.isFinite(Number(n))?(Number(n)>0?'+':'')+Number(n).toFixed(1)+'%':'미확인';
  const burdenText=x=>x==='낮음'?'가격부담 낮음':x==='높음'?'가격부담 높음':x==='보통'?'가격부담 보통':'가격 미확인';
  const trendText=n=>!Number.isFinite(Number(n))?'변화 미확인':Number(n)>=3?'최근 거래가격 ↑':Number(n)<=-3?'최근 거래가격 ↓':'최근 거래가격 보합';
  const trendClass=n=>!Number.isFinite(Number(n))?'':Number(n)>0?'up':Number(n)<0?'down':'';

  function ensure(){
    if(document.getElementById('homebuyingBoard'))return document.getElementById('homebuyingBoard');
    const anchor=document.getElementById('roneTrendPanel')||document.getElementById('quickSummary');
    const sec=document.createElement('section');sec.id='homebuyingBoard';sec.className='section';
    sec.innerHTML='<div class="section-head"><h2>서울 외곽 내집마련 보드</h2><small>초보자용 비교</small></div><div class="homebuying-tools"><button class="hb-chip on" data-filter="전체">전체</button><button class="hb-chip" data-filter="가격부담 낮음">가격부담 낮음</button><button class="hb-chip" data-filter="하락">최근 하락</button><button class="hb-chip" data-filter="재개발">재개발 있음</button></div><div id="homebuyingMeta" class="hb-meta">국토부 실거래 불러오는 중…</div><div id="homebuyingList" class="hb-grid"><div class="loading">서울 아파트 실거래 비교 중…</div></div><details class="hb-help"><summary>이 보드는 어떻게 보면 되나요?</summary><div><b>가격부담</b>은 선택한 12개 자치구끼리 최근 평당 실거래 중앙값을 비교한 상대등급입니다. <b>변화율</b>은 각 월에 신고된 거래들의 평당가 중앙값 변화라서 한국부동산원 가격지수와는 다릅니다. 실제 매수 전에는 원하는 단지의 최근 거래를 따로 확인하세요.</div></details>';
    if(anchor)anchor.after(sec);else document.getElementById('home')?.appendChild(sec);
    return sec;
  }
  function render(data){
    ensure();const root=document.getElementById('homebuyingList'),meta=document.getElementById('homebuyingMeta');
    if(meta)meta.textContent=`${data.months?.[1]||'-'} → ${data.months?.[0]||'-'} · 국토부 아파트 실거래`;
    const rows=data.rows||[];
    root.innerHTML=rows.map((x,i)=>`<article class="hb-card" data-burden="${esc(burdenText(x.priceBurden))}" data-trend="${Number(x.changePct)<0?'하락':'기타'}" data-redev="${x.redevelopmentCount>0?'재개발':''}">
      <div class="hb-rank">${i+1}</div>
      <div class="hb-head"><div><span>${esc(x.district)}</span><strong>${moneyMan(x.latestMedianPyeong)} / 평</strong></div><b class="hb-grade burden-${esc(x.priceBurden)}">${esc(burdenText(x.priceBurden))}</b></div>
      <div class="hb-kpis"><div><span>월 중간 거래가</span><b>${moneyMan(x.latestMedianAmount)}</b></div><div><span>전월 대비</span><b class="${trendClass(x.changePct)}">${pct(x.changePct)}</b></div><div><span>최근 거래건수</span><b>${Number(x.latestCount||0).toLocaleString('ko-KR')}건</b></div><div><span>재개발 추적</span><b>${Number(x.redevelopmentCount||0)}곳</b></div></div>
      <div class="hb-status"><span class="${trendClass(x.changePct)}">${trendText(x.changePct)}</span><span>온비드 조회 가능</span><span>법원경매 API 대기</span></div>
      <details><summary>초보자 설명</summary><p><b>${esc(x.district)}</b>의 최근 신고거래를 모아 비교한 값입니다. 같은 아파트만 비교한 지수가 아니므로 전월 대비 수치가 크게 움직일 수 있습니다. 가격부담 등급은 이 보드의 12개 자치구 안에서만 비교한 상대값입니다.</p></details>
    </article>`).join('')||'<div class="empty">비교할 데이터가 없습니다.</div>';
    bindFilters();
  }
  function bindFilters(){
    const sec=document.getElementById('homebuyingBoard');if(!sec)return;
    sec.querySelectorAll('.hb-chip').forEach(btn=>btn.onclick=()=>{
      sec.querySelectorAll('.hb-chip').forEach(x=>x.classList.toggle('on',x===btn));const f=btn.dataset.filter;
      sec.querySelectorAll('.hb-card').forEach(card=>{let ok=f==='전체';if(f==='가격부담 낮음')ok=card.dataset.burden==='가격부담 낮음';if(f==='하락')ok=card.dataset.trend==='하락';if(f==='재개발')ok=card.dataset.redev==='재개발';card.style.display=ok?'':'none'});
    });
  }
  async function load(){ensure();try{const r=await fetch('/api/homebuying',{cache:'no-store'}),d=await r.json();if(!r.ok||d.ok===false)throw new Error(d.error||'조회 실패');render(d)}catch(e){const root=document.getElementById('homebuyingList');if(root)root.innerHTML=`<div class="notice error"><b>내집마련 보드 조회 오류</b><br>${esc(e.message||e)}</div>`}}
  const style=document.createElement('style');style.textContent=`
    .homebuying-tools{display:flex;gap:6px;overflow-x:auto;margin-bottom:8px;scrollbar-width:none}.homebuying-tools::-webkit-scrollbar{display:none}.hb-chip{flex:0 0 auto;border:1px solid #d8d8d8;background:#fff;border-radius:999px;padding:7px 10px;font-size:9px;font-weight:900;color:#666}.hb-chip.on{background:#222;color:#fff;border-color:#222}.hb-meta{font-size:9px;color:#888;margin:0 2px 8px}.hb-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.hb-card{position:relative;background:#fff;border:1px solid #ddd;border-radius:15px;padding:12px;box-shadow:0 4px 14px rgba(0,0,0,.05)}.hb-rank{position:absolute;right:10px;top:10px;font-size:9px;color:#999;font-weight:900}.hb-head{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;padding-right:24px}.hb-head span{display:block;font-size:10px;color:#666;font-weight:900}.hb-head strong{display:block;font-size:15px;margin-top:3px}.hb-grade{font-size:8px;padding:4px 6px;border-radius:999px;border:1px solid #ddd;background:#f7f7f7;white-space:nowrap}.burden-낮음{color:#067647}.burden-높음{color:#b42318}.hb-kpis{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px}.hb-kpis>div{background:#f7f7f7;border:1px solid #e8e8e8;border-radius:10px;padding:8px}.hb-kpis span{display:block;font-size:8px;color:#777}.hb-kpis b{display:block;font-size:11px;margin-top:2px}.hb-kpis .up,.hb-status .up{color:#b42318}.hb-kpis .down,.hb-status .down{color:#2563eb}.hb-status{display:flex;gap:5px;flex-wrap:wrap;margin-top:9px}.hb-status span{font-size:8px;border:1px solid #e2e2e2;background:#fafafa;border-radius:999px;padding:4px 6px}.hb-card details{border-top:1px solid #eee;margin-top:9px}.hb-card summary{font-size:9px;font-weight:900;padding-top:8px;cursor:pointer}.hb-card p{font-size:9px;line-height:1.6;color:#666}.hb-help{margin-top:8px;background:#fff;border:1px solid #ddd;border-radius:13px;padding:0 12px}.hb-help summary{padding:10px 0;font-size:10px;font-weight:900;cursor:pointer}.hb-help div{border-top:1px solid #eee;padding:10px 0 12px;font-size:10px;color:#666;line-height:1.65}.hb-help b{color:#222}@media(max-width:560px){.hb-grid{grid-template-columns:1fr}.hb-card{padding:11px}}
  `;document.head.appendChild(style);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,0),{once:true});else setTimeout(load,0);
})();
