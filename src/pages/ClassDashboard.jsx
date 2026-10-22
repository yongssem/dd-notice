import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/ui/Layout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import NoticeComposer from '../components/NoticeComposer.jsx';
import NoticeList from '../components/NoticeList.jsx';
import { useAuth } from '../hooks/useAuth.js';
import {
  listStudents,
  addStudents,
  regenerateToken,
  deleteStudent,
  listNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} from '../lib/firestore.js';

export default function ClassDashboard({ klass }) {
  const { logout } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [adding, setAdding] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const [notices, setNotices] = useState([]);
  const [noticesLoading, setNoticesLoading] = useState(true);
  const [noticeBusy, setNoticeBusy] = useState(false);
  const [noticeError, setNoticeError] = useState('');
  const [editingNotice, setEditingNotice] = useState(null);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : '';

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await listStudents(klass.id);
      setStudents(rows);
    } catch (e) {
      setError(e?.message ?? '학생 목록 조회 실패');
    } finally {
      setLoading(false);
    }
  }, [klass.id]);

  const refreshNotices = useCallback(async () => {
    setNoticesLoading(true);
    setNoticeError('');
    try {
      const rows = await listNotices(klass.id);
      setNotices(rows);
    } catch (e) {
      setNoticeError(e?.message ?? '알림장 조회 실패');
    } finally {
      setNoticesLoading(false);
    }
  }, [klass.id]);

  useEffect(() => {
    refresh();
    refreshNotices();
  }, [refresh, refreshNotices]);

  const handleNoticeSubmit = async ({ date, content }) => {
    setNoticeBusy(true);
    setNoticeError('');
    try {
      if (editingNotice) {
        await updateNotice(klass.id, editingNotice.id, { date, content });
        setEditingNotice(null);
      } else {
        await createNotice(klass.id, { date, content });
      }
      await refreshNotices();
      return true;
    } catch (e) {
      setNoticeError(e?.message ?? '알림장 저장 실패');
      return false;
    } finally {
      setNoticeBusy(false);
    }
  };

  const handleNoticeDelete = async (n) => {
    if (!confirm(`${n.date} 알림장을 삭제할까요?`)) return;
    try {
      await deleteNotice(klass.id, n.id);
      await refreshNotices();
    } catch (e) {
      setNoticeError(e?.message ?? '알림장 삭제 실패');
    }
  };

  const handleAdd = async () => {
    const names = bulkText
      .split(/[\n,]/)
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    setAdding(true);
    setError('');
    try {
      await addStudents(klass.id, names);
      setBulkText('');
      await refresh();
    } catch (e) {
      setError(e?.message ?? '학생 추가 실패');
    } finally {
      setAdding(false);
    }
  };

  const linkFor = (s) => `${origin}/p/${klass.id}/${s.inviteToken}`;

  const handleCopy = async (s) => {
    try {
      await navigator.clipboard.writeText(linkFor(s));
      setCopiedId(s.id);
      setTimeout(() => setCopiedId((cur) => (cur === s.id ? null : cur)), 1500);
    } catch {
      setError('클립보드 복사 실패 — 링크를 직접 선택해 주세요.');
    }
  };

  const handleRegen = async (s) => {
    if (!confirm(`${s.studentName} 학생의 링크를 새로 만들까요?\n기존 링크는 즉시 무효화됩니다.`)) return;
    await regenerateToken(klass.id, s.id);
    await refresh();
  };

  const handleDelete = async (s) => {
    if (!confirm(`${s.studentName} 학생을 명단에서 삭제할까요?`)) return;
    await deleteStudent(klass.id, s.id);
    await refresh();
  };

  return (
    <Layout
      title="뚝딱알림장"
      subtitle={`${klass.name} · ${klass.teacherName}`}
    >
      <div className="space-y-6">
        <Card tape="yellow">
          <h2 className="font-hand text-2xl mb-2">학생 추가</h2>
          <p className="text-xs text-ink-secondary mb-3">
            한 줄에 한 명, 또는 쉼표로 구분해서 여러 명을 한꺼번에 붙여넣으세요.
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={4}
            placeholder={'예)\n김철수\n이영희, 박민수\n최지연'}
            className="w-full px-3 py-2 bg-paper-bg border border-paper-line rounded-paper text-ink-primary focus:outline-none focus:border-ink-accent font-sans text-sm"
          />
          <div className="mt-3 flex items-center gap-3">
            <Button
              variant="primary"
              disabled={adding || bulkText.trim().length === 0}
              onClick={handleAdd}
            >
              {adding ? '추가 중…' : '명단에 추가'}
            </Button>
            <span className="text-xs text-ink-secondary">
              추가 시 학생별 초대 링크가 자동 생성됩니다.
            </span>
          </div>
        </Card>

        <Card tape="coral">
          <h2 className="font-hand text-2xl mb-3">
            학생 명단 · 초대 링크 ({students.length}명)
          </h2>

          {error && <p className="text-xs text-ink-accent mb-3">{error}</p>}
          {loading ? (
            <p className="text-sm text-ink-secondary">불러오는 중…</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-ink-secondary">
              아직 학생이 없습니다. 위 카드에서 추가하세요.
            </p>
          ) : (
            <ul className="divide-y divide-paper-line">
              {students.map((s) => (
                <li key={s.id} className="py-3 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[160px]">
                    <div className="text-base font-semibold text-ink-primary">
                      {s.studentName}
                      {s.tokenUsed && (
                        <span className="ml-2 text-xs text-tape-mint bg-ink-primary px-2 py-0.5 rounded">
                          연결됨
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink-secondary break-all">
                      {linkFor(s)}
                    </div>
                    {s.parentNickname && (
                      <div className="text-xs text-ink-secondary mt-0.5">
                        학부모: {s.parentNickname}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="primary" onClick={() => handleCopy(s)}>
                      {copiedId === s.id ? '복사됨!' : '링크 복사'}
                    </Button>
                    <Button variant="secondary" onClick={() => handleRegen(s)}>
                      재발급
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s)}
                      className="text-xs text-ink-secondary underline underline-offset-2 hover:text-ink-accent"
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <NoticeComposer
          initial={editingNotice ?? undefined}
          busy={noticeBusy}
          error={noticeError}
          onSubmit={handleNoticeSubmit}
          onCancel={() => setEditingNotice(null)}
        />

        <div>
          <h2 className="font-hand text-2xl mb-3 px-1">
            알림장 목록 ({notices.length})
          </h2>
          <NoticeList
            notices={notices}
            loading={noticesLoading}
            onEdit={(n) => {
              setEditingNotice(n);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onDelete={handleNoticeDelete}
          />
        </div>
      </div>

      <div className="text-center mt-8">
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
