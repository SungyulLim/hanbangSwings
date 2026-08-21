import { useState } from 'react';
import { useAppStore } from '../store';
import { MAX_PLAYERS, POSITION_LABELS, ALL_POSITIONS, type Position } from '../types';
import { Users, Plus, Pencil, Trash2, X, Hash, User, MapPin, RotateCcw, Check, Lock } from 'lucide-react';

export default function TeamRoster() {
  const { players, addPlayer, updatePlayer, removePlayer, resetToDemo, isAdmin } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; number: string; positions: Position[] }>({
    name: '',
    number: '',
    positions: ['BENCH'],
  });

  const resetForm = () => {
    setForm({ name: '', number: '', positions: ['BENCH'] });
    setEditId(null);
    setShowForm(false);
  };

  const toggleFormPosition = (pos: Position) => {
    setForm(prev => {
      let current = [...prev.positions];
      if (current.includes(pos)) {
        if (current.length === 1) return prev;
        current = current.filter(p => p !== pos);
      } else {
        current.push(pos);
      }
      return { ...prev, positions: current };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('선수 등록/수정 권한은 관리자 계정만 가지고 있습니다.');
      return;
    }
    if (!form.name.trim() || !form.number) return;

    if (editId) {
      updatePlayer(editId, {
        name: form.name.trim(),
        number: parseInt(form.number, 10),
        positions: form.positions.length > 0 ? form.positions : ['BENCH'],
      });
    } else {
      const success = addPlayer({
        name: form.name.trim(),
        number: parseInt(form.number, 10),
        positions: form.positions.length > 0 ? form.positions : ['BENCH'],
      });
      if (!success) {
        alert(`선수는 최대 ${MAX_PLAYERS}명까지 등록 가능합니다.`);
        return;
      }
    }
    resetForm();
  };

  const startEdit = (id: string) => {
    if (!isAdmin) {
      alert('선수 정보 수정은 관리자 계정만 가능합니다.');
      return;
    }
    const p = players.find(x => x.id === id);
    if (!p) return;
    setForm({
      name: p.name,
      number: String(p.number),
      positions: p.positions && p.positions.length > 0 ? p.positions : ['BENCH'],
    });
    setEditId(id);
    setShowForm(true);
  };

  const handleRemove = (id: string) => {
    if (!isAdmin) {
      alert('선수 삭제 권한은 관리자 계정만 가지고 있습니다.');
      return;
    }
    if (confirm('이 선수를 삭제하시겠습니까?')) {
      removePlayer(id);
    }
  };

  const handleResetRoster = () => {
    if (!isAdmin) {
      alert('로스터 초기화는 관리자 계정만 가능합니다.');
      return;
    }
    if (confirm('로스터를 사진속 23명 실제 동아리원 데이터로 초기화하시겠습니까?')) {
      resetToDemo();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-green-600" />
            선수 로스터
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {players.length} / {MAX_PLAYERS}명 등록됨 (멀티 포지션 지원)
          </p>
        </div>
        {isAdmin ? (
          <div className="flex gap-2">
            <button onClick={handleResetRoster} className="btn-secondary text-xs">
              <RotateCcw className="w-3.5 h-3.5" /> 실제 23명 로스터 초기화
            </button>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="btn-primary"
              disabled={players.length >= MAX_PLAYERS}
            >
              <Plus className="w-4 h-4" />
              선수 추가
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
            <Lock className="w-3.5 h-3.5" /> 일반 회원 (조회 전용)
          </div>
        )}
      </div>

      {/* 선수 추가/편집 폼 (관리자 전용) */}
      {showForm && isAdmin && (
        <div className="glass-card p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">
              {editId ? '선수 정보 및 멀티 포지션 수정' : '새 선수 등록'}
            </h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block font-medium">
                  <User className="w-3 h-3 inline mr-1" />이름
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="선수 이름"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block font-medium">
                  <Hash className="w-3 h-3 inline mr-1" />등번호
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="등번호 (예: 7)"
                  min="0"
                  max="99"
                  value={form.number}
                  onChange={e => setForm({ ...form, number: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-2 block font-medium">
                <MapPin className="w-3 h-3 inline mr-1" />소화 가능 포지션 (다중 선택 가능)
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_POSITIONS.map(pos => {
                  const isSelected = form.positions.includes(pos);
                  return (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => toggleFormPosition(pos)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {pos} ({POSITION_LABELS[pos]})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={resetForm} className="btn-secondary">
                취소
              </button>
              <button type="submit" className="btn-primary">
                {editId ? '수정 완료' : '등록'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 선수 목록 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {players.map((player, idx) => {
          const positions = player.positions && player.positions.length > 0 ? player.positions : ['BENCH'];
          return (
            <div
              key={player.id}
              className="glass-card p-4 flex items-center gap-4 animate-fade-in"
              style={{ animationDelay: `${idx * 15}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-sm">
                {player.number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-slate-900 text-base truncate">{player.name}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {positions.map(p => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 border border-slate-200 text-slate-700"
                    >
                      {p} ({POSITION_LABELS[p as Position]})
                    </span>
                  ))}
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(player.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                    title="포지션 및 등번호 수정"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemove(player.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {players.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">등록된 선수가 없습니다</p>
          {isAdmin && (
            <button onClick={handleResetRoster} className="btn-primary mt-4">
              <RotateCcw className="w-4 h-4" /> 사진속 23명 로스터 로드
            </button>
          )}
        </div>
      )}
    </div>
  );
}
