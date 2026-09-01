// Final wording audit: distinguish official source data from app-derived indicators.
(() => {
  'use strict';

  function replaceText(root,from,to){
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{if(n.nodeValue?.includes(from))n.nodeValue=n.nodeValue.split(from).join(to)});
  }

  function fixLabels(){
    replaceText(document.getElementById('cards'),'참고 가성비','앱 참고점수');
    replaceText(document.getElementById('newList'),'참고 가성비','앱 참고점수');
    replaceText(document.getElementById('marketList'),'참고 가성비','앱 참고점수');
    replaceText(document.getElementById('detailMain'),'참고 가성비','앱 참고점수');

    document.querySelectorAll('.gradebox .why').forEach(el=>{
      replaceText(el,'사업단계·거래량·데이터 완성도 참고점수','사업단계·참고 거래량·데이터 완성도 기반 앱 점수');
    });

    const court=document.querySelector('.court-status span');
    if(court)court.textContent='현재 앱에는 법원 경매 자동목록이 연결되어 있지 않습니다. 공식 연계 방법과 이용조건이 확인될 때까지 법원 공식 사이트 링크만 제공합니다.';

    const guide=document.getElementById('guidePage');
    if(guide){
      guide.querySelectorAll('details').forEach(d=>{
        const s=d.querySelector('summary'),body=d.querySelector('.guide-body');
        if(s?.textContent.includes('A·B·C·D 등급'))s.textContent='⭐ A·B·C·D 앱 참고등급은 뭐예요?';
        if(s?.textContent.includes('홈의 재개발 사업지는'))s.textContent='🏠 홈의 추적 정비사업지는 뭐예요?';
        if(s?.textContent.includes('❓ 미확인은')){
          if(body)body.innerHTML='<b>공식 확인값이 아직 연결되지 않았거나, 현재 자료에서 정확히 확인하지 못한 상태</b>라는 뜻이에요.<br><br>실제로 해당 정보가 존재하지 않는다는 뜻과는 다를 수 있습니다. 앱은 확인되지 않은 숫자나 날짜를 임의로 채우지 않습니다.';
        }
        if(s?.textContent.includes('A·B·C·D 앱 참고등급')&&body){
          body.innerHTML='사업지를 빠르게 비교하기 위해 <b>사업단계·참고 거래량·확인된 데이터 항목</b>을 앱 내부 기준으로 점수화한 표시예요.<br><br>서울시나 국토부가 부여한 투자등급이 아니며, A가 수익을 보장하거나 D가 나쁜 사업지라는 뜻도 아닙니다.';
        }
      });
    }
  }

  function wrap(name){
    const old=window[name];if(typeof old!=='function')return;
    window[name]=function(...args){const r=old.apply(this,args);Promise.resolve(r).finally(()=>setTimeout(fixLabels,0));return r};
  }
  ['renderDashboard','applyFilter','renderNew','renderMarket','renderDetail','showPage'].forEach(wrap);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(fixLabels,0),{once:true});else setTimeout(fixLabels,0);
})();
