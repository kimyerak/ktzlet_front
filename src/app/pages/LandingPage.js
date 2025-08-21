'use client';

import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  if (showLogin) {
    return <LoginForm onBack={() => setShowLogin(false)} />;
  }

  if (showRegister) {
    return <RegisterForm onBack={() => setShowRegister(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* 메인 타이틀 */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            KT AI 교육 플랫폼 'KTzlet' 💝
          </h1>
          <div className="text-2xl mb-2">🌟✨🎓✨🌟</div>
        </div>

        {/* 소개 멘트 */}
        <Card className="mb-8">
          <p className="text-lg text-gray-800 leading-relaxed">
            KT의 AI 기술을 활용해 학생 개개인의 학습 수준과 스타일에 맞춘 맞춤형 교육법을 제공하는 플랫폼으로서,
            교사와 학생 간의 원활한 소통을 지원하여 공교육 수업 시나리오를 100% 충족시키는 서비스입니다.
          </p>
          <div className="text-3xl mt-4">💖</div>
        </Card>

        {/* 버튼들 */}
        <div className="space-y-4">
          <Button
            onClick={() => setShowLogin(true)}
            variant="primary"
            size="lg"
            className="w-full max-w-md mx-auto block"
          >
            🔑 로그인하기
          </Button>
          
          <Button
            onClick={() => setShowRegister(true)}
            variant="secondary"
            size="lg"
            className="w-full max-w-md mx-auto block"
          >
            ✨ 회원가입하기
          </Button>
        </div>

        {/* 하단 장식 */}
        <div className="mt-12 text-4xl">
          🎈🎪🎨🎭🎸🎯
        </div>
      </div>
    </div>
  );
} 