"use client";

import { cookies } from 'next/headers';   // violation: server-only in client component
import 'server-only';                      // violation: server-only in client component

export function ClientViolations() {
  return <div>client</div>;
}
