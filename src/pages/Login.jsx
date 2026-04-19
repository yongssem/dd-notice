import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/ui/Layout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function Login() {
  const navigate = useNavigate();
  const { ready, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signup') await signUpWithEmail(email, password);
      else await signInWithEmail(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(prettifyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setBusy(true);
    try {
      await signInWithGoogle();
      navigate('/', { replace: true });
    } catch (err) {
      setError(prettifyAuthError(err));
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

          {error && <p className="text-xs text-ink-accent">{error}</p>}

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
            setError('');
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

function prettifyAuthError(err) {
  const code = err?.code ?? '';
  if (code.includes('invalid-credential') || code.includes('wrong-password'))
    return '이메일 또는 비밀번호가 맞지 않습니다.';
  if (code.includes('user-not-found')) return '등록되지 않은 이메일입니다.';
  if (code.includes('email-already-in-use')) return '이미 가입된 이메일입니다.';
  if (code.includes('weak-password')) return '비밀번호는 6자 이상이어야 합니다.';
  if (code.includes('popup-closed-by-user')) return '로그인 창이 닫혔습니다.';
  if (code.includes('network-request-failed')) return '네트워크를 확인해 주세요.';
  return err?.message ?? '로그인 중 오류가 발생했습니다.';
}
