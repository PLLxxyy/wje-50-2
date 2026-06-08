import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import Home from './pages/Home';
import WordList from './pages/WordList';
import Review from './pages/Review';
import ImportExport from './pages/ImportExport';

export default function App() {
  const init = useStore((state) => state.init);
  const isInitialized = useStore((state) => state.isInitialized);

  useEffect(() => {
    init();
  }, [init]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-soft">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white text-2xl">
            ⌨️
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/words" element={<WordList />} />
          <Route path="/review" element={<Review />} />
          <Route path="/import-export" element={<ImportExport />} />
        </Route>
      </Routes>
    </Router>
  );
}
