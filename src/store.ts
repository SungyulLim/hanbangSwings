// ===== Zustand 스토어 (데이터 영구 보존 & 과거 버전 자동 마이그레이션 & 백업/복원 지원) =====
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player, Game, Season, PositionAssignment, SharedLineupData, BattingStats, PitchingStats, GameResult, GameType } from './types';
import { MAX_PLAYERS } from './types';
import { demoPlayers, demoGames, demoSeasons } from './data/demo';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// 과거 저장소 키 목록 (자동 데이터 복구용)
const LEGACY_STORAGE_KEYS = [
  'hanbang-swings-store-v9',
  'hanbang-swings-store-v8',
  'hanbang-swings-store-v7',
  'hanbang-swings-store-v6',
  'hanbang-swings-store-v5',
  'hanbang-swings-store-v4',
  'hanbang-swings-store-v3',
  'hanbang-swings-store-v2',
  'hanbang-swings-store-v1',
  'hanbang-swings-store',
];

interface AppState {
  players: Player[];
  games: Game[];
  seasons: Season[];
  initialized: boolean;
  isAdmin: boolean;

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

  // Init & Reset
  initializeWithDemo: () => void;
  resetToDemo: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      players: [],
      games: [],
      seasons: [],
      initialized: false,
      isAdmin: false,

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
        set({ players: [...players, newPlayer] });
        return true;
      },

      updatePlayer: (id, data) => {
        set({ players: get().players.map(p => p.id === id ? { ...p, ...data } : p) });
      },

      removePlayer: (id) => {
        set({ players: get().players.filter(p => p.id !== id) });
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
        set({ seasons: [...get().seasons, newSeason] });
        return id;
      },

      updateSeason: (id, data) => {
        set({ seasons: get().seasons.map(s => s.id === id ? { ...s, ...data } : s) });
      },

      removeSeason: (id) => {
        // 해당 리그에 속한 경기의 seasonId를 undefined로 초기화
        set({
          seasons: get().seasons.filter(s => s.id !== id),
          games: get().games.map(g => g.seasonId === id ? { ...g, seasonId: undefined } : g),
        });
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
        set({ games: [...get().games, newGame] });
        return id;
      },

      updateGame: (id, data) => {
        set({ games: get().games.map(g => g.id === id ? { ...g, ...data } : g) });
      },

      removeGame: (id) => {
        set({ games: get().games.filter(g => g.id !== id) });
      },

      completeGame: (id, result, scoreUs, scoreThem, battingStats, pitchingStats) => {
        set({
          games: get().games.map(g =>
            g.id === id
              ? { ...g, status: 'completed' as const, result, scoreUs, scoreThem, battingStats, pitchingStats }
              : g
          ),
        });
      },

      updateGameAssignments: (gameId, assignments, targetTeam = 'main') => {
        set({
          games: get().games.map(g => {
            if (g.id !== gameId) return g;
            if (targetTeam === 'blue') return { ...g, blueAssignments: assignments };
            if (targetTeam === 'white') return { ...g, whiteAssignments: assignments };
            return { ...g, assignments };
          }),
        });
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
          set({
            players: data.players,
            games: Array.isArray(data.games) ? data.games : [],
            seasons: Array.isArray(data.seasons) && data.seasons.length > 0 ? data.seasons : demoSeasons,
            initialized: true,
          });
          return true;
        } catch {
          return false;
        }
      },

      initializeWithDemo: () => {
        const { initialized, players, games, seasons } = get();

        // 1. 이미 스토어에 데이터가 존재하면 절대 덮어쓰지 않고 기존 데이터 유지!
        if (initialized && (players.length > 0 || games.length > 0)) {
          if (seasons.length === 0) {
            set({ seasons: demoSeasons });
          }
          return;
        }

        // 2. 현재 스토어가 비어있다면, 과거 버전의 localStorage 키에서 기존 사용자 데이터 복구 시도
        if (typeof window !== 'undefined') {
          for (const key of LEGACY_STORAGE_KEYS) {
            try {
              const raw = localStorage.getItem(key);
              if (raw) {
                const parsed = JSON.parse(raw);
                const state = parsed.state || parsed;
                if (state && Array.isArray(state.players) && state.players.length > 0) {
                  set({
                    players: state.players,
                    games: Array.isArray(state.games) ? state.games : [],
                    seasons: Array.isArray(state.seasons) && state.seasons.length > 0 ? state.seasons : demoSeasons,
                    initialized: true,
                  });
                  return;
                }
              }
            } catch {
              // ignore parse errors
            }
          }
        }

        // 3. 브라우저에 저장된 이전 데이터가 전혀 없는 최초 방문자일 때만 데모 데이터 로드
        set({
          players: demoPlayers,
          games: demoGames,
          seasons: demoSeasons,
          initialized: true,
        });
      },

      resetToDemo: () => {
        set({
          players: demoPlayers,
          games: demoGames,
          seasons: demoSeasons,
          initialized: true,
        });
      },
    }),
    { name: 'hanbang-swings-main-storage' }
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
