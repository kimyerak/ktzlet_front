'use client';

import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import HistoryPage from '../../../pages/HistoryPage';
import Header from '../../../ui/Header';

export default function HistoryPageRoute() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (!loading && user && user.type !== 'student') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (!user || user.type !== 'student') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-purple-100">
      <Header user={user} onHomeClick={() => router.push('/dashboard/student')} />
      <HistoryPage user={user} onBack={() => router.push('/dashboard/student')} />
    </div>
  );
} 