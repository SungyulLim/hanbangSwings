import { useSearchParams } from 'react-router-dom';
import { decodeSharedLineup } from '../store';
import { type Position, POSITION_LABELS } from '../types';
import { Calendar, Users, ExternalLink } from 'lucide-react';
import logoImg from '../assets/logo.png';

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

export default function SharedLineup() {
  const [searchParams] = useSearchParams();
  const data = searchParams.get('data');
  const lineup = data ? decodeSharedLineup(data) : null;

  if (!lineup) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md">
          <img src={logoImg} alt="한방 스윙스 로고" className="w-16 h-16 object-contain mx-auto mb-4" />
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">링크를 찾을 수 없습니다</h1>
          <p className="text-slate-500 text-sm">라인업 데이터가 유효하지 않거나 만료되었습니다.</p>
          <a href="/" className="btn-primary mt-4 inline-flex">
            <ExternalLink className="w-4 h-4" /> 홈으로 이동
          </a>
        </div>
      </div>
    );
  }

  const orderedAssignments = [...lineup.assignments]
    .filter(a => a.battingOrder > 0)
    .sort((a, b) => a.battingOrder - b.battingOrder);

  const benchAssignments = lineup.assignments.filter(a => a.battingOrder === 0);

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-12 text-slate-900">
      <div className="max-w-lg mx-auto space-y-6">
        {/* 헤더 */}
        <div className="text-center pt-6">
          <img src={logoImg} alt="한방 스윙스 로고" className="w-16 h-16 object-contain mx-auto mb-2 drop-shadow-xs" />
          <h1 className="text-2xl font-black text-slate-900">한방 스윙스</h1>
          <p className="text-slate-500 text-xs tracking-widest uppercase mt-1 font-bold">HANBANG SWINGS</p>
        </div>

        {/* 경기 정보 */}
        <div className="glass-card p-5 text-center">
          <div className="text-xs text-slate-500 font-bold mb-1">{lineup.lineupTitle}</div>
          <h2 className="text-lg font-extrabold text-slate-900">
            {lineup.gameType === 'internal' ? '한방 스윙스 자체 청백전' : `vs ${lineup.opponent}`}
          </h2>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-slate-500">
            {lineup.gameDate && (
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5" /> {lineup.gameDate}
              </span>
            )}
          </div>
        </div>

        {/* 다이아몬드 (읽기 전용) */}
        <div className="glass-card p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-3">수비 포지션 배치 (투수 P 포함)</h3>
          <svg viewBox="0 0 400 360" className="w-full h-auto drop-shadow-md">
            <defs>
              <radialGradient id="fieldGradShared" cx="50%" cy="60%" r="60%">
                <stop offset="0%" stopColor="#15803d" />
                <stop offset="100%" stopColor="#166534" />
              </radialGradient>
            </defs>

            <rect x="0" y="0" width="400" height="360" rx="16" fill="url(#fieldGradShared)" />
            <path d="M 40,140 Q 200,-10 360,140" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <polygon points="200,145 300,230 200,315 100,230" fill="rgba(217, 119, 6, 0.25)" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
            <rect x="196" y="141" width="8" height="8" fill="white" opacity="0.9" transform="rotate(45 200 145)" />
            <rect x="296" y="226" width="8" height="8" fill="white" opacity="0.9" transform="rotate(45 300 230)" />
            <rect x="96" y="226" width="8" height="8" fill="white" opacity="0.9" transform="rotate(45 100 230)" />
            <polygon points="200,311 195,318 200,325 205,318" fill="white" opacity="0.9" />
            <circle cx="200" cy="230" r="6" fill="rgba(217, 119, 6, 0.6)" />

            {Object.entries(POSITION_COORDS).map(([pos, coord]) => {
              const assignment = lineup.assignments.find(a => a.position === pos);
              const isAssigned = !!assignment;

              return (
                <g key={pos}>
                  <circle
                    cx={coord.x} cy={coord.y}
                    r={isAssigned ? 24 : 20}
                    fill={isAssigned ? '#ffffff' : 'rgba(15, 23, 42, 0.75)'}
                    stroke={isAssigned ? '#ffffff' : 'rgba(255,255,255,0.5)'}
                    strokeWidth={isAssigned ? 2 : 1}
                  />
                  <text x={coord.x} y={isAssigned ? coord.y - 6 : coord.y + 1} textAnchor="middle" dominantBaseline="middle"
                    fill={isAssigned ? '#475569' : '#ffffff'} fontSize={isAssigned ? '8' : '11'} fontWeight="800" fontFamily="Inter, sans-serif">
                    {pos}
                  </text>
                  {isAssigned && assignment && (
                    <>
                      <text x={coord.x} y={coord.y + 5} textAnchor="middle" dominantBaseline="middle"
                        fill="#0f172a" fontSize="10" fontWeight="900" fontFamily="'Noto Sans KR', sans-serif">
                        {assignment.playerName.length > 3 ? assignment.playerName.slice(0, 3) : assignment.playerName}
                      </text>
                      <text x={coord.x} y={coord.y + 16} textAnchor="middle" dominantBaseline="middle"
                        fill="#64748b" fontSize="8" fontWeight="700" fontFamily="Inter, sans-serif">
                        #{assignment.playerNumber}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* 타순 */}
        <div className="glass-card p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-3">선발 타순 (1번 ~ 9번 + DH)</h3>
          <div className="space-y-1.5">
            {orderedAssignments.map(a => (
              <div key={a.battingOrder} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                  {a.battingOrder}
                </div>
                <div className="flex-1">
                  <span className="font-extrabold text-slate-900 text-sm">{a.playerName}</span>
                  <span className="text-xs text-slate-500 ml-2 font-bold">#{a.playerNumber}</span>
                </div>
                <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                  {a.position}
                </span>
              </div>
            ))}
          </div>
          {benchAssignments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <h4 className="text-xs text-slate-500 font-bold mb-2">벤치</h4>
              {benchAssignments.map(a => (
                <div key={a.position + a.playerNumber} className="flex items-center gap-3 px-3 py-2 text-slate-600 text-sm">
                  <span>{a.playerName} #{a.playerNumber}</span>
                  <span className="ml-auto text-xs font-bold">{POSITION_LABELS[a.position as Position]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="text-center text-xs text-slate-500 py-4 font-medium">
          ⚾ 한방 스윙스 · Hanbang Swings
        </div>
      </div>
    </div>
  );
}
