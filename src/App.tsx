import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ImportStudents from './pages/ImportStudents';
import SettingsPage from './pages/SettingsPage';
import RafflePage from './pages/RafflePage';
import HistoryPage from './pages/HistoryPage';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="importar" element={<ImportStudents />} />
            <Route path="configuracoes" element={<SettingsPage />} />
            <Route path="sorteio" element={<RafflePage />} />
            <Route path="historico" element={<HistoryPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" />
    </AppProvider>
  );
}

export default App;
