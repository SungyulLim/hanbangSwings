import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAppStore, CURRENT_DATA_VERSION } from '../../store';
import {
  LayoutDashboard, Users, Calendar, Trophy, Menu, X, Key, LogOut,
  ShieldCheck, Lock, Download, Upload, Database, RefreshCw, AlertCircle, CheckCircle2,
  Cloud, CloudOff, Wifi, Sparkles, Check, ExternalLink
} from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { getFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig, type FirebaseConfig } from '../../lib/firebaseConfig';
import { testFirebaseConnection } from '../../services/cloudStore';

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
  const [activeModalTab, setActiveModalTab] = useState<'sync' | 'cloud'>('sync');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Firebase Config Form
  const [fbConfigJson, setFbConfigJson] = useState('');
  const [fbTesting, setFbTesting] = useState(false);
  const [fbTestResult, setFbTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  const {
    isAdmin, loginAdmin, logoutAdmin, exportData, importData,
    syncWithOfficialData, initCloudSync, players, games, seasons,
    dataVersion, isCloudConnected, cloudSyncStatus
  } = useAppStore();
  const location = useLocation();

  useEffect(() => {
    const existing = getFirebaseConfig();
    if (existing) {
      setFbConfigJson(JSON.stringify(existing, null, 2));
    }
  }, [showDataModal]);

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

  // 공식 최신 데이터 동기화
  const handleSyncOfficialData = () => {
    if (confirm('배포된 최신 공식 데이터(선수 27명, 5개 경기 완료 기록)로 데이터를 동기화하시겠습니까?')) {
      syncWithOfficialData();
      alert('최신 공식 데이터로 동기화되었습니다!');
      setShowDataModal(false);
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

  // Firebase 설정 테스트 및 저장
  const handleSaveFirebaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('클라우드 DB 설정은 관리자만 변경할 수 있습니다.');
      return;
    }
    setFbTesting(true);
    setFbTestResult(null);

    try {
      // JSON 파싱 시도 (문자열에서 JS 객체 구문도 지원)
      let cleaned = fbConfigJson.trim();
      if (cleaned.startsWith('const firebaseConfig =')) {
        cleaned = cleaned.replace(/const\s+firebaseConfig\s*=\s*/, '').replace(/;$/, '');
      }
      // 키에 따옴표가 없는 JS 객체 형태를 유효한 JSON으로 변환
      cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
      // 트레일링 콤마 제거
      cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

      const parsed = JSON.parse(cleaned) as FirebaseConfig;
      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error('apiKey 및 projectId가 포함되어야 합니다.');
      }

      const res = await testFirebaseConnection(parsed);
      if (res.success) {
        saveFirebaseConfig(parsed);
        initCloudSync();
        setFbTestResult({ success: true, msg: '연결 성공! 실시간 클라우드 동기화가 활성화되었습니다.' });
      } else {
        setFbTestResult({ success: false, msg: res.error || '연결에 실패했습니다.' });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '올바른 Firebase 설정 JSON 형식이 아닙니다.';
      setFbTestResult({ success: false, msg: errorMessage });
    } finally {
      setFbTesting(false);
    }
  };

  const handleDisconnectFirebase = () => {
    if (confirm('실시간 클라우드 DB 연결을 해제하고 로컬 모드로 전환하시겠습니까?')) {
      clearFirebaseConfig();
      setFbConfigJson('');
      setFbTestResult(null);
      window.location.reload();
    }
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

          {/* 관리자 로그인 / 클라우드 상태 & 데이터 관리 */}
          <div className="flex items-center gap-2">
            {/* 클라우드 실시간 상태 뱃지 */}
            <button
              onClick={() => { setActiveModalTab('cloud'); setShowDataModal(true); }}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 border ${
                isCloudConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : cloudSyncStatus === 'connecting' || cloudSyncStatus === 'syncing'
                  ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
              title="실시간 클라우드 DB 연결 상태"
            >
              {isCloudConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">실시간 클라우드 ON</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">데이터 관리</span>
                </>
              )}
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

      {/* 데이터 관리 & 클라우드 동기화 모달 */}
      {showDataModal && (
        <div className="modal-overlay" onClick={() => setShowDataModal(false)}>
          <div className="modal-content p-6 max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">데이터 동기화 &amp; 관리</h3>
                  <p className="text-[11px] text-slate-500">실시간 클라우드 DB 연동 및 백업 관리</p>
                </div>
              </div>
              <button onClick={() => setShowDataModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 탭 네비게이션 */}
            <div className="flex gap-2 mb-4 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveModalTab('sync')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeModalTab === 'sync'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" /> 백업 / 공식 동기화
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('cloud')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeModalTab === 'cloud'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-600" /> 실시간 클라우드 DB (Firebase)
              </button>
            </div>

            {activeModalTab === 'sync' && (
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

                {/* 버전 정보 뱃지 */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>데이터 버전: <span className="font-mono text-slate-900">{dataVersion || CURRENT_DATA_VERSION}</span></span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">최신 배포판</span>
                </div>

                {/* 1. 최신 공식 데이터로 즉시 동기화 */}
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2">
                  <h4 className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-indigo-700" />
                    최신 공식 데이터로 동기화
                  </h4>
                  <p className="text-[11px] text-indigo-900 leading-relaxed">
                    동아리 공식 최신 기록(선수 27명, 5개 경기 완료 기록)으로 현재 브라우저의 데이터를 즉시 새로고침합니다.
                  </p>
                  <button
                    type="button"
                    onClick={handleSyncOfficialData}
                    className="w-full btn-primary text-xs py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> 최신 공식 데이터 동기화
                  </button>
                </div>

                {/* 2. 백업 다운로드 */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                  <h4 className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-700" />
                    전체 데이터 백업 파일 다운로드 (.json)
                  </h4>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    현재 브라우저의 모든 데이터를 JSON 백업 파일로 내보냅니다.
                  </p>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="w-full btn-secondary text-xs py-2.5 border-emerald-300 text-emerald-900 hover:bg-emerald-100 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4 text-emerald-700" /> 백업 파일 다운로드 (.json)
                  </button>
                </div>

                {/* 3. 복원 업로드 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-slate-700" />
                    백업 파일 불러오기
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    이전에 다운로드한 백업 파일(.json)을 업로드하여 데이터를 복원합니다.
                  </p>
                  <label className="w-full btn-secondary text-xs py-2.5 flex items-center justify-center gap-2 cursor-pointer border-slate-300 text-slate-800 hover:bg-slate-200">
                    <Upload className="w-4 h-4" /> 백업 파일 선택 (.json)
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleImportBackup}
                    />
                  </label>
                </div>
              </div>
            )}

            {activeModalTab === 'cloud' && (
              <div className="space-y-4">
                {/* 상태 표시 박스 */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  isCloudConnected
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  {isCloudConnected ? (
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Wifi className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                      <CloudOff className="w-4 h-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-sm flex items-center gap-2">
                      {isCloudConnected ? '🟢 실시간 클라우드 DB 연결됨' : '⚪ 로컬 오프라인 모드'}
                    </div>
                    <p className="text-xs mt-1 text-slate-600 leading-relaxed">
                      {isCloudConnected
                        ? '선수 추가, 경기 기록 입력 시 모든 사용자에게 실시간으로 1초 만에 자동 반영됩니다!'
                        : 'Firebase를 연동하면 명령어 실행 없이 웹 화면에서 수정하는 즉시 모든 사람에게 실시간 반영됩니다.'}
                    </p>
                  </div>
                </div>

                {/* 1분 설정 가이드 안내 */}
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1.5 text-blue-950">
                  <div className="font-bold flex items-center gap-1.5 text-blue-900">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Firebase 무료 클라우드 DB 1분 연동 방법</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-blue-800 text-[11px] leading-relaxed">
                    <li>
                      <a
                        href="https://console.firebase.google.com"
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-bold inline-flex items-center gap-0.5"
                      >
                        Firebase 콘솔 <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      에서 무료 프로젝트 생성
                    </li>
                    <li>좌측 메뉴 <strong>Firestore Database</strong> 만들기 (테스트 모드로 시작)</li>
                    <li><strong>프로젝트 설정 &gt; 웹 앱 추가(&lt;/&gt;)</strong>에서 생성된 <code>firebaseConfig</code>를 아래에 붙여넣기</li>
                  </ol>
                </div>

                {/* 설정 입력 폼 */}
                <form onSubmit={handleSaveFirebaseConfig} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Firebase Config (JSON 또는 JS 객체)
                    </label>
                    <textarea
                      rows={6}
                      className="input-field font-mono text-[11px] w-full"
                      placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "hanbang-xxx.firebaseapp.com",\n  "projectId": "hanbang-xxx",\n  "storageBucket": "hanbang-xxx.appspot.com",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
                      value={fbConfigJson}
                      onChange={e => setFbConfigJson(e.target.value)}
                    />
                  </div>

                  {fbTestResult && (
                    <div className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${
                      fbTestResult.success
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-red-100 text-red-900 border border-red-300'
                    }`}>
                      {fbTestResult.success ? <Check className="w-4 h-4 text-emerald-700" /> : <AlertCircle className="w-4 h-4 text-red-700" />}
                      <span>{fbTestResult.msg}</span>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end pt-1">
                    {isCloudConnected && (
                      <button
                        type="button"
                        onClick={handleDisconnectFirebase}
                        className="btn-secondary text-xs text-red-600 hover:bg-red-50 border-red-200"
                      >
                        연결 해제
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={fbTesting || !fbConfigJson.trim()}
                      className="btn-primary text-xs py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                    >
                      {fbTesting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          연결 확인 중...
                        </>
                      ) : (
                        <>
                          <Cloud className="w-3.5 h-3.5" />
                          연결 테스트 &amp; 저장
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
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
          onClick={() => { setActiveModalTab('sync'); setShowDataModal(true); }}
          className="text-emerald-700 hover:underline font-bold flex items-center gap-1"
        >
          <Database className="w-3.5 h-3.5" /> 데이터 관리 / 동기화
        </button>
      </footer>
    </div>
  );
}
