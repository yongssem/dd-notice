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
      wide
      actions={<Button variant="secondary" onClick={logout}>로그아웃</Button>}
    >
      <div className="dashboard-summary" aria-label="우리 반 현황">
        <div className="summary-item"><span>우리 반 학생</span><strong>{students.length}</strong></div>
        <div className="summary-item"><span>첫 연결 완료</span><strong>{students.filter((s) => s.tokenUsed).length}</strong></div>
        <div className="summary-item"><span>올린 알림장</span><strong>{notices.length}</strong></div>
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <NoticeComposer
            initial={editingNotice ?? undefined}
            busy={noticeBusy}
            error={noticeError}
            onSubmit={handleNoticeSubmit}
            onCancel={() => setEditingNotice(null)}
          />
          <section aria-labelledby="notice-list-title">
            <h2 id="notice-list-title" className="section-title">알림장 목록 <span className="count-label">{notices.length}개의 안내</span></h2>
            <NoticeList
              notices={notices}
              loading={noticesLoading}
              onEdit={(n) => {
                setEditingNotice(n);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onDelete={handleNoticeDelete}
            />
          </section>
        </div>
        <aside className="dashboard-side" aria-label="학생 명단과 초대 링크 관리">
          <Card tape="yellow">
            <h2 className="section-title">학생 명단 <span className="count-label">{students.length}명</span></h2>
            {error && <p role="alert" className="text-xs text-ink-accent mb-3">{error}</p>}
            {loading ? (
              <p className="text-sm text-ink-secondary">불러오는 중…</p>
            ) : students.length === 0 ? (
              <p className="text-sm text-ink-secondary">아직 학생이 없습니다. 아래에서 명단을 추가하세요.</p>
            ) : (
              <ul className="divide-y divide-paper-line">
                {students.map((s) => (
                  <li key={s.id} className="student-row">
                    <div className="student-identity">
                      <div className="student-name">{s.studentName}{s.tokenUsed && <span className="connection-badge">연결됨</span>}</div>
                      {s.parentNickname && <div className="text-xs text-ink-secondary mt-1">학부모: {s.parentNickname}</div>}
                      <div className="student-link">{linkFor(s)}</div>
                    </div>
                    <div className="student-actions">
                      <Button variant="primary" onClick={() => handleCopy(s)}>{copiedId === s.id ? '복사됨!' : '링크 복사'}</Button>
                      <Button variant="secondary" onClick={() => handleRegen(s)}>재발급</Button>
                      <button type="button" onClick={() => handleDelete(s)} className="text-action">삭제</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card tape="mint">
            <h2 className="mb-2">학생 추가</h2>
            <p className="text-xs text-ink-secondary mb-3">한 줄에 한 명, 또는 쉼표로 구분해 붙여넣으세요.</p>
            <textarea
              aria-label="추가할 학생 이름"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={3}
              placeholder={'예) 김가온\n이나래\n박다온'}
              className="ink-field"
            />
            <div className="mt-4">
              <Button variant="primary" disabled={adding || bulkText.trim().length === 0} onClick={handleAdd}>{adding ? '추가 중…' : '명단에 추가'}</Button>
            </div>
            <p className="text-xs text-ink-secondary mt-3">학생별 학부모 초대 링크가 자동으로 만들어집니다.</p>
          </Card>
        </aside>
      </div>
    </Layout>
  );
}
