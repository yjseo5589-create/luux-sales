// 명함 사진을 Gemini(Firebase AI Logic)로 읽어 거래처 등록창에 채울 값을 만든다. 저장은 사용자가 확인한 뒤에만 한다.
import {getAI,getGenerativeModel,GoogleAIBackend,Schema,ThinkingLevel} from 'firebase/ai';
import {initializeAppCheck,ReCaptchaEnterpriseProvider} from 'firebase/app-check';
import {app} from './firebase-app';

export type CardResult={company:string;type:string;contact:string;position:string;department:string;phone:string;officePhone:string;email:string};

const text=(description:string)=>Schema.string({description});
const schema=Schema.object({properties:{
 company:text('회사명 하나. 한글과 영문이 함께 있으면 한글만 쓴다. 영문만 있으면 영문 그대로 쓰고 번역·음역하지 않는다. 법인 표기((주), 주식회사, Co., Ltd.)는 뺀다'),
 type:Schema.enumString({enum:['광고주','대행사','렙사','기타'],description:'룩스(디지털 옥외광고 매체) 기준 거래처 구분. 광고대행사는 대행사, 미디어렙·매체 판매 대행사는 렙사, 광고를 집행하는 브랜드·기업은 광고주, 판단이 어려우면 기타'}),
 contact:text('사람 이름. 한글 이름이 있으면 한글 이름'),
 position:text('직급과 직책. 둘 다 있으면 "차장 / 팀장"처럼 " / "로 구분'),
 department:text('부서·팀'),
 phone:text('휴대전화. 010-1234-5678 형식'),
 officePhone:text('회사 전화(대표·직통). 02-1234-5678 형식. 팩스는 제외'),
 email:text('이메일')
}});

// AI Logic은 App Check 토큰이 있는 요청만 받는다. reCAPTCHA는 명함 등록을 처음 쓸 때만 불러온다.
const RECAPTCHA_SITE_KEY='6LeNNwQuAAAAAItCxmFjE8gbII8ib8lvneCEdS6z';
initializeAppCheck(app,{provider:new ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY),isTokenAutoRefreshEnabled:true});

// 무료 요금제는 모델마다 하루 요청 수가 따로 정해져 있어(Flash 20회), 한도에 걸리면 다음 모델로 넘긴다.
const ai=getAI(app,{backend:new GoogleAIBackend()});
const models=['gemini-3.5-flash','gemini-3.5-flash-lite','gemini-3.1-flash-lite'].map(model=>getGenerativeModel(ai,{
 model,
 generationConfig:{responseMimeType:'application/json',responseSchema:schema,thinkingConfig:{thinkingLevel:ThinkingLevel.LOW}}
}));
const overQuota=(e:any)=>/quota|429|RESOURCE_EXHAUSTED/i.test(String(e?.message||''));

// 휴대폰 원본 사진은 수 MB라 긴 변 1600px JPEG로 줄여 보낸다.
async function shrink(file:File){
 const bitmap=await createImageBitmap(file);
 const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
 const canvas=document.createElement('canvas');
 canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
 canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);
 bitmap.close();
 return canvas.toDataURL('image/jpeg',0.85).split(',')[1];
}

export async function scanCard(file:File,companies:string[]=[]):Promise<CardResult>{
 let data:string;
 try{data=await shrink(file)}catch{throw Error('이미지를 열 수 없습니다. 다른 사진으로 시도해 주세요.')}
 try{
  const request=[
   '한국 비즈니스 명함 사진이다. 명함에 적힌 정보만 옮기고 없는 항목은 빈 문자열로 둔다. 추측해서 채우지 않는다.'+
   (companies.length?'\n이미 등록된 거래처: '+companies.join(', ')+'\n명함의 회사가 이 중 하나와 같은 회사면 company에 등록된 이름을 그대로 쓴다.':''),
   {inlineData:{data,mimeType:'image/jpeg'}}
  ];
  let result;
  for(const [i,model] of models.entries()){
   try{result=await model.generateContent(request);break}
   catch(e){if(!overQuota(e)||i===models.length-1)throw e}
  }
  if(!result)throw Error('no result');
  const raw=JSON.parse(result.response.text());
  const pick=(key:keyof CardResult)=>typeof raw[key]==='string'?raw[key].trim():'';
  const card={company:pick('company'),type:pick('type')||'기타',contact:pick('contact'),position:pick('position'),department:pick('department'),phone:pick('phone'),officePhone:pick('officePhone'),email:pick('email')};
  if(!card.company&&!card.contact&&!card.phone&&!card.email)throw Error('명함 정보를 찾지 못했습니다. 명함이 잘 보이게 다시 찍어 주세요.');
  return card;
 }catch(e:any){
  console.error('card-scan',e);
  if(e?.message?.startsWith('명함 정보'))throw e;
  const message=String(e?.message||'');
  if(!navigator.onLine)throw Error('인터넷 연결을 확인해 주세요.');
  if(/App Check/i.test(message))throw Error('명함 인식 보안 확인에 실패했습니다.');
  if(/api-not-enabled|not been used|disabled|PERMISSION_DENIED|403/i.test(message))throw Error('명함 인식이 아직 설정되지 않았습니다.');
  if(overQuota(e))throw Error(/per ?day/i.test(message)?'오늘 인식 한도를 모두 썼습니다. 오후 5시 이후 다시 시도해 주세요.':'요청이 많습니다. 1분 뒤 다시 시도해 주세요.');
  throw Error('명함을 인식하지 못했습니다. 다시 시도해 주세요.');
 }
}
