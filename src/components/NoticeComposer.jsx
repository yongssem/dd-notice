import { useEffect, useRef, useState } from 'react';
import Card from './ui/Card.jsx';
import Button from './ui/Button.jsx';

const today = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function NoticeComposer({
  initial,
  onSubmit,
  onCancel,
  busy = false,
  error = '',
}) {
  const [date, setDate] = useState(initial?.date ?? today());
  const [content, setContent] = useState(initial?.content ?? '');
  const submitLock = useRef(false);

  useEffect(() => {
    setDate(initial?.date ?? today());
    setContent(initial?.content ?? '');
  }, [initial]);

  const isEdit = Boolean(initial?.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy || submitLock.current || !date || !content.trim()) return;
    submitLock.current = true;
    try {
      const saved = await onSubmit({ date, content });
      if (saved === true && !isEdit) setContent('');
    } finally {
      submitLock.current = false;
    }
  };

  return (
    <Card tape="mint">
      <h2 className="font-hand text-2xl mb-3">
        {isEdit ? '알림장 수정' : '알림장 작성'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-xs text-ink-secondary">날짜</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-1.5 bg-paper-bg border border-paper-line rounded-paper text-ink-primary text-sm focus:outline-none focus:border-ink-accent"
          />
        </div>
        <textarea
          required
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={'오늘의 알림을 적어주세요.\n줄바꿈은 그대로 보입니다.'}
          className="w-full px-3 py-2 bg-paper-bg border border-paper-line rounded-paper text-ink-primary focus:outline-none focus:border-ink-accent text-sm leading-relaxed"
        />
        {error && <p className="text-xs text-ink-accent">{error}</p>}
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            variant="primary"
            disabled={busy || !content.trim()}
          >
            {busy ? '저장 중…' : isEdit ? '수정 저장' : '발행'}
          </Button>
          {isEdit && (
            <Button type="button" variant="secondary" onClick={onCancel}>
              취소
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
