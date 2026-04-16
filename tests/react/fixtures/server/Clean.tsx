"use client";

import { useState, useCallback } from 'react';

export function CleanClient() {
  const [count, setCount] = useState(0);
  const increment = useCallback(() => setCount((c) => c + 1), []);
  return <button onClick={increment}>{count}</button>;
}
