import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import NavBar from './components/shared/NavBar';
import PosPage from './pages/PosPage';
import DashboardPage from './pages/DashboardPage';
import CustomerPage from './pages/CustomerPage';
import seedData from './data/seedData.json';

export default function App() {
  const initialize = useStore((s) => s.initialize);

  useEffect(() => {
    initialize(seedData);
  }, [initialize]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Routes>
          <Route path="/pos" element={<PosPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customer" element={<CustomerPage />} />
          <Route path="*" element={<Navigate to="/pos" replace />} />
        </Routes>
      </main>
    </div>
  );
}
