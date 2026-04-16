import { memo } from 'react';

export const SafeList = memo(function SafeList({ items }: { items: string[] }) {
  return <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>;
});
