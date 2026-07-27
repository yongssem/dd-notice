import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/ui/Layout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { describeFirebaseError } from '../lib/firebaseErrors.js';

export default function Login() {
  const navigate = useNavigate();
  const { ready, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // error는 { code, message, hint } 객체 또는 null
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'signup') await signUpWithEmail(email, password);
      else await signInWithEmail(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(describeFirebaseError(err, '로그인 중 오류가 발생했습니다.'));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      navigate('/', { replace: true });
    } catch (err) {
      setError(describeFirebaseError(err, '로그인 중 오류가 발생했습니다.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout
      title="뚝딱알림장"
      subtitle="담임 전용 로그인"
    >
      <Card tape="yellow" className="max-w-md mx-auto">
        <h2 className="font-hand text-2xl mb-4">
          {mode === 'signup' ? '교사 회원가입' : '교사 로그인'}
        </h2>

        {!ready && (
          <p className="mb-4 text-xs text-ink-accent">
            Firebase 설정이 비었습니다. .env.local을 채운 뒤 dev 서버를 재시작하세요.
          </p>
        )}

        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-ink-secondary mb-1">이메일</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-paper-bg border border-paper-line rounded-paper text-ink-primary focus:outline-none focus:border-ink-accent"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">비밀번호</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-paper-bg border border-paper-line rounded-paper text-ink-primary focus:outline-none focus:border-ink-accent"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
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
            {busy ? '처리 중…' : mode === 'signup' ? '가입하기' : '로그인'}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-2 text-xs text-ink-secondary">
          <span className="flex-1 h-px bg-paper-line" />
          <span>또는</span>
          <span className="flex-1 h-px bg-paper-line" />
        </div>

        <Button
          variant="secondary"
          disabled={busy}
          onClick={handleGoogle}
          className="w-full"
        >
          Google로 로그인
        </Button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signup' ? 'signin' : 'signup');
            setError(null);
          }}
          className="mt-4 text-xs text-ink-secondary underline underline-offset-2 hover:text-ink-primary"
        >
          {mode === 'signup'
            ? '이미 계정이 있어요 → 로그인'
            : '아직 계정이 없어요 → 가입하기'}
        </button>
      </Card>
    </Layout>
  );
}
