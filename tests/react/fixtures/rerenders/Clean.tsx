import { memo, useCallback, useMemo } from 'react';

export const Clean = memo(function Clean({ id, items }: { id: number; items: string[] }) {
  const style       = useMemo(() => ({ color: 'red' }), []);
  const handleClick = useCallback(() => console.log(id), [id]);
  return <button style={style} onClick={handleClick}>{items.join(', ')}</button>;
});
