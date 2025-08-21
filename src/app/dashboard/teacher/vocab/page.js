'use client';

import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import VocabManagement from '../../../pages/teacher/VocabManagement';

export default function VocabManagementPage() {
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
    return <div>로딩 중...</div>;
  }

  if (!user || user.type !== 'teacher') {
    return null;
  }

  return <VocabManagement user={user} />;
} 