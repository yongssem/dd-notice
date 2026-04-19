import { useEffect, useState, useCallback } from 'react';
import { getMyClass } from '../lib/firestore.js';

export function useMyClass(uid) {
  const [klass, setKlass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!uid) {
      setKlass(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const k = await getMyClass(uid);
      setKlass(k);
    } catch (e) {
      setError(e?.message ?? '학급 조회 실패');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { klass, loading, error, refresh };
}
