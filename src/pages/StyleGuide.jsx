import Layout from '../components/ui/Layout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';

export default function StyleGuide() {
  return (
    <Layout
      title="뚝딱알림장"
      subtitle="Phase 2 · 디자인 시스템 (종이 · 크래프트 톤)"
    >
      <section className="space-y-6">
        <Card tape="yellow">
          <h2 className="font-hand text-2xl mb-2">오늘의 알림장</h2>
          <p className="text-sm text-ink-secondary leading-relaxed">
            본문은 Pretendard로 가독성 우선, 제목 포인트는 Gaegu 손글씨.
            마스킹테이프(노란색)로 쪽지 느낌을 살렸습니다.
          </p>
        </Card>

        <Card tape="mint">
          <h2 className="font-hand text-2xl mb-2">공지사항</h2>
          <p className="text-sm text-ink-secondary leading-relaxed">
            <span className="text-ink-accent font-semibold">빨간펜 강조</span>는
            중요한 문구에만 사용합니다. 민트 테이프 버전.
          </p>
        </Card>

        <Card tape="coral">
          <h2 className="font-hand text-2xl mb-2">수업 안내</h2>
          <p className="text-sm text-ink-secondary leading-relaxed">
            코랄 테이프 + 카드 그림자 2px 3px 0 rgba(0,0,0,0.08).
            radius 6px로 각진 종이 느낌을 유지합니다.
          </p>
        </Card>

        <Card>
          <h3 className="font-hand text-xl mb-3">버튼 3종</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">primary 버튼</Button>
            <Button variant="secondary">secondary 버튼</Button>
            <Button variant="primary" disabled>
              비활성 (opacity-50)
            </Button>
          </div>
          <p className="mt-4 text-xs text-ink-secondary">
            native disabled 대신 opacity-50 + pointer-events-none 적용.
          </p>
        </Card>

        <Card>
          <h3 className="font-hand text-xl mb-3">컬러 팔레트</h3>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-3 rounded-paper bg-paper-bg border border-paper-line">
              paper.bg
            </div>
            <div className="p-3 rounded-paper bg-paper-card border border-paper-line">
              paper.card
            </div>
            <div className="p-3 rounded-paper bg-paper-line">paper.line</div>
            <div className="p-3 rounded-paper bg-ink-primary text-paper-card">
              ink.primary
            </div>
            <div className="p-3 rounded-paper bg-ink-secondary text-paper-card">
              ink.secondary
            </div>
            <div className="p-3 rounded-paper bg-ink-accent text-paper-card">
              ink.accent
            </div>
            <div className="p-3 rounded-paper bg-tape-yellow">tape.yellow</div>
            <div className="p-3 rounded-paper bg-tape-mint">tape.mint</div>
            <div className="p-3 rounded-paper bg-tape-coral">tape.coral</div>
          </div>
        </Card>
      </section>
    </Layout>
  );
}
