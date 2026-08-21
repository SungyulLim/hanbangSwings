// ===== 통계 계산 유틸리티 =====
import type { BattingStats, PitchingStats, AggregatedBattingStats, AggregatedPitchingStats, Game } from '../types';

// 타율 (BA) = H / AB
export function calcBA(H: number, AB: number): number {
  if (AB === 0) return 0;
  return H / AB;
}

// 루타 (TB)
export function calcTB(stats: BattingStats): number {
  const singles = stats.H - stats['2B'] - stats['3B'] - stats.HR;
  return singles + stats['2B'] * 2 + stats['3B'] * 3 + stats.HR * 4;
}

// 출루율 (OBP) = (H + BB) / (AB + BB)
export function calcOBP(H: number, BB: number, AB: number): number {
  const denom = AB + BB;
  if (denom === 0) return 0;
  return (H + BB) / denom;
}

// 장타율 (SLG) = TB / AB
export function calcSLG(TB: number, AB: number): number {
  if (AB === 0) return 0;
  return TB / AB;
}

// OPS = OBP + SLG
export function calcOPS(OBP: number, SLG: number): number {
  return OBP + SLG;
}

// 방어율 (ERA) = (ER / IP) * 9
export function calcERA(ER: number, IP: number): number {
  if (IP === 0) return 0;
  return (ER / IP) * 9;
}

// 숫자 포맷 (타율 등 소수점 3자리)
export function formatRate(value: number): string {
  if (value === 0) return '.000';
  const str = value.toFixed(3);
  return value >= 1 ? str : str.substring(1);
}

// ERA 포맷 (소수점 2자리)
export function formatERA(value: number): string {
  if (value === 0) return '0.00';
  return value.toFixed(2);
}

// 빈 타자 기록 생성
export function emptyBattingStats(playerId: string): BattingStats {
  return { playerId, PA: 0, AB: 0, H: 0, '2B': 0, '3B': 0, HR: 0, RBI: 0, R: 0, BB: 0, SO: 0, SB: 0 };
}

// 빈 투수 기록 생성
export function emptyPitchingStats(playerId: string): PitchingStats {
  return { playerId, IP: 0, ER: 0, R: 0, H: 0, SO: 0, BB: 0, W: 0, L: 0, SV: 0 };
}

// 타자 누적 합산
export function aggregateBattingStats(playerId: string, games: Game[]): AggregatedBattingStats {
  const sum = emptyBattingStats(playerId) as AggregatedBattingStats;
  sum.G = 0;
  sum.BA = 0;
  sum.OBP = 0;
  sum.SLG = 0;
  sum.OPS = 0;
  sum.TB = 0;

  for (const game of games) {
    if (game.status !== 'completed') continue;
    const stat = game.battingStats.find(s => s.playerId === playerId);
    if (!stat) continue;
    sum.G += 1;
    sum.PA += stat.PA;
    sum.AB += stat.AB;
    sum.H += stat.H;
    sum['2B'] += stat['2B'];
    sum['3B'] += stat['3B'];
    sum.HR += stat.HR;
    sum.RBI += stat.RBI;
    sum.R += stat.R;
    sum.BB += stat.BB;
    sum.SO += stat.SO;
    sum.SB += stat.SB;
  }

  sum.TB = calcTB(sum);
  sum.BA = calcBA(sum.H, sum.AB);
  sum.OBP = calcOBP(sum.H, sum.BB, sum.AB);
  sum.SLG = calcSLG(sum.TB, sum.AB);
  sum.OPS = calcOPS(sum.OBP, sum.SLG);

  return sum;
}

// 투수 누적 합산
export function aggregatePitchingStats(playerId: string, games: Game[]): AggregatedPitchingStats {
  const sum = emptyPitchingStats(playerId) as AggregatedPitchingStats;
  sum.G = 0;
  sum.ERA = 0;

  for (const game of games) {
    if (game.status !== 'completed') continue;
    const stat = game.pitchingStats.find(s => s.playerId === playerId);
    if (!stat) continue;
    sum.G += 1;
    sum.IP += stat.IP;
    sum.ER += stat.ER;
    sum.R += stat.R;
    sum.H += stat.H;
    sum.SO += stat.SO;
    sum.BB += stat.BB;
    sum.W += stat.W;
    sum.L += stat.L;
    sum.SV += stat.SV;
  }

  sum.ERA = calcERA(sum.ER, sum.IP);

  return sum;
}

// 경기별 타자 통계 (단일 경기)
export function singleGameBattingCalc(stat: BattingStats) {
  const TB = calcTB(stat);
  return {
    BA: calcBA(stat.H, stat.AB),
    OBP: calcOBP(stat.H, stat.BB, stat.AB),
    SLG: calcSLG(TB, stat.AB),
    OPS: calcOPS(calcOBP(stat.H, stat.BB, stat.AB), calcSLG(TB, stat.AB)),
    TB,
  };
}
