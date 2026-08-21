import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import {
  FIELD_POSITIONS, type Position, type PositionAssignment,
  POSITION_LABELS, type GameResult, type BattingStats, type PitchingStats,
} from '../types';
import DiamondField from '../components/lineup/DiamondField';
import BattingOrderList from '../components/lineup/BattingOrderList';
import BattingStatsForm from '../components/stats/BattingStatsForm';
import PitchingStatsForm from '../components/stats/PitchingStatsForm';
import { emptyBattingStats, emptyPitchingStats, formatRate, formatERA, singleGameBattingCalc, calcERA } from '../utils/stats';
import {
  ArrowLeft, Share2, Copy, Check, X, Target,
  ClipboardList, Calendar, ShieldAlert, Trash2, Lock
} from 'lucide-react';

type Tab = 'lineup' | 'record';

export default function GameDetail() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const {
    players, games, isAdmin,
    updateGameAssignments, completeGame, removeGame, encodeLineupForShare,
  } = useAppStore();

  const game = games.find(g => g.id === gameId);

  const [tab, setTab] = useState<Tab>('lineup');
  const [internalTeamTab, setInternalTeamTab] = useState<'blue' | 'white'>('blue');
  const [showPlayerPicker, setShowPlayerPicker] = useState<Position | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 경기 기록 입력 상태
  const [result, setResult] = useState<GameResult>('W');
  const [scoreUs, setScoreUs] = useState('');
  const [scoreThem, setScoreThem] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [battingData, setBattingData] = useState<Record<string, BattingStats>>({});
  const [pitchingData, setPitchingData] = useState<Record<string, PitchingStats>>({});
  const [recordStep, setRecordStep] = useState<'select' | 'stats'>('select');

  // 선수 목록 배번 오름차순 정렬
  const sortedPlayersList = useMemo(() => {
    return [...players].sort((a, b) => a.number - b.number);
  }, [players]);

  if (!game) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-slate-600">경기를 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/games')} className="btn-secondary mt-4">
          <ArrowLeft className="w-4 h-4" /> 목록으로
        </button>
      </div>
    );
  }

  const isInternal = game.gameType === 'internal';

  const currentAssignments = useMemo(() => {
    if (isInternal) {
      return internalTeamTab === 'blue' ? (game.blueAssignments || []) : (game.whiteAssignments || []);
    }
    return game.assignments || [];
  }, [game, isInternal, internalTeamTab]);

  const diamondAssignments = useMemo(() => {
    const map: Record<Position, string | null> = {} as Record<Position, string | null>;
    FIELD_POSITIONS.forEach(pos => {
      const a = currentAssignments.find(x => x.position === pos);
      map[pos] = a?.playerId ?? null;
    });
    return map;
  }, [currentAssignments]);

  const assignedPlayerIds = new Set(currentAssignments.map(a => a.playerId));

  // === 삭제 핸들러 ===
  const handleDeleteGame = () => {
    if (!isAdmin) {
      alert('경기 삭제 권한은 관리자 계정만 가지고 있습니다.');
      return;
    }
    if (confirm(`'vs ${game.opponent}' 경기를 삭제하시겠습니까? 관련 모든 기록이 삭제됩니다.`)) {
      removeGame(game.id);
      navigate('/games');
    }
  };

  // === 라인업 편집 핸들러 ===

  const handlePositionClick = (position: Position) => {
    if (!isAdmin) {
      alert('라인업 포지션 배정은 관리자만 가능합니다.');
      return;
    }
    if (game.status === 'completed') return;
    setShowPlayerPicker(position);
  };

  const handleAssignPlayer = (playerId: string) => {
    if (!showPlayerPicker || !isAdmin) return;
    const position = showPlayerPicker;
    const maxOrder = currentAssignments.reduce((m, a) => Math.max(m, a.battingOrder), 0);

    let newAssignments = currentAssignments.filter(a => a.position !== position);
    newAssignments = newAssignments.filter(a => a.playerId !== playerId);
    newAssignments.push({
      position,
      playerId,
      battingOrder: position === 'BENCH' ? 0 : maxOrder + 1,
    });

    const targetTeam = isInternal ? internalTeamTab : 'main';
    updateGameAssignments(game.id, newAssignments, targetTeam);
    setShowPlayerPicker(null);
  };

  const handleRemovePosition = (position: string) => {
    if (!isAdmin) return;
    const newAssignments = currentAssignments.filter(a => a.position !== position);
    const targetTeam = isInternal ? internalTeamTab : 'main';
    updateGameAssignments(game.id, newAssignments, targetTeam);
  };

  const handleReorder = (newAssignments: PositionAssignment[]) => {
    if (!isAdmin) return;
    const targetTeam = isInternal ? internalTeamTab : 'main';
    updateGameAssignments(game.id, newAssignments, targetTeam);
  };

  const handleShare = () => {
    const targetTeam = isInternal ? internalTeamTab : 'main';
    const encoded = encodeLineupForShare(game.id, targetTeam);
    if (!encoded) return;
    const url = `${window.location.origin}/share?data=${encoded}`;
    setShareUrl(url);
  };

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // === 경기 기록 핸들러 ===

  const togglePlayer = (id: string) => {
    setSelectedPlayerIds(prev => {
      if (prev.includes(id)) return prev.filter(pid => pid !== id);
      if (!battingData[id]) setBattingData(d => ({ ...d, [id]: emptyBattingStats(id) }));
      if (!pitchingData[id]) setPitchingData(d => ({ ...d, [id]: emptyPitchingStats(id) }));
      return [...prev, id];
    });
  };

  const selectedPlayers = useMemo(() => {
    return selectedPlayerIds.map(id => players.find(p => p.id === id)!).filter(Boolean).sort((a, b) => a.number - b.number);
  }, [selectedPlayerIds, players]);

  const handleSaveRecord = () => {
    if (!isAdmin) {
      alert('경기 기록 입력은 관리자 계정으로 로그인 후 가능합니다.');
      return;
    }
    if (scoreUs === '' || scoreThem === '') {
      alert('스코어를 입력해주세요.');
      return;
    }
    if (selectedPlayerIds.length === 0) {
      alert('출전 선수를 1명 이상 선택해주세요.');
      return;
    }

    const finalBatting = selectedPlayerIds
      .map(id => battingData[id])
      .filter(b => b && (b.PA > 0 || b.AB > 0 || b.H > 0 || b.BB > 0 || b.RBI > 0));

    const finalPitching = selectedPlayerIds
      .map(id => pitchingData[id])
      .filter(p => p && (p.IP > 0 || p.W > 0 || p.L > 0 || p.SV > 0 || p.SO > 0 || p.ER > 0 || p.R > 0 || p.H > 0 || p.BB > 0));

    completeGame(
      game.id, result,
      parseInt(scoreUs, 10), parseInt(scoreThem, 10),
      finalBatting, finalPitching
    );
    alert('경기 기록이 저장되었습니다!');
  };

  const isUpcoming = game.status === 'upcoming';

  return (
    <div className="space-y-6 pb-20">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/games')} className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-extrabold text-slate-900">
              {isInternal ? '한방 스윙스 자체 청백전' : `vs ${game.opponent}`}
            </h2>
            {isInternal && (
              <span className="badge badge-blue">청백전</span>
            )}
            {!isUpcoming && (
              <span className={`badge ${game.result === 'W' ? 'badge-win' : game.result === 'L' ? 'badge-loss' : 'badge-draw'}`}>
                {isInternal ? `청팀 ${game.scoreUs} : ${game.scoreThem} 백팀` : `${game.result === 'W' ? '승' : game.result === 'L' ? '패' : '무'} ${game.scoreUs}:${game.scoreThem}`}
              </span>
            )}
            {isUpcoming && (
              <span className="text-xs border border-slate-300 text-slate-600 px-2 py-0.5 rounded-md font-semibold bg-white">예정</span>
            )}
          </div>
          <p className="text-slate-500 text-xs flex items-center gap-1 mt-1">
            <Calendar className="w-3.5 h-3.5" /> {game.gameDate}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleDeleteGame}
            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
            title="경기 삭제"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="bg-slate-100 border border-slate-200 text-slate-600 p-3 rounded-xl text-xs flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
          <span><strong>일반 회원 모드 (조회 전용):</strong> 라인업 및 기록 편집은 관리자 계정로그인 후 가능합니다.</span>
        </div>
      )}

      {/* 탭 */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-2">
        <button
          onClick={() => setTab('lineup')}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            tab === 'lineup' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Target className="w-4 h-4 inline mr-2" />
          라인업 & 타순 배치
        </button>
        <button
          onClick={() => setTab('record')}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            tab === 'record' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ClipboardList className="w-4 h-4 inline mr-2" />
          {isUpcoming ? '경기 기록 입력' : '경기 기록'}
        </button>
      </div>

      {/* ===== 라인업 탭 ===== */}
      {tab === 'lineup' && (
        <div className="space-y-4">
          {isInternal && (
            <div className="flex gap-2">
              <button
                onClick={() => { setInternalTeamTab('blue'); setShareUrl(null); }}
                className={`flex-1 py-2.5 rounded-xl font-extrabold text-sm border transition-all ${
                  internalTeamTab === 'blue'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                🔵 청팀 라인업
              </button>
              <button
                onClick={() => { setInternalTeamTab('white'); setShareUrl(null); }}
                className={`flex-1 py-2.5 rounded-xl font-extrabold text-sm border transition-all ${
                  internalTeamTab === 'white'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                ⚪ 백팀 라인업
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-base">
              {isInternal ? (internalTeamTab === 'blue' ? '청팀 선발 라인업' : '백팀 선발 라인업') : '선발 라인업 & 타순'}
            </h3>
            <button onClick={handleShare} className="btn-secondary text-xs px-3 py-1.5">
              <Share2 className="w-3.5 h-3.5" /> 라인업 웹 공유
            </button>
          </div>

          {shareUrl && (
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2 animate-scale-in">
              <input type="text" value={shareUrl} readOnly className="input-field text-xs flex-1" />
              <button onClick={handleCopy} className="btn-primary px-3 py-2 text-xs">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 다이아몬드 수비 위치 배치 */}
            <div className="glass-card p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-3">수비 포지션 배치 (투수 P 포함)</h3>
              <DiamondField
                assignments={diamondAssignments}
                players={players}
                onPositionClick={handlePositionClick}
                readOnly={!isAdmin || !isUpcoming}
              />
              {isAdmin && isUpcoming && (
                <div className="mt-4 flex gap-2 flex-wrap justify-center">
                  {(['DH', 'BENCH'] as Position[]).map(pos => {
                    const existing = currentAssignments.find(a => a.position === pos);
                    return (
                      <button
                        key={pos}
                        onClick={() => handlePositionClick(pos)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          existing
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {POSITION_LABELS[pos]}: {existing ? players.find(p => p.id === existing.playerId)?.name : '미정'}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 타순 (1번 ~ 9번 + DH) */}
            <div className="glass-card p-5">
              <BattingOrderList
                assignments={currentAssignments}
                players={players}
                onReorder={handleReorder}
                onRemove={handleRemovePosition}
                readOnly={!isAdmin || !isUpcoming}
              />
            </div>
          </div>
        </div>
      )}

      {/* ===== 기록 탭 ===== */}
      {tab === 'record' && (
        <div className="space-y-6">
          {game.status === 'completed' ? (
            /* 완료된 경기: 기록 조회 */
            <div className="space-y-4">
              <div className="glass-card p-5">
                <h3 className="font-bold text-slate-900 mb-3">경기 결과 스코어</h3>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-xs text-slate-500 font-bold">{isInternal ? '청팀' : '한방 스윙스'}</div>
                    <div className="text-3xl font-extrabold text-slate-900">{game.scoreUs}</div>
                  </div>
                  <div className="text-slate-400 font-bold text-base">VS</div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500 font-bold">{isInternal ? '백팀' : game.opponent}</div>
                    <div className="text-3xl font-extrabold text-slate-700">{game.scoreThem}</div>
                  </div>
                </div>
              </div>

              {/* 타격 기록 조회 */}
              {game.battingStats.length > 0 && (
                <div className="glass-card overflow-hidden">
                  <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-900 text-sm">타격 기록</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>선수</th><th>PA</th><th>AB</th><th>H</th><th>2B</th><th>3B</th><th>HR</th><th>RBI</th><th>R</th><th>BB</th><th>SO</th><th>SB</th><th>BA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {game.battingStats.map(stat => {
                          const p = players.find(pl => pl.id === stat.playerId);
                          const calc = singleGameBattingCalc(stat);
                          return (
                            <tr key={stat.playerId}>
                              <td>{p ? `#${p.number} ${p.name}` : '?'}</td>
                              <td>{stat.PA}</td><td>{stat.AB}</td><td>{stat.H}</td><td>{stat['2B']}</td><td>{stat['3B']}</td>
                              <td>{stat.HR}</td><td>{stat.RBI}</td><td>{stat.R}</td><td>{stat.BB}</td><td>{stat.SO}</td><td>{stat.SB}</td>
                              <td className="font-extrabold text-slate-900">{formatRate(calc.BA)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 투수 기록 조회 */}
              {game.pitchingStats.length > 0 && (
                <div className="glass-card overflow-hidden">
                  <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-900 text-sm">투구 기록</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>선수</th><th>W</th><th>L</th><th>SV</th><th>IP</th><th>H</th><th>R</th><th>ER</th><th>BB</th><th>SO</th><th>ERA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {game.pitchingStats.map(stat => {
                          const p = players.find(pl => pl.id === stat.playerId);
                          return (
                            <tr key={stat.playerId}>
                              <td>{p ? `#${p.number} ${p.name}` : '?'}</td>
                              <td>{stat.W}</td><td>{stat.L}</td><td>{stat.SV}</td><td>{stat.IP}</td><td>{stat.H}</td>
                              <td>{stat.R}</td><td>{stat.ER}</td><td>{stat.BB}</td><td>{stat.SO}</td>
                              <td className="font-extrabold text-slate-900">{formatERA(calcERA(stat.ER, stat.IP))}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 예정 경기: 기록 입력 */
            isAdmin ? (
              <div className="space-y-6">
                {/* 스코어 입력 */}
                <div className="glass-card p-5">
                  <h3 className="font-bold text-slate-900 mb-3">경기 결과 및 스코어 입력</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block font-medium">경기 결과</label>
                      <select className="input-field font-semibold" value={result} onChange={e => setResult(e.target.value as GameResult)}>
                        <option value="W">{isInternal ? '청팀 승리' : '승리 (W)'}</option>
                        <option value="L">{isInternal ? '백팀 승리' : '패배 (L)'}</option>
                        <option value="D">무승부 (D)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block font-medium">{isInternal ? '청팀 점수' : '우리 점수'}</label>
                      <input type="number" min="0" className="input-field font-bold" placeholder="0" value={scoreUs} onChange={e => setScoreUs(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block font-medium">{isInternal ? '백팀 점수' : '상대 점수'}</label>
                      <input type="number" min="0" className="input-field font-bold" placeholder="0" value={scoreThem} onChange={e => setScoreThem(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* 선수선택 vs 기록입력 탭 */}
                <div className="glass-card">
                  <div className="flex border-b border-slate-200">
                    <button
                      onClick={() => setRecordStep('select')}
                      className={`flex-1 py-3 text-sm font-bold transition-colors ${
                        recordStep === 'select' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      1. 출전 선수 선택 ({selectedPlayerIds.length}명)
                    </button>
                    <button
                      onClick={() => setRecordStep('stats')}
                      disabled={selectedPlayerIds.length === 0}
                      className={`flex-1 py-3 text-sm font-bold transition-colors ${
                        recordStep === 'stats' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600 disabled:opacity-40'
                      }`}
                    >
                      2. 타격 / 투구 성적 입력 (투수 DH 겸업 지원)
                    </button>
                  </div>

                  <div className="p-5">
                    {recordStep === 'select' && (
                      <div>
                        <p className="text-xs text-slate-500 mb-3">경기에 출전한 선수들을 체크하세요. (배번순 정렬)</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {sortedPlayersList.map(player => {
                            const isSelected = selectedPlayerIds.includes(player.id);
                            return (
                              <button
                                key={player.id}
                                onClick={() => togglePlayer(player.id)}
                                className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left ${
                                  isSelected ? 'bg-slate-900 text-white border-slate-900 font-bold' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${isSelected ? 'bg-white text-black' : 'bg-slate-100'}`}>
                                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                                <span className="text-xs font-bold opacity-60">#{player.number}</span>
                                <span className="text-sm truncate font-extrabold">{player.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {recordStep === 'stats' && (
                      <div className="space-y-6">
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-xs flex items-center gap-2 font-medium">
                          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                          투수가 지명타자(DH)나 타자로 출전한 경우, 아래에서 타격 기록과 투구 기록을 모두 입력할 수 있습니다.
                        </div>

                        {selectedPlayers.map(player => (
                          <div key={`stat-${player.id}`} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                              <span className="font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">#{player.number}</span>
                              <span className="font-extrabold text-slate-900 text-base">{player.name}</span>
                              <div className="flex gap-1 ml-auto">
                                {player.positions?.map(pos => (
                                  <span key={pos} className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                                    {pos}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* 타격 기록 */}
                            <div>
                              <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">⚾ 타격 기록</h4>
                              <BattingStatsForm
                                playerName={player.name}
                                stats={battingData[player.id] || emptyBattingStats(player.id)}
                                onChange={(stats) => setBattingData(prev => ({ ...prev, [player.id]: stats }))}
                              />
                            </div>

                            {/* 투구 기록 */}
                            <div className="pt-2 border-t border-slate-200">
                              <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">🥎 투구 기록</h4>
                              <PitchingStatsForm
                                playerName={player.name}
                                stats={pitchingData[player.id] || emptyPitchingStats(player.id)}
                                onChange={(stats) => setPitchingData(prev => ({ ...prev, [player.id]: stats }))}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={handleSaveRecord} className="btn-green text-base px-6 py-3">
                    <Check className="w-5 h-5" /> 경기 최종 기록 저장하기
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-card p-12 text-center">
                <Lock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">경기 기록 입력은 관리자 전용 기능입니다</p>
                <p className="text-slate-400 text-xs mt-1">상단 '관리자 로그인' (암호: hanbang2026) 후 기록을 입력할 수 있습니다.</p>
              </div>
            )
          )}
        </div>
      )}

      {/* 선수 선택 모달 (배번 오름차순 정렬) */}
      {showPlayerPicker && isAdmin && (
        <div className="modal-overlay" onClick={() => setShowPlayerPicker(null)}>
          <div className="modal-content p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">
                {POSITION_LABELS[showPlayerPicker]} ({showPlayerPicker}) 포지션 선수 배치
              </h3>
              <button onClick={() => setShowPlayerPicker(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {sortedPlayersList.map(player => {
                const alreadyAssigned = assignedPlayerIds.has(player.id);
                const isCurrentPos = currentAssignments.find(
                  a => a.position === showPlayerPicker && a.playerId === player.id
                );
                return (
                  <button
                    key={player.id}
                    onClick={() => handleAssignPlayer(player.id)}
                    disabled={alreadyAssigned && !isCurrentPos}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all border ${
                      isCurrentPos
                        ? 'bg-slate-900 text-white border-slate-900'
                        : alreadyAssigned
                        ? 'opacity-30 cursor-not-allowed border-transparent bg-slate-50'
                        : 'border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                      isCurrentPos ? 'bg-white text-black' : 'bg-slate-200 text-slate-800'
                    }`}>
                      #{player.number}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{player.name}</div>
                      <div className="text-xs opacity-70 flex gap-1 mt-0.5">
                        {player.positions?.map(p => (
                          <span key={p} className="underline font-semibold">{p}</span>
                        ))}
                      </div>
                    </div>
                    {alreadyAssigned && !isCurrentPos && (
                      <span className="ml-auto text-xs opacity-50 font-medium">배정됨</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
