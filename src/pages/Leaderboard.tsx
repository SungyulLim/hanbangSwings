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
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-white" />
            리더보드 & 기록실
          </h2>
          <p className="text-bw-500 text-sm mt-1">누적 순위표 및 통산 기록</p>
        </div>
      </div>

      {/* 컨트롤 패널 */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex bg-bw-150 p-1 rounded-lg w-full md:w-auto">
          <button
            onClick={() => setTab('batting')}
            className={`flex-1 md:w-32 py-2 text-sm font-bold rounded transition-all ${
              tab === 'batting' ? 'bg-white text-black shadow-md' : 'text-bw-500 hover:text-white'
            }`}
          >
            타격 순위
          </button>
          <button
            onClick={() => setTab('pitching')}
            className={`flex-1 md:w-32 py-2 text-sm font-bold rounded transition-all ${
              tab === 'pitching' ? 'bg-white text-black shadow-md' : 'text-bw-500 hover:text-white'
            }`}
          >
            투구 순위
          </button>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Search className="w-4 h-4 text-bw-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="선수 검색..."
              className="input-field pl-9 h-full"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setQualifyingOnly(!qualifyingOnly)}
            className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 border transition-all ${
              qualifyingOnly 
                ? 'bg-white text-black border-white' 
                : 'bg-transparent text-bw-500 border-bw-300 hover:text-white'
            }`}
            title={`규정 ${tab === 'batting' ? '타석' : '이닝'} (${tab === 'batting' ? qualPA : qualIP}) 이상만 보기`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">규정 {tab === 'batting' ? '타석' : '이닝'}</span>
          </button>
        </div>
      </div>

      {/* 타자 순위표 */}
      {tab === 'batting' && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>선수</th>
                  <th onClick={() => handleBatSort('G')} className={batSort.key === 'G' ? 'sorted' : ''}>G<SortIcon sortConfig={batSort} sortKey="G" /></th>
                  <th onClick={() => handleBatSort('PA')} className={batSort.key === 'PA' ? 'sorted' : ''}>PA<SortIcon sortConfig={batSort} sortKey="PA" /></th>
                  <th onClick={() => handleBatSort('AB')} className={batSort.key === 'AB' ? 'sorted' : ''}>AB<SortIcon sortConfig={batSort} sortKey="AB" /></th>
                  <th onClick={() => handleBatSort('BA')} className={batSort.key === 'BA' ? 'sorted' : ''}>BA<SortIcon sortConfig={batSort} sortKey="BA" /></th>
                  <th onClick={() => handleBatSort('H')} className={batSort.key === 'H' ? 'sorted' : ''}>H<SortIcon sortConfig={batSort} sortKey="H" /></th>
                  <th onClick={() => handleBatSort('2B')} className={batSort.key === '2B' ? 'sorted' : ''}>2B<SortIcon sortConfig={batSort} sortKey="2B" /></th>
                  <th onClick={() => handleBatSort('3B')} className={batSort.key === '3B' ? 'sorted' : ''}>3B<SortIcon sortConfig={batSort} sortKey="3B" /></th>
                  <th onClick={() => handleBatSort('HR')} className={batSort.key === 'HR' ? 'sorted' : ''}>HR<SortIcon sortConfig={batSort} sortKey="HR" /></th>
                  <th onClick={() => handleBatSort('RBI')} className={batSort.key === 'RBI' ? 'sorted' : ''}>RBI<SortIcon sortConfig={batSort} sortKey="RBI" /></th>
                  <th onClick={() => handleBatSort('R')} className={batSort.key === 'R' ? 'sorted' : ''}>R<SortIcon sortConfig={batSort} sortKey="R" /></th>
                  <th onClick={() => handleBatSort('BB')} className={batSort.key === 'BB' ? 'sorted' : ''}>BB<SortIcon sortConfig={batSort} sortKey="BB" /></th>
                  <th onClick={() => handleBatSort('SO')} className={batSort.key === 'SO' ? 'sorted' : ''}>SO<SortIcon sortConfig={batSort} sortKey="SO" /></th>
                  <th onClick={() => handleBatSort('SB')} className={batSort.key === 'SB' ? 'sorted' : ''}>SB<SortIcon sortConfig={batSort} sortKey="SB" /></th>
                  <th onClick={() => handleBatSort('OBP')} className={batSort.key === 'OBP' ? 'sorted' : ''}>OBP<SortIcon sortConfig={batSort} sortKey="OBP" /></th>
                  <th onClick={() => handleBatSort('SLG')} className={batSort.key === 'SLG' ? 'sorted' : ''}>SLG<SortIcon sortConfig={batSort} sortKey="SLG" /></th>
                  <th onClick={() => handleBatSort('OPS')} className={batSort.key === 'OPS' ? 'sorted' : ''}>OPS<SortIcon sortConfig={batSort} sortKey="OPS" /></th>
                </tr>
              </thead>
              <tbody>
                {displayBatting.map(({ player, stats }, idx) => (
                  <tr key={player.id} className="cursor-pointer" onClick={() => setSelectedPlayer(player)}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-bw-500 w-4 text-right text-xs">{idx + 1}</span>
                        {player.name}
                      </div>
                    </td>
                    <td>{stats.G}</td>
                    <td>{stats.PA}</td>
                    <td>{stats.AB}</td>
                    <td className={`font-bold ${batSort.key === 'BA' ? 'text-white font-extrabold' : ''}`}>{formatRate(stats.BA)}</td>
                    <td className={batSort.key === 'H' ? 'text-white font-bold' : ''}>{stats.H}</td>
                    <td>{stats['2B']}</td>
                    <td>{stats['3B']}</td>
                    <td className={batSort.key === 'HR' ? 'text-white font-bold' : ''}>{stats.HR}</td>
                    <td className={batSort.key === 'RBI' ? 'text-white font-bold' : ''}>{stats.RBI}</td>
                    <td>{stats.R}</td>
                    <td>{stats.BB}</td>
                    <td>{stats.SO}</td>
                    <td>{stats.SB}</td>
                    <td>{formatRate(stats.OBP)}</td>
                    <td>{formatRate(stats.SLG)}</td>
                    <td className={batSort.key === 'OPS' ? 'text-white font-bold' : ''}>{formatRate(stats.OPS)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {displayBatting.length === 0 && (
              <div className="text-center py-12 text-bw-500 text-sm">
                해당하는 기록이 없습니다.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 투수 순위표 */}
      {tab === 'pitching' && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>선수</th>
                  <th onClick={() => handlePitSort('G')} className={pitSort.key === 'G' ? 'sorted' : ''}>G<SortIcon sortConfig={pitSort} sortKey="G" /></th>
                  <th onClick={() => handlePitSort('W')} className={pitSort.key === 'W' ? 'sorted' : ''}>W<SortIcon sortConfig={pitSort} sortKey="W" /></th>
                  <th onClick={() => handlePitSort('L')} className={pitSort.key === 'L' ? 'sorted' : ''}>L<SortIcon sortConfig={pitSort} sortKey="L" /></th>
                  <th onClick={() => handlePitSort('SV')} className={pitSort.key === 'SV' ? 'sorted' : ''}>SV<SortIcon sortConfig={pitSort} sortKey="SV" /></th>
                  <th onClick={() => handlePitSort('ERA')} className={pitSort.key === 'ERA' ? 'sorted' : ''}>ERA<SortIcon sortConfig={pitSort} sortKey="ERA" /></th>
                  <th onClick={() => handlePitSort('IP')} className={pitSort.key === 'IP' ? 'sorted' : ''}>IP<SortIcon sortConfig={pitSort} sortKey="IP" /></th>
                  <th onClick={() => handlePitSort('H')} className={pitSort.key === 'H' ? 'sorted' : ''}>H<SortIcon sortConfig={pitSort} sortKey="H" /></th>
                  <th onClick={() => handlePitSort('R')} className={pitSort.key === 'R' ? 'sorted' : ''}>R<SortIcon sortConfig={pitSort} sortKey="R" /></th>
                  <th onClick={() => handlePitSort('ER')} className={pitSort.key === 'ER' ? 'sorted' : ''}>ER<SortIcon sortConfig={pitSort} sortKey="ER" /></th>
                  <th onClick={() => handlePitSort('BB')} className={pitSort.key === 'BB' ? 'sorted' : ''}>BB<SortIcon sortConfig={pitSort} sortKey="BB" /></th>
                  <th onClick={() => handlePitSort('SO')} className={pitSort.key === 'SO' ? 'sorted' : ''}>SO<SortIcon sortConfig={pitSort} sortKey="SO" /></th>
                </tr>
              </thead>
              <tbody>
                {displayPitching.map(({ player, stats }, idx) => (
                  <tr key={player.id} className="cursor-pointer" onClick={() => setSelectedPlayer(player)}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-bw-500 w-4 text-right text-xs">{idx + 1}</span>
                        {player.name}
                      </div>
                    </td>
                    <td>{stats.G}</td>
                    <td className={pitSort.key === 'W' ? 'text-white font-bold' : ''}>{stats.W}</td>
                    <td>{stats.L}</td>
                    <td className={pitSort.key === 'SV' ? 'text-white font-bold' : ''}>{stats.SV}</td>
                    <td className={`font-bold ${pitSort.key === 'ERA' ? 'text-white font-extrabold' : ''}`}>{formatERA(stats.ERA)}</td>
                    <td className={pitSort.key === 'IP' ? 'text-white font-bold' : ''}>{stats.IP}</td>
                    <td>{stats.H}</td>
                    <td>{stats.R}</td>
                    <td>{stats.ER}</td>
                    <td>{stats.BB}</td>
                    <td className={pitSort.key === 'SO' ? 'text-white font-bold' : ''}>{stats.SO}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {displayPitching.length === 0 && (
              <div className="text-center py-12 text-bw-500 text-sm">
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
