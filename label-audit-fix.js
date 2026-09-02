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

  function fixAuctionTabs(){
    const page=document.getElementById('onbidPage');
    const sw=document.getElementById('propertySourceSwitch');
    const court=document.getElementById('courtAuctionSection');
    if(!page||!sw||!court)return;

    // court-auction-ui.js가 만든 실제 법원경매 보드는 온비드 섹션에서 제외한다.
    court.classList.remove('onbid-source-section');

    // optimize-ui.js가 예전에 만든 안내용 임시 법원경매 박스는 제거한다.
    page.querySelectorAll('.court-auction-section').forEach(el=>{
      if(el!==court)el.remove();
    });

    const header=page.querySelector('header');
    const title=header?.querySelector('h1');
    const sub=header?.querySelector('.sub');
    const onbidSections=[...page.children].filter(el=>
      el.tagName==='SECTION' &&
      el!==sw &&
      el!==court &&
      !el.classList.contains('court-auction-section')
    );

    function setSource(source){
      sw.querySelectorAll('button[data-source]').forEach(b=>b.classList.toggle('on',b.dataset.source===source));
      onbidSections.forEach(el=>{el.style.display=source==='onbid'?'':'none'});
      court.style.display=source==='court'?'':'none';
      if(title)title.textContent=source==='court'?'법원 경매':'온비드 공매';
      if(sub)sub.textContent=source==='court'?'서울 5개 지방법원 경매 데이터를 조회합니다.':'사업지를 선택하면 해당 구·동의 온비드 공매를 조회합니다.';
    }

    sw.querySelectorAll('button[data-source]').forEach(b=>{
      b.onclick=()=>setSource(b.dataset.source);
    });

    const selected=sw.querySelector('button.on[data-source]')?.dataset.source||'onbid';
    setSource(selected);
  }

  function wrap(name){
    const old=window[name];if(typeof old!=='function')return;
    window[name]=function(...args){
      const r=old.apply(this,args);
      Promise.resolve(r).finally(()=>setTimeout(()=>{fixLabels();fixAuctionTabs()},0));
      return r;
    };
  }

  ['renderDashboard','applyFilter','renderNew','renderMarket','renderDetail','showPage'].forEach(wrap);
  const boot=()=>setTimeout(()=>{fixLabels();fixAuctionTabs()},0);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
