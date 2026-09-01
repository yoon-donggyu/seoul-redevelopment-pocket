import { XMLParser } from 'fast-xml-parser';
import projectsPayload from '../data/projects.json' with { type: 'json' };

const PROJECTS = projectsPayload.projects || [];
const VERSION = '7.0.0-VERCEL';

const MOLIT = {
  land: {
    label: '토지',
    url: 'https://apis.data.go.kr/1613000/RTMSDataSvcLandTrade/getRTMSDataSvcLandTrade'
  },
  rowhouse: {
    label: '연립다세대',
    url: 'https://apis.data.go.kr/1613000/RTMSDataSvcRHTrade/getRTMSDataSvcRHTrade'
  },
  detached: {
    label: '단독다가구',
    url: 'https://apis.data.go.kr/1613000/RTMSDataSvcSHTrade/getRTMSDataSvcSHTrade'
  },
  apartment: {
    label: '아파트',
    url: 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade'
  }
};

const ONBID_BASE='https://apis.data.go.kr/B010003/OnbidRlstListSrvc2/getRlstCltrList2';
const ONBID_PRPT_CODES=['0007','0010','0005','0002','0003'];
const xmlParser = new XMLParser({ignoreAttributes:false, trimValues:true});

function serviceKey(){
  const raw=(process.env.DATA_GO_KR_SERVICE_KEY||'').trim();
  if(!raw) return '';
  try { return decodeURIComponent(raw); } catch { return raw; }
}
function keyOrThrow(){
  const k=serviceKey();
  if(!k) throw new Error('Vercel 환경변수 DATA_GO_KR_SERVICE_KEY가 아직 설정되지 않았습니다.');
  return k;
}
function monthStrings(n=3){
  const out=[],d=new Date();
  for(let i=0;i<n;i++){
    const x=new Date(d.getFullYear(),d.getMonth()-i,1);
    out.push(String(x.getFullYear())+String(x.getMonth()+1).padStart(2,'0'));
  }
  return out;
}
function arr(x){ return x==null?[]:Array.isArray(x)?x:[x]; }
function pick(obj,keys){
  for(const k of keys){
    if(obj && obj[k]!=null && String(obj[k]).trim()!=='') return String(obj[k]).trim();
  }
  return '';
}
function num(v){
  const n=Number(String(v??'').replace(/,/g,'').replace(/[^\d.-]/g,''));
  return Number.isFinite(n)?n:0;
}
function median(vals){
  const a=vals.filter(v=>Number.isFinite(v)).sort((a,b)=>a-b);
  if(!a.length)return null;
  const m=Math.floor(a.length/2);
  return a.length%2?a[m]:(a[m-1]+a[m])/2;
}
function avg(vals){
  const a=vals.filter(v=>Number.isFinite(v));
  return a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
}
function pyeongPrice(amountManwon,areaSqm){
  if(!amountManwon||!areaSqm)return null;
  return Math.round((amountManwon/(areaSqm/3.305785))*10)/10;
}
function projectMaps(p){
  const q=encodeURIComponent(`${p.district} ${p.name}`);
  return {
    naver:`https://map.naver.com/p/search/${q}`,
    kakao:`https://map.kakao.com/?q=${q}`,
    google:`https://www.google.com/maps/search/?api=1&query=${q}`
  };
}
function baseProject(p){
  return {...p,maps:projectMaps(p),market:{
    status:'상세조회',
    scope:'법정동 참고 실거래',
    count:0,latestDealDate:null,recentDeals:[],
    statistics:{},byType:{
      land:{count:0},rowhouse:{count:0},detached:{count:0},apartment:{count:0}
    },apiErrors:[]
  }};
}
function projectById(id){ return PROJECTS.find(p=>p.id===id); }

