'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import StudentDashboard from '../../pages/student/StudentDashboard';
import Header from '../../ui/Header';

export default function StudentDashboardPage() {
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

  // 조건부 반환 대신 조건부 렌더링 사용
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      {user && user.type === 'student' ? (
        <>
          <Header user={user} />
          <StudentDashboard user={user} />
        </>
      ) : (
        <div>접근 권한이 없습니다.</div>
      )}
    </div>
  );
} 