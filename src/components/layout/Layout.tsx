import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import {
  LayoutDashboard, Users, Calendar, Trophy, Menu, X, Key, LogOut,
  ShieldCheck, Lock, Download, Upload, Database, Check, AlertCircle
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '대시보드' },
  { to: '/roster', icon: Users, label: '로스터' },
  { to: '/games', icon: Calendar, label: '경기' },
  { to: '/leaderboard', icon: Trophy, label: '리더보드' },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const { isAdmin, loginAdmin, logoutAdmin, exportData, importData, players, games, seasons } = useAppStore();
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

  // 데이터 백업 JSON 다운로드
  const handleExportBackup = () => {
    const jsonStr = exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `한방스윙스_데이터백업_${today}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 데이터 복원 JSON 파일 업로드
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      if (confirm('백업 파일을 불러오면 현재 브라우저의 선수/경기/리그 데이터가 해당 파일 내용으로 복원됩니다. 계속하시겠습니까?')) {
        const success = importData(content);
        if (success) {
          alert('데이터가 성공적으로 복원되었습니다!');
          setShowDataModal(false);
        } else {
          alert('올바르지 않은 백업 파일 형식입니다. JSON 파일을 확인해 주세요.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3 group">
            <img
              src={logoImg}
              alt="한방 스윙스 로고"
              className="w-10 h-10 object-contain group-hover:scale-105 transition-transform"
            />
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

          {/* 관리자 로그인 / 상태 버튼 & 백업 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDataModal(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-bold"
              title="데이터 백업 및 복원"
            >
              <Database className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">데이터 백업/복원</span>
            </button>

            {isAdmin ? (
              <div className="flex items-center gap-2">
                <span className="badge bg-amber-100 text-amber-900 border border-amber-300 text-xs py-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> 관리자
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

      {/* 데이터 백업 / 복원 모달 */}
      {showDataModal && (
        <div className="modal-overlay" onClick={() => setShowDataModal(false)}>
          <div className="modal-content p-6 max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">데이터 영구 백업 &amp; 복원</h3>
                  <p className="text-[11px] text-slate-500">선수 목록, 경기 기록, 리그 데이터를 파일로 안전하게 관리하세요.</p>
                </div>
              </div>
              <button onClick={() => setShowDataModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 현재 데이터 요약 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 flex justify-around text-center">
                <div>
                  <div className="text-slate-400 font-bold mb-0.5">선수 로스터</div>
                  <div className="text-base font-extrabold text-slate-900">{players.length}명</div>
                </div>
                <div className="border-r border-slate-200" />
                <div>
                  <div className="text-slate-400 font-bold mb-0.5">등록된 경기</div>
                  <div className="text-base font-extrabold text-slate-900">{games.length}개</div>
                </div>
                <div className="border-r border-slate-200" />
                <div>
                  <div className="text-slate-400 font-bold mb-0.5">리그(시즌)</div>
                  <div className="text-base font-extrabold text-slate-900">{seasons.length}개</div>
                </div>
              </div>

              {/* 1. 백업 다운로드 */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                <h4 className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-700" />
                  전체 데이터 백업 파일 다운로드 (.json)
                </h4>
                <p className="text-[11px] text-emerald-800">
                  현재 브라우저에 저장된 모든 선수, 경기 기록, 리그 데이터를 JSON 파일로 다운로드합니다. 기기 변경이나 안전한 보관을 위해 주기적으로 백업을 권장합니다.
                </p>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="w-full btn-primary text-xs py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> 백업 파일 다운로드 (.json)
                </button>
              </div>

              {/* 2. 복원 업로드 */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
                <h4 className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-blue-700" />
                  백업 파일 불러오기 및 데이터 복원
                </h4>
                <p className="text-[11px] text-blue-800">
                  이전에 다운로드해 둔 백업 파일(.json)을 업로드하면 현재 브라우저에 모든 데이터가 즉시 복원됩니다.
                </p>
                <label className="w-full btn-secondary text-xs py-2.5 flex items-center justify-center gap-2 cursor-pointer border-blue-300 text-blue-900 hover:bg-blue-100">
                  <Upload className="w-4 h-4" /> 백업 파일 선택 (.json)
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportBackup}
                  />
                </label>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>데이터는 브라우저의 영구 로컬 스토리지에 자동 보관되며, 배포 시에도 유지됩니다.</span>
              </div>
            </div>
          </div>
        </div>
      )}

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

      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-4 flex-wrap">
        <span>© 2026 한방 스윙스 ⚾ Hanbang Swings</span>
        <button
          onClick={() => setShowDataModal(true)}
          className="text-emerald-700 hover:underline font-bold flex items-center gap-1"
        >
          <Database className="w-3.5 h-3.5" /> 데이터 백업 / 복원
        </button>
      </footer>
    </div>
  );
}
