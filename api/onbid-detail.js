import { XMLParser } from 'fast-xml-parser';

const xml=new XMLParser({ignoreAttributes:false,trimValues:true});
const CANDIDATES=[
  'https://apis.data.go.kr/B010003/OnbidRlstDtlSrvc2/getRlstCltrDtl2',
  'https://apis.data.go.kr/B010003/OnbidRlstDtlSrvc2/getRlstCltrDetail2',
  'https://apis.data.go.kr/B010003/OnbidRlstDtlSrvc/getRlstCltrDtl'
];

function serviceKey(){
  const raw=(process.env.DATA_GO_KR_SERVICE_KEY||'').trim();
  if(!raw)throw new Error('DATA_GO_KR_SERVICE_KEY가 없습니다.');
  try{return decodeURIComponent(raw)}catch{return raw}
}
function arr(v){return v==null?[]:Array.isArray(v)?v:[v]}
function num(v){const n=Number(String(v??'').replace(/,/g,'').replace(/[^\d.-]/g,''));return Number.isFinite(n)?n:null}
function pickCI(obj,keys){const m={};for(const[k,v]of Object.entries(obj||{}))m[k.toLowerCase()]=v;for(const k of keys){const v=m[String(k).toLowerCase()];if(v!=null&&String(v).trim()!=='')return String(v).trim()}return ''}
function parse(text,ct){const t=String(text||'').trim();if(!t)return{};if((ct||'').includes('json')||t.startsWith('{')||t.startsWith('[')){try{return JSON.parse(t)}catch{}}if(t.startsWith('<')){try{return xml.parse(t)}catch{}}throw new Error('JSON/XML 형식이 아닙니다.')}
function extract(data){const body=data?.response?.body||data?.body||data;const direct=body?.item||body?.items?.item||body?.items||body?.data||body?.result||body?.list;const rows=arr(direct);if(rows.length)return rows;const found=[];const walk=v=>{if(!v||typeof v!=='object')return;if(!Array.isArray(v)){const keys=Object.keys(v).map(k=>k.toLowerCase());if(keys.some(k=>k.includes('cltr')||k.includes('bid')||k.includes('apsl')||k.includes('addr')))found.push(v)}for(const x of Object.values(v))walk(x)};walk(data);return found}
function normalize(x){
  const appraisal=num(pickCI(x,['apslEvlAmt','cltrApslEvlAvgAmt','apslEvlAvgAmt','appraisalAmount','APSL_EVL_AMT']));
  const minimum=num(pickCI(x,['lowstBidPrc','minBidPrc','lowstBidAmt','frstBidPrc','minimumBidAmount','LOWST_BID_PRC','MIN_BID_PRC']));
  const bidStart=pickCI(x,['pbctBegnDtm','bidBegnDtm','bidStart','PBCT_BEGN_DTM']);
  const bidEnd=pickCI(x,['pbctDdlnDt','pbctLastDdlnDt','bidEndDtm','bidEnd','PBCT_CLS_DTM']);
  return {
    cltrMngNo:pickCI(x,['cltrMngNo','CLTR_MNG_NO']),
    pbctCdtnNo:pickCI(x,['pbctCdtnNo','PBCT_CDTN_NO']),
    name:pickCI(x,['onbidCltrNm','cltrNm','goodsNm','CLTR_NM']),
    address:pickCI(x,['sidoSgkEmd','sidoSggEmd','radr','zadr','lctnAddr','addr','address','LDNM_ADRS','ROAD_NM_ADDR']),
    appraisalAmount:appraisal,
    minimumBidAmount:minimum,
    discountRate:appraisal&&minimum?Math.round((1-minimum/appraisal)*1000)/10:null,
    bidStart,bidEnd,
    landSqm:num(pickCI(x,['landSqms','landSqm','LAND_SQMS'])),
    buildingSqm:num(pickCI(x,['bldSqms','bldSqm','BLD_SQMS'])),
    bidStatus:pickCI(x,['pbctCltrStatNm','pbancPbctCltrStatNm','PBCT_STAT_NM']),
    raw:x
  }
}
async function call(url,cltrMngNo,pbctCdtnNo){
  const u=new URL(url);u.searchParams.set('serviceKey',serviceKey());u.searchParams.set('resultType','json');u.searchParams.set('cltrMngNo',cltrMngNo);if(pbctCdtnNo)u.searchParams.set('pbctCdtnNo',pbctCdtnNo);
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
  try{const r=await fetch(u,{signal:ctrl.signal,headers:{Accept:'application/json,application/xml,text/xml,*/*','User-Agent':'SeoulRedevelopmentPocket/7.4'}});const text=await r.text();if(!r.ok)throw new Error(`HTTP ${r.status} ${text.slice(0,120)}`);const parsed=parse(text,r.headers.get('content-type')||'');const rows=extract(parsed);if(!rows.length)throw new Error('상세 데이터 없음');return {endpoint:url,rows}}finally{clearTimeout(timer)}
}

export default async function handler(req,res){
  const cltrMngNo=String(req.query.cltrMngNo||'').trim();const pbctCdtnNo=String(req.query.pbctCdtnNo||'').trim();
  if(!cltrMngNo)return res.status(400).json({ok:false,error:'물건관리번호(cltrMngNo)가 필요합니다.'});
  const errors=[];
  for(const endpoint of CANDIDATES){
    try{const out=await call(endpoint,cltrMngNo,pbctCdtnNo);const items=out.rows.map(normalize);return res.status(200).json({ok:true,version:'7.4.0',source:'KAMCO OnBid 부동산 물건상세',endpoint:out.endpoint,cltrMngNo,pbctCdtnNo,item:items[0]||null,items:items.map(x=>({...x,raw:undefined})),generatedAt:new Date().toISOString()})}catch(e){errors.push({endpoint,error:String(e?.message||e)})}
  }
  return res.status(502).json({ok:false,version:'7.4.0',error:'온비드 상세 API 호출에 실패했습니다. 상세 서비스 활용신청/권한 또는 엔드포인트 명세를 확인해야 합니다.',cltrMngNo,pbctCdtnNo,attempts:errors,officialDataset:'https://www.data.go.kr/data/15157247/openapi.do'});
}
