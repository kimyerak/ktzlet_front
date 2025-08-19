'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function Header({ user, onLogout, onHomeClick }) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleHomeClick = () => {
    if (onHomeClick) {
      // onHomeClick prop이 있으면 그것을 사용
      onHomeClick();
    } else {
      // 기본적으로 사용자 타입에 따라 적절한 대시보드로 이동
      if (user && user.type === 'teacher') {
        router.push('/dashboard/teacher');
      } else if (user && user.type === 'student') {
        router.push('/dashboard/student');
      } else {
        router.push('/');
      }
    }
  };

  const handleLogout = () => {
    logout();
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-purple-200">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <h1 
            className="text-2xl font-bold text-gray-800 cursor-pointer hover:text-purple-600 transition-colors"
            onClick={handleHomeClick}
          >
            AI 교육 플랫폼 💝
          </h1>
          {user && (
            <p className="text-gray-700">
              안녕하세요, {user.name}님! 
              {user.type === 'teacher' ? ' 👩‍🏫' : ' 👨‍🎓'}
            </p>
          )}
        </div>
        {user && (
          <button
            onClick={handleLogout}
            className="bg-red-400 hover:bg-red-500 text-white px-6 py-2 rounded-full font-medium transition-colors"
          >
            🚪 로그아웃
          </button>
        )}
      </div>
    </header>
  );
} 