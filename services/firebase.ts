import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: 請從 Firebase Console -> Project Settings 複製您的設定並填入下方
// 注意：在正式生產環境中，建議使用環境變數 (Environment Variables) 處理這些金鑰
const firebaseConfig = {
  apiKey: "AIzaSyCdH0TSCHh9tKpVh5GS865f_nMc8bjYnro",
  authDomain: "project-2188675985560412717.firebaseapp.com",
  projectId: "project-2188675985560412717",
  storageBucket: "project-2188675985560412717.firebasestorage.app",
  messagingSenderId: "612909772216",
  appId: "1:612909772216:web:8528a4187a75a7871b734d"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);