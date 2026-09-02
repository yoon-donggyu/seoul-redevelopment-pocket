// Mobile flow fixes: OnBid result-first navigation + home sort tools at top.
// No MutationObserver / no polling loops.
(() => {
  'use strict';

  function moveHomeToolsToTop(){
    const bar=document.getElementById('homeTools');
    const panel=document.querySelector('#home .filterpanel');
    if(!bar||!panel)return;
    if(panel.firstElementChild!==bar)panel.prepend(bar);
  }

  function onbidParts(){
    const page=document.getElementById('onbidPage');
    const chooser=document.getElementById('onbidProjectList')?.closest('section')||null;
    const result=document.getElementById('onbidList')?.closest('section')||null;
    const intro=page?[...page.children].find(el=>el.tagName==='SECTION'&&el!==chooser&&el!==result&&el.id!=='propertySourceSwitch'&&el.querySelector('.notice'))||null:null;
    return {page,chooser,result,intro};
  }

  function ensureOnbidBackButton(){
    const {result}=onbidParts();
    if(!result)return null;
    let btn=document.getElementById('onbidBackToAreas');
    if(btn){btn.textContent='← 뒤로가기';return btn;}
    btn=document.createElement('button');
    btn.type='button';
    btn.id='onbidBackToAreas';
    btn.className='onbid-back-to-areas';
    btn.textContent='← 뒤로가기';
    btn.onclick=()=>showOnbidChooser(true);
    result.prepend(btn);
    return btn;
  }

  function showOnbidChooser(scroll=true){
    const {chooser,result,intro}=onbidParts();
    if(intro)intro.style.display='';
    if(chooser)chooser.style.display='';
    if(result)result.style.display='none';
    if(scroll)window.scrollTo({top:0,left:0,behavior:'auto'});
  }

  function showOnbidResults(){
    const {chooser,result,intro}=onbidParts();
    if(intro)intro.style.display='none';
    if(chooser)chooser.style.display='none';
    if(result)result.style.display='';
    ensureOnbidBackButton();
    window.scrollTo({top:0,left:0,behavior:'auto'});
  }

  const oldDashboard=window.renderDashboard;
  if(typeof oldDashboard==='function')window.renderDashboard=function(...args){const r=oldDashboard.apply(this,args);setTimeout(moveHomeToolsToTop,0);return r};
  const oldChooser=window.renderOnbidChooser;
  if(typeof oldChooser==='function')window.renderOnbidChooser=function(...args){const r=oldChooser.apply(this,args);setTimeout(()=>showOnbidChooser(false),0);return r};
  const oldLoad=window.loadOnbidProject;
  if(typeof oldLoad==='function')window.loadOnbidProject=async function(...args){showOnbidResults();try{return await oldLoad.apply(this,args)}finally{setTimeout(()=>{ensureOnbidBackButton();window.scrollTo({top:0,left:0,behavior:'auto'})},0)}};

  document.addEventListener('click',e=>{const btn=e.target?.closest?.('#propertySourceSwitch button[data-source="onbid"]');if(btn)setTimeout(()=>showOnbidChooser(true),0)});

  const style=document.createElement('style');
  style.textContent=`
    #home .filterpanel>#homeTools{margin:0 0 10px!important;padding-bottom:9px;border-bottom:1px solid #e8e8e8}
    .onbid-back-to-areas{width:100%;border:1px solid #202124;background:#202124;color:#fff;border-radius:13px;padding:13px 15px;margin:0 0 10px;font-size:11px;font-weight:900;text-align:left;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.08)}
    .onbid-back-to-areas:hover{background:#111;color:#fff}.onbid-back-to-areas:active{transform:translateY(1px)}
  `;
  document.head.appendChild(style);

  setTimeout(()=>{moveHomeToolsToTop();const {result}=onbidParts();if(result)showOnbidChooser(false)},0);
})();