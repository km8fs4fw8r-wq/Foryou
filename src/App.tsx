import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CreatePage from './pages/CreatePage';
import CardPage from './pages/CardPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/card/:id" element={<CardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
