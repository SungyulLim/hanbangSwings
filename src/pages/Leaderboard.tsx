import { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { aggregateBattingStats, aggregatePitchingStats, formatRate, formatERA } from '../utils/stats';
import type { Player, Game } from '../types';
import PlayerProfileCard from '../components/stats/PlayerProfileCard';
import { Trophy, ChevronDown, ChevronUp, Search, Filter, Layers, X } from 'lucide-react';

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
};

export default function Leaderboard() {
  const { players, games, seasons } = useAppStore();
  const [tab, setTab] = useState<'batting' | 'pitching'>('batting');
  const [search, setSearch] = useState('');
  const [qualifyingOnly, setQualifyingOnly] = useState(false);

  // 'all' | Set<seasonId>
  // 'all' 모드: 전체 통산
  // Set 모드: 선택된 리그들 합산
  const [mode, setMode] = useState<'all' | 'custom'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const [batSort, setBatSort] = useState<SortConfig>({ key: 'BA', direction: 'desc' });
  const [pitSort, setPitSort] = useState<SortConfig>({ key: 'ERA', direction: 'asc' });

  // 리그 토글
  const toggleSeason = (id: string) => {
    setMode('custom');
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setAll = () => {
    setMode('all');
    setSelectedIds(new Set());
  };

  // 현재 선택 기준으로 완료된 경기 필터링
  const completedGames = useMemo(() => {
    const all = games.filter(g => g.status === 'completed');
    if (mode === 'all') return all;
    if (selectedIds.size === 0) return [];
    return all.filter(g => g.seasonId && selectedIds.has(g.seasonId));
  }, [games, mode, selectedIds]);

  const teamGames = completedGames.length;
  const qualPA = Math.max(1, teamGames * 1.5);
  const qualIP = Math.max(1, teamGames * 1);

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
    if (search) result = result.filter(r => r.player.name.includes(search));
    if (qualifyingOnly) result = result.filter(r => r.stats.PA >= qualPA);
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
    if (search) result = result.filter(r => r.player.name.includes(search));
    if (qualifyingOnly) result = result.filter(r => r.stats.IP >= qualIP);
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
    setBatSort(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
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

  const SortIcon = ({ sortConfig, sortKey }: { sortConfig: SortConfig; sortKey: string }) => {
    if (sortConfig.key !== sortKey) return null;
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="w-3 h-3 inline ml-1" />
      : <ChevronDown className="w-3 h-3 inline ml-1" />;
  };

  // 헤더 레이블
  const headerLabel = useMemo(() => {
    if (mode === 'all') return '전체 통산';
    if (selectedIds.size === 0) return '리그를 선택하세요';
    if (selectedIds.size === 1) {
      const id = [...selectedIds][0];
      return seasons.find(s => s.id === id)?.name ?? '선택된 리그';
    }
    return `${selectedIds.size}개 리그 합산`;
  }, [mode, selectedIds, seasons]);

  const sortedSeasons = useMemo(
    () => [...seasons].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [seasons]
  );

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            리더보드 &amp; 기록실
          </h2>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5">
            {mode === 'custom' && selectedIds.size > 1 && (
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">
                <Layers className="w-3 h-3" /> 합산 모드
              </span>
            )}
            {headerLabel}
          </p>
        </div>
      </div>

      {/* 리그 셀렉터 */}
      <div className="glass-card p-4 space-y-3">
        <p className="text-xs text-slate-500 font-bold flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          리그 선택
          {mode === 'custom' && selectedIds.size > 0 && (
            <span className="ml-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              {selectedIds.size}개 선택됨 · 여러 개 선택 시 합산
            </span>
          )}
        </p>

        <div className="flex flex-wrap gap-2">
          {/* 전체 통산 버튼 */}
          <button
            onClick={setAll}
            className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all flex items-center gap-1.5 ${
              mode === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            전체 통산
          </button>

          {sortedSeasons.map(season => {
            const isSelected = mode === 'custom' && selectedIds.has(season.id);
            const gamesInSeason = games.filter(g => g.status === 'completed' && g.seasonId === season.id).length;
            return (
              <button
                key={season.id}
                onClick={() => toggleSeason(season.id)}
                className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all flex items-center gap-2 group ${
                  isSelected
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:bg-amber-50'
                }`}
              >
                <Trophy className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-amber-400 group-hover:text-amber-500'}`} />
                <span>{season.name}</span>
                <span className={`text-[11px] font-normal ${isSelected ? 'text-amber-100' : 'text-slate-400'}`}>
                  {gamesInSeason}경기
                </span>
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center">
                    <X className="w-2.5 h-2.5 text-white" />
                  </span>
                )}
              </button>
            );
          })}

          {seasons.length === 0 && (
            <span className="text-xs text-slate-400 py-2">경기 페이지에서 리그를 먼저 생성하세요.</span>
          )}
        </div>

        {/* 합산 중인 리그 배지 */}
        {mode === 'custom' && selectedIds.size > 1 && (
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
            <span className="text-xs text-slate-400 self-center">합산 중:</span>
            {[...selectedIds].map(id => {
              const s = seasons.find(x => x.id === id);
              return s ? (
                <span key={id} className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">
                  {s.name}
                  <button onClick={() => toggleSeason(id)} className="hover:text-red-600 transition-colors">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}
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
            title={`규정 ${tab === 'batting' ? '타석' : '이닝'} (${tab === 'batting' ? qualPA.toFixed(1) : qualIP.toFixed(1)}) 이상만 보기`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>규정 {tab === 'batting' ? '타석' : '이닝'}</span>
          </button>
        </div>
      </div>

      {/* 경기 없음 / 리그 미선택 안내 */}
      {(completedGames.length === 0 || (mode === 'custom' && selectedIds.size === 0)) && (
        <div className="glass-card p-8 text-center">
          <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-sm">
            {mode === 'custom' && selectedIds.size === 0
              ? '위에서 리그를 하나 이상 선택하세요.'
              : `선택한 리그에 완료된 경기가 없습니다.`}
          </p>
        </div>
      )}

      {/* 타자 순위표 */}
      {tab === 'batting' && completedGames.length > 0 && (mode === 'all' || selectedIds.size > 0) && (
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

      {/* 투수 순위표 */}
      {tab === 'pitching' && completedGames.length > 0 && (mode === 'all' || selectedIds.size > 0) && (
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
