// ===== Firebase 환경설정 관리 =====
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// 한방 스윙스 기본 공식 Firebase 설정
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyCUfmhc3HERCn-472Ki_5p5hz6XKA12NT4",
  authDomain: "hanbangswings.firebaseapp.com",
  projectId: "hanbangswings",
  storageBucket: "hanbangswings.firebasestorage.app",
  messagingSenderId: "139642884441",
  appId: "1:139642884441:web:a2714c90ee92af0287fc48"
};

const LOCAL_STORAGE_KEY = 'hanbang_firebase_config_override';

// 기본 환경변수 또는 로컬 오버라이드 설정 로드
export function getFirebaseConfig(): FirebaseConfig | null {
  // 1. 브라우저 로컬 스토리지에 직접 입력된 오버라이드 설정이 있는지 확인
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.projectId && parsed.apiKey) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  // 2. Vite 환경변수 (.env) 확인
  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (envApiKey && envProjectId) {
    return {
      apiKey: envApiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
      projectId: envProjectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };
  }

  // 3. 프로젝트 기본 설정 반환
  return DEFAULT_FIREBASE_CONFIG;
}

// 브라우저에서 직접 Firebase 설정 저장
export function saveFirebaseConfig(config: FirebaseConfig): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  }
}

// 브라우저 Firebase 설정 삭제
export function clearFirebaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
}
