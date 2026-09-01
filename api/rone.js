const API='https://www.reb.or.kr/r-one/openapi/SttsApiTblData.do';
const STATBL_ID='A_2024_00178';
const SEOUL_CLS_ID='500007';

function pick(obj,keys){for(const k of keys){if(obj?.[k]!=null&&String(obj[k]).trim()!=='')return obj[k]}return null}
function rowsFrom(data){
  const found=[];
  const walk=v=>{
    if(!v||typeof v!=='object')return;
    if(Array.isArray(v)){if(v.length&&v.every(x=>x&&typeof x==='object'))found.push(v);for(const x of v)walk(x);return}
    for(const x of Object.values(v))walk(x);
  };
  walk(data);
  return found.sort((a,b)=>b.length-a.length)[0]||[];
}
function n(v){const x=Number(String(v??'').replace(/,/g,''));return Number.isFinite(x)?x:null}
function period(row){return String(pick(row,['WRTTIME_IDTFR_NM','WRTTIME_IDTFR_ID','WRTTIME_NM','TIME','BASE_YM'])||'').trim()}
function labelPeriod(s){
  const m=String(s).match(/(20\d{2})\D*(0?[1-9]|1[0-2])/);
  if(m)return `${m[1].slice(2)}.${String(m[2]).padStart(2,'0')}`;
  if(/^20\d{4}$/.test(s))return `${s.slice(2,4)}.${s.slice(4)}`;
  return s;
}
function normalize(rows){
  const out=[];
  for(const r of rows){
    const value=n(pick(r,['DATA_VALUE','DTA_VAL','VALUE','VAL']));
    const p=period(r);if(value==null||!p)continue;
    const item=String(pick(r,['ITM_NM','ITEM_NAME','ITEM_NAME1','ITEM_NAME2','ITM_NAME'])||'');
    const cls=String(pick(r,['CLS_NM','CLS_NAME','CLASS_NAME'])||'');
    out.push({period:p,label:labelPeriod(p),value,item,cls});
  }
  const preferred=out.filter(x=>/아파트/.test(x.item)&&/(매매|가격지수|지수)/.test(x.item));
  const base=preferred.length>=2?preferred:out;
  const seen=new Map();for(const x of base)seen.set(x.period,x);
  return [...seen.values()].sort((a,b)=>String(a.period).localeCompare(String(b.period)));
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','public, s-maxage=43200, stale-while-revalidate=86400');
  try{
    const key=(process.env.RONE_API_KEY||'').trim();
    if(!key)return res.status(500).json({ok:false,error:'RONE_API_KEY가 없습니다.'});
    const now=new Date();const start=String(now.getFullYear()-1);
    const u=new URL(API);
    u.searchParams.set('KEY',key);u.searchParams.set('Type','json');
    u.searchParams.set('STATBL_ID',STATBL_ID);u.searchParams.set('DTACYCLE_CD','MM');
    u.searchParams.set('CLS_ID',SEOUL_CLS_ID);u.searchParams.set('START_WRTTIME',start);
    u.searchParams.set('pIndex','1');u.searchParams.set('pSize','100');
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),15000);
    let r,text;
    try{r=await fetch(u,{signal:ctrl.signal,headers:{Accept:'application/json,text/plain,*/*','User-Agent':'SeoulRedevelopmentPocket/8.4'}});text=await r.text()}finally{clearTimeout(timer)}
    if(!r.ok)throw new Error(`R-ONE HTTP ${r.status}`);
    let data;try{data=JSON.parse(text)}catch{throw new Error('R-ONE 응답이 JSON이 아닙니다.')}
    const series=normalize(rowsFrom(data));
    if(series.length<2)return res.status(502).json({ok:false,error:'서울 아파트 지수 시계열을 식별하지 못했습니다.',rawKeys:Object.keys(data||{}).slice(0,20)});
    const latest=series.at(-1),prev=series.at(-2);
    const change=prev.value?((latest.value/prev.value)-1)*100:null;
    const signal=change==null?'확인중':change>0.1?'상승':change<-0.1?'하락':'보합';
    return res.status(200).json({ok:true,source:'한국부동산원 R-ONE',statblId:STATBL_ID,region:'서울',housingType:'아파트',metric:'월간 매매가격지수',cache:'12시간 CDN 캐시',latest:{...latest,changePct:change==null?null:Math.round(change*1000)/1000,signal},series:series.slice(-18),generatedAt:new Date().toISOString()});
  }catch(e){return res.status(502).json({ok:false,error:String(e?.message||e),source:'한국부동산원 R-ONE'})}
}
