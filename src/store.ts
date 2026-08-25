// ===== Zustand 스토어 (로컬 영구 보존 & Firebase 실시간 클라우드 자동 동기화) =====
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player, Game, Season, PositionAssignment, SharedLineupData, BattingStats, PitchingStats, GameResult, GameType } from './types';
import { MAX_PLAYERS } from './types';
import {
  initialPlayers,
  initialGames,
  initialSeasons,
  CURRENT_DATA_VERSION,
  CURRENT_DATA_TIMESTAMP,
} from './data/initialData';
import {
  subscribeToCloudStore,
  saveToCloudStore,
  type CloudSyncStatus,
} from './services/cloudStore';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

interface AppState {
  players: Player[];
  games: Game[];
  seasons: Season[];
  initialized: boolean;
  isAdmin: boolean;
  dataVersion?: string;

  // Cloud Sync 상태
  isCloudConnected: boolean;
  cloudSyncStatus: CloudSyncStatus;
  initCloudSync: () => void;

  // Admin Auth
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;

  // Player actions
  addPlayer: (player: Omit<Player, 'id' | 'createdAt'>) => boolean;
  updatePlayer: (id: string, data: Partial<Player>) => void;
  removePlayer: (id: string) => void;

  // Season (League) actions
  addSeason: (name: string, startDate: string, endDate: string) => string;
  updateSeason: (id: string, data: Partial<Season>) => void;
  removeSeason: (id: string) => void;

  // Game actions
  addGame: (gameDate: string, opponent: string, gameType?: GameType, seasonId?: string) => string;
  updateGame: (id: string, data: Partial<Game>) => void;
  removeGame: (id: string) => void;
  completeGame: (id: string, result: GameResult, scoreUs: number, scoreThem: number, battingStats: BattingStats[], pitchingStats: PitchingStats[]) => void;

  // Lineup assignment actions
  updateGameAssignments: (gameId: string, assignments: PositionAssignment[], targetTeam?: 'main' | 'blue' | 'white') => void;

  // Sharing
  encodeLineupForShare: (gameId: string, targetTeam?: 'main' | 'blue' | 'white') => string | null;

  // Data Export / Import (전체 백업 및 복원)
  exportData: () => string;
  importData: (jsonStr: string) => boolean;

  // Init & Sync & Reset
  initializeWithDemo: () => void;
  resetToDemo: () => void;
  syncWithOfficialData: () => void;
}

