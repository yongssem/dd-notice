import { useAuth } from '../hooks/useAuth.js';
import { useMyClass } from '../hooks/useMyClass.js';
import CreateClass from './CreateClass.jsx';
import ClassDashboard from './ClassDashboard.jsx';
import Layout from '../components/ui/Layout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';

export default function RootGate() {
  const { user } = useAuth();
  const { klass, loading, error, refresh } = useMyClass(user?.uid);

  if (loading) {
    return (
      <Layout title="뚝딱알림장" subtitle="불러오는 중">
        <Card>
          <p className="text-sm text-ink-secondary">학급 정보를 확인하는 중입니다…</p>
        </Card>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="뚝딱알림장" subtitle="오류">
        <Card tape="coral">
          <h2 className="font-hand text-2xl mb-2 text-ink-accent">조회 실패</h2>
          <p className="text-sm text-ink-primary break-words">{error.message}</p>
          {error.hint && (
            <p className="text-xs text-ink-secondary mt-3 break-words">{error.hint}</p>
          )}
          {error.code && (
            <p className="text-[11px] text-ink-secondary mt-3 opacity-70">
              오류 코드: {error.code}
            </p>
          )}
          <div className="mt-4">
            <Button variant="secondary" onClick={refresh}>
              다시 시도
            </Button>
          </div>
        </Card>
      </Layout>
    );
  }

  if (!klass) {
    return <CreateClass onCreated={refresh} />;
  }

  return <ClassDashboard klass={klass} />;
}
