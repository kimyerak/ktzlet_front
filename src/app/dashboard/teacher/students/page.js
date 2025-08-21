'use client';

import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import StudentManagement from '../../../pages/teacher/StudentManagement';
import Header from '../../../ui/Header';
import LoadingSpinner from '../../../ui/LoadingSpinner';

export default function StudentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (!loading && user && user.type !== 'teacher') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSpinner message="학생 목록을 불러오는 중..." fullScreen={true} />;
  }

  if (!user || user.type !== 'teacher') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100">
      <Header user={user} onHomeClick={() => router.push('/dashboard/teacher')} />
      <StudentManagement user={user} onBack={() => router.push('/dashboard/teacher')} />
    </div>
  );
} 