"use server";

import { useState, useEffect } from 'react';

export function ServerViolations() {
  const [count, setCount] = useState(0); // violation: client hook in server component
  useEffect(() => {}, []);               // violation: client hook in server component

  const isBrowser = typeof window !== 'undefined'; // violation: browser global

  return <div>{count}</div>;
}
