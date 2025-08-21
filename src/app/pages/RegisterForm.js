'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import UserTypeSelector from '../ui/UserTypeSelector';
import { userService } from '../services/apiService';

export default function RegisterForm({ onBack }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    type: '',
    level: '초급' // 학생의 경우 사용될 레벨
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTypeChange = (type) => {
    setFormData({
      ...formData,
      type
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 유효성 검사
      if (!formData.name || !formData.email || !formData.password || !formData.type) {
        setError('모든 필드를 입력해주세요!');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('비밀번호가 일치하지 않습니다!');
        return;
      }

      if (formData.password.length < 4) {
        setError('비밀번호는 4자 이상 입력해주세요!');
        return;
      }

      // 백엔드 API를 통한 사용자 등록
      const userData = {
        userInfo: {
          email: formData.email,
          password: formData.password,
          name: formData.name
        },
        userType: formData.type.toUpperCase() // student -> STUDENT, teacher -> TEACHER
      };
      
      // 학생인 경우 level 추가
      if (formData.type === 'student') {
        userData.level = formData.level;
      }
      
      const newUser = await userService.register(userData);
      
      // 로컬 상태에 등록
      const localUserData = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        type: newUser.userType.toLowerCase()
      };
      register(localUserData);
    } catch (error) {
      console.error('회원가입 오류:', error);
      setError('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-50 to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card variant="glass" className="border-pink-200">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              ✨ 회원가입
            </h2>
            <p className="text-gray-700">새로운 시작을 환영해요! 🎉</p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="이름을 입력하세요"
              label="👤 이름"
            />

            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              label="📧 이메일"
            />

            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              label="🔒 비밀번호"
            />

            <Input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="비밀번호를 다시 입력하세요"
              label="🔒 비밀번호 확인"
            />

            <UserTypeSelector
              selectedType={formData.type}
              onTypeChange={handleTypeChange}
            />

            {/* 학생인 경우 레벨 선택 */}
            {formData.type === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  📚 영어 레벨
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800"
                >
                  <option value="초급">초급</option>
                  <option value="중급">중급</option>
                  <option value="고급">고급</option>
                </select>
              </div>
            )}

            <ErrorMessage message={error} />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '🔄 가입 중...' : '🎊 가입완료!'}
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