'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/apiService';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import ErrorMessage from '../../ui/ErrorMessage';
import LoadingSpinner from '../../ui/LoadingSpinner';

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await userService.login(formData);
      console.log('로그인 성공:', response);
      
      // 사용자 정보 설정
      const userData = {
        id: response.id,
        email: response.email,
        name: response.name,
        type: response.userType === 'TEACHER' ? 'teacher' : 'student',
        userType: response.userType
      };
      
      login(userData);
      
      // 사용자 타입에 따라 적절한 대시보드로 이동
      if (response.userType === 'TEACHER') {
        router.push('/dashboard/teacher');
      } else {
        router.push('/dashboard/student');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      setError(error.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            로그인 🎓
          </h1>
          <p className="text-gray-600">
            AI 교육 플랫폼에 오신 것을 환영합니다!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              이메일 📧
            </label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호 🔒
            </label>
            <Input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <ErrorMessage message={error} />}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105"
          >
            {loading ? (
              <LoadingSpinner message="로그인 중..." />
            ) : (
              '로그인 🚀'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            계정이 없으신가요?{' '}
            <button
              onClick={() => router.push('/register')}
              className="text-purple-600 hover:text-purple-700 font-medium underline"
            >
              회원가입
            </button>
          </p>
        </div>
      </div>
    </div>
  );
} 