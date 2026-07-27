import { useEffect, useState, useCallback } from 'react';
import { getMyClass } from '../lib/firestore.js';
import { describeFirebaseError } from '../lib/firebaseErrors.js';

export function useMyClass(uid) {
  const [klass, setKlass] = useState(null);
  const [loading, setLoading] = useState(true);
  // error는 { code, message, hint } 객체 또는 null
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!uid) {
      setKlass(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const k = await getMyClass(uid);
      setKlass(k);
    } catch (e) {
      setError(describeFirebaseError(e, '학급 조회 실패'));
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { klass, loading, error, refresh };
}
