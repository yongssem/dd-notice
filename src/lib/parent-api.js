export async function visitParent(classId, token, nickname) {
  const response = await fetch('/api/parent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify({
      action: nickname === undefined ? 'open' : 'confirm',
      classId,
      token,
      ...(nickname === undefined ? {} : { nickname }),
    }),
  });
  if (!response.ok) {
    throw new Error([400, 401].includes(response.status)
      ? '유효하지 않은 초대 링크입니다. 담임 선생님께 새 링크를 요청해 주세요.'
      : '불러오는 중 오류가 발생했습니다.');
  }
  return response.json();
}
