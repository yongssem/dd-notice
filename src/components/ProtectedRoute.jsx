import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { missingFirebaseEnvKeys } from '../lib/firebase.js';

export default function ProtectedRoute({ children }) {
  const { user, loading, ready } = useAuth();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <p className="font-hand text-2xl text-ink-primary mb-2">설정 대기 중</p>
          <p className="text-sm text-ink-secondary">
            .env.local(배포 시에는 Vercel 환경변수)에 Firebase 값을 넣고
            dev 서버 재시작 또는 재배포해 주세요.
          </p>
          {missingFirebaseEnvKeys.length > 0 && (
            <p className="text-xs text-ink-accent mt-3 break-words">
              비어 있는 값: {missingFirebaseEnvKeys.join(', ')}
            </p>
          )}
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
