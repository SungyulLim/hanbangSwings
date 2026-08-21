import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { LayoutDashboard, Users, Calendar, Trophy, Menu, X, Zap, Key, LogOut, ShieldCheck, Lock } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '대시보드' },
  { to: '/roster', icon: Users, label: '로스터' },
  { to: '/games', icon: Calendar, label: '경기' },
  { to: '/leaderboard', icon: Trophy, label: '리더보드' },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const { isAdmin, loginAdmin, logoutAdmin } = useAppStore();
  const location = useLocation();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = loginAdmin(password);
    if (success) {
      setShowLoginModal(false);
      setPassword('');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm group-hover:bg-slate-800 transition-colors">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-900 leading-none">
                한방 스윙스
              </h1>
              <p className="text-[9px] text-slate-500 font-bold tracking-[0.2em] uppercase mt-0.5">
                Hanbang Swings
              </p>
            </div>
          </NavLink>

          {/* 데스크톱 네비 */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* 관리자 로그인 / 상태 버튼 */}
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <span className="badge bg-amber-100 text-amber-900 border border-amber-300 text-xs py-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> 관리자 모드
                </span>
                <button
                  onClick={logoutAdmin}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="관리자 로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setPassword(''); setLoginError(false); setShowLoginModal(true); }}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline font-bold">관리자 로그인</span>
                <span className="sm:hidden font-bold">로그인</span>
              </button>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="md:hidden px-4 pb-4 animate-slide-up">
            <div className="bg-white border border-slate-200 rounded-2xl p-2 space-y-1 shadow-lg">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6" key={location.pathname}>
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* 관리자 암호 로그인 모달 */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-content p-6 max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">관리자 인증</h3>
              </div>
              <button onClick={() => setShowLoginModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">관리자 비밀번호</label>
                <input
                  type="password"
                  className="input-field text-center font-mono tracking-widest text-lg"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setLoginError(false); }}
                  autoFocus
                  required
                />
                {loginError && (
                  <p className="text-xs text-red-600 font-bold mt-1.5 text-center">
                    비밀번호가 일치하지 않습니다.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowLoginModal(false)} className="btn-secondary text-xs">
                  취소
                </button>
                <button type="submit" className="btn-primary text-xs">
                  로그인
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500 font-medium">
        © 2026 한방 스윙스 ⚾ Hanbang Swings
      </footer>
    </div>
  );
}
