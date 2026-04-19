import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx';
import RootGate from './pages/RootGate.jsx';
import ParentView from './pages/ParentView.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/p/:classId/:token" element={<ParentView />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RootGate />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
