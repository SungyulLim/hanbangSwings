import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppStore } from './store';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import TeamRoster from './pages/TeamRoster';
import Games from './pages/Games';
import GameDetail from './pages/GameDetail';
import Leaderboard from './pages/Leaderboard';
import SharedLineup from './pages/SharedLineup';

export default function App() {
  const initializeWithDemo = useAppStore(s => s.initializeWithDemo);

  useEffect(() => {
    initializeWithDemo();
  }, [initializeWithDemo]);

  return (
    <Routes>
      <Route path="/share" element={<SharedLineup />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/roster" element={<TeamRoster />} />
        <Route path="/games" element={<Games />} />
        <Route path="/games/:gameId" element={<GameDetail />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Route>
    </Routes>
  );
}
