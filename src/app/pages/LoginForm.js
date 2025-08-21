'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import { userService } from '../services/apiService';

export default function LoginForm({ onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (email && password) {
        // 백엔드에 로그인 API가 없으므로 기존 방식 사용
        // 이메일로 사용자 조회
        const user = await userService.getUserByEmail(email);
        
        if (user) {
          // 실제로는 비밀번호 검증도 필요하지만 일단 패스
          const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            type: user.userType.toLowerCase() // STUDENT -> student, TEACHER -> teacher
          };
          login(userData);
        } else {
          setError('등록되지 않은 이메일입니다.');
        }
      } else {
        setError('이메일과 비밀번호를 입력해주세요!');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      if (error.message && error.message.includes('찾을 수 없습니다')) {
        setError('등록되지 않은 이메일입니다.');
      } else {
        setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
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
              disabled={isLoading}
            >
              {isLoading ? '🔄 로그인 중...' : '🚀 로그인하기'}
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