async function fetchText(url,timeout=12000){
  const ctrl=new AbortController();
  const t=setTimeout(()=>ctrl.abort(),timeout);
  try{
    const r=await fetch(url,{signal:ctrl.signal,headers:{'User-Agent':'SeoulRedevelopmentPocket/7.0','Accept':'application/json,application/xml,text/xml,*/*'}});
    const text=await r.text();
    if(!r.ok) throw new Error(`HTTP ${r.status} ${text.slice(0,120)}`);
    return {text,contentType:r.headers.get('content-type')||'',status:r.status};
  } finally {clearTimeout(t);}
}

function extractXmlItems(parsed){
  const body=parsed?.response?.body || parsed?.body || parsed;
  const item=body?.items?.item ?? body?.item ?? [];
  return arr(item);
}
function normalizeMolit(type,x){
  const amount=num(pick(x,['거래금액','dealAmount','거래금액(만원)']));
  const area=num(pick(x,['대지면적','전용면적','건물면적','연면적','거래면적','dealArea','excluUseAr']));
  const y=pick(x,['년','dealYear']),m=pick(x,['월','dealMonth']),d=pick(x,['일','dealDay']);
  const date=(y&&m&&d)?`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`:'';
  return {
    type,typeLabel:MOLIT[type].label,
    dealDate:date,
    umdNm:pick(x,['법정동','법정동명','umdNm','법정동읍면동코드']),
    jibun:pick(x,['지번','jibun']),
    buildingName:pick(x,['아파트','연립다세대','건물명','aptNm','buildingName']),
    amountManwon:amount||null,
    areaSqm:area||null,
    pricePerPyeongManwon:pyeongPrice(amount,area),
    raw:x
  };
}
async function fetchMolit(type,lawdCd,ym){
  const u=new URL(MOLIT[type].url);
  u.searchParams.set('serviceKey',keyOrThrow());
  u.searchParams.set('LAWD_CD',lawdCd);
  u.searchParams.set('DEAL_YMD',ym);
  u.searchParams.set('numOfRows','1000');
  u.searchParams.set('pageNo','1');
  const {text}=await fetchText(u.toString(),14000);
  const parsed=xmlParser.parse(text);
  return extractXmlItems(parsed).map(x=>normalizeMolit(type,x));
}
function dongMatch(rowDong,targetDong){
  const a=String(rowDong||'').replace(/\s/g,''),b=String(targetDong||'').replace(/\s/g,'');
  return a===b || a.startsWith(b) || b.startsWith(a);
}
async function marketForProject(p){
  const months=monthStrings(3), errors=[], all=[];
  const jobs=[];
  for(const type of Object.keys(MOLIT)){
    for(const ym of months){
      jobs.push((async()=>{
        try{
          const rows=await fetchMolit(type,p.lawdCd,ym);
          all.push(...rows.filter(r=>dongMatch(r.umdNm,p.dong)));
        }catch(e){errors.push({type,ym,message:String(e?.message||e)})}
      })());
    }
  }
  await Promise.all(jobs);
  all.sort((a,b)=>String(b.dealDate).localeCompare(String(a.dealDate)));
  const prices=all.map(x=>x.pricePerPyeongManwon).filter(Boolean);
  const amounts=all.map(x=>x.amountManwon).filter(Boolean);
  const byType={};
  for(const type of Object.keys(MOLIT)){
    const rows=all.filter(x=>x.type===type);
    byType[type]={
      count:rows.length,
      latestDealDate:rows[0]?.dealDate||null,
      medianPricePerPyeongManwon:median(rows.map(x=>x.pricePerPyeongManwon).filter(Boolean))
    };
  }
  return {
    status:errors.length===Object.keys(MOLIT).length*months.length?'오류':'연동완료',
    scope:`${p.district} ${p.dong} 법정동 참고 실거래 · 최근 ${months.length}개월`,
    count:all.length,
    latestDealDate:all[0]?.dealDate||null,
    recentDeals:all.slice(0,20).map(x=>({...x,raw:undefined})),
    statistics:{
      avgPricePerPyeongManwon:avg(prices)?Math.round(avg(prices)*10)/10:null,
      medianPricePerPyeongManwon:median(prices),
      minAmountManwon:amounts.length?Math.min(...amounts):null,
      maxAmountManwon:amounts.length?Math.max(...amounts):null
    },
    byType,apiErrors:errors
  };
}
async function projectPayload(id){
  const p=projectById(id);
  if(!p) throw new Error('사업지를 찾을 수 없습니다.');
  const project=baseProject(p);
  project.market=await marketForProject(p);
  return {ok:true,version:VERSION,generatedAt:new Date().toISOString(),project};
}

