import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { type GameType } from '../types';
import { Calendar, Plus, ChevronRight, Trash2, X, Swords, Users, Key } from 'lucide-react';

export default function Games() {
  const { games, addGame, removeGame, isAdmin } = useAppStore();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [gameDate, setGameDate] = useState('');
  const [opponent, setOpponent] = useState('');
  const [gameType, setGameType] = useState<GameType>('external');

  const upcomingGames = [...games].filter(g => g.status === 'upcoming').sort((a, b) => a.gameDate.localeCompare(b.gameDate));
  const completedGames = [...games].filter(g => g.status === 'completed').sort((a, b) => b.gameDate.localeCompare(a.gameDate));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('경기 생성은 관리자 계정으로 로그인 후 이용 가능합니다.');
      return;
    }
    if (!gameDate) return;
    if (gameType === 'external' && !opponent.trim()) {
      alert('상대팀 이름을 입력해주세요.');
      return;
    }

    const id = addGame(gameDate, gameType === 'internal' ? '한방 스윙스 청백전' : opponent.trim(), gameType);
    setShowForm(false);
    setGameDate('');
    setOpponent('');
    setGameType('external');
    navigate(`/games/${id}`);
  };

  const handleDelete = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (!isAdmin) {
      alert('경기 삭제 권한은 관리자 계정만 가지고 있습니다.');
      return;
    }
    if (confirm(`'${title}' 경기를 삭제하시겠습니까? 관련 모든 타순 및 기록이 삭제됩니다.`)) {
      removeGame(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-green-600" /> 경기 관리
          </h2>
          <p className="text-slate-500 text-sm mt-1">대외 경기 및 내부 청백전 타순/투수/기록을 관리하세요</p>
        </div>
        {isAdmin ? (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Plus className="w-4 h-4" /> 경기 생성
          </button>
        ) : (
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
            <Key className="w-3.5 h-3.5" /> 일반 회원 (조회 전용)
          </div>
        )}
      </div>

      {/* 경기 생성 폼 */}
      {showForm && isAdmin && (
        <div className="glass-card p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">새 경기 등록</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGameType('external')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  gameType === 'external'
                    ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="text-sm">대외 경기</span>
                <span className="text-[11px] opacity-70">타 팀과의 공식/친선 경기</span>
              </button>

              <button
                type="button"
                onClick={() => setGameType('internal')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  gameType === 'internal'
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                <Swords className="w-5 h-5" />
                <span className="text-sm">청백전 (내부 경기)</span>
                <span className="text-[11px] opacity-70">청팀 vs 백팀 동아리 자체전</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block font-medium">경기 날짜</label>
                <input
                  type="date"
                  className="input-field"
                  value={gameDate}
                  onChange={e => setGameDate(e.target.value)}
                  required
                />
              </div>
              {gameType === 'external' ? (
                <div>
                  <label className="text-xs text-slate-500 mb-1 block font-medium">상대팀 이름</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="예: 번개타자들"
                    value={opponent}
                    onChange={e => setOpponent(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs text-slate-500 mb-1 block font-medium">경기 구분</label>
                  <input
                    type="text"
                    className="input-field bg-slate-50 text-slate-500 cursor-not-allowed"
                    value="한방 스윙스 자체 청백전"
                    disabled
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                취소
              </button>
              <button type="submit" className="btn-primary">
                경기 생성하기
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 예정 경기 */}
      {upcomingGames.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">예정 경기</h3>
          <div className="space-y-2">
            {upcomingGames.map(game => (
              <button
                key={game.id}
                onClick={() => navigate(`/games/${game.id}`)}
                className="glass-card p-4 flex items-center justify-between w-full text-left hover:border-slate-400 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] text-slate-500 font-bold">{game.gameDate.substring(5, 7)}월</span>
                    <span className="text-lg font-extrabold text-slate-900 leading-none">{game.gameDate.substring(8)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-base">vs {game.opponent}</span>
                      {game.gameType === 'internal' && (
                        <span className="badge badge-blue text-[11px]">청백전</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {game.gameType === 'internal' ? '청팀 & 백팀 타순/투수배치' : '타순 & 수비포지션 작성대기'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      onClick={(e) => handleDelete(e, game.id, game.opponent)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg"
                      title="경기 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 완료된 경기 */}
      {completedGames.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">완료된 경기</h3>
          <div className="space-y-2">
            {completedGames.map(game => (
              <button
                key={game.id}
                onClick={() => navigate(`/games/${game.id}`)}
                className="glass-card p-4 flex items-center justify-between w-full text-left hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] text-slate-400 font-bold">{game.gameDate.substring(5, 7)}월</span>
                    <span className="text-lg font-extrabold text-slate-700 leading-none">{game.gameDate.substring(8)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">vs {game.opponent}</span>
                      {game.gameType === 'internal' && (
                        <span className="badge badge-blue text-[11px]">청백전</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{game.gameDate}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${game.result === 'W' ? 'badge-win' : game.result === 'L' ? 'badge-loss' : 'badge-draw'}`}>
                    {game.gameType === 'internal'
                      ? `청팀 ${game.scoreUs} : ${game.scoreThem} 백팀`
                      : `${game.result === 'W' ? '승' : game.result === 'L' ? '패' : '무'} ${game.scoreUs}:${game.scoreThem}`}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={(e) => handleDelete(e, game.id, game.opponent)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg"
                      title="경기 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {games.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">등록된 경기가 없습니다</p>
          {isAdmin && (
            <p className="text-slate-400 text-sm mt-1">상단의 '경기 생성' 버튼으로 대외경기 또는 청백전을 생성하세요</p>
          )}
        </div>
      )}
    </div>
  );
}
