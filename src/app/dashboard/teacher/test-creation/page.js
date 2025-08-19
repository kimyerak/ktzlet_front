'use client';

import { useAuth } from '../../../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import TestCreation from '../../../pages/TestCreation';
import Header from '../../../ui/Header';

export default function TestCreationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [testConfig, setTestConfig] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (!loading && user && user.type !== 'teacher') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // URL 파라미터에서 설정 데이터 읽기
    const configParam = searchParams.get('config');
    if (configParam) {
      try {
        const config = JSON.parse(decodeURIComponent(configParam));
        setTestConfig(config);
      } catch (error) {
        console.error('설정 데이터 파싱 오류:', error);
        // 기본값으로 설정
        setTestConfig({
          title: '새 테스트',
          numofquestion: 2,
          time_limit_sec: 3600,
          open_at: '',
          close_at: '',
          target_score: 70
        });
      }
    }
  }, [searchParams]);

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (!user || user.type !== 'teacher') {
    return null;
  }

  const handleSubmit = (testData) => {
    const createdTests = JSON.parse(localStorage.getItem('createdTests') || '[]');
    const availableTests = JSON.parse(localStorage.getItem('availableTests') || '[]');

    if (testData.id) {
      // 편집 모드: 기존 테스트 업데이트
      const updatedCreatedTests = createdTests.map(test => 
        test.id === testData.id ? { ...test, ...testData } : test
      );
      localStorage.setItem('createdTests', JSON.stringify(updatedCreatedTests));

              const updatedAvailableTests = availableTests.map(test => 
          test.id === testData.id ? { 
            ...test, 
            ...testData,
            subject: testData.title || '영어',
            open_at: testData.open_at || '',
            close_at: testData.close_at || ''
          } : test
        );
      localStorage.setItem('availableTests', JSON.stringify(updatedAvailableTests));

      console.log('Test updated:', testData);
      alert('테스트가 성공적으로 수정되었습니다!');
    } else {
      // 새로 생성 모드
      const newTest = {
        ...testData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        createdBy: user.id || 'teacher'
      };
      createdTests.push(newTest);
      localStorage.setItem('createdTests', JSON.stringify(createdTests));

      const studentTest = {
        ...testData,
        id: newTest.id,
        createdAt: newTest.createdAt,
        createdBy: newTest.createdBy,
        subject: testData.title || '영어',
        open_at: testData.open_at || '',
        close_at: testData.close_at || '',
        autoRetake: false
      };
      availableTests.push(studentTest);
      localStorage.setItem('availableTests', JSON.stringify(availableTests));

      console.log('Test saved:', newTest);
      alert('테스트가 성공적으로 생성되었습니다!');
    }
    
    router.push('/dashboard/teacher');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100">
      <Header user={user} onHomeClick={() => router.push('/dashboard/teacher')} />
      <TestCreation
        testConfig={testConfig}
        onBack={() => router.push('/dashboard/teacher/test-setup')}
        onSubmit={handleSubmit}
        user={user}
      />
    </div>
  );
} 