// 클라우드 저장 헬퍼 (상태 업데이트 후 자동 실행)
function syncToCloudIfConnected(get: () => AppState, set: (partial: Partial<AppState>) => void) {
  const { players, games, seasons, isCloudConnected } = get();
  if (isCloudConnected) {
    saveToCloudStore({ players, games, seasons }, (status) => set({ cloudSyncStatus: status }));
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      players: [],
      games: [],
      seasons: [],
      initialized: false,
      isAdmin: false,
      dataVersion: undefined,
      isCloudConnected: false,
      cloudSyncStatus: 'disconnected',

      initCloudSync: () => {
        subscribeToCloudStore(
          (cloudData) => {
            set({
              players: cloudData.players,
              games: cloudData.games,
              seasons: cloudData.seasons,
              isCloudConnected: true,
              cloudSyncStatus: 'connected',
              initialized: true,
            });
          },
          (status) => {
            set({
              cloudSyncStatus: status,
              isCloudConnected: status === 'connected' || status === 'syncing',
            });
          }
        );
      },

      loginAdmin: (password: string) => {
        if (password === 'hanbang2026') {
          set({ isAdmin: true });
          return true;
        }
        return false;
      },

      logoutAdmin: () => {
        set({ isAdmin: false });
      },

      addPlayer: (data) => {
        const { players } = get();
        if (players.length >= MAX_PLAYERS) return false;
        const newPlayer: Player = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        const nextPlayers = [...players, newPlayer];
        set({ players: nextPlayers });
        syncToCloudIfConnected(get, set);
        return true;
      },

      updatePlayer: (id, data) => {
        const nextPlayers = get().players.map(p => p.id === id ? { ...p, ...data } : p);
        set({ players: nextPlayers });
        syncToCloudIfConnected(get, set);
      },

      removePlayer: (id) => {
        const nextPlayers = get().players.filter(p => p.id !== id);
        set({ players: nextPlayers });
        syncToCloudIfConnected(get, set);
      },

      addSeason: (name, startDate, endDate) => {
        const id = generateId();
        const newSeason: Season = {
          id,
          name,
          startDate,
          endDate,
          createdAt: new Date().toISOString(),
        };
        const nextSeasons = [...get().seasons, newSeason];
        set({ seasons: nextSeasons });
        syncToCloudIfConnected(get, set);
        return id;
      },

      updateSeason: (id, data) => {
        const nextSeasons = get().seasons.map(s => s.id === id ? { ...s, ...data } : s);
        set({ seasons: nextSeasons });
        syncToCloudIfConnected(get, set);
      },

      removeSeason: (id) => {
        const nextSeasons = get().seasons.filter(s => s.id !== id);
        const nextGames = get().games.map(g => g.seasonId === id ? { ...g, seasonId: undefined } : g);
        set({
          seasons: nextSeasons,
          games: nextGames,
        });
        syncToCloudIfConnected(get, set);
      },

      addGame: (gameDate, opponent, gameType = 'external', seasonId) => {
        const id = generateId();
        const opponentName = gameType === 'internal' ? '한방 스윙스 청백전' : opponent;
        const newGame: Game = {
          id,
          gameDate,
          opponent: opponentName,
          gameType,
          status: 'upcoming',
          seasonId,
          assignments: [],
          blueAssignments: [],
          whiteAssignments: [],
          battingStats: [],
          pitchingStats: [],
          createdAt: new Date().toISOString(),
        };
        const nextGames = [...get().games, newGame];
        set({ games: nextGames });
        syncToCloudIfConnected(get, set);
        return id;
      },

      updateGame: (id, data) => {
        const nextGames = get().games.map(g => g.id === id ? { ...g, ...data } : g);
        set({ games: nextGames });
        syncToCloudIfConnected(get, set);
      },

      removeGame: (id) => {
        const nextGames = get().games.filter(g => g.id !== id);
        set({ games: nextGames });
        syncToCloudIfConnected(get, set);
      },

      completeGame: (id, result, scoreUs, scoreThem, battingStats, pitchingStats) => {
        const nextGames = get().games.map(g =>
          g.id === id
            ? { ...g, status: 'completed' as const, result, scoreUs, scoreThem, battingStats, pitchingStats }
            : g
        );
        set({ games: nextGames });
        syncToCloudIfConnected(get, set);
      },

      updateGameAssignments: (gameId, assignments, targetTeam = 'main') => {
        const nextGames = get().games.map(g => {
          if (g.id !== gameId) return g;
          if (targetTeam === 'blue') return { ...g, blueAssignments: assignments };
          if (targetTeam === 'white') return { ...g, whiteAssignments: assignments };
          return { ...g, assignments };
        });
        set({ games: nextGames });
        syncToCloudIfConnected(get, set);
      },

      encodeLineupForShare: (gameId, targetTeam = 'main') => {
        const { games, players } = get();
        const game = games.find(g => g.id === gameId);
        if (!game) return null;

        let assignmentsToShare = game.assignments || [];
        let teamName = '한방 스윙스';
        if (game.gameType === 'internal') {
          if (targetTeam === 'blue') {
            assignmentsToShare = game.blueAssignments || [];
            teamName = '청팀';
          } else if (targetTeam === 'white') {
            assignmentsToShare = game.whiteAssignments || [];
            teamName = '백팀';
          }
        }

        const shareData: SharedLineupData = {
          gameDate: game.gameDate,
          opponent: game.opponent,
          gameType: game.gameType || 'external',
          lineupTitle: `${teamName} 라인업`,
          teamName,
          assignments: assignmentsToShare.map(a => {
            const player = players.find(p => p.id === a.playerId);
            return {
              position: a.position,
              playerName: player?.name ?? '미정',
              playerNumber: player?.number ?? 0,
              battingOrder: a.battingOrder,
            };
          }),
        };

        try {
          const json = JSON.stringify(shareData);
          return btoa(encodeURIComponent(json));
        } catch {
          return null;
        }
      },

      exportData: () => {
        const { players, games, seasons } = get();
        const exportObj = {
          title: '한방 스윙스 데이터 백업',
          exportDate: new Date().toISOString(),
          version: 1,
          dataVersion: CURRENT_DATA_VERSION,
          players,
          games,
          seasons,
        };
        return JSON.stringify(exportObj, null, 2);
      },

      importData: (jsonStr: string) => {
        try {
          const data = JSON.parse(jsonStr);
          if (!data.players || !Array.isArray(data.players)) {
            return false;
          }
          const nextState = {
            players: data.players,
            games: Array.isArray(data.games) ? data.games : [],
            seasons: Array.isArray(data.seasons) && data.seasons.length > 0 ? data.seasons : initialSeasons,
            dataVersion: data.dataVersion || CURRENT_DATA_VERSION,
            initialized: true,
          };
          set(nextState);
          syncToCloudIfConnected(get, set);
          return true;
        } catch {
          return false;
        }
      },

      initializeWithDemo: () => {
        const { initialized, dataVersion, players, games } = get();

        // 1. 배포된 공식 데이터 버전과 로컬 저장소의 데이터 버전이 다르면 자동 갱신
        if (dataVersion !== CURRENT_DATA_VERSION) {
          set({
            players: initialPlayers,
            games: initialGames,
            seasons: initialSeasons,
            dataVersion: CURRENT_DATA_VERSION,
            initialized: true,
          });
          return;
        }

        // 2. 이미 최신 버전으로 초기화되었고 데이터가 존재하면 기존 상태 유지
        if (initialized && (players.length > 0 || games.length > 0)) {
          return;
        }

        // 3. 브라우저 최초 방문 시 최신 공식 마스터 데이터 로드
        set({
          players: initialPlayers,
          games: initialGames,
          seasons: initialSeasons,
          dataVersion: CURRENT_DATA_VERSION,
          initialized: true,
        });
      },

      syncWithOfficialData: () => {
        set({
          players: initialPlayers,
          games: initialGames,
          seasons: initialSeasons,
          dataVersion: CURRENT_DATA_VERSION,
          initialized: true,
        });
        syncToCloudIfConnected(get, set);
      },

      resetToDemo: () => {
        set({
          players: initialPlayers,
          games: initialGames,
          seasons: initialSeasons,
          dataVersion: CURRENT_DATA_VERSION,
          initialized: true,
        });
        syncToCloudIfConnected(get, set);
      },
    }),
    {
      name: 'hanbang-swings-main-storage',
      // isCloudConnected와 cloudSyncStatus는 휘발성이므로 제외
      partialize: (state) => ({
        players: state.players,
        games: state.games,
        seasons: state.seasons,
        initialized: state.initialized,
        isAdmin: state.isAdmin,
        dataVersion: state.dataVersion,
      }),
    }
  )
);

export function decodeSharedLineup(encoded: string): SharedLineupData | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    return JSON.parse(json) as SharedLineupData;
  } catch {
    return null;
  }
}
export { CURRENT_DATA_VERSION, CURRENT_DATA_TIMESTAMP };
