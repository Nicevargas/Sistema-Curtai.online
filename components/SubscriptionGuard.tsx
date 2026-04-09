'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const [profile, setProfile] = useState<any>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const pathname = usePathname();

  return <>{children}</>;
}
