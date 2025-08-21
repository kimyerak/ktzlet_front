'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AutoQuizGenerator from '../../../pages/teacher/AutoQuizGenerator';

export default function AutoQuizGeneratorPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 사용자 정보 로드
    const userInfo = localStorage.getItem('user');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
  }, []);

  const handleBack = () => {
    router.push('/dashboard/teacher');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ 사용자 정보를 찾을 수 없습니다</div>
          <button 
            onClick={handleBack}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl transition-colors"
          >
            ← 뒤로가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <AutoQuizGenerator 
      user={user}
      onBack={handleBack}
    />
  );
} 