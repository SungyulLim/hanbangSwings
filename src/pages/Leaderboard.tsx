import { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { aggregateBattingStats, aggregatePitchingStats, formatRate, formatERA } from '../utils/stats';
import type { Player, Game } from '../types';
import PlayerProfileCard from '../components/stats/PlayerProfileCard';
import { Trophy, ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
};

export default function Leaderboard() {
  const { players, games } = useAppStore();
  const [tab, setTab] = useState<'batting' | 'pitching'>('batting');
  const [search, setSearch] = useState('');
  const [qualifyingOnly, setQualifyingOnly] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const [batSort, setBatSort] = useState<SortConfig>({ key: 'BA', direction: 'desc' });
  const [pitSort, setPitSort] = useState<SortConfig>({ key: 'ERA', direction: 'asc' });

  const completedGames = useMemo(() => games.filter(g => g.status === 'completed'), [games]);
  const teamGames = completedGames.length;
  const qualPA = teamGames * 1.5;
  const qualIP = teamGames * 1;

  // 데이터 집계
  const aggregatedBatting = useMemo(() => {
    return players
      .map(p => ({ player: p, stats: aggregateBattingStats(p.id, completedGames as Game[]) }))
      .filter(item => item.stats.G > 0);
  }, [players, completedGames]);

  const aggregatedPitching = useMemo(() => {
    return players
      .map(p => ({ player: p, stats: aggregatePitchingStats(p.id, completedGames as Game[]) }))
      .filter(item => item.stats.G > 0);
  }, [players, completedGames]);

  // 필터 및 정렬 (타자)
  const displayBatting = useMemo(() => {
    let result = [...aggregatedBatting];

    if (search) {
      result = result.filter(r => r.player.name.includes(search));
    }
    if (qualifyingOnly) {
      result = result.filter(r => r.stats.PA >= qualPA);
    }

    result.sort((a, b) => {
      const aVal = a.stats[batSort.key as keyof typeof a.stats] as number;
      const bVal = b.stats[batSort.key as keyof typeof b.stats] as number;
      return batSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [aggregatedBatting, search, qualifyingOnly, batSort, qualPA]);

  // 필터 및 정렬 (투수)
  const displayPitching = useMemo(() => {
    let result = [...aggregatedPitching];

    if (search) {
      result = result.filter(r => r.player.name.includes(search));
    }
    if (qualifyingOnly) {
      result = result.filter(r => r.stats.IP >= qualIP);
    }

    result.sort((a, b) => {
      const aVal = a.stats[pitSort.key as keyof typeof a.stats] as number;
      const bVal = b.stats[pitSort.key as keyof typeof b.stats] as number;
      
      if (pitSort.key === 'ERA') {
        if (a.stats.IP === 0) return 1;
        if (b.stats.IP === 0) return -1;
      }
      
      return pitSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [aggregatedPitching, search, qualifyingOnly, pitSort, qualIP]);

  const handleBatSort = (key: string) => {
    setBatSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handlePitSort = (key: string) => {
    const defaultDir = key === 'ERA' ? 'asc' : 'desc';
    setPitSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === defaultDir 
        ? (defaultDir === 'asc' ? 'desc' : 'asc') 
        : defaultDir
    }));
  };

  const SortIcon = ({ sortConfig, sortKey }: { sortConfig: SortConfig, sortKey: string }) => {
    if (sortConfig.key !== sortKey) return null;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-3 h-3 inline ml-1" /> 
      : <ChevronDown className="w-3 h-3 inline ml-1" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            리더보드 & 기록실
          </h2>
          <p className="text-slate-500 text-sm mt-1">누적 순위표 및 통산 성적</p>
        </div>
      </div>

      {/* 컨트롤 패널 */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setTab('batting')}
            className={`flex-1 md:w-32 py-2 text-sm font-extrabold rounded-lg transition-all ${
              tab === 'batting' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            타격 순위
          </button>
          <button
            onClick={() => setTab('pitching')}
            className={`flex-1 md:w-32 py-2 text-sm font-extrabold rounded-lg transition-all ${
              tab === 'pitching' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            투구 순위
          </button>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="선수 검색..."
              className="input-field pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setQualifyingOnly(!qualifyingOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              qualifyingOnly 
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
            title={`규정 ${tab === 'batting' ? '타석' : '이닝'} (${tab === 'batting' ? qualPA : qualIP}) 이상만 보기`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>규정 {tab === 'batting' ? '타석' : '이닝'}</span>
          </button>
        </div>
      </div>

      {/* 타자 순위표 (한글 용어 헤더) */}
      {tab === 'batting' && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>선수</th>
                  <th onClick={() => handleBatSort('G')} className={batSort.key === 'G' ? 'sorted' : ''}>경기<SortIcon sortConfig={batSort} sortKey="G" /></th>
                  <th onClick={() => handleBatSort('PA')} className={batSort.key === 'PA' ? 'sorted' : ''}>타석<SortIcon sortConfig={batSort} sortKey="PA" /></th>
                  <th onClick={() => handleBatSort('AB')} className={batSort.key === 'AB' ? 'sorted' : ''}>타수<SortIcon sortConfig={batSort} sortKey="AB" /></th>
                  <th onClick={() => handleBatSort('BA')} className={batSort.key === 'BA' ? 'sorted' : ''}>타율<SortIcon sortConfig={batSort} sortKey="BA" /></th>
                  <th onClick={() => handleBatSort('H')} className={batSort.key === 'H' ? 'sorted' : ''}>안타<SortIcon sortConfig={batSort} sortKey="H" /></th>
                  <th onClick={() => handleBatSort('2B')} className={batSort.key === '2B' ? 'sorted' : ''}>2루타<SortIcon sortConfig={batSort} sortKey="2B" /></th>
                  <th onClick={() => handleBatSort('3B')} className={batSort.key === '3B' ? 'sorted' : ''}>3루타<SortIcon sortConfig={batSort} sortKey="3B" /></th>
                  <th onClick={() => handleBatSort('HR')} className={batSort.key === 'HR' ? 'sorted' : ''}>홈런<SortIcon sortConfig={batSort} sortKey="HR" /></th>
                  <th onClick={() => handleBatSort('RBI')} className={batSort.key === 'RBI' ? 'sorted' : ''}>타점<SortIcon sortConfig={batSort} sortKey="RBI" /></th>
                  <th onClick={() => handleBatSort('R')} className={batSort.key === 'R' ? 'sorted' : ''}>득점<SortIcon sortConfig={batSort} sortKey="R" /></th>
                  <th onClick={() => handleBatSort('BB')} className={batSort.key === 'BB' ? 'sorted' : ''}>볼넷<SortIcon sortConfig={batSort} sortKey="BB" /></th>
                  <th onClick={() => handleBatSort('SO')} className={batSort.key === 'SO' ? 'sorted' : ''}>삼진<SortIcon sortConfig={batSort} sortKey="SO" /></th>
                  <th onClick={() => handleBatSort('SB')} className={batSort.key === 'SB' ? 'sorted' : ''}>도루<SortIcon sortConfig={batSort} sortKey="SB" /></th>
                  <th onClick={() => handleBatSort('OBP')} className={batSort.key === 'OBP' ? 'sorted' : ''}>출루율<SortIcon sortConfig={batSort} sortKey="OBP" /></th>
                  <th onClick={() => handleBatSort('SLG')} className={batSort.key === 'SLG' ? 'sorted' : ''}>장타율<SortIcon sortConfig={batSort} sortKey="SLG" /></th>
                  <th onClick={() => handleBatSort('OPS')} className={batSort.key === 'OPS' ? 'sorted' : ''}>OPS<SortIcon sortConfig={batSort} sortKey="OPS" /></th>
                </tr>
              </thead>
              <tbody>
                {displayBatting.map(({ player, stats }, idx) => (
                  <tr key={player.id} className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setSelectedPlayer(player)}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold w-4 text-right text-xs">{idx + 1}</span>
                        <span className="font-bold text-xs bg-slate-900 text-white px-1.5 py-0.5 rounded">#{player.number}</span>
                        <span className="font-extrabold text-slate-900">{player.name}</span>
                      </div>
                    </td>
                    <td>{stats.G}</td>
                    <td>{stats.PA}</td>
                    <td>{stats.AB}</td>
                    <td className={`font-extrabold ${batSort.key === 'BA' ? 'text-green-700 bg-green-50' : 'text-slate-900'}`}>{formatRate(stats.BA)}</td>
                    <td className={batSort.key === 'H' ? 'font-extrabold text-slate-900' : ''}>{stats.H}</td>
                    <td>{stats['2B']}</td>
                    <td>{stats['3B']}</td>
                    <td className={batSort.key === 'HR' ? 'font-extrabold text-slate-900' : ''}>{stats.HR}</td>
                    <td className={batSort.key === 'RBI' ? 'font-extrabold text-slate-900' : ''}>{stats.RBI}</td>
                    <td>{stats.R}</td>
                    <td>{stats.BB}</td>
                    <td>{stats.SO}</td>
                    <td>{stats.SB}</td>
                    <td>{formatRate(stats.OBP)}</td>
                    <td>{formatRate(stats.SLG)}</td>
                    <td className={`font-extrabold ${batSort.key === 'OPS' ? 'text-green-700 bg-green-50' : 'text-slate-900'}`}>{formatRate(stats.OPS)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {displayBatting.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">
                해당하는 기록이 없습니다.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 투수 순위표 (한글 용어 헤더) */}
      {tab === 'pitching' && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>선수</th>
                  <th onClick={() => handlePitSort('G')} className={pitSort.key === 'G' ? 'sorted' : ''}>경기<SortIcon sortConfig={pitSort} sortKey="G" /></th>
                  <th onClick={() => handlePitSort('W')} className={pitSort.key === 'W' ? 'sorted' : ''}>승<SortIcon sortConfig={pitSort} sortKey="W" /></th>
                  <th onClick={() => handlePitSort('L')} className={pitSort.key === 'L' ? 'sorted' : ''}>패<SortIcon sortConfig={pitSort} sortKey="L" /></th>
                  <th onClick={() => handlePitSort('SV')} className={pitSort.key === 'SV' ? 'sorted' : ''}>세이브<SortIcon sortConfig={pitSort} sortKey="SV" /></th>
                  <th onClick={() => handlePitSort('ERA')} className={pitSort.key === 'ERA' ? 'sorted' : ''}>ERA<SortIcon sortConfig={pitSort} sortKey="ERA" /></th>
                  <th onClick={() => handlePitSort('IP')} className={pitSort.key === 'IP' ? 'sorted' : ''}>이닝<SortIcon sortConfig={pitSort} sortKey="IP" /></th>
                  <th onClick={() => handlePitSort('H')} className={pitSort.key === 'H' ? 'sorted' : ''}>피안타<SortIcon sortConfig={pitSort} sortKey="H" /></th>
                  <th onClick={() => handlePitSort('R')} className={pitSort.key === 'R' ? 'sorted' : ''}>실점<SortIcon sortConfig={pitSort} sortKey="R" /></th>
                  <th onClick={() => handlePitSort('ER')} className={pitSort.key === 'ER' ? 'sorted' : ''}>자책점<SortIcon sortConfig={pitSort} sortKey="ER" /></th>
                  <th onClick={() => handlePitSort('BB')} className={pitSort.key === 'BB' ? 'sorted' : ''}>사사구<SortIcon sortConfig={pitSort} sortKey="BB" /></th>
                  <th onClick={() => handlePitSort('SO')} className={pitSort.key === 'SO' ? 'sorted' : ''}>탈삼진<SortIcon sortConfig={pitSort} sortKey="SO" /></th>
                </tr>
              </thead>
              <tbody>
                {displayPitching.map(({ player, stats }, idx) => (
                  <tr key={player.id} className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setSelectedPlayer(player)}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold w-4 text-right text-xs">{idx + 1}</span>
                        <span className="font-bold text-xs bg-slate-900 text-white px-1.5 py-0.5 rounded">#{player.number}</span>
                        <span className="font-extrabold text-slate-900">{player.name}</span>
                      </div>
                    </td>
                    <td>{stats.G}</td>
                    <td className={pitSort.key === 'W' ? 'font-extrabold text-slate-900' : ''}>{stats.W}</td>
                    <td>{stats.L}</td>
                    <td className={pitSort.key === 'SV' ? 'font-extrabold text-slate-900' : ''}>{stats.SV}</td>
                    <td className={`font-extrabold ${pitSort.key === 'ERA' ? 'text-green-700 bg-green-50' : 'text-slate-900'}`}>{formatERA(stats.ERA)}</td>
                    <td className={pitSort.key === 'IP' ? 'font-extrabold text-slate-900' : ''}>{stats.IP}</td>
                    <td>{stats.H}</td>
                    <td>{stats.R}</td>
                    <td>{stats.ER}</td>
                    <td>{stats.BB}</td>
                    <td className={pitSort.key === 'SO' ? 'font-extrabold text-slate-900' : ''}>{stats.SO}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {displayPitching.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">
                해당하는 기록이 없습니다.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 선수 프로필 모달 */}
      {selectedPlayer && (
        <PlayerProfileCard
          player={selectedPlayer}
          games={games}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
