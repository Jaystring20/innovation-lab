import type { ReactNode } from 'react';

export default function StoreLayout({ children }: { children: ReactNode }) {
  return <div className="p-6">{children}</div>;
}
