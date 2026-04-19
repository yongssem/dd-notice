import Card from './ui/Card.jsx';
import Button from './ui/Button.jsx';

export default function NoticeList({
  notices,
  loading,
  readonly = false,
  onEdit,
  onDelete,
}) {
  if (loading) {
    return (
      <Card>
        <p className="text-sm text-ink-secondary">알림장을 불러오는 중…</p>
      </Card>
    );
  }

  if (notices.length === 0) {
    return (
      <Card>
        <h3 className="font-hand text-xl mb-1">알림장이 없습니다</h3>
        <p className="text-sm text-ink-secondary">
          {readonly
            ? '아직 올라온 알림장이 없어요.'
            : '위 카드에서 첫 알림장을 작성해 보세요.'}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {notices.map((n, idx) => (
        <Card
          key={n.id}
          tape={['yellow', 'mint', 'coral'][idx % 3]}
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="font-hand text-xl text-ink-primary">
              {formatDate(n.date)}
            </div>
            {!readonly && (
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => onEdit(n)}>
                  수정
                </Button>
                <button
                  type="button"
                  onClick={() => onDelete(n)}
                  className="text-xs text-ink-secondary underline underline-offset-2 hover:text-ink-accent"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
          <pre className="whitespace-pre-wrap font-sans text-sm text-ink-primary leading-relaxed">
{n.content}
          </pre>
        </Card>
      ))}
    </div>
  );
}

function formatDate(ymd) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-');
  return `${y}.${m}.${d}`;
}
