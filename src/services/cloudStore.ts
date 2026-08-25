// ===== Firestore 실시간 동기화 서비스 =====
import { doc, onSnapshot, setDoc, getDoc, type Unsubscribe } from 'firebase/firestore';
import { getFirestoreDb, initFirebase } from '../lib/firebase';
import type { Player, Game, Season } from '../types';
import { initialPlayers, initialGames, initialSeasons } from '../data/initialData';
import type { FirebaseConfig } from '../lib/firebaseConfig';

const TEAM_DOC_COLLECTION = 'teamData';
const TEAM_DOC_ID = 'hanbang';

export interface CloudTeamData {
  players: Player[];
  games: Game[];
  seasons: Season[];
  updatedAt: string;
  version?: number;
}

export type CloudSyncStatus = 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'error';

let activeUnsubscribe: Unsubscribe | null = null;
let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// 실시간 클라우드 DB 구독
export function subscribeToCloudStore(
  onDataReceived: (data: CloudTeamData) => void,
  onStatusChange?: (status: CloudSyncStatus) => void
): () => void {
  // 이전 구독 해제
  if (activeUnsubscribe) {
    activeUnsubscribe();
    activeUnsubscribe = null;
  }

  const db = getFirestoreDb();
  if (!db) {
    onStatusChange?.('disconnected');
    return () => {};
  }

  onStatusChange?.('connecting');
  const docRef = doc(db, TEAM_DOC_COLLECTION, TEAM_DOC_ID);

  try {
    activeUnsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const rawData = docSnap.data() as Partial<CloudTeamData>;
          if (Array.isArray(rawData.players)) {
            onDataReceived({
              players: rawData.players,
              games: Array.isArray(rawData.games) ? rawData.games : [],
              seasons: Array.isArray(rawData.seasons) && rawData.seasons.length > 0 ? rawData.seasons : initialSeasons,
              updatedAt: rawData.updatedAt || new Date().toISOString(),
              version: rawData.version || 1,
            });
            onStatusChange?.('connected');
            return;
          }
        }

        // 문서가 비어있거나 최초 생성인 경우 최신 마스터 데이터로 자동 시딩
        const initialData: CloudTeamData = {
          players: initialPlayers,
          games: initialGames,
          seasons: initialSeasons,
          updatedAt: new Date().toISOString(),
          version: 1,
        };

        setDoc(docRef, initialData, { merge: true })
          .then(() => {
            onDataReceived(initialData);
            onStatusChange?.('connected');
          })
          .catch((err) => {
            console.error('[Firebase] 초기 시딩 실패:', err);
            onStatusChange?.('error');
          });
      },
      (error) => {
        console.error('[Firebase] 실시간 구독 에러:', error);
        onStatusChange?.('error');
      }
    );

    return () => {
      if (activeUnsubscribe) {
        activeUnsubscribe();
        activeUnsubscribe = null;
      }
    };
  } catch (error) {
    console.error('[Firebase] 구독 설정 실패:', error);
    onStatusChange?.('error');
    return () => {};
  }
}

// 클라우드 DB에 데이터 저장 (디바운스 적용)
export function saveToCloudStore(
  data: { players: Player[]; games: Game[]; seasons: Season[] },
  onStatusChange?: (status: CloudSyncStatus) => void
): void {
  const db = getFirestoreDb();
  if (!db) return;

  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }

  saveDebounceTimer = setTimeout(async () => {
    onStatusChange?.('syncing');
    try {
      const docRef = doc(db, TEAM_DOC_COLLECTION, TEAM_DOC_ID);
      const payload: CloudTeamData = {
        players: data.players,
        games: data.games,
        seasons: data.seasons,
        updatedAt: new Date().toISOString(),
        version: 1,
      };
      await setDoc(docRef, payload, { merge: true });
      onStatusChange?.('connected');
    } catch (error) {
      console.error('[Firebase] 클라우드 저장 실패:', error);
      onStatusChange?.('error');
    }
  }, 400);
}

// Firebase 연결 테스트 함수
export async function testFirebaseConnection(
  config: FirebaseConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const { db } = initFirebase(config);
    if (!db) {
      return { success: false, error: 'Firebase 초기화에 실패했습니다. 설정값을 확인해주세요.' };
    }

    const docRef = doc(db, TEAM_DOC_COLLECTION, TEAM_DOC_ID);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      // 쓰기 테스트
      await setDoc(docRef, {
        players: initialPlayers,
        games: initialGames,
        seasons: initialSeasons,
        updatedAt: new Date().toISOString(),
        version: 1,
      }, { merge: true });
    }
    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMessage };
  }
}
