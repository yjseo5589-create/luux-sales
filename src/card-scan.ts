// 명함 사진을 Gemini(Firebase AI Logic)로 읽어 거래처 등록창에 채울 값을 만든다. 저장은 사용자가 확인한 뒤에만 한다.
import {getAI,getGenerativeModel,GoogleAIBackend,Schema} from 'firebase/ai';
import {app} from './firebase-app';

export type CardResult={company:string;type:string;contact:string;position:string;department:string;phone:string;officePhone:string;email:string};

const text=(description:string)=>Schema.string({description});
const schema=Schema.object({properties:{
 company:text('회사명 하나. 한글 표기가 있으면 한글만 쓰고, 법인 표기((주), 주식회사)와 영문 병기는 뺀다'),
 type:Schema.enumString({enum:['광고주','대행사','렙사','기타'],description:'룩스(디지털 옥외광고 매체) 기준 거래처 구분. 광고대행사는 대행사, 미디어렙·매체 판매 대행사는 렙사, 광고를 집행하는 브랜드·기업은 광고주, 판단이 어려우면 기타'}),
 contact:text('사람 이름. 한글 이름이 있으면 한글 이름'),
 position:text('직급과 직책. 둘 다 있으면 "차장 / 팀장"처럼 " / "로 구분'),
 department:text('부서·팀'),
 phone:text('휴대전화. 010-1234-5678 형식'),
 officePhone:text('회사 전화(대표·직통). 02-1234-5678 형식. 팩스는 제외'),
 email:text('이메일')
}});

const model=getGenerativeModel(getAI(app,{backend:new GoogleAIBackend()}),{
 model:'gemini-3.5-flash',
 generationConfig:{responseMimeType:'application/json',responseSchema:schema,temperature:0}
});

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
  const result=await model.generateContent([
   '한국 비즈니스 명함 사진이다. 명함에 적힌 정보만 옮기고 없는 항목은 빈 문자열로 둔다. 추측해서 채우지 않는다.'+
   (companies.length?'\n이미 등록된 거래처: '+companies.join(', ')+'\n명함의 회사가 이 중 하나와 같은 회사면 company에 등록된 이름을 그대로 쓴다.':''),
   {inlineData:{data,mimeType:'image/jpeg'}}
  ]);
  const raw=JSON.parse(result.response.text());
  const pick=(key:keyof CardResult)=>typeof raw[key]==='string'?raw[key].trim():'';
  const card={company:pick('company'),type:pick('type')||'기타',contact:pick('contact'),position:pick('position'),department:pick('department'),phone:pick('phone'),officePhone:pick('officePhone'),email:pick('email')};
  if(!card.company&&!card.contact&&!card.phone&&!card.email)throw Error('명함 정보를 찾지 못했습니다. 명함이 잘 보이게 다시 찍어 주세요.');
  return card;
 }catch(e:any){
  if(e?.message?.startsWith('명함 정보'))throw e;
  const message=String(e?.message||'');
  if(!navigator.onLine)throw Error('인터넷 연결을 확인해 주세요.');
  if(/api-not-enabled|not been used|disabled|PERMISSION_DENIED|403/i.test(message))throw Error('명함 인식이 아직 설정되지 않았습니다.');
  if(/quota|429|RESOURCE_EXHAUSTED/i.test(message))throw Error('오늘 인식 한도를 넘었습니다. 잠시 후 다시 시도해 주세요.');
  throw Error('명함을 인식하지 못했습니다. 다시 시도해 주세요.');
 }
}
