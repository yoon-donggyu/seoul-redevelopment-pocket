// R-ONE Seoul apartment market signal. Static fetch, no polling/observer.
(() => {
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function lineSvg(series){
    const xs=(series||[]).slice(-12);if(xs.length<2)return'';
    const vals=xs.map(x=>Number(x.value)).filter(Number.isFinite);if(vals.length<2)return'';
    const min=Math.min(...vals),max=Math.max(...vals),span=max-min||1,w=280,h=78,p=8;
    const pts=xs.map((x,i)=>{const xx=p+i*(w-p*2)/(xs.length-1);const yy=h-p-(Number(x.value)-min)/span*(h-p*2);return `${xx.toFixed(1)},${yy.toFixed(1)}`}).join(' ');
    const labels=[xs[0],xs.at(-1)];
    return `<svg class="rone-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="서울 아파트 매매가격지수 최근 12개 관측치"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${pts.split(' ').at(-1).split(',')[0]}" cy="${pts.split(' ').at(-1).split(',')[1]}" r="3.5" fill="currentColor"/><text x="8" y="74">${esc(labels[0].label)}</text><text x="272" y="74" text-anchor="end">${esc(labels[1].label)}</text></svg>`;
  }
  function fmt(v,d=1){const n=Number(v);return Number.isFinite(n)?n.toLocaleString('ko-KR',{minimumFractionDigits:d,maximumFractionDigits:d}):'-'}
  async function load(){
    const card=document.querySelector('.signal-market');if(!card)return;
    const badge=card.querySelector('.signal-badge'),strong=document.getElementById('marketSignalText'),small=card.querySelector('small'),track=card.querySelector('.signal-track i');
    try{
      const r=await fetch('/api/rone',{cache:'no-store'}),d=await r.json();if(!r.ok||d.ok===false)throw new Error(d.error||'R-ONE 조회 실패');
      const x=d.latest||{},chg=Number(x.changePct),signal=x.signal||'확인중';
      if(badge){badge.textContent=signal;badge.classList.remove('wait');badge.classList.toggle('ok',signal==='상승');badge.classList.toggle('down',signal==='하락')}
      if(strong)strong.innerHTML=`서울 아파트 지수 <b>${fmt(x.value,1)}</b> <em class="market-change ${chg>0?'up':chg<0?'down':''}">${Number.isFinite(chg)?(chg>0?'+':'')+fmt(chg,2)+'%':'-'}</em>`;
      if(small)small.textContent=`${x.label||x.period||''} · 전월 대비 · 한국부동산원 R-ONE 월간 매매가격지수`;
      if(track&&Number.isFinite(chg))track.style.width=Math.max(8,Math.min(92,50+chg*20))+'%';
      let chart=card.querySelector('.rone-mini-chart');if(!chart){chart=document.createElement('div');chart.className='rone-mini-chart';card.appendChild(chart)}chart.innerHTML=lineSvg(d.series||[]);
      let sec=document.getElementById('roneTrendPanel');
      if(!sec){sec=document.createElement('section');sec.id='roneTrendPanel';sec.className='section';document.getElementById('quickSummary')?.after(sec)}
      const series=(d.series||[]).slice(-12);const first=series[0],last=series.at(-1);const longChg=first?.value?((Number(last.value)/Number(first.value)-1)*100):null;
      sec.innerHTML=`<div class="section-head"><h2>서울 아파트 집값 흐름</h2><small>R-ONE 공식지수</small></div><div class="card rone-panel"><div class="rone-head"><div><span>최근 ${series.length}개 월간 관측치 · 첫 값 대비</span><strong>${Number.isFinite(longChg)?(longChg>0?'+':'')+fmt(longChg,1)+'%':'-'}</strong></div><div><span>최신 월간 변화</span><strong class="${chg>0?'up':chg<0?'down':''}">${Number.isFinite(chg)?(chg>0?'+':'')+fmt(chg,2)+'%':'-'}</strong></div></div>${lineSvg(series)}<details><summary>이 숫자는 무슨 뜻인가요?</summary><p><b>${fmt(x.value,1)}</b>은 원 단위 가격이나 상승률이 아니라 한국부동산원의 가격지수 수준입니다. 아래 첫 값 대비 변화율도 개별 아파트 가격상승률이 아니라 <b>표시된 지수 관측치의 첫 값과 마지막 값을 비교한 앱 계산값</b>입니다. 실제 매수할 아파트 가격은 지역·단지·면적별 실거래를 따로 확인해야 합니다.</p></details></div>`;
    }catch(e){if(badge){badge.textContent='확인필요';badge.classList.add('wait')}if(strong)strong.textContent='R-ONE 연결 확인 필요';if(small)small.textContent=String(e.message||e);}
  }
  const style=document.createElement('style');style.textContent=`
    .market-change{font-style:normal;font-size:11px;margin-left:5px}.market-change.up,.rone-head .up{color:#b42318}.market-change.down,.rone-head .down,.signal-badge.down{color:#2563eb}
    .rone-mini-chart{margin-top:8px;color:#333}.rone-mini-chart .rone-svg{height:54px}
    .rone-svg{display:block;width:100%;height:100px;color:#333;overflow:visible}.rone-svg text{font-size:8px;fill:#888;stroke:none}
    .rone-panel{padding:13px}.rone-head{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}.rone-head>div{background:#f7f7f7;border:1px solid #e7e7e7;border-radius:11px;padding:9px}.rone-head span{display:block;font-size:9px;color:#777}.rone-head strong{display:block;font-size:17px;margin-top:2px}.rone-panel details{border-top:1px solid #eee;margin-top:7px}.rone-panel summary{font-size:10px;font-weight:900;padding:10px 0 4px;cursor:pointer}.rone-panel p{font-size:10px;line-height:1.6;color:#666;margin:5px 0 0}.rone-panel p b{color:#222}
  `;document.head.appendChild(style);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,0),{once:true});else setTimeout(load,0);
})();
