import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/ui/Layout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import NoticeList from '../components/NoticeList.jsx';
import {
  getClass,
  findParentByToken,
  listNotices,
  markParentFirstAccess,
  markParentReaccess,
} from '../lib/firestore.js';
import { describeFirebaseError } from '../lib/firebaseErrors.js';

export default function ParentView() {
  const { classId, token } = useParams();
  const [klass, setKlass] = useState(null);
  const [parent, setParent] = useState(null);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  // error는 { code, message, hint } 객체 또는 null
  const [error, setError] = useState(null);

  const [nickname, setNickname] = useState('');
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [k, p] = await Promise.all([
        getClass(classId),
        findParentByToken(classId, token),
      ]);
      if (!k || !p) {
        setError({
          code: '',
          message: '유효하지 않은 초대 링크입니다. 담임 선생님께 새 링크를 요청해 주세요.',
          hint: '',
        });
        setLoading(false);
        return;
      }
      setKlass(k);
      setParent(p);

      if (p.tokenUsed) {
        const rows = await listNotices(classId);
        setNotices(rows);
        markParentReaccess(classId, p.id).catch(() => {});
      }
    } catch (e) {
      setError(describeFirebaseError(e, '불러오는 중 오류가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  }, [classId, token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    setConfirming(true);
    setError(null);
    try {
      await markParentFirstAccess(classId, parent.id, nickname);
      const rows = await listNotices(classId);
      setNotices(rows);
      setParent({ ...parent, tokenUsed: true, parentNickname: nickname.trim() });
    } catch (e) {
      setError(describeFirebaseError(e, '확인 처리 실패'));
    } finally {
      setConfirming(false);
    }
  };

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
      <Layout title="뚝딱알림장" subtitle="알림">
        <Card tape="coral">
          <h2 className="font-hand text-2xl mb-2 text-ink-accent">접속 불가</h2>
          <p className="text-sm text-ink-primary break-words">{error.message}</p>
          {error.code && (
            <p className="text-xs text-ink-secondary mt-3">
              문제가 계속되면 담임 선생님께 문의해 주세요.
            </p>
          )}
          {/* 설정 조치 안내는 개발 모드에서만 — 학부모 화면에는 노출하지 않습니다. */}
          {import.meta.env.DEV && error.hint && (
            <p className="text-[11px] text-ink-secondary mt-3 break-words opacity-70">
              {error.hint} {error.code && `(${error.code})`}
            </p>
          )}
        </Card>
      </Layout>
    );
  }

  if (parent && !parent.tokenUsed) {
    return (
      <Layout title="뚝딱알림장" subtitle={`${klass.name} · ${klass.teacherName} 선생님`}>
        <Card tape="yellow" className="max-w-md mx-auto">
          <h2 className="font-hand text-2xl mb-2">
            <span className="text-ink-accent">{parent.studentName}</span> 학부모님이신가요?
          </h2>
          <p className="text-sm text-ink-secondary mb-4">
            맞으시면 뭐라고 부를지 알려주세요. (예: {parent.studentName}엄마, {parent.studentName}아빠)
          </p>
          <form onSubmit={handleConfirm} className="space-y-3">
            <input
              required
              maxLength={20}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={`예) ${parent.studentName}엄마`}
              className="w-full px-3 py-2 bg-paper-bg border border-paper-line rounded-paper text-ink-primary focus:outline-none focus:border-ink-accent"
            />
            <Button type="submit" variant="primary" disabled={confirming} className="w-full">
              {confirming ? '확인 중…' : '맞아요, 들어갈게요'}
            </Button>
          </form>
          <p className="mt-4 text-xs text-ink-secondary">
            다음부터는 같은 링크로 바로 알림장을 보실 수 있습니다.
          </p>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout
      title="뚝딱알림장"
      subtitle={`${klass.name} · ${parent.studentName} (${parent.parentNickname || '학부모'})`}
    >
      <h2 className="font-hand text-2xl mb-3 px-1">
        우리 반 알림장 ({notices.length})
      </h2>
      <NoticeList notices={notices} loading={false} readonly />
    </Layout>
  );
}
