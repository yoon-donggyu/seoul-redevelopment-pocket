const API='https://api.vworld.kr/req/address';

async function query(address,type,key){
  const u=new URL(API);u.searchParams.set('service','address');u.searchParams.set('request','getcoord');u.searchParams.set('version','2.0');u.searchParams.set('crs','EPSG:4326');u.searchParams.set('address',address);u.searchParams.set('refine','true');u.searchParams.set('simple','false');u.searchParams.set('format','json');u.searchParams.set('type',type);u.searchParams.set('key',key);
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
  try{const r=await fetch(u,{signal:ctrl.signal,headers:{Accept:'application/json','User-Agent':'SeoulRedevelopmentPocket/8.0'}});const text=await r.text();if(!r.ok)throw new Error(`VWorld HTTP ${r.status}`);let d;try{d=JSON.parse(text)}catch{throw new Error('VWorld 응답 형식 오류')};return d}finally{clearTimeout(timer)}
}
function parse(d){const resp=d?.response||{};const result=resp?.result||{};const point=result?.point||{};const status=resp?.status;const x=Number(point.x),y=Number(point.y);if(status==='OK'&&Number.isFinite(x)&&Number.isFinite(y))return{ok:true,lat:y,lng:x,refinedText:result.refined?.text||'',structure:result.refined?.structure||null};return null}

export default async function handler(req,res){
  const key=(process.env.VWORLD_API_KEY||'').trim();if(!key)return res.status(500).json({ok:false,error:'VWORLD_API_KEY가 없습니다.'});
  const address=String(req.query.address||'').trim();if(!address)return res.status(400).json({ok:false,error:'address가 필요합니다.'});
  try{
    for(const type of ['road','parcel']){const d=await query(address,type,key);const p=parse(d);if(p)return res.status(200).json({...p,type,address,source:'국토교통부 VWorld',generatedAt:new Date().toISOString()})}
    return res.status(404).json({ok:false,error:'주소 좌표를 찾지 못했습니다.',address,source:'국토교통부 VWorld'});
  }catch(e){return res.status(502).json({ok:false,error:String(e?.message||e),source:'국토교통부 VWorld'})}
}