function onbidExtract(json){
  const body=json?.response?.body || json?.body || json;
  const v=body?.items?.item ?? body?.items ?? body?.item ?? body?.data ?? body?.result ?? body?.list ?? [];
  return arr(v);
}
function pickCI(obj,keys){
  const map={}; for(const [k,v] of Object.entries(obj||{}))map[k.toLowerCase()]=v;
  for(const k of keys){const v=map[String(k).toLowerCase()];if(v!=null&&String(v).trim()!=='')return String(v).trim();}
  return '';
}
function numCI(obj,keys){return num(pickCI(obj,keys));}
function normalizeOnbid(x){
  const appraisal=numCI(x,['apslEvlAmt','cltrApslEvlAvgAmt','apslEvlAvgAmt','APSL_EVL_AMT']);
  const minimum=numCI(x,['lowstBidPrc','minBidPrc','lowstBidAmt','frstBidPrc','LOWST_BID_PRC','MIN_BID_PRC']);
  const sido=pickCI(x,['lctnSdnm','sdnm','SIDO_NM','CTPV_NM']);
  const district=pickCI(x,['lctnSggnm','sggnm','SGG_NM']);
  const dong=pickCI(x,['lctnEmdNm','emdNm','EMD_NM']);
  let address=pickCI(x,['sidoSgkEmd','sidoSggEmd','radr','zadr','lctnAddr','addr','address','LDNM_ADRS','ROAD_NM_ADDR']);
  if(!address)address=[sido,district,dong].filter(Boolean).join(' ');
  return {
    cltrMngNo:pickCI(x,['cltrMngNo','CLTR_MNG_NO']),
    pbctCdtnNo:pickCI(x,['pbctCdtnNo','PBCT_CDTN_NO']),
    name:pickCI(x,['onbidCltrNm','cltrNm','goodsNm','CLTR_NM'])||'온비드 부동산 공매',
    address,sido,district,dong,
    category:pickCI(x,['ctgrFullNm','ctgrNm','CTGR_FULL_NM']),
    propertyType:pickCI(x,['scrnPrptDvsnNm','prptDvsnNm','PRPT_DVSN_NM']),
    bidStatus:pickCI(x,['pbctCltrStatNm','pbancPbctCltrStatNm','PBCT_STAT_NM']),
    appraisalAmount:appraisal||null,
    minimumBidAmount:minimum||null,
    discountRate:appraisal&&minimum?Math.round((1-minimum/appraisal)*1000)/10:null,
    landSqm:numCI(x,['landSqms','landSqm','LAND_SQMS'])||null,
    buildingSqm:numCI(x,['bldSqms','bldSqm','BLD_SQMS'])||null,
    bidStart:pickCI(x,['pbctBegnDtm','bidBegnDtm','PBCT_BEGN_DTM']),
    bidEnd:pickCI(x,['pbctDdlnDt','pbctLastDdlnDt','bidEndDtm','PBCT_CLS_DTM']),
    failedBidCount:numCI(x,['usbdNft','uscbdCnt','USBD_NFT'])||0,
    onbidUrl:'https://www.onbid.co.kr/'
  };
}
async function onbidForProject(p){
  const items=[],errors=[],fields=new Set();
  await Promise.all(ONBID_PRPT_CODES.map(async code=>{
    try{
      const u=new URL(ONBID_BASE);
      u.searchParams.set('serviceKey',keyOrThrow());
      u.searchParams.set('pageNo','1');u.searchParams.set('numOfRows','100');u.searchParams.set('resultType','json');
      u.searchParams.set('prptDivCd',code);u.searchParams.set('pvctTrgtYn','N');
      u.searchParams.set('lctnSdnm','서울특별시');u.searchParams.set('lctnSggnm',p.district);u.searchParams.set('lctnEmdNm',p.dong);
      const {text}=await fetchText(u.toString(),14000);
      const j=JSON.parse(text);
      for(const raw of onbidExtract(j)){Object.keys(raw||{}).forEach(k=>fields.add(k));items.push(normalizeOnbid(raw));}
    }catch(e){errors.push({propertyCode:code,message:String(e?.message||e)})}
  }));
  const seen=new Set(),dedup=[];
  for(const x of items){const k=[x.cltrMngNo,x.pbctCdtnNo,x.name,x.address].join('|');if(seen.has(k))continue;seen.add(k);dedup.push(x);}
  return {
    ok:errors.length<ONBID_PRPT_CODES.length,version:VERSION,generatedAt:new Date().toISOString(),
    project:{id:p.id,name:p.name,district:p.district,dong:p.dong},
    scope:`${p.district} ${p.dong} 현재 입찰중/예정 부동산 공매`,
    exactProjectBoundary:false,
    exactProjectBoundaryNote:'사업구역 Polygon과 온비드 주소 좌표 매칭 전이므로 동일 구/동 참고 공매입니다.',
    count:dedup.length,items:dedup,apiErrors:errors,availableFields:[...fields].sort()
  };
}

