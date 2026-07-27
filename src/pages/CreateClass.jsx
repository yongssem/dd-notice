import { useState } from 'react';
import Layout from '../components/ui/Layout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { createClass } from '../lib/firestore.js';
import { describeFirebaseError } from '../lib/firebaseErrors.js';

export default function CreateClass({ onCreated }) {
  const { user, logout } = useAuth();
  const [name, setName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [busy, setBusy] = useState(false);
  // error는 { code, message, hint } 객체 또는 null
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await createClass({
        uid: user.uid,
        name,
        teacherName,
      });
      onCreated?.();
    } catch (err) {
      setError(describeFirebaseError(err, '학급 생성 중 오류'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout title="뚝딱알림장" subtitle="학급 만들기">
      <Card tape="mint" className="max-w-md mx-auto">
        <h2 className="font-hand text-2xl mb-2">우리 반 정보</h2>
        <p className="text-sm text-ink-secondary mb-4">
          MVP는 학급 <span className="text-ink-accent font-semibold">1개</span>만 지원합니다.
          학생 명단은 생성 후 다음 단계에서 입력할 수 있습니다.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-ink-secondary mb-1">학급명</label>
            <input
              required
              maxLength={30}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예) 3학년 2반"
              className="w-full px-3 py-2 bg-paper-bg border border-paper-line rounded-paper text-ink-primary focus:outline-none focus:border-ink-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">교사 이름</label>
            <input
              required
              maxLength={20}
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="예) 용쌤"
              className="w-full px-3 py-2 bg-paper-bg border border-paper-line rounded-paper text-ink-primary focus:outline-none focus:border-ink-accent"
            />
          </div>
          {error && (
            <div className="text-xs break-words">
              <p className="text-ink-accent">{error.message}</p>
              {error.hint && <p className="text-ink-secondary mt-1">{error.hint}</p>}
              {error.code && (
                <p className="text-ink-secondary mt-1 opacity-70">오류 코드: {error.code}</p>
              )}
            </div>
          )}
          <Button type="submit" variant="primary" disabled={busy} className="w-full">
            {busy ? '만드는 중…' : '학급 만들기'}
          </Button>
        </form>
      </Card>

      <div className="text-center mt-6">
        <button
          type="button"
          onClick={logout}
          className="text-xs text-ink-secondary underline underline-offset-2 hover:text-ink-primary"
        >
          로그아웃
        </button>
      </div>
    </Layout>
  );
}
