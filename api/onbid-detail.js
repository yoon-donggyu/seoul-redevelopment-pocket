import { XMLParser } from 'fast-xml-parser';

const xml=new XMLParser({ignoreAttributes:false,trimValues:true});
const ENDPOINT='https://apis.data.go.kr/B010003/OnbidRlstDtlSrvc2/getRlstDtlInf2';

function serviceKey(){
  const raw=(process.env.DATA_GO_KR_SERVICE_KEY||'').trim();
  if(!raw)throw new Error('DATA_GO_KR_SERVICE_KEY가 없습니다.');
  try{return decodeURIComponent(raw)}catch{return raw}
}
function arr(v){return v==null?[]:Array.isArray(v)?v:[v]}
function num(v){const n=Number(String(v??'').replace(/,/g,'').replace(/[^\d.-]/g,''));return Number.isFinite(n)?n:null}
function pickCI(obj,keys){const m={};for(const[k,v]of Object.entries(obj||{}))m[k.toLowerCase()]=v;for(const k of keys){const v=m[String(k).toLowerCase()];if(v!=null&&String(v).trim()!=='')return String(v).trim()}return ''}
function parse(text,ct){const t=String(text||'').trim();if(!t)return{};if((ct||'').includes('json')||t.startsWith('{')||t.startsWith('[')){try{return JSON.parse(t)}catch{}}if(t.startsWith('<')){try{return xml.parse(t)}catch{}}throw new Error('JSON/XML 형식이 아닙니다: '+t.slice(0,120))}
function extract(data){const body=data?.response?.body||data?.body||data;return arr(body?.items?.item??body?.items??body?.item??body?.data??body?.result??body?.list??[])}
function normalize(x){
  const appraisal=num(pickCI(x,['apslEvlAmt']));
  const lowstText=pickCI(x,['lowstBidPrcIndctCont']);
  const minimum=num(lowstText);
  const ratio=num(pickCI(x,['apslPrcCtrsLowstBidRto']));
  const bidStart=pickCI(x,['cltrBidBgngDt']);
  const bidEnd=pickCI(x,['cltrBidEndDt']);
  return {
    cltrMngNo:pickCI(x,['cltrMngNo']),
    pbctCdtnNo:pickCI(x,['pbctCdtnNo']),
    onbidCltrno:pickCI(x,['onbidCltrno']),
    onbidPbancNo:pickCI(x,['onbidPbancNo']),
    pbctNo:pickCI(x,['pbctNo']),
    name:pickCI(x,['cltrNm','onbidCltrNm','goodsNm']),
    address:[pickCI(x,['lctnSdnm']),pickCI(x,['lctnSggnm']),pickCI(x,['lctnEmdNm']),pickCI(x,['lctnRiNm']),pickCI(x,['lctnAddr'])].filter(Boolean).join(' ')||pickCI(x,['radr','zadr','addr','address']),
    appraisalAmount:appraisal,
    minimumBidAmount:minimum,
    minimumBidDisplay:lowstText||null,
    discountRate:ratio!=null?Math.round((100-ratio)*10)/10:(appraisal&&minimum?Math.round((1-minimum/appraisal)*1000)/10:null),
    bidStart,bidEnd,
    landSqm:num(pickCI(x,['landSqms','landSqm'])),
    buildingSqm:num(pickCI(x,['bldSqms','bldSqm'])),
    failedBidCount:num(pickCI(x,['usbdNft'])),
    bidProgressCount:num(pickCI(x,['bidPrgnNft'])),
    bidStatus:pickCI(x,['pbctCltrStatNm','pbancPbctCltrStatNm']),
    firstBidPrice:num(pickCI(x,['frstBidPrc']))
  };
}

async function call(cltrMngNo,pbctCdtnNo){
  const u=new URL(ENDPOINT);
  u.searchParams.set('serviceKey',serviceKey());
  u.searchParams.set('pageNo','1');
  u.searchParams.set('numOfRows','10');
  u.searchParams.set('resultType','json');
  u.searchParams.set('cltrMngNo',cltrMngNo);
  if(pbctCdtnNo)u.searchParams.set('pbctCdtnNo',pbctCdtnNo);
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),15000);
  try{
    const r=await fetch(u,{signal:ctrl.signal,headers:{Accept:'application/json,application/xml,text/xml,*/*','User-Agent':'SeoulRedevelopmentPocket/7.4.1'}});
    const text=await r.text();
    if(!r.ok)throw new Error(`HTTP ${r.status} ${text.slice(0,180)}`);
    const parsed=parse(text,r.headers.get('content-type')||'');
    const resultCode=String(parsed?.response?.header?.resultCode??'');
    const resultMsg=String(parsed?.response?.header?.resultMsg??'');
    if(resultCode&&resultCode!=='00')throw new Error(`온비드 ${resultCode} ${resultMsg}`);
    const rows=extract(parsed);
    if(!rows.length)throw new Error('상세 데이터가 없습니다. 현재 입찰중/예정 물건인지 확인이 필요합니다.');
    return rows.map(normalize);
  }finally{clearTimeout(timer)}
}

export default async function handler(req,res){
  try{
    const cltrMngNo=String(req.query.cltrMngNo||'').trim();
    const pbctCdtnNo=String(req.query.pbctCdtnNo||'').trim();
    if(!cltrMngNo)return res.status(400).json({ok:false,error:'물건관리번호(cltrMngNo)가 필요합니다.'});
    const items=await call(cltrMngNo,pbctCdtnNo);
    return res.status(200).json({ok:true,version:'7.4.1',source:'KAMCO 온비드 부동산 물건상세 조회서비스',endpoint:ENDPOINT,cltrMngNo,pbctCdtnNo,item:items[0]||null,items,generatedAt:new Date().toISOString()});
  }catch(e){
    return res.status(502).json({ok:false,version:'7.4.1',error:String(e?.message||e),endpoint:ENDPOINT,officialOperation:'getRlstDtlInf2'});
  }
}
