import type { BattingStats } from '../../types';
import { singleGameBattingCalc, formatRate } from '../../utils/stats';

interface Props {
  stats: BattingStats;
  onChange: (stats: BattingStats) => void;
  playerName: string;
}

const FIELDS: { key: keyof BattingStats; label: string }[] = [
  { key: 'PA', label: 'PA' }, { key: 'AB', label: 'AB' }, { key: 'H', label: 'H' },
  { key: '2B', label: '2B' }, { key: '3B', label: '3B' }, { key: 'HR', label: 'HR' },
  { key: 'RBI', label: 'RBI' }, { key: 'R', label: 'R' }, { key: 'BB', label: 'BB' },
  { key: 'SO', label: 'SO' }, { key: 'SB', label: 'SB' },
];

export default function BattingStatsForm({ stats, onChange }: Props) {
  const calc = singleGameBattingCalc(stats);
  const handleChange = (key: keyof BattingStats, value: string) => {
    if (key === 'playerId') return;
    onChange({ ...stats, [key]: Math.max(0, value === '' ? 0 : parseInt(value) || 0) });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {FIELDS.map(f => (
          <div key={f.key} className="text-center">
            <label className="text-[10px] text-bw-500 block mb-1 font-medium">{f.label}</label>
            <input
              type="number" min="0" className="stat-input w-full"
              value={stats[f.key] || ''} onChange={e => handleChange(f.key, e.target.value)} placeholder="0"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-4 flex-wrap mt-2">
        {[
          { label: '타율', value: formatRate(calc.BA) },
          { label: '출루율', value: formatRate(calc.OBP) },
          { label: '장타율', value: formatRate(calc.SLG) },
          { label: 'OPS', value: formatRate(calc.OPS) },
        ].map(item => (
          <div key={item.label} className="text-center">
            <div className="text-[10px] text-bw-400 font-medium">{item.label}</div>
            <div className="text-sm font-bold text-white">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
