// 실시간 연동과 명함 인식이 같이 쓰는 Firebase 앱. 필요한 기능 쪽에서만 불러와 첫 화면을 가볍게 유지한다.
import {initializeApp} from 'firebase/app';

export const app=initializeApp({
 apiKey:'AIzaSyC1FiluWRkBfwF9rm9ncf0APWLb2nHYDag',
 authDomain:'luux-sales-68821.firebaseapp.com',
 projectId:'luux-sales-68821',
 storageBucket:'luux-sales-68821.firebasestorage.app',
 messagingSenderId:'173052996063',
 appId:'1:173052996063:web:8bb137dbcaca866f2d3c6a'
});
