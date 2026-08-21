import { useMemo } from 'react';
import { type Player, type Game, POSITION_LABELS, type Position } from '../../types';
import { aggregateBattingStats, aggregatePitchingStats, formatRate, formatERA, singleGameBattingCalc } from '../../utils/stats';
import { X, TrendingUp, User, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  player: Player;
  games: Game[];
  onClose: () => void;
}

export default function PlayerProfileCard({ player, games, onClose }: Props) {
  const completedGames = useMemo(() => games.filter(g => g.status === 'completed'), [games]);

  const playerGames = useMemo(() => {
    return completedGames
      .filter(g => g.battingStats.some(s => s.playerId === player.id) || g.pitchingStats.some(s => s.playerId === player.id))
      .sort((a, b) => a.gameDate.localeCompare(b.gameDate));
  }, [player.id, completedGames]);

  const batStats = useMemo(() => aggregateBattingStats(player.id, playerGames), [player.id, playerGames]);
  const pitStats = useMemo(() => aggregatePitchingStats(player.id, playerGames), [player.id, playerGames]);

  // 차트 데이터 (타율 트렌드)
  const chartData = useMemo(() => {
    let accumulatedH = 0;
    let accumulatedAB = 0;
    return playerGames.map(game => {
      const stat = game.battingStats.find(s => s.playerId === player.id);
      if (!stat) return null;

      accumulatedH += stat.H;
      accumulatedAB += stat.AB;
      const currentBA = accumulatedAB > 0 ? accumulatedH / accumulatedAB : 0;
      
      const single = singleGameBattingCalc(stat);

      return {
        date: game.gameDate.substring(5), // MM-DD
        '누적 타율': parseFloat(currentBA.toFixed(3)),
        '당일 타율': parseFloat(single.BA.toFixed(3)),
        '안타': stat.H,
      };
    }).filter(Boolean);
  }, [playerGames, player.id]);

  const isPitcher = pitStats.G > 0;
  const positions = player.positions && player.positions.length > 0 ? player.positions : ['BENCH' as Position];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="bg-slate-900 text-white p-6 relative overflow-hidden rounded-t-[20px]">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10">
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 rounded-xl bg-white text-slate-900 flex items-center justify-center font-black text-2xl shrink-0 shadow-md">
              #{player.number}
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                {player.name}
              </h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {positions.map(p => (
                  <span key={p} className="badge bg-slate-800 text-slate-200 border border-slate-700">
                    {p} ({POSITION_LABELS[p as Position]})
                  </span>
                ))}
                <span className="text-xs text-slate-400 flex items-center gap-1 ml-1 font-medium">
                  <Calendar className="w-3.5 h-3.5" /> 출전 {playerGames.length}경기
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* 주요 스탯 요약 */}
          <div>
            <h3 className="font-extrabold text-slate-900 mb-3 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-slate-900" /> 통산 성적 요약
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="glass-card p-3 text-center border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold">타율</div>
                <div className="text-xl font-extrabold text-slate-900">{formatRate(batStats.BA)}</div>
              </div>
              <div className="glass-card p-3 text-center border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold">OPS</div>
                <div className="text-xl font-extrabold text-slate-900">{formatRate(batStats.OPS)}</div>
              </div>
              <div className="glass-card p-3 text-center border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold">홈런</div>
                <div className="text-xl font-extrabold text-slate-900">{batStats.HR}개</div>
              </div>
              <div className="glass-card p-3 text-center border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold">타점</div>
                <div className="text-xl font-extrabold text-slate-900">{batStats.RBI}</div>
              </div>
            </div>
          </div>

          {/* 차트 */}
          {chartData.length > 1 && (
            <div>
              <h3 className="font-extrabold text-slate-900 mb-3 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-900" /> 타율 트렌드
              </h3>
              <div className="glass-card p-4 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={val => val.toFixed(3)} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                    <Line type="monotone" dataKey="누적 타율" stroke="#0f172a" strokeWidth={2.5} dot={{ fill: '#0f172a', r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="당일 타율" stroke="#94a3b8" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 상세 스탯 (한글 용어 헤더) */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-extrabold text-slate-600 mb-2">타격 세부 기록</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="stats-table min-w-full">
                  <thead>
                    <tr>
                      <th className="!text-left">경기</th><th>타석</th><th>타수</th><th>안타</th><th>2루타</th><th>3루타</th><th>홈런</th><th>득점</th><th>타점</th><th>볼넷</th><th>삼진</th><th>도루</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="!text-left">{batStats.G}</td>
                      <td>{batStats.PA}</td><td>{batStats.AB}</td><td>{batStats.H}</td><td>{batStats['2B']}</td>
                      <td>{batStats['3B']}</td><td>{batStats.HR}</td><td>{batStats.R}</td><td>{batStats.RBI}</td>
                      <td>{batStats.BB}</td><td>{batStats.SO}</td><td>{batStats.SB}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {isPitcher && (
              <div>
                <h4 className="text-xs font-extrabold text-slate-600 mb-2">투구 세부 기록</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="stats-table min-w-full">
                    <thead>
                      <tr>
                        <th className="!text-left">경기</th><th>승</th><th>패</th><th>세이브</th><th>ERA</th><th>이닝</th><th>피안타</th><th>실점</th><th>자책점</th><th>사사구</th><th>탈삼진</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="!text-left">{pitStats.G}</td>
                        <td>{pitStats.W}</td><td>{pitStats.L}</td><td>{pitStats.SV}</td>
                        <td className="font-extrabold text-slate-900">{formatERA(pitStats.ERA)}</td>
                        <td>{pitStats.IP}</td><td>{pitStats.H}</td><td>{pitStats.R}</td>
                        <td>{pitStats.ER}</td><td>{pitStats.BB}</td><td>{pitStats.SO}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
