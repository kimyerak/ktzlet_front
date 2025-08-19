'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';

export default function LoginForm({ onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // 간단한 데모용 로그인 (실제로는 서버 인증 필요)
    if (email && password) {
      // 이메일로 사용자 타입 구분 (데모용)
      const userType = email.includes('teacher') ? 'teacher' : 'student';
      const userData = {
        id: Date.now(),
        email,
        name: email.split('@')[0],
        type: userType
      };
      login(userData);
    } else {
      setError('이메일과 비밀번호를 입력해주세요!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card variant="glass" className="border-blue-200">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              🔑 로그인
            </h2>
            <p className="text-gray-700">반가워요! 다시 만나서 기뻐요 😊</p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              label="📧 이메일"
            />
            <p className="text-xs text-gray-700 mt-1">
              💡 팁: teacher@로 시작하면 교사로, 그 외는 학생으로 로그인됩니다
            </p>

            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              label="🔒 비밀번호"
            />

            <ErrorMessage message={error} />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
            >
              🚀 로그인하기
            </Button>
          </form>

          {/* 하단 */}
          <div className="mt-6 text-center">
            <button
              onClick={onBack}
              className="text-gray-700 hover:text-gray-800 transition-colors"
            >
              ← 돌아가기
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
} 