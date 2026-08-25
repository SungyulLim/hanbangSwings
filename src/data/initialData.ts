// ===== 한방 스윙스 공식 마스터 데이터 (2026-08-25 최신 업데이트) =====
import type { Player, Game, Season } from '../types';

export const CURRENT_DATA_VERSION = '2026-08-25-v1';
export const CURRENT_DATA_TIMESTAMP = '2026-08-25T06:11:38.932Z';

export const initialPlayers: Player[] = [
  {
    id: "p07",
    name: "정회제",
    number: 2,
    positions: ["2B", "SS"],
    createdAt: "2026-01-01"
  },
  {
    id: "p16",
    name: "이건욱",
    number: 3,
    positions: ["3B"],
    createdAt: "2026-01-01"
  },
  {
    id: "p04",
    name: "김준혁",
    number: 4,
    positions: ["3B", "1B"],
    createdAt: "2026-01-01"
  },
  {
    id: "p21",
    name: "박준현",
    number: 6,
    positions: ["LF", "CF", "RF"],
    createdAt: "2026-01-01"
  },
  {
    id: "p15",
    name: "이민형",
    number: 12,
    positions: ["C", "1B"],
    createdAt: "2026-01-01"
  },
  {
    id: "p08",
    name: "김세훈",
    number: 13,
    positions: ["C"],
    createdAt: "2026-01-01"
  },
  {
    id: "p05",
    name: "강현승",
    number: 15,
    positions: ["P"],
    createdAt: "2026-01-01"
  },
  {
    id: "p03",
    name: "임성열",
    number: 16,
    positions: ["P"],
    createdAt: "2026-01-01"
  },
  {
    id: "p17",
    name: "김필립",
    number: 17,
    positions: ["RF"],
    createdAt: "2026-01-01"
  },
  {
    id: "p14",
    name: "서지호",
    number: 18,
    positions: ["C", "3B"],
    createdAt: "2026-01-01"
  },
  {
    id: "p13",
    name: "김승현",
    number: 21,
    positions: ["P"],
    createdAt: "2026-01-01"
  },
  {
    id: "p19",
    name: "문예찬",
    number: 23,
    positions: ["LF"],
    createdAt: "2026-01-01"
  },
  {
    id: "p09",
    name: "김찬호",
    number: 31,
    positions: ["SS", "2B"],
    createdAt: "2026-01-01"
  },
  {
    id: "p18",
    name: "구도현",
    number: 33,
    positions: ["1B"],
    createdAt: "2026-01-01"
  },
  {
    id: "p23",
    name: "탁월한",
    number: 36,
    positions: ["P", "SS"],
    createdAt: "2026-01-01"
  },
  {
    id: "p01",
    name: "이준민",
    number: 39,
    positions: ["LF"],
    createdAt: "2026-01-01"
  },
  {
    id: "p02",
    name: "이정훈",
    number: 41,
    positions: ["C"],
    createdAt: "2026-01-01"
  },
  {
    id: "p10",
    name: "석권원",
    number: 42,
    positions: ["P", "C"],
    createdAt: "2026-01-01"
  },
  {
    id: "p11",
    name: "유은택",
    number: 51,
    positions: ["CF", "LF", "RF"],
    createdAt: "2026-01-01"
  },
  {
    id: "p12",
    name: "구본서",
    number: 52,
    positions: ["CF", "LF", "RF"],
    createdAt: "2026-01-01"
  },
  {
    id: "p20",
    name: "박건우",
    number: 80,
    positions: ["P", "2B"],
    createdAt: "2026-01-01"
  },
  {
    id: "p22",
    name: "정우찬",
    number: 88,
    positions: ["2B"],
    createdAt: "2026-01-01"
  },
  {
    id: "p06",
    name: "김도경",
    number: 91,
    positions: ["SS"],
    createdAt: "2026-01-01"
  },
  {
    id: "mt74xxpa87elxl",
    name: "조성환",
    number: 29,
    positions: ["P", "C", "1B"],
    createdAt: "2026-08-24T11:11:02.878Z"
  },
  {
    id: "mt74y6bgmmnxcl",
    name: "이태훈",
    number: 77,
    positions: ["C", "1B", "3B"],
    createdAt: "2026-08-24T11:11:14.044Z"
  },
  {
    id: "mt74yilkhg7ak6",
    name: "임유진",
    number: 47,
    positions: ["MANAGER"],
    createdAt: "2026-08-24T11:11:29.960Z"
  },
  {
    id: "mt74yort74dpdi",
    name: "하상은",
    number: 57,
    positions: ["MANAGER"],
    createdAt: "2026-08-24T11:11:37.961Z"
  }
];

