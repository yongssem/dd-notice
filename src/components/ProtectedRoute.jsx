import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function ProtectedRoute({ children }) {
  const { user, loading, ready } = useAuth();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <p className="font-hand text-2xl text-ink-primary mb-2">설정 대기 중</p>
          <p className="text-sm text-ink-secondary">
            .env.local에 Firebase 값을 넣고 dev 서버를 재시작해 주세요.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-ink-secondary">불러오는 중...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
