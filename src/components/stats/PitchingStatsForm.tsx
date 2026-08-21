import type { PitchingStats } from '../../types';
import { calcERA, formatERA } from '../../utils/stats';

interface Props {
  stats: PitchingStats;
  onChange: (stats: PitchingStats) => void;
  playerName: string;
}

const FIELDS: { key: keyof PitchingStats; label: string; step?: string }[] = [
  { key: 'IP', label: 'IP', step: '0.1' }, { key: 'ER', label: 'ER' }, { key: 'R', label: 'R' },
  { key: 'H', label: 'H' }, { key: 'SO', label: 'SO' }, { key: 'BB', label: 'BB' },
  { key: 'W', label: 'W' }, { key: 'L', label: 'L' }, { key: 'SV', label: 'SV' },
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
            <label className="text-[10px] text-bw-500 block mb-1 font-medium">{f.label}</label>
            <input
              type="number" min="0" step={f.step || '1'} className="stat-input w-full"
              value={stats[f.key] || ''} onChange={e => handleChange(f.key, e.target.value)} placeholder="0"
            />
          </div>
        ))}
      </div>
      <div className="mt-2">
        <div className="text-[10px] text-bw-400 font-medium">ERA</div>
        <div className="text-sm font-bold text-white">{formatERA(era)}</div>
      </div>
    </div>
  );
}
