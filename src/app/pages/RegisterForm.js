'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import UserTypeSelector from '../ui/UserTypeSelector';

export default function RegisterForm({ onBack }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    type: ''
  });
  const [error, setError] = useState('');
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

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

    // 사용자 등록
    const userData = {
      id: Date.now(),
      name: formData.name,
      email: formData.email,
      type: formData.type
    };
    register(userData);
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

            <ErrorMessage message={error} />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
            >
              🎊 가입완료!
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