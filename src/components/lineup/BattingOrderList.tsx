import { type PositionAssignment, type Player, POSITION_LABELS } from '../../types';
import { GripVertical, X } from 'lucide-react';
import { useState, useCallback } from 'react';

interface BattingOrderListProps {
  assignments: PositionAssignment[];
  players: Player[];
  onReorder: (assignments: PositionAssignment[]) => void;
  onRemove: (position: string) => void;
  readOnly?: boolean;
}

export default function BattingOrderList({ assignments, players, onReorder, onRemove, readOnly }: BattingOrderListProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const ordered = [...assignments].filter(a => a.battingOrder > 0).sort((a, b) => a.battingOrder - b.battingOrder);
  const bench = assignments.filter(a => a.battingOrder === 0);
  const getPlayer = (playerId: string) => players.find(p => p.id === playerId);

  const handleDragStart = useCallback((idx: number) => { setDragIdx(idx); }, []);
  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); }, []);
  const handleDrop = useCallback((dropIdx: number) => {
    if (dragIdx === null || dragIdx === dropIdx) { setDragIdx(null); setDragOverIdx(null); return; }
    const newOrdered = [...ordered];
    const [moved] = newOrdered.splice(dragIdx, 1);
    newOrdered.splice(dropIdx, 0, moved);
    const updated = newOrdered.map((a, i) => ({ ...a, battingOrder: i + 1 }));
    onReorder([...updated, ...bench]);
    setDragIdx(null);
    setDragOverIdx(null);
  }, [dragIdx, ordered, bench, onReorder]);

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-900 text-sm">타순 ({ordered.length}명)</h3>

      {ordered.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-sm">
          포지션에 선수를 배치하면 타순이 자동으로 설정됩니다
        </div>
      ) : (
        <div className="space-y-1.5">
          {ordered.map((assignment, idx) => {
            const player = getPlayer(assignment.playerId);
            if (!player) return null;
            return (
              <div
                key={assignment.playerId}
                draggable={!readOnly}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={e => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border ${
                  dragIdx === idx ? 'opacity-50 scale-95 border-slate-300'
                  : dragOverIdx === idx ? 'bg-slate-100 border-slate-400'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                } ${!readOnly ? 'cursor-grab active:cursor-grabbing' : ''}`}
              >
                {!readOnly && <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />}
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                  {assignment.battingOrder}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-extrabold text-slate-900 text-sm truncate">{player.name}</span>
                  <span className="text-xs text-slate-500 ml-2 font-bold">#{player.number}</span>
                </div>
                <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md shrink-0">
                  {assignment.position}
                </span>
                {!readOnly && (
                  <button onClick={() => onRemove(assignment.position)} className="p-1 text-slate-400 hover:text-red-600 transition-colors shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {bench.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-200">
          <h4 className="text-xs text-slate-500 font-bold mb-2">벤치 / DH</h4>
          <div className="space-y-1">
            {bench.map(assignment => {
              const player = getPlayer(assignment.playerId);
              if (!player) return null;
              return (
                <div key={assignment.playerId} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-100">
                  <div className="w-7 h-7 rounded bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">-</div>
                  <span className="font-bold text-slate-800 text-sm">{player.name}</span>
                  <span className="text-xs text-slate-500">#{player.number}</span>
                  <span className="ml-auto text-xs text-slate-600 font-bold">{POSITION_LABELS[assignment.position]}</span>
                  {!readOnly && (
                    <button onClick={() => onRemove(assignment.position)} className="p-1 text-slate-400 hover:text-red-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
