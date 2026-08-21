// ===== 한방 스윙스 - 핵심 타입 정의 (라인업 단일화 & 투수 DH 겸업 지원) =====

export const MAX_PLAYERS = 35;

// 수비 포지션
export type Position = 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH' | 'BENCH';

export const FIELD_POSITIONS: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
export const ALL_POSITIONS: Position[] = [...FIELD_POSITIONS, 'DH', 'BENCH'];

export const POSITION_LABELS: Record<Position, string> = {
  P: '투수', C: '포수', '1B': '1루수', '2B': '2루수', '3B': '3루수',
  SS: '유격수', LF: '좌익수', CF: '중견수', RF: '우익수',
  DH: '지명타자', BENCH: '후보',
};

// 선수 (멀티 포지션 지원)
export interface Player {
  id: string;
  name: string;
  number: number;
  positions: Position[];
  createdAt: string;
}

// 라인업 포지션 배정
export interface PositionAssignment {
  position: Position;
  playerId: string;
  battingOrder: number; // 0 = 타순 없음 (벤치)
}

// 타자 기록
export interface BattingStats {
  playerId: string;
  PA: number;   // 타석
  AB: number;   // 타수
  H: number;    // 안타
  '2B': number; // 2루타
  '3B': number; // 3루타
  HR: number;   // 홈런
  RBI: number;  // 타점
  R: number;    // 득점
  BB: number;   // 볼넷
  SO: number;   // 삼진
  SB: number;   // 도루
}

// 투수 기록
export interface PitchingStats {
  playerId: string;
  IP: number;   // 이닝
  ER: number;   // 자책점
  R: number;    // 실점
  H: number;    // 피안타
  SO: number;   // 탈삼진
  BB: number;   // 사사구
  W: number;    // 승
  L: number;    // 패
  SV: number;   // 세이브
}

export type GameResult = 'W' | 'L' | 'D';
export type GameStatus = 'upcoming' | 'completed';
export type GameType = 'external' | 'internal'; // external: 대외 경기, internal: 청백전

// 경기 (단일 라인업 & 청백전시 청/백 라인업 구조)
export interface Game {
  id: string;
  gameDate: string;
  opponent: string; // 대외경기: 상대팀명, 청백전: "한방 스윙스 청백전"
  gameType: GameType;
  status: GameStatus;
  result?: GameResult;
  scoreUs?: number; // 우리팀 / 청팀 점수
  scoreThem?: number; // 상대팀 / 백팀 점수
  
  // 경기의 라인업 (대외경기: 단일 라인업, 청백전: 청팀/백팀 라인업)
  assignments: PositionAssignment[]; // 대외경기용 타순 및 수비배치
  blueAssignments?: PositionAssignment[]; // 청백전 청팀
  whiteAssignments?: PositionAssignment[]; // 청백전 백팀

  // 경기 후 기록 (투수 DH 겸업 포함)
  battingStats: BattingStats[];
  pitchingStats: PitchingStats[];
  createdAt: string;
}

// 누적 통계
export interface AggregatedBattingStats extends BattingStats {
  G: number;
  BA: number;
  OBP: number;
  SLG: number;
  OPS: number;
  TB: number;
}

export interface AggregatedPitchingStats extends PitchingStats {
  G: number;
  ERA: number;
}

// 공유 라인업 데이터
export interface SharedLineupData {
  gameDate: string;
  opponent: string;
  gameType: GameType;
  teamName?: string; // e.g. "한방 스윙스" 또는 "청팀" / "백팀"
  lineupTitle?: string;
  assignments: {
    position: Position;
    playerName: string;
    playerNumber: number;
    battingOrder: number;
  }[];
}
