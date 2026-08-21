import type { PitchingStats } from '../../types';
import { calcERA, formatERA } from '../../utils/stats';

interface Props {
  stats: PitchingStats;
  onChange: (stats: PitchingStats) => void;
  playerName: string;
}

const FIELDS: { key: keyof PitchingStats; label: string; step?: string }[] = [
  { key: 'IP', label: '이닝', step: '0.1' },
  { key: 'ER', label: '자책점' },
  { key: 'R', label: '실점' },
  { key: 'H', label: '피안타' },
  { key: 'SO', label: '탈삼진' },
  { key: 'BB', label: '사사구' },
  { key: 'W', label: '승' },
  { key: 'L', label: '패' },
  { key: 'SV', label: '세이브' },
];

export default function PitchingStatsForm({ stats, onChange }: Props) {
  const era = calcERA(stats.ER, stats.IP);
  const handleChange = (key: keyof PitchingStats, value: string) => {
    if (key === 'playerId') return;
    onChange({ ...stats, [key]: Math.max(0, value === '' ? 0 : parseFloat(value) || 0) });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {FIELDS.map(f => (
          <div key={f.key} className="text-center">
            <label className="text-[11px] text-slate-600 block mb-1 font-extrabold">{f.label}</label>
            <input
              type="number"
              min="0"
              step={f.step || '1'}
              className="stat-input w-full"
              value={stats[f.key] || ''}
              onChange={e => handleChange(f.key, e.target.value)}
              placeholder="0"
            />
          </div>
        ))}
      </div>
      <div className="mt-2 bg-slate-100 p-2.5 rounded-xl border border-slate-200 inline-block px-4">
        <div className="text-[10px] text-slate-500 font-extrabold">ERA (평균자책점)</div>
        <div className="text-sm font-black text-slate-900">{formatERA(era)}</div>
      </div>
    </div>
  );
}
