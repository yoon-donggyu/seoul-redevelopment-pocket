// Spatial classification UI: VWorld geocoding + project polygon judgement. No observers/polling.
(() => {
  'use strict';
  const CACHE_KEY='srp_location_judge_v1';
  const readCache=()=>{try{return JSON.parse(sessionStorage.getItem(CACHE_KEY)||'{}')}catch{return {}}};
  const saveCache=x=>{try{sessionStorage.setItem(CACHE_KEY,JSON.stringify(x))}catch{}};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  async function judge(projectId,address){
    const k=projectId+'|'+address,c=readCache();if(c[k])return c[k];
    const u=new URL('/api/location-judge',location.origin);u.searchParams.set('projectId',projectId);u.searchParams.set('address',address);
    const r=await fetch(u,{cache:'no-store'}),t=await r.text();let d;try{d=JSON.parse(t)}catch{throw new Error('위치판정 응답 오류')};if(!r.ok||d.ok===false)throw new Error(d.error||('HTTP '+r.status));
    c[k]=d;saveCache(c);return d;
  }
  function badgeHTML(d){
    const cls=d.status==='inside'?'inside':d.status==='near'?'near':d.status==='outside'?'outside':'wait';
    return `<span class="spatial-badge ${cls}" title="지도 좌표와 사업구역 Polygon을 비교한 참고 판정">${esc(d.label||'판정대기')}</span>`;
  }
  function waitingHTML(){return '<span class="spatial-badge wait">위치 확인 중…</span>'}
  function addGuide(root){
    if(!root||root.querySelector('.spatial-guide'))return;
    const g=document.createElement('div');g.className='spatial-guide';g.innerHTML='<b>위치 판정</b><span><i class="dot inside"></i>구역 내부</span><span><i class="dot near"></i>경계 200m 이내</span><span><i class="dot outside"></i>구역 외부</span><small>서울시 Polygon + VWorld 주소좌표 참고판정 · 법적 효력 없음</small>';
    root.prepend(g);
  }
  async function enrichTrades(p){
    const section=[...document.querySelectorAll('#detailMain .section')].find(s=>s.querySelector('.section-head h2')?.textContent?.includes('최근 실거래'));
    const trades=section?.querySelectorAll('.trade');if(!trades?.length)return;
    addGuide(section.querySelector('.card'));
    const deals=p?.market?.recentDeals||[];
    for(let i=0;i<Math.min(10,trades.length,deals.length);i++){
      const row=trades[i],d=deals[i];if(row.dataset.spatialReady)return;
      row.dataset.spatialReady='1';
      const addr=['서울특별시',p.district,d.umdNm||p.dong,d.jibun||''].filter(Boolean).join(' ');
      const slot=document.createElement('div');slot.className='spatial-slot';slot.innerHTML=waitingHTML();row.appendChild(slot);
      try{slot.innerHTML=badgeHTML(await judge(p.id,addr))}catch{slot.innerHTML='<span class="spatial-badge wait">위치 판정 실패</span>'}
    }
    if(trades.length>10){const n=document.createElement('div');n.className='spatial-limit-note';n.textContent='속도 보호를 위해 최근 10건만 자동 위치 판정합니다.';section.querySelector('.card')?.appendChild(n)}
  }
  async function enrichOnbid(id){
    const root=document.getElementById('onbidList'),cards=[...(root?.querySelectorAll('article.card')||[])];if(!cards.length)return;
    for(let i=0;i<Math.min(12,cards.length);i++){
      const card=cards[i];if(card.dataset.spatialReady)continue;card.dataset.spatialReady='1';
      const address=card.querySelector('.area')?.textContent?.trim();if(!address)continue;
      let slot=card.querySelector('.spatial-slot');if(!slot){slot=document.createElement('div');slot.className='spatial-slot onbid-spatial';slot.innerHTML=waitingHTML();(card.querySelector('.name')||card).after(slot)}
      try{slot.innerHTML=badgeHTML(await judge(id,address))}catch{slot.innerHTML='<span class="spatial-badge wait">위치 판정 실패</span>'}
    }
    if(cards.length>12&&!root.querySelector('.spatial-limit-note')){const n=document.createElement('div');n.className='spatial-limit-note';n.textContent='속도 보호를 위해 상위 12개 공매 물건만 자동 위치 판정합니다.';root.appendChild(n)}
  }

  const oldDetail=window.renderDetail;
  if(typeof oldDetail==='function')window.renderDetail=function(p){const r=oldDetail.apply(this,arguments);setTimeout(()=>enrichTrades(p).catch(()=>{}),100);return r};
  const oldOnbid=window.loadOnbidProject;
  if(typeof oldOnbid==='function')window.loadOnbidProject=async function(id){const r=await oldOnbid.apply(this,arguments);setTimeout(()=>enrichOnbid(id).catch(()=>{}),100);return r};

  const style=document.createElement('style');style.textContent=`
    .spatial-guide{display:flex;align-items:center;gap:7px;flex-wrap:wrap;padding:9px 0 11px;border-bottom:1px solid #eee;margin-bottom:2px}.spatial-guide>b{font-size:10px}.spatial-guide>span{font-size:9px;color:#666;display:flex;align-items:center;gap:4px}.spatial-guide small{width:100%;font-size:8.5px;color:#999}.spatial-guide .dot{width:7px;height:7px;border-radius:50%;display:inline-block}.dot.inside{background:#067647}.dot.near{background:#b54708}.dot.outside{background:#777}
    .spatial-slot{margin-top:7px}.onbid-spatial{margin-top:2px;margin-bottom:8px}.spatial-badge{display:inline-flex;align-items:center;border-radius:999px;padding:5px 8px;font-size:9px;font-weight:900;border:1px solid #ddd;background:#f7f7f7}.spatial-badge.inside{color:#067647;border-color:#a7d7bd;background:#f1fbf5}.spatial-badge.near{color:#9a4b00;border-color:#e8c29b;background:#fff8ef}.spatial-badge.outside{color:#555;background:#f4f4f4}.spatial-badge.wait{color:#777;background:#fafafa}.spatial-limit-note{font-size:8.5px;color:#999;padding:9px 2px 0}
  `;document.head.appendChild(style);
})();
