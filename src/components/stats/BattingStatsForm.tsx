import type { BattingStats } from '../../types';
import { singleGameBattingCalc, formatRate } from '../../utils/stats';

interface Props {
  stats: BattingStats;
  onChange: (stats: BattingStats) => void;
  playerName: string;
}

const FIELDS: { key: keyof BattingStats; label: string }[] = [
  { key: 'PA', label: '타석' },
  { key: 'AB', label: '타수' },
  { key: 'H', label: '안타' },
  { key: '2B', label: '2루타' },
  { key: '3B', label: '3루타' },
  { key: 'HR', label: '홈런' },
  { key: 'RBI', label: '타점' },
  { key: 'R', label: '득점' },
  { key: 'BB', label: '볼넷' },
  { key: 'SO', label: '삼진' },
  { key: 'SB', label: '도루' },
];

export default function BattingStatsForm({ stats, onChange }: Props) {
  const calc = singleGameBattingCalc(stats);
  const handleChange = (key: keyof BattingStats, value: string) => {
    if (key === 'playerId') return;
    onChange({ ...stats, [key]: Math.max(0, value === '' ? 0 : parseInt(value, 10) || 0) });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {FIELDS.map(f => (
          <div key={f.key} className="text-center">
            <label className="text-[11px] text-slate-600 block mb-1 font-extrabold">{f.label}</label>
            <input
              type="number"
              min="0"
              className="stat-input w-full"
              value={stats[f.key] || ''}
              onChange={e => handleChange(f.key, e.target.value)}
              placeholder="0"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-4 flex-wrap mt-2 bg-slate-100 p-2.5 rounded-xl border border-slate-200 justify-around">
        {[
          { label: '타율', value: formatRate(calc.BA) },
          { label: '출루율', value: formatRate(calc.OBP) },
          { label: '장타율', value: formatRate(calc.SLG) },
          { label: 'OPS', value: formatRate(calc.OPS) },
        ].map(item => (
          <div key={item.label} className="text-center">
            <div className="text-[10px] text-slate-500 font-extrabold">{item.label}</div>
            <div className="text-sm font-black text-slate-900">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
