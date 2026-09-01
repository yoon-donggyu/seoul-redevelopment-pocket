import { XMLParser } from 'fast-xml-parser';
import projectsPayload from '../data/projects.json' with { type: 'json' };

const PROJECTS = projectsPayload.projects || [];
const BASE = 'https://apis.data.go.kr/B010003/OnbidRlstListSrvc2/getRlstCltrList2';
const CODES = ['0007','0010','0005','0002','0003'];
const xml = new XMLParser({ignoreAttributes:false, trimValues:true});

function key(){
  const raw=(process.env.DATA_GO_KR_SERVICE_KEY||'').trim();
  if(!raw) throw new Error('Vercel 환경변수 DATA_GO_KR_SERVICE_KEY가 없습니다.');
  try{return decodeURIComponent(raw)}catch{return raw}
}
function arr(v){return v==null?[]:Array.isArray(v)?v:[v]}
function num(v){const n=Number(String(v??'').replace(/,/g,'').replace(/[^\d.-]/g,''));return Number.isFinite(n)?n:0}
function pickCI(obj,keys){const m={};for(const[k,v]of Object.entries(obj||{}))m[k.toLowerCase()]=v;for(const k of keys){const v=m[String(k).toLowerCase()];if(v!=null&&String(v).trim()!=='')return String(v).trim()}return ''}
function numCI(obj,keys){return num(pickCI(obj,keys))}
function projectById(id){return PROJECTS.find(p=>p.id===id)}
function extract(data){
  const body=data?.response?.body||data?.body||data;
  return arr(body?.items?.item??body?.items??body?.item??body?.data??body?.result??body?.list??[]);
}
function parseBody(text,contentType){
  const t=String(text||'').trim();
  if(!t)return {};
  if((contentType||'').includes('json')||t.startsWith('{')||t.startsWith('[')){
    try{return JSON.parse(t)}catch(e){}
  }
  if(t.startsWith('<')){
    try{return xml.parse(t)}catch(e){}
  }
  throw new Error('온비드가 JSON/XML이 아닌 응답을 반환했습니다: '+t.slice(0,120));
}
async function call(code,page,region){
  const u=new URL(BASE);
  u.searchParams.set('serviceKey',key());
  u.searchParams.set('pageNo',String(page||1));
  u.searchParams.set('numOfRows','100');
  u.searchParams.set('resultType','json');
  u.searchParams.set('prptDivCd',code);
  u.searchParams.set('pvctTrgtYn','N');
  if(region){
    u.searchParams.set('lctnSdnm','서울특별시');
    u.searchParams.set('lctnSggnm',region.district);
    u.searchParams.set('lctnEmdNm',region.dong);
  }
  const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),14000);
  try{
    const r=await fetch(u,{signal:ctrl.signal,headers:{Accept:'application/json,application/xml,text/xml,*/*','User-Agent':'SeoulRedevelopmentPocket/7.3'}});
    const text=await r.text();
    if(!r.ok)throw new Error('HTTP '+r.status+' '+text.slice(0,140));
    return parseBody(text,r.headers.get('content-type')||'');
  }finally{clearTimeout(timer)}
}
function regionMatch(raw,p){
  const blob=Object.values(raw||{}).map(v=>String(v??'')).join(' ');
  return blob.includes(p.district)&&blob.includes(p.dong);
}
function normalize(x){
  const appraisal=numCI(x,['apslEvlAmt','cltrApslEvlAvgAmt','apslEvlAvgAmt','APSL_EVL_AMT']);
  const minimum=numCI(x,['lowstBidPrc','minBidPrc','lowstBidAmt','frstBidPrc','LOWST_BID_PRC','MIN_BID_PRC']);
  const sido=pickCI(x,['lctnSdnm','sdnm','SIDO_NM','CTPV_NM']);
  const district=pickCI(x,['lctnSggnm','sggnm','SGG_NM']);
  const dong=pickCI(x,['lctnEmdNm','emdNm','EMD_NM']);
  let address=pickCI(x,['sidoSgkEmd','sidoSggEmd','radr','zadr','lctnAddr','addr','address','LDNM_ADRS','ROAD_NM_ADDR']);
  if(!address)address=[sido,district,dong].filter(Boolean).join(' ');
  return {
    cltrMngNo:pickCI(x,['cltrMngNo','CLTR_MNG_NO']),pbctCdtnNo:pickCI(x,['pbctCdtnNo','PBCT_CDTN_NO']),
    name:pickCI(x,['onbidCltrNm','cltrNm','goodsNm','CLTR_NM'])||'온비드 부동산 공매',address,sido,district,dong,
    category:pickCI(x,['ctgrFullNm','ctgrNm','CTGR_FULL_NM']),propertyType:pickCI(x,['scrnPrptDvsnNm','prptDvsnNm','PRPT_DVSN_NM']),
    bidStatus:pickCI(x,['pbctCltrStatNm','pbancPbctCltrStatNm','PBCT_STAT_NM']),appraisalAmount:appraisal||null,minimumBidAmount:minimum||null,
    discountRate:appraisal&&minimum?Math.round((1-minimum/appraisal)*1000)/10:null,landSqm:numCI(x,['landSqms','landSqm','LAND_SQMS'])||null,
    buildingSqm:numCI(x,['bldSqms','bldSqm','BLD_SQMS'])||null,bidStart:pickCI(x,['pbctBegnDtm','bidBegnDtm','PBCT_BEGN_DTM']),
    bidEnd:pickCI(x,['pbctDdlnDt','pbctLastDdlnDt','bidEndDtm','PBCT_CLS_DTM']),failedBidCount:numCI(x,['usbdNft','uscbdCnt','USBD_NFT'])||0,
    onbidUrl:'https://www.onbid.co.kr/'
  };
}