function dashboard(){
  return {
    ok:true,version:VERSION,backend:'Vercel Serverless Functions',generatedAt:new Date().toISOString(),
    projects:PROJECTS.map(baseProject),
    note:'목록은 빠르게 표시하고 실거래/온비드는 사업지 선택 시 Vercel에서 직접 조회합니다.'
  };
}
function status(){
  const key=!!serviceKey();
  return {
    ok:true,version:VERSION,backend:'Vercel',generatedAt:new Date().toISOString(),
    appsScript:false,
    molit:{serviceKeySaved:key,land:key?'직접연결':'키 필요',rowhouse:key?'직접연결':'키 필요',detached:key?'직접연결':'키 필요',apartment:key?'직접연결':'키 필요'},
    onbid:{status:key?'연결':'키 필요',service:'차세대 온비드 부동산 물건목록 조회서비스'},
    news:{status:'정적 43개 + 공식자료 확장 예정'},
    lastRefreshAt:'요청 시 실시간 / CDN 캐시'
  };
}

export default async function handler(req,res){
  const action=String(req.query.action||'dashboard');
  try{
    let out;
    if(action==='dashboard'||action==='refresh') out=dashboard();
    else if(action==='status') out=status();
    else if(action==='project') out=await projectPayload(String(req.query.id||''));
    else if(action==='onbid'){
      const p=projectById(String(req.query.id||''));
      if(!p) throw new Error('사업지를 찾을 수 없습니다.');
      out=await onbidForProject(p);
    } else if(action==='onbidDebug'){
      const p=projectById(String(req.query.id||''));
      if(!p) throw new Error('사업지를 찾을 수 없습니다.');
      const d=await onbidForProject(p);
      out={ok:d.ok,project:d.project,count:d.count,availableFields:d.availableFields,firstItem:d.items[0]||null,apiErrors:d.apiErrors,generatedAt:d.generatedAt};
    } else out={ok:false,error:'지원하지 않는 action입니다.',action};

    res.setHeader('Content-Type','application/json; charset=utf-8');
    if(action==='dashboard'||action==='status')res.setHeader('Cache-Control','public, s-maxage=21600, stale-while-revalidate=86400');
    else res.setHeader('Cache-Control','no-store');
    return res.status(out.ok===false?400:200).json(out);
  }catch(e){
    return res.status(500).json({ok:false,error:String(e?.message||e),version:VERSION,backend:'Vercel'});
  }
}
