import { readFile } from 'node:fs/promises';

const VWORLD='https://api.vworld.kr/req/address';
let boundaryCache=null;

async function boundaries(){
  if(boundaryCache)return boundaryCache;
  const text=await readFile(new URL('../data/project_boundaries.geojson',import.meta.url),'utf8');
  boundaryCache=JSON.parse(text);
  return boundaryCache;
}
async function geocode(address,key){
  for(const type of ['road','parcel']){
    const u=new URL(VWORLD);
    for(const [k,v] of Object.entries({service:'address',request:'getcoord',version:'2.0',crs:'EPSG:4326',address,refine:'true',simple:'false',format:'json',type,key}))u.searchParams.set(k,v);
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),10000);
    try{
      const r=await fetch(u,{signal:ctrl.signal,headers:{Accept:'application/json','User-Agent':'SeoulRedevelopmentPocket/8.1'}});
      const t=await r.text();if(!r.ok)continue;
      let d;try{d=JSON.parse(t)}catch{continue}
      const resp=d?.response,res=resp?.result,p=res?.point,x=Number(p?.x),y=Number(p?.y);
      if(resp?.status==='OK'&&Number.isFinite(x)&&Number.isFinite(y))return{lat:y,lng:x,type,refinedText:res?.refined?.text||address};
    }catch{}finally{clearTimeout(timer)}
  }
  return null;
}
function pointInRing(x,y,ring){
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const xi=ring[i][0],yi=ring[i][1],xj=ring[j][0],yj=ring[j][1];
    const hit=((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/((yj-yi)||1e-12)+xi);
    if(hit)inside=!inside;
  }
  return inside;
}
function insideGeometry(lng,lat,g){
  if(!g)return false;
  if(g.type==='Polygon')return (g.coordinates||[]).some((ring,i)=>i===0?pointInRing(lng,lat,ring):false);
  if(g.type==='MultiPolygon')return (g.coordinates||[]).some(poly=>poly?.[0]&&pointInRing(lng,lat,poly[0]));
  return false;
}
function toXY(lng,lat,lat0){const R=6371000,rad=Math.PI/180;return{x:R*lng*rad*Math.cos(lat0*rad),y:R*lat*rad}}
function segDist(p,a,b){const vx=b.x-a.x,vy=b.y-a.y,wx=p.x-a.x,wy=p.y-a.y,c=vx*vx+vy*vy;if(!c)return Math.hypot(wx,wy);const t=Math.max(0,Math.min(1,(wx*vx+wy*vy)/c));return Math.hypot(p.x-(a.x+t*vx),p.y-(a.y+t*vy))}
function ringsOf(g){if(g?.type==='Polygon')return g.coordinates||[];if(g?.type==='MultiPolygon')return (g.coordinates||[]).flat();return[]}
function boundaryDistance(lng,lat,g){
  const p=toXY(lng,lat,lat),rings=ringsOf(g);let min=Infinity;
  for(const ring of rings)for(let i=1;i<ring.length;i++)min=Math.min(min,segDist(p,toXY(ring[i-1][0],ring[i-1][1],lat),toXY(ring[i][0],ring[i][1],lat)));
  return Number.isFinite(min)?Math.round(min):null;
}
export default async function handler(req,res){
  const key=(process.env.VWORLD_API_KEY||'').trim();if(!key)return res.status(500).json({ok:false,error:'VWORLD_API_KEY가 없습니다.'});
  const projectId=String(req.query.projectId||'').trim(),address=String(req.query.address||'').trim();
  if(!projectId||!address)return res.status(400).json({ok:false,error:'projectId와 address가 필요합니다.'});
  try{
    const fc=await boundaries(),feature=fc?.features?.find(f=>f.properties?.projectId===projectId);
    if(!feature)return res.status(200).json({ok:true,status:'boundary_wait',label:'구역경계 대기',projectId,address,source:'서울시 공간정보 + VWorld'});
    const point=await geocode(address,key);
    if(!point)return res.status(200).json({ok:true,status:'geocode_wait',label:'주소 좌표 미확인',projectId,address,source:'국토교통부 VWorld'});
    const inside=insideGeometry(point.lng,point.lat,feature.geometry),distance=boundaryDistance(point.lng,point.lat,feature.geometry);
    const status=inside?'inside':distance!=null&&distance<=200?'near':'outside';
    const label=inside?'사업구역 내부':status==='near'?`경계 인근 ${distance}m`:`구역 외부${distance!=null?' · '+distance+'m':''}`;
    return res.status(200).json({ok:true,status,label,inside,distanceMeters:distance,point,projectId,address,boundarySource:feature.properties?.source||'서울시 공간정보',legalEffect:false,generatedAt:new Date().toISOString()});
  }catch(e){return res.status(502).json({ok:false,error:String(e?.message||e)})}
}
