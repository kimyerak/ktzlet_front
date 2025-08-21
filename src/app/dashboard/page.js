'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // 사용자 타입에 따라 적절한 대시보드로 리다이렉트
      if (user.type === 'teacher') {
        router.push('/dashboard/teacher');
      } else if (user.type === 'student') {
        router.push('/dashboard/student');
      }
    } else if (!loading && !user) {
      // 로그인하지 않은 경우 홈으로 리다이렉트
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSpinner fullScreen={true} />;
  }

  return <LoadingSpinner message="대시보드로 이동 중..." fullScreen={true} />;
} 