export default async function handler(req,res){
  try{
    const p=projectById(String(req.query.id||''));
    if(!p)return res.status(404).json({ok:false,error:'사업지를 찾을 수 없습니다.'});
    const items=[],apiErrors=[],fields=new Set();let queryMode='region-query';
    for(const code of CODES){
      let rows=[];
      try{rows=extract(await call(code,1,{district:p.district,dong:p.dong}))}
      catch(e){
        const msg=String(e?.message||e);apiErrors.push({propertyCode:code,stage:'region-query',message:msg});
        if(msg.includes('HTTP 400')||msg.includes('JSON/XML이 아닌 응답')){
          queryMode='fallback-local-filter';
          try{
            for(let page=1;page<=3;page++){
              const pageRows=extract(await call(code,page,null));
              if(!pageRows.length)break;
              rows.push(...pageRows.filter(raw=>regionMatch(raw,p)));
              if(pageRows.length<100)break;
            }
          }catch(e2){apiErrors.push({propertyCode:code,stage:'fallback',message:String(e2?.message||e2)})}
        }
      }
      for(const raw of rows){Object.keys(raw||{}).forEach(k=>fields.add(k));items.push(normalize(raw))}
    }
    const seen=new Set(),dedup=[];
    for(const x of items){const k=[x.cltrMngNo,x.pbctCdtnNo,x.name,x.address].join('|');if(seen.has(k))continue;seen.add(k);dedup.push(x)}
    res.setHeader('Cache-Control','no-store');
    return res.status(200).json({ok:true,version:'7.3.0',generatedAt:new Date().toISOString(),project:{id:p.id,name:p.name,district:p.district,dong:p.dong},scope:`${p.district} ${p.dong} 현재 입찰중/예정 부동산 공매`,queryMode,count:dedup.length,items:dedup,apiErrors,availableFields:[...fields].sort(),exactProjectBoundary:false,exactProjectBoundaryNote:'사업구역 Polygon 좌표 매칭 전이므로 동일 구/동 참고 공매입니다.'});
  }catch(e){return res.status(500).json({ok:false,error:String(e?.message||e),version:'7.3.0'})}
}
