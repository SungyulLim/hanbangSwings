import { useAppStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { aggregateBattingStats, aggregatePitchingStats, formatRate, formatERA } from '../utils/stats';
import { Trophy, Calendar, ChevronRight, Zap, Award } from 'lucide-react';
import type { Game } from '../types';

export default function Dashboard() {
  const { players, games } = useAppStore();
  const navigate = useNavigate();

  const completedGames = games.filter(g => g.status === 'completed');
  const upcomingGames = games.filter(g => g.status === 'upcoming');
  const wins = completedGames.filter(g => g.result === 'W').length;
  const losses = completedGames.filter(g => g.result === 'L').length;
  const draws = completedGames.filter(g => g.result === 'D').length;

  // 리더
  const battingLeaders = players
    .map(p => ({ player: p, stats: aggregateBattingStats(p.id, completedGames as Game[]) }))
    .filter(x => x.stats.G > 0);

  const pitchingLeaders = players
    .map(p => ({ player: p, stats: aggregatePitchingStats(p.id, completedGames as Game[]) }))
    .filter(x => x.stats.G > 0);

  const baLeader = [...battingLeaders].sort((a, b) => b.stats.BA - a.stats.BA)[0];
  const hrLeader = [...battingLeaders].sort((a, b) => b.stats.HR - a.stats.HR)[0];
  const eraLeader = [...pitchingLeaders].sort((a, b) => {
    if (a.stats.IP === 0) return 1;
    if (b.stats.IP === 0) return -1;
    return a.stats.ERA - b.stats.ERA;
  })[0];

  const recentGames = [...completedGames].sort((a, b) => b.gameDate.localeCompare(a.gameDate)).slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-green-600" />
            대시보드
          </h2>
          <p className="text-slate-500 text-sm mt-1">한방 스윙스 시즌 현황 & 동아리 리더보드</p>
        </div>
        <button onClick={() => navigate('/games')} className="btn-primary text-xs">
          <Calendar className="w-4 h-4" /> 경기 관리
        </button>
      </div>

      {/* 전적 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '승', value: wins, color: 'text-green-600' },
          { label: '패', value: losses, color: 'text-red-600' },
          { label: '무', value: draws, color: 'text-amber-600' },
          { label: '완료 경기', value: completedGames.length, color: 'text-slate-900' },
        ].map(item => (
          <div key={item.label} className="glass-card p-4 text-center">
            <div className={`text-3xl font-extrabold ${item.color}`}>{item.value}</div>
            <div className="text-xs text-slate-500 mt-1 font-bold">{item.label}</div>
          </div>
        ))}
      </div>

      {/* 리더 */}
      {battingLeaders.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-amber-500" /> 시즌 주요 리더
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {baLeader && (
              <div className="glass-card p-4 border-l-4 border-l-green-500">
                <div className="text-xs text-slate-500 font-bold">타율 1위</div>
                <div className="text-lg font-extrabold text-slate-900 mt-1">{baLeader.player.name}</div>
                <div className="text-2xl font-extrabold text-green-600 mt-1">{formatRate(baLeader.stats.BA)}</div>
              </div>
            )}
            {hrLeader && (
              <div className="glass-card p-4 border-l-4 border-l-amber-500">
                <div className="text-xs text-slate-500 font-bold">홈런 1위</div>
                <div className="text-lg font-extrabold text-slate-900 mt-1">{hrLeader.player.name}</div>
                <div className="text-2xl font-extrabold text-amber-600 mt-1">{hrLeader.stats.HR}개</div>
              </div>
            )}
            {eraLeader && eraLeader.stats.IP > 0 && (
              <div className="glass-card p-4 border-l-4 border-l-blue-500">
                <div className="text-xs text-slate-500 font-bold">방어율 1위</div>
                <div className="text-lg font-extrabold text-slate-900 mt-1">{eraLeader.player.name}</div>
                <div className="text-2xl font-extrabold text-blue-600 mt-1">{formatERA(eraLeader.stats.ERA)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 예정 경기 */}
      {upcomingGames.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-blue-600" /> 다음 예정 경기
          </h3>
          <div className="space-y-2">
            {upcomingGames.map(game => (
              <button
                key={game.id}
                onClick={() => navigate(`/games/${game.id}`)}
                className="glass-card p-4 flex items-center justify-between w-full text-left hover:border-slate-400 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex flex-col items-center justify-center text-xs">
                    <span>{game.gameDate.substring(5, 7)}월</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">vs {game.opponent}</span>
                      {game.gameType === 'internal' && (
                        <span className="badge badge-blue">청백전</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{game.gameDate}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-100 text-slate-700 font-bold border border-slate-200 rounded-md px-2.5 py-1">
                    라인업 보기
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 최근 경기 */}
      {recentGames.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-slate-700" /> 최근 경기 결과
            </h3>
            <button onClick={() => navigate('/games')} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-bold">
              전체 경기보기 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {recentGames.map(game => (
              <button
                key={game.id}
                onClick={() => navigate(`/games/${game.id}`)}
                className="glass-card p-4 flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center gap-3">
                  <span className={`badge ${game.result === 'W' ? 'badge-win' : game.result === 'L' ? 'badge-loss' : 'badge-draw'}`}>
                    {game.gameType === 'internal'
                      ? '청백전'
                      : (game.result === 'W' ? '승' : game.result === 'L' ? '패' : '무')}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">vs {game.opponent}</div>
                    <div className="text-xs text-slate-500">{game.gameDate}</div>
                  </div>
                </div>
                <div className="text-lg font-extrabold text-slate-900">
                  {game.gameType === 'internal'
                    ? `청팀 ${game.scoreUs} : ${game.scoreThem} 백팀`
                    : `${game.scoreUs} : ${game.scoreThem}`}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
