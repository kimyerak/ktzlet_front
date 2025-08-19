'use client';

import { useAuth } from '../../../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import TestSetup from '../../../pages/TestSetup';
import Header from '../../../ui/Header';

export default function TestSetupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialConfig, setInitialConfig] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (!loading && user && user.type !== 'teacher') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // URL 파라미터에서 편집 데이터 읽기
    const editParam = searchParams.get('edit');
    if (editParam) {
      try {
        const editData = JSON.parse(decodeURIComponent(editParam));
        setInitialConfig(editData);
      } catch (error) {
        console.error('편집 데이터 파싱 오류:', error);
      }
    }
  }, [searchParams]);

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (!user || user.type !== 'teacher') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-purple-100">
      <Header user={user} onHomeClick={() => router.push('/dashboard/teacher')} />
      <TestSetup
        initialConfig={initialConfig}
        onNext={(config) => {
          // 테스트 생성 페이지로 이동하면서 설정 데이터 전달
          router.push(`/dashboard/teacher/test-creation?config=${encodeURIComponent(JSON.stringify(config))}`);
        }}
        onBack={() => router.push('/dashboard/teacher')}
      />
    </div>
  );
} 