// Beginner-friendly Seoul outer-district homebuying board. Official transaction data only.
(() => {
  'use strict';
  let DATA=null,segment='all',budget=0,quick='전체';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
  const hasNum=n=>n!==null&&n!==undefined&&n!==''&&Number.isFinite(Number(n));
  const moneyMan=n=>hasNum(n)?Math.round(Number(n)).toLocaleString('ko-KR')+'만원':'미확인';
  const moneyEok=n=>hasNum(n)?(Number(n)/10000).toFixed(Number(n)%10000?1:0)+'억':'미확인';
  const pct=n=>hasNum(n)?(Number(n)>0?'+':'')+Number(n).toFixed(1)+'%':'미확인';
  const burdenText=x=>x==='낮음'?'가격부담 낮음':x==='높음'?'가격부담 높음':x==='보통'?'가격부담 보통':'가격 미확인';
  const trendText=n=>!hasNum(n)?'변화 미확인':Number(n)>=3?'최근 거래가격 ↑':Number(n)<=-3?'최근 거래가격 ↓':'최근 거래가격 보합';
  const trendClass=n=>!hasNum(n)?'':Number(n)>0?'up':Number(n)<0?'down':'';
  const confClass=x=>x==='신뢰 높음'?'good':x==='표본 부족'?'low':'mid';
  const segmentLabel=()=>segment==='type59'?'59㎡형':segment==='type84'?'84㎡형':'전체 면적';
  const trackedCount=x=>Number(x.trackedProjectCount??x.redevelopmentCount??0);

  function ensure(){
    if(document.getElementById('homebuyingBoard'))return document.getElementById('homebuyingBoard');
    const anchor=document.getElementById('roneTrendPanel')||document.getElementById('quickSummary');
    const sec=document.createElement('section');sec.id='homebuyingBoard';sec.className='section';
    sec.innerHTML=`<div class="section-head"><h2>서울 외곽 내집마련 보드</h2><small>초보자용 비교</small></div>
      <div class="hb-filterbox"><b>① 평형</b><div class="homebuying-tools hb-segments"><button class="hb-chip on" data-seg="all">전체</button><button class="hb-chip" data-seg="type59">59㎡형</button><button class="hb-chip" data-seg="type84">84㎡형</button></div>
      <b>② 예산</b><div class="homebuying-tools hb-budgets"><button class="hb-chip on" data-budget="0">전체</button><button class="hb-chip" data-budget="40000">4억 이하</button><button class="hb-chip" data-budget="50000">5억 이하</button><button class="hb-chip" data-budget="60000">6억 이하</button><button class="hb-chip" data-budget="70000">7억 이하</button></div>
      <b>③ 조건</b><div class="homebuying-tools hb-quick"><button class="hb-chip on" data-quick="전체">전체</button><button class="hb-chip" data-quick="낮음">가격부담 낮음</button><button class="hb-chip" data-quick="하락">최근 하락</button><button class="hb-chip" data-quick="추적사업지">앱 추적 사업지 있음</button></div></div>
      <div id="homebuyingMeta" class="hb-meta">국토부 실거래 불러오는 중…</div><div id="homebuyingList" class="hb-grid"><div class="loading">서울 아파트 실거래 비교 중…</div></div>
      <details class="hb-help"><summary>59㎡형·84㎡형과 신뢰도는 어떻게 보나요?</summary><div><b>59㎡형</b>은 전용 55~65㎡, <b>84㎡형</b>은 전용 80~90㎡ 거래를 묶은 참고 비교입니다. <b>신뢰 높음</b>은 최신 월 거래 20건 이상, <b>참고</b>는 5~19건, <b>표본 부족</b>은 4건 이하입니다. 이 신뢰도는 공공기관 등급이 아니라 <b>앱이 거래 표본 수만으로 구분한 참고표시</b>입니다. 예산 필터는 선택한 평형의 <b>월 중간 거래가</b> 기준입니다.</div></details>`;
    if(anchor)anchor.after(sec);else document.getElementById('home')?.appendChild(sec);
    bindControls();return sec;
  }
  function currentRows(){
    if(!DATA)return[];
    return (DATA.rows||[]).map(x=>({...x,view:x.segments?.[segment]||null})).filter(x=>{
      const s=x.view;if(!s)return false;
      if(budget&&(!hasNum(s.latestMedianAmount)||Number(s.latestMedianAmount)>budget))return false;
      if(quick==='낮음'&&s.priceBurden!=='낮음')return false;
      if(quick==='하락'&&!(hasNum(s.changePct)&&Number(s.changePct)<0))return false;
      if(quick==='추적사업지'&&!(trackedCount(x)>0))return false;
      return true;
    }).sort((a,b)=>(hasNum(a.view?.latestMedianPyeong)?Number(a.view.latestMedianPyeong):Infinity)-(hasNum(b.view?.latestMedianPyeong)?Number(b.view.latestMedianPyeong):Infinity));
  }
  function render(){
    ensure();if(!DATA)return;
    const root=document.getElementById('homebuyingList'),meta=document.getElementById('homebuyingMeta'),rows=currentRows();
    const diag=DATA.diagnostics||{},diagText=diag.errorCount?` · API 오류 ${diag.errorCount}개 지역`:'';
    if(meta)meta.textContent=`${DATA.months?.[1]||'-'} → ${DATA.months?.[0]||'-'} · ${segmentLabel()} · ${budget?moneyEok(budget)+' 이하':'예산 전체'} · ${rows.length}개 지역${diagText}`;
    if(diag.okCount===0&&diag.errorCount>0){
      const first=(DATA.rows||[]).find(x=>x.apiErrors?.length)?.apiErrors?.[0];
      root.innerHTML=`<div class="notice error" style="grid-column:1/-1"><b>국토부 실거래 조회 실패</b><br>${esc(first?.error||'공공데이터 API 응답을 확인해야 합니다.')}<br><small>오류 응답은 캐시하지 않으므로 새 배포 후 다시 조회됩니다.</small></div>`;
      return;
    }
    root.innerHTML=rows.length?rows.map((x,i)=>{const s=x.view||{},bad=x.status==='error';return `<article class="hb-card ${bad?'hb-error-card':''}">
      <div class="hb-rank">${i+1}</div>
      <div class="hb-head"><div><span>${esc(x.district)} · ${esc(segmentLabel())}</span><strong>${bad?'조회 실패':moneyMan(s.latestMedianPyeong)+' / 평'}</strong></div><b class="hb-grade burden-${esc(s.priceBurden||'미확인')}">${bad?'API 확인':esc(burdenText(s.priceBurden))}</b></div>
      <div class="hb-kpis"><div><span>월 중간 거래가</span><b>${bad?'미확인':moneyMan(s.latestMedianAmount)}</b></div><div><span>전월 대비</span><b class="${trendClass(s.changePct)}">${bad?'미확인':pct(s.changePct)}</b></div><div><span>최근 거래건수</span><b>${bad?'미확인':Number(s.latestCount||0).toLocaleString('ko-KR')+'건'}</b></div><div><span>표본 참고도</span><b class="conf-${confClass(s.confidence)}">${bad?'조회 실패':esc(s.confidence||'미확인')}</b></div></div>
      <div class="hb-status"><span class="${trendClass(s.changePct)}">${bad?'실거래 API 확인 필요':trendText(s.changePct)}</span><span>앱 추적 정비사업 ${trackedCount(x)}곳</span><span>온비드 조회 가능</span><span>법원경매 API 대기</span></div>
      <details><summary>초보자 설명</summary><p>${bad?`국토부 API 조회 중 오류가 발생했습니다. ${esc(x.apiErrors?.[0]?.error||'잠시 후 다시 확인하세요.')}`:`<b>${esc(x.district)}</b>의 ${esc(segmentLabel())} 신고거래를 모아 비교한 값입니다. <b>앱 추적 정비사업 ${trackedCount(x)}곳</b>은 서울시 전체 공식 사업 수가 아니라 이 앱의 등록 목록 중 해당 자치구 사업지 수입니다. ${s.confidence==='표본 부족'?'<b>거래 수가 적어 변화율은 특히 조심해서 봐야 합니다.</b>':'한 달의 거래 구성에 따라 변화율이 달라질 수 있으므로 원하는 단지의 최근 실거래를 한 번 더 확인하세요.'}`}</p></details>
    </article>`}).join(''):'<div class="card"><div class="empty">현재 선택한 평형·예산·조건에 맞는 지역이 없습니다.</div></div>';
  }
  function setActive(group,attr,value){document.querySelectorAll(group+' .hb-chip').forEach(b=>b.classList.toggle('on',String(b.dataset[attr])===String(value)))}
  function bindControls(){
    document.querySelectorAll('.hb-segments .hb-chip').forEach(b=>b.onclick=()=>{segment=b.dataset.seg;setActive('.hb-segments','seg',segment);render()});
    document.querySelectorAll('.hb-budgets .hb-chip').forEach(b=>b.onclick=()=>{budget=Number(b.dataset.budget||0);setActive('.hb-budgets','budget',budget);render()});
    document.querySelectorAll('.hb-quick .hb-chip').forEach(b=>b.onclick=()=>{quick=b.dataset.quick;setActive('.hb-quick','quick',quick);render()});
  }
  async function load(){ensure();try{const r=await fetch('/api/homebuying',{cache:'default'}),d=await r.json();if(!r.ok||d.ok===false)throw new Error(d.error||'조회 실패');DATA=d;render()}catch(e){const root=document.getElementById('homebuyingList');if(root)root.innerHTML=`<div class="notice error"><b>내집마련 보드 조회 오류</b><br>${esc(e.message||e)}</div>`}}
  const style=document.createElement('style');style.textContent=`
    .hb-filterbox{background:#f7f7f7;border:1px solid #e2e2e2;border-radius:13px;padding:9px;margin-bottom:8px}.hb-filterbox>b{display:block;font-size:9px;color:#666;margin:2px 2px 5px}.homebuying-tools{display:flex;gap:6px;overflow-x:auto;margin-bottom:8px;scrollbar-width:none}.homebuying-tools:last-child{margin-bottom:0}.homebuying-tools::-webkit-scrollbar{display:none}.hb-chip{flex:0 0 auto;border:1px solid #d8d8d8;background:#fff;border-radius:999px;padding:7px 10px;font-size:9px;font-weight:900;color:#666}.hb-chip.on{background:#222;color:#fff;border-color:#222}.hb-meta{font-size:9px;color:#888;margin:0 2px 8px}.hb-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.hb-card{position:relative;background:#fff;border:1px solid #ddd;border-radius:15px;padding:12px;box-shadow:0 4px 14px rgba(0,0,0,.05)}.hb-error-card{border-color:#f0b8b8}.hb-rank{position:absolute;right:10px;top:10px;font-size:9px;color:#999;font-weight:900}.hb-head{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;padding-right:24px}.hb-head span{display:block;font-size:10px;color:#666;font-weight:900}.hb-head strong{display:block;font-size:15px;margin-top:3px}.hb-grade{font-size:8px;padding:4px 6px;border-radius:999px;border:1px solid #ddd;background:#f7f7f7;white-space:nowrap}.burden-낮음{color:#067647}.burden-높음{color:#b42318}.hb-kpis{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px}.hb-kpis>div{background:#f7f7f7;border:1px solid #e8e8e8;border-radius:10px;padding:8px}.hb-kpis span{display:block;font-size:8px;color:#777}.hb-kpis b{display:block;font-size:11px;margin-top:2px}.hb-kpis .up,.hb-status .up{color:#b42318}.hb-kpis .down,.hb-status .down{color:#2563eb}.conf-good{color:#067647}.conf-low{color:#b42318}.conf-mid{color:#8a5a00}.hb-status{display:flex;gap:5px;flex-wrap:wrap;margin-top:9px}.hb-status span{font-size:8px;border:1px solid #e2e2e2;background:#fafafa;border-radius:999px;padding:4px 6px}.hb-card details{border-top:1px solid #eee;margin-top:9px}.hb-card summary{font-size:9px;font-weight:900;padding-top:8px;cursor:pointer}.hb-card p{font-size:9px;line-height:1.6;color:#666}.hb-help{margin-top:8px;background:#fff;border:1px solid #ddd;border-radius:13px;padding:0 12px}.hb-help summary{padding:10px 0;font-size:10px;font-weight:900;cursor:pointer}.hb-help div{border-top:1px solid #eee;padding:10px 0 12px;font-size:10px;color:#666;line-height:1.65}.hb-help b{color:#222}@media(max-width:560px){.hb-grid{grid-template-columns:1fr}.hb-card{padding:11px}}
  `;document.head.appendChild(style);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,0),{once:true});else setTimeout(load,0);
})();
