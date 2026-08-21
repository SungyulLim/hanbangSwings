import { type Position, type Player } from '../../types';

interface DiamondFieldProps {
  assignments: Record<Position, string | null>;
  players: Player[];
  onPositionClick: (position: Position) => void;
  readOnly?: boolean;
}

const POSITION_COORDS: Record<string, { x: number; y: number }> = {
  CF: { x: 200, y: 30 },
  LF: { x: 68, y: 100 },
  RF: { x: 332, y: 100 },
  SS: { x: 140, y: 160 },
  '2B': { x: 260, y: 160 },
  '3B': { x: 85, y: 215 },
  P: { x: 200, y: 210 },
  '1B': { x: 315, y: 215 },
  C: { x: 200, y: 310 },
};

export default function DiamondField({ assignments, players, onPositionClick, readOnly }: DiamondFieldProps) {
  const getPlayer = (pos: Position): Player | undefined => {
    const pid = assignments[pos];
    if (!pid) return undefined;
    return players.find(p => p.id === pid);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <svg viewBox="0 0 400 360" className="w-full h-auto drop-shadow-md">
        <defs>
          <radialGradient id="fieldGradLight" cx="50%" cy="60%" r="60%">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#166534" />
          </radialGradient>
        </defs>

        {/* 잔디 배경 */}
        <rect x="0" y="0" width="400" height="360" rx="16" fill="url(#fieldGradLight)" />

        {/* 외야 원호 */}
        <path d="M 40,140 Q 200,-10 360,140" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />

        {/* 내야 다이아몬드 */}
        <polygon points="200,145 300,230 200,315 100,230" fill="rgba(217, 119, 6, 0.25)" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />

        {/* 베이스 */}
        <rect x="196" y="141" width="8" height="8" fill="white" opacity="0.9" transform="rotate(45 200 145)" />
        <rect x="296" y="226" width="8" height="8" fill="white" opacity="0.9" transform="rotate(45 300 230)" />
        <rect x="96" y="226" width="8" height="8" fill="white" opacity="0.9" transform="rotate(45 100 230)" />
        <polygon points="200,311 195,318 200,325 205,318" fill="white" opacity="0.9" />

        {/* 마운드 */}
        <circle cx="200" cy="230" r="6" fill="rgba(217, 119, 6, 0.6)" />

        {/* 포지션 노드 */}
        {Object.entries(POSITION_COORDS).map(([pos, coord]) => {
          const position = pos as Position;
          const player = getPlayer(position);
          const isAssigned = !!player;

          return (
            <g
              key={pos}
              className={readOnly ? '' : 'cursor-pointer'}
              onClick={() => !readOnly && onPositionClick(position)}
            >
              <circle
                cx={coord.x} cy={coord.y}
                r={isAssigned ? 24 : 20}
                fill={isAssigned ? '#ffffff' : 'rgba(15, 23, 42, 0.75)'}
                stroke={isAssigned ? '#ffffff' : 'rgba(255,255,255,0.5)'}
                strokeWidth={isAssigned ? 2 : 1}
              />

              <text
                x={coord.x} y={isAssigned ? coord.y - 6 : coord.y + 1}
                textAnchor="middle" dominantBaseline="middle"
                fill={isAssigned ? '#475569' : '#ffffff'}
                fontSize={isAssigned ? '8' : '11'}
                fontWeight="800" fontFamily="Inter, sans-serif"
              >
                {pos}
              </text>

              {isAssigned && player && (
                <>
                  <text
                    x={coord.x} y={coord.y + 5}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="#0f172a" fontSize="10" fontWeight="900"
                    fontFamily="'Noto Sans KR', sans-serif"
                  >
                    {player.name.length > 3 ? player.name.slice(0, 3) : player.name}
                  </text>
                  <text
                    x={coord.x} y={coord.y + 16}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="#64748b" fontSize="8" fontWeight="700"
                    fontFamily="Inter, sans-serif"
                  >
                    #{player.number}
                  </text>
                </>
              )}

              {!isAssigned && !readOnly && (
                <text
                  x={coord.x} y={coord.y + 14}
                  textAnchor="middle" dominantBaseline="middle"
                  fill="rgba(255,255,255,0.7)" fontSize="8" fontFamily="Inter, sans-serif"
                >
                  클릭
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
