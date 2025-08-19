'use client';

import { useAuth } from './contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import LoadingSpinner from './ui/LoadingSpinner';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // 로그인된 사용자는 대시보드로 리다이렉트
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return user ? <LoadingSpinner message="대시보드로 이동 중..." /> : <LandingPage />;
}