export const initialSeasons: Season[] = [
  {
    id: "season-2026-spring",
    name: "2026-1",
    startDate: "2026-03-01",
    endDate: "2026-06-30",
    createdAt: "2026-04-01"
  }
];

export const initialGames: Game[] = [
  {
    id: "mt6tmqdnnf977m",
    gameDate: "2026-03-21",
    opponent: "마이라클",
    gameType: "external",
    status: "completed",
    seasonId: "season-2026-spring",
    assignments: [],
    blueAssignments: [],
    whiteAssignments: [],
    battingStats: [
      { playerId: "p16", PA: 3, AB: 3, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 0, SO: 2, SB: 0 },
      { playerId: "p08", PA: 3, AB: 3, H: 2, "2B": 1, "3B": 0, HR: 0, RBI: 2, R: 0, BB: 0, SO: 0, SB: 0 },
      { playerId: "p03", PA: 1, AB: 1, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 0, SO: 0, SB: 0 },
      { playerId: "p17", PA: 2, AB: 2, H: 1, "2B": 0, "3B": 0, HR: 0, RBI: 1, R: 0, BB: 0, SO: 1, SB: 0 },
      { playerId: "p14", PA: 2, AB: 2, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 0, SO: 1, SB: 2 },
      { playerId: "p19", PA: 1, AB: 1, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 0, SO: 1, SB: 0 },
      { playerId: "p09", PA: 2, AB: 1, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 1, SO: 0, SB: 0 },
      { playerId: "p18", PA: 3, AB: 2, H: 1, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 1, SO: 0, SB: 0 },
      { playerId: "p23", PA: 3, AB: 3, H: 1, "2B": 0, "3B": 0, HR: 1, RBI: 1, R: 0, BB: 0, SO: 0, SB: 0 },
      { playerId: "p01", PA: 3, AB: 2, H: 1, "2B": 0, "3B": 0, HR: 0, RBI: 1, R: 0, BB: 1, SO: 0, SB: 6 },
      { playerId: "p02", PA: 2, AB: 2, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 1, SO: 2, SB: 2 },
      { playerId: "p11", PA: 4, AB: 3, H: 2, "2B": 0, "3B": 0, HR: 1, RBI: 2, R: 0, BB: 1, SO: 0, SB: 0 },
      { playerId: "p06", PA: 4, AB: 4, H: 1, "2B": 0, "3B": 0, HR: 0, RBI: 2, R: 0, BB: 0, SO: 0, SB: 0 }
    ],
    pitchingStats: [
      { playerId: "p16", IP: 1, ER: 2, R: 2, H: 2, BB: 0, SO: 0, W: 0, L: 0, SV: 0 },
      { playerId: "p05", IP: 2, ER: 0, R: 0, H: 1, BB: 0, SO: 6, W: 0, L: 0, SV: 0 },
      { playerId: "p13", IP: 2, ER: 3, R: 3, H: 3, BB: 1, SO: 2, W: 0, L: 0, SV: 0 }
    ],
    createdAt: "2026-08-24T05:54:24.395Z",
    result: "W",
    scoreUs: 12,
    scoreThem: 7
  },
  {
    id: "mt6tnq55lt971b",
    gameDate: "2026-04-11",
    opponent: "한방 스윙스 자체 청백전",
    gameType: "internal",
    status: "completed",
    seasonId: "season-2026-spring",
    assignments: [],
    blueAssignments: [],
    whiteAssignments: [],
    battingStats: [
      { playerId: "p07", PA: 2, AB: 1, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 1, SO: 0, SB: 0 },
      { playerId: "p16", PA: 3, AB: 3, H: 1, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 0, SO: 0, SB: 0 },
      { playerId: "p21", PA: 2, AB: 1, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 1, SO: 1, SB: 0 },
      { playerId: "p03", PA: 2, AB: 2, H: 1, "2B": 0, "3B": 1, HR: 0, RBI: 0, R: 0, BB: 0, SO: 0, SB: 0 },
      { playerId: "p09", PA: 3, AB: 3, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 0, SO: 1, SB: 0 },
      { playerId: "p18", PA: 3, AB: 1, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 2, SO: 2, SB: 0 },
      { playerId: "p23", PA: 3, AB: 1, H: 1, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 2, SO: 0, SB: 2 },
      { playerId: "p01", PA: 2, AB: 2, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 1, SO: 1, SB: 1 },
      { playerId: "p10", PA: 3, AB: 3, H: 1, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 0, SO: 1, SB: 1 },
      { playerId: "p11", PA: 3, AB: 0, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 0, SO: 1, SB: 0 },
      { playerId: "p22", PA: 3, AB: 2, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 1, SO: 1, SB: 0 },
      { playerId: "p06", PA: 3, AB: 3, H: 1, "2B": 0, "3B": 0, HR: 0, RBI: 1, R: 0, BB: 0, SO: 0, SB: 0 }
    ],
    pitchingStats: [
      { playerId: "p07", IP: 2, ER: 1, R: 3, H: 0, BB: 1, SO: 1, W: 0, L: 0, SV: 0 },
      { playerId: "p16", IP: 1, ER: 0, R: 0, H: 1, BB: 1, SO: 1, W: 0, L: 0, SV: 0 },
      { playerId: "p03", IP: 1, ER: 0, R: 0, H: 0, BB: 3, SO: 1, W: 0, L: 0, SV: 0 },
      { playerId: "p23", IP: 1, ER: 0, R: 0, H: 0, BB: 2, SO: 2, W: 0, L: 0, SV: 0 },
      { playerId: "p06", IP: 1, ER: 7, R: 7, H: 4, BB: 3, SO: 1, W: 0, L: 0, SV: 0 }
    ],
    createdAt: "2026-08-24T05:55:10.745Z",
    result: "W",
    scoreUs: 10,
    scoreThem: 2
  },
  {
    id: "mt73pnw71058f6",
    gameDate: "2026-05-09",
    opponent: "포스텍 타키온즈 루키",
    gameType: "external",
    status: "completed",
    seasonId: "season-2026-spring",
    assignments: [],
    blueAssignments: [],
    whiteAssignments: [],
    battingStats: [
      { playerId: "p04", PA: 2, AB: 1, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 1, SO: 0, SB: 0 },
      { playerId: "p15", PA: 2, AB: 0, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 2, SO: 0, SB: 0 },
      { playerId: "p05", PA: 1, AB: 0, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 1, SO: 0, SB: 0 },
      { playerId: "p03", PA: 2, AB: 0, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 2, BB: 2, SO: 0, SB: 2 },
      { playerId: "p14", PA: 2, AB: 2, H: 1, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 0, SO: 1, SB: 0 },
      { playerId: "p19", PA: 2, AB: 1, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 1, SO: 0, SB: 0 },
      { playerId: "p18", PA: 2, AB: 1, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 1, SO: 1, SB: 0 },
      { playerId: "p02", PA: 2, AB: 0, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 2, BB: 2, SO: 0, SB: 2 }
    ],
    pitchingStats: [
      { playerId: "p05", IP: 2, ER: 0, R: 1, H: 0, BB: 0, SO: 3, W: 0, L: 0, SV: 0 },
      { playerId: "p03", IP: 0, ER: 6, R: 5, H: 2, BB: 5, SO: 0, W: 0, L: 0, SV: 0 }
    ],
    createdAt: "2026-08-24T10:36:37.303Z",
    result: "W",
    scoreUs: 7,
    scoreThem: 6
  },
  {
    id: "mt73x2mhi294qn",
    gameDate: "2026-05-09",
    opponent: "포스텍 타키온즈",
    gameType: "external",
    status: "completed",
    seasonId: "season-2026-spring",
    assignments: [],
    blueAssignments: [],
    whiteAssignments: [],
    battingStats: [
      { playerId: "p16", PA: 2, AB: 2, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 0, SO: 0, SB: 0 },
      { playerId: "p08", PA: 2, AB: 2, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 0, SO: 0, SB: 1 },
      { playerId: "mt74xxpa87elxl", PA: 1, AB: 1, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 1, SO: 0, SB: 0 },
      { playerId: "p01", PA: 3, AB: 1, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 2, SO: 0, SB: 2 },
      { playerId: "p11", PA: 1, AB: 1, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 1, SO: 1, SB: 0 },
      { playerId: "mt74y6bgmmnxcl", PA: 2, AB: 2, H: 0, "2B": 0, "3B": 1, HR: 0, RBI: 1, R: 1, BB: 0, SO: 0, SB: 0 },
      { playerId: "p06", PA: 2, AB: 2, H: 1, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 1, BB: 0, SO: 0, SB: 1 }
    ],
    pitchingStats: [
      { playerId: "mt74xxpa87elxl", IP: 1.1, ER: 3, R: 3, H: 1, BB: 6, SO: 1, W: 0, L: 1, SV: 0 },
      { playerId: "p07", IP: 0.2, ER: 0, R: 0, H: 0, BB: 0, SO: 1, W: 0, L: 0, SV: 0 },
      { playerId: "p12", IP: 0, ER: 0, R: 2, H: 0, BB: 2, SO: 0, W: 0, L: 0, SV: 0 }
    ],
    createdAt: "2026-08-24T10:42:22.985Z",
    result: "L",
    scoreUs: 3,
    scoreThem: 7
  },
  {
    id: "mt880qiiwl2md0",
    gameDate: "2026-05-16",
    opponent: "한방 스윙스 청백전",
    gameType: "internal",
    status: "completed",
    seasonId: "season-2026-spring",
    assignments: [],
    blueAssignments: [],
    whiteAssignments: [],
    battingStats: [
      { playerId: "p16", PA: 2, AB: 2, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 0, SO: 1, SB: 0 },
      { playerId: "p04", PA: 2, AB: 2, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 0, SO: 1, SB: 0 },
      { playerId: "p21", PA: 2, AB: 2, H: 2, "2B": 0, "3B": 0, HR: 0, RBI: 2, R: 0, BB: 0, SO: 0, SB: 0 },
      { playerId: "p14", PA: 3, AB: 2, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 1, SO: 2, SB: 0 },
      { playerId: "p19", PA: 2, AB: 1, H: 1, "2B": 0, "3B": 1, HR: 0, RBI: 3, R: 0, BB: 1, SO: 0, SB: 0 },
      { playerId: "mt74xxpa87elxl", PA: 3, AB: 2, H: 2, "2B": 0, "3B": 1, HR: 0, RBI: 0, R: 0, BB: 1, SO: 0, SB: 0 },
      { playerId: "p18", PA: 1, AB: 1, H: 1, "2B": 1, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 0, SO: 0, SB: 1 },
      { playerId: "p01", PA: 2, AB: 2, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 0, SO: 1, SB: 0 },
      { playerId: "p02", PA: 2, AB: 1, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 1, SO: 0, SB: 0 },
      { playerId: "p10", PA: 1, AB: 1, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 0, SO: 0, SB: 0 },
      { playerId: "p11", PA: 3, AB: 3, H: 2, "2B": 0, "3B": 0, HR: 0, RBI: 1, R: 0, BB: 0, SO: 0, SB: 1 },
      { playerId: "p20", PA: 1, AB: 1, H: 0, "2B": 0, "3B": 0, HR: 0, RBI: 0, R: 0, BB: 0, SO: 0, SB: 0 },
      { playerId: "p22", PA: 2, AB: 2, H: 1, "2B": 0, "3B": 0, HR: 0, RBI: 2, R: 0, BB: 0, SO: 0, SB: 0 },
      { playerId: "mt74y6bgmmnxcl", PA: 3, AB: 3, H: 3, "2B": 0, "3B": 1, HR: 0, RBI: 2, R: 0, BB: 0, SO: 0, SB: 0 }
    ],
    pitchingStats: [],
    createdAt: "2026-08-25T05:24:58.554Z",
    result: "L",
    scoreUs: 6,
    scoreThem: 7
  }
];

// 하위 호환성을 위해 demo 변수명도 export
export const demoPlayers = initialPlayers;
export const demoGames = initialGames;
export const demoSeasons = initialSeasons;
