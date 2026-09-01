// v7.1 UI + OnBid endpoint patch
(() => {
  const statusBtn=document.querySelector('.bottomnav button[data-page="statusPage"]');
  if(statusBtn){
    statusBtn.addEventListener('click',()=>setTimeout(()=>{try{renderSources()}catch(e){}},50));
  }
  window.loadOnbidProject=async function(id,force=false){
    const p=(window.dashboard?.projects||dashboard?.projects||[]).find(x=>x.id===id);
    document.getElementById('onbidStamp').textContent=(p?p.name:'')+' 조회 중…';
    document.getElementById('onbidList').innerHTML='<div class="loading">온비드 공매를 조회하는 중…</div>';
    try{
      const qs=new URLSearchParams({id,...(force?{force:'1'}:{})});
      const r=await fetch('/api/onbid?'+qs.toString(),{cache:'no-store'});
      const d=await r.json();
      if(!r.ok||d.ok===false)throw new Error(d.error||('HTTP '+r.status));
      if(window.onbidData)window.onbidData[id]=d;
      renderOnbidProjectResult(d);
    }catch(e){
      document.getElementById('onbidStamp').textContent='조회 오류';
      document.getElementById('onbidList').innerHTML='<div class="notice error"><b>온비드 조회 오류</b><br>'+esc(e.message)+'</div>';
    }
  };
})();
