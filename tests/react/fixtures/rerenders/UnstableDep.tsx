import { useEffect } from 'react';

export function UnstableDep({ userId }: { userId: number }) {
  useEffect(() => {
    console.log(userId);
  }, [{ id: userId }]);
  return null;
}
