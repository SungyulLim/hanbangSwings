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
import { downloadGameRecordTemplate, parseGameRecordExcel, type ParsedExcelResult } from '../utils/excelUtils';
import {
  ArrowLeft, Share2, Copy, Check, X, Target,
  ClipboardList, Calendar, ShieldAlert, Trash2, Lock, Search, UserPlus,
  FileSpreadsheet, Upload, Download, Sparkles, AlertCircle
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
  const [pickerSearch, setPickerSearch] = useState('');
  const [quickSearch, setQuickSearch] = useState('');
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

  // 엑셀 관련 상태
  const [excelModalData, setExcelModalData] = useState<ParsedExcelResult | null>(null);
  const [isParsingExcel, setIsParsingExcel] = useState(false);

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

  const filteredPickerPlayers = useMemo(() => {
    if (!pickerSearch.trim()) return sortedPlayersList;
    const q = pickerSearch.trim().toLowerCase();
    return sortedPlayersList.filter(p =>
      p.name.toLowerCase().includes(q) || String(p.number).includes(q)
    );
  }, [sortedPlayersList, pickerSearch]);

  const quickSearchMatches = useMemo(() => {
    if (!quickSearch.trim()) return [];
    const q = quickSearch.trim().toLowerCase();
    return sortedPlayersList.filter(p =>
      p.name.toLowerCase().includes(q) || String(p.number).includes(q)
    );
  }, [sortedPlayersList, quickSearch]);

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

  const handleOpenPicker = (position: Position) => {
    if (!isAdmin) {
      alert('라인업 포지션 배정은 관리자만 가능합니다.');
      return;
    }
    if (game.status === 'completed') return;
    setPickerSearch('');
    setShowPlayerPicker(position);
  };

  const handleAssignPlayer = (playerId: string, positionOverride?: Position) => {
    const position = positionOverride || showPlayerPicker;
    if (!position || !isAdmin) return;

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
    setQuickSearch('');
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

  const handleDownloadTemplate = () => {
    if (!game) return;
    const title = isInternal ? `한방스윙스_청백전_${game.gameDate}` : `한방스윙스_vs_${game.opponent}_${game.gameDate}`;
    downloadGameRecordTemplate(players, title);
  };

  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsingExcel(true);
    try {
      const parsed = await parseGameRecordExcel(file, players);
      if (parsed.matchedPlayerIds.length === 0) {
        alert('엑셀 파일에서 매칭된 선수 성적을 찾을 수 없습니다. 이름이나 등번호가 등록된 로스터와 일치하는지 확인해 주세요.');
      } else {
        setExcelModalData(parsed);
      }
    } catch (err) {
      console.error(err);
      alert('엑셀 파일 분석 중 오류가 발생했습니다. 올바른 .xlsx 또는 .csv 파일인지 확인해 주세요.');
    } finally {
      setIsParsingExcel(false);
      e.target.value = '';
    }
  };

  const handleApplyExcelRecord = () => {
    if (!excelModalData) return;
    const { matchedPlayerIds, battingData: newBatting, pitchingData: newPitching } = excelModalData;

    setSelectedPlayerIds(prev => {
      const set = new Set([...prev, ...matchedPlayerIds]);
      return Array.from(set);
    });

    setBattingData(prev => {
      const next = { ...prev };
      Object.keys(newBatting).forEach(pid => {
        next[pid] = newBatting[pid];
      });
      return next;
    });

    setPitchingData(prev => {
      const next = { ...prev };
      Object.keys(newPitching).forEach(pid => {
        next[pid] = newPitching[pid];
      });
      return next;
    });

    setExcelModalData(null);
    setRecordStep('stats');
    alert(`${matchedPlayerIds.length}명 선수의 기록이 엑셀에서 성공적으로 불러와졌습니다!`);
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

          {isAdmin && isUpcoming && (
            <div className="glass-card p-3 bg-slate-900 text-white relative">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                <input
                  type="text"
                  placeholder="선수 이름 또는 등번호 직접 검색하여 타순/포지션에 바로 추가..."
                  className="bg-transparent text-white placeholder-slate-400 text-xs flex-1 outline-none font-bold py-1.5"
                  value={quickSearch}
                  onChange={e => setQuickSearch(e.target.value)}
                />
                {quickSearch && (
                  <button onClick={() => setQuickSearch('')} className="text-slate-400 hover:text-white mr-1">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {quickSearchMatches.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white text-slate-900 border border-slate-200 rounded-xl shadow-xl z-30 max-h-64 overflow-y-auto p-2 space-y-1 animate-scale-in">
                  <div className="text-[10px] text-slate-400 font-bold px-2 py-1 uppercase">검색된 선수 목록</div>
                  {quickSearchMatches.map(player => {
                    const isAlreadyAssigned = assignedPlayerIds.has(player.id);
                    return (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                            #{player.number}
                          </span>
                          <span className="font-extrabold text-sm">{player.name}</span>
                          <span className="text-xs text-slate-500 font-medium">({player.positions?.join(', ')})</span>
                          {isAlreadyAssigned && (
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">배정됨</span>
                          )}
                        </div>

                        <div className="flex gap-1 flex-wrap justify-end">
                          {FIELD_POSITIONS.map(pos => (
                            <button
                              key={pos}
                              onClick={() => handleAssignPlayer(player.id, pos)}
                              className="px-2 py-1 rounded text-xs font-bold bg-slate-100 hover:bg-slate-900 hover:text-white transition-colors border border-slate-200"
                            >
                              {pos}
                            </button>
                          ))}
                          <button
                            onClick={() => handleAssignPlayer(player.id, 'DH')}
                            className="px-2 py-1 rounded text-xs font-bold bg-amber-100 text-amber-900 hover:bg-amber-600 hover:text-white transition-colors border border-amber-200"
                          >
                            DH
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
            <div className="glass-card p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-3">수비 포지션 배치 (포지션 클릭 시 검색 선택)</h3>
              <DiamondField
                assignments={diamondAssignments}
                players={players}
                onPositionClick={handleOpenPicker}
                readOnly={!isAdmin || !isUpcoming}
              />
              {isAdmin && isUpcoming && (
                <div className="mt-4 flex gap-2 flex-wrap justify-center">
                  {(['DH', 'BENCH'] as Position[]).map(pos => {
                    const existing = currentAssignments.find(a => a.position === pos);
                    return (
                      <button
                        key={pos}
                        onClick={() => handleOpenPicker(pos)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          existing
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {POSITION_LABELS[pos]}: {existing ? players.find(p => p.id === existing.playerId)?.name : '미정 (검색)'}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

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

              {/* 타격 기록 조회 (한글 용어 헤더) */}
              {game.battingStats.length > 0 && (
                <div className="glass-card overflow-hidden">
                  <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-900 text-sm">타격 기록</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>선수</th><th>타석</th><th>타수</th><th>안타</th><th>2루타</th><th>3루타</th><th>홈런</th><th>타점</th><th>득점</th><th>볼넷</th><th>삼진</th><th>도루</th><th>타율</th>
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

              {/* 투수 기록 조회 (한글 용어 헤더) */}
              {game.pitchingStats.length > 0 && (
                <div className="glass-card overflow-hidden">
                  <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-900 text-sm">투구 기록</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>선수</th><th>승</th><th>패</th><th>세이브</th><th>이닝</th><th>피안타</th><th>실점</th><th>자책점</th><th>사사구</th><th>탈삼진</th><th>ERA</th>
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
            isAdmin ? (
              <div className="space-y-6">
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

                {/* 엑셀 파일 업로드 & 양식 다운로드 스마트 바 */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-emerald-950 flex items-center gap-1.5">
                        엑셀(Excel) 파일로 경기 기록 일괄 입력
                        <span className="badge bg-emerald-600 text-white text-[10px] px-1.5 py-0.2">스마트 매칭</span>
                      </h4>
                      <p className="text-xs text-emerald-800 font-medium">선수 목록이 채워진 양식을 받거나, 작성된 엑셀을 업로드하여 성적을 한 번에 반영하세요.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="flex-1 sm:flex-initial px-3 py-2 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-700" />
                      양식 다운로드
                    </button>
                    <label className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      {isParsingExcel ? '분석 중...' : '엑셀 업로드'}
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                        onChange={handleExcelFileUpload}
                        disabled={isParsingExcel}
                      />
                    </label>
                  </div>
                </div>

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
                      2. 타격 / 투구 성적 입력 (한글 용어 적용)
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
                          각 항목(타석, 타수, 안타, 이닝, 자책점 등)을 한글 용어로 입력해 주세요.
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

                            <div>
                              <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">⚾ 타격 기록</h4>
                              <BattingStatsForm
                                playerName={player.name}
                                stats={battingData[player.id] || emptyBattingStats(player.id)}
                                onChange={(stats) => setBattingData(prev => ({ ...prev, [player.id]: stats }))}
                              />
                            </div>

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

      {/* 선수 선택 모달 */}
      {showPlayerPicker && isAdmin && (
        <div className="modal-overlay" onClick={() => setShowPlayerPicker(null)}>
          <div className="modal-content p-5 max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-green-600" />
                {POSITION_LABELS[showPlayerPicker]} ({showPlayerPicker}) 포지션 선수 선택
              </h3>
              <button onClick={() => setShowPlayerPicker(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                className="input-field pl-9 font-bold text-sm"
                placeholder="선수 이름 또는 등번호 검색 (예: 이건욱, #3)"
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                autoFocus
              />
              {pickerSearch && (
                <button
                  onClick={() => setPickerSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {filteredPickerPlayers.map(player => {
                const alreadyAssigned = assignedPlayerIds.has(player.id);
                const isCurrentPos = currentAssignments.find(
                  a => a.position === showPlayerPicker && a.playerId === player.id
                );
                return (
                  <button
                    key={player.id}
                    onClick={() => handleAssignPlayer(player.id)}
                    disabled={alreadyAssigned && !isCurrentPos}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all border ${
                      isCurrentPos
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : alreadyAssigned
                        ? 'opacity-40 cursor-not-allowed border-transparent bg-slate-100'
                        : 'border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                      isCurrentPos ? 'bg-white text-black' : 'bg-slate-200 text-slate-800'
                    }`}>
                      #{player.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-sm truncate">{player.name}</div>
                      <div className="text-[11px] opacity-70 flex gap-1 mt-0.5">
                        {player.positions?.map(p => (
                          <span key={p} className="font-semibold">{p}</span>
                        ))}
                      </div>
                    </div>
                    {alreadyAssigned && !isCurrentPos && (
                      <span className="ml-auto text-[11px] opacity-60 font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                        타 포지션 배정됨
                      </span>
                    )}
                    {isCurrentPos && (
                      <span className="ml-auto text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                        현재 배정
                      </span>
                    )}
                  </button>
                );
              })}

              {filteredPickerPlayers.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  '{pickerSearch}' 검색 결과가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 엑셀 데이터 파싱 미리보기 모달 */}
      {excelModalData && (
        <div className="modal-overlay" onClick={() => setExcelModalData(null)}>
          <div className="modal-content p-6 max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                엑셀 기록 파싱 완료
              </h3>
              <button onClick={() => setExcelModalData(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-900 text-sm font-semibold">
                🎉 총 <span className="font-extrabold text-emerald-700">{excelModalData.matchedPlayerIds.length}명</span>의 출전 선수 성적이 성공적으로 매칭되었습니다.
              </div>

              {excelModalData.unmatchedRows.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                  <div className="font-bold flex items-center gap-1 mb-1 text-amber-950">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    로스터 미일치 행 ({excelModalData.unmatchedRows.length}건)
                  </div>
                  <p className="text-[11px] text-amber-800">아래 행은 등록된 선수 등번호/이름과 일치하지 않아 제외되었습니다:</p>
                  <ul className="mt-1 font-mono text-[10px] bg-white/70 p-2 rounded max-h-24 overflow-y-auto space-y-0.5">
                    {excelModalData.unmatchedRows.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                <h4 className="text-xs font-bold text-slate-500">매칭된 선수 성적 요약</h4>
                {excelModalData.matchedPlayerIds.map(pid => {
                  const p = players.find(pl => pl.id === pid);
                  const b = excelModalData.battingData[pid];
                  const pr = excelModalData.pitchingData[pid];
                  return (
                    <div key={pid} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-500">#{p?.number}</span>
                        <span className="font-extrabold text-slate-900">{p?.name}</span>
                      </div>
                      <div className="flex gap-2 text-[11px]">
                        {b && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                            타격: {b.PA}타석 {b.AB}타수 {b.H}안타 {b.HR > 0 ? `(${b.HR}홈런)` : ''} {b.RBI}타점
                          </span>
                        )}
                        {pr && (
                          <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">
                            투구: {pr.IP}이닝 {pr.ER}자책 {pr.SO}K
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button onClick={() => setExcelModalData(null)} className="btn-secondary text-xs px-4 py-2.5">
                  취소
                </button>
                <button onClick={handleApplyExcelRecord} className="btn-primary text-xs px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Check className="w-4 h-4" /> 기록 폼에 바로 반영하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
