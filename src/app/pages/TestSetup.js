'use client';

import { useState, useEffect } from 'react';

export default function TestSetup({ onNext, onBack, initialConfig }) {
  const [testConfig, setTestConfig] = useState(() => ({
    title: '',
    numofquestion: 10,
    open_at: '',
    close_at: '',
    time_limit_sec: 3600, // 60분을 초 단위로
    target_score: 70,
    ...initialConfig,
    open_at: initialConfig?.open_at || '',
    close_at: initialConfig?.close_at || ''
  }));

  useEffect(() => {
    if (initialConfig) {
      setTestConfig(prev => ({
        ...prev,
        ...initialConfig,
        open_at: initialConfig.open_at || '',
        close_at: initialConfig.close_at || ''
      }));
    }
  }, [initialConfig]);

  const [errors, setErrors] = useState({});



  const handleChange = (field, value) => {
    setTestConfig(prev => ({
      ...prev,
      [field]: value
    }));
    // 에러 제거
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handlePeriodChange = (type, value) => {
    setTestConfig(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!testConfig.title.trim()) {
      newErrors.title = '테스트 제목을 입력해주세요';
    }
    if (!testConfig.open_at) {
      newErrors.startDate = '응시 시작일을 선택해주세요';
    }
    if (!testConfig.close_at) {
      newErrors.endDate = '응시 마감일을 선택해주세요';
    }
    if (testConfig.open_at && testConfig.close_at) {
      if (new Date(testConfig.open_at) >= new Date(testConfig.close_at)) {
        newErrors.endDate = '마감일은 시작일보다 늦어야 합니다';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      // 새 테스트 생성 시에는 id를 제거
      const configToSend = { ...testConfig };
      if (!initialConfig?.id) {
        delete configToSend.id;
      }
      onNext(configToSend);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-purple-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📝 테스트 {initialConfig?.id ? '수정하기' : '제작하기'}
          </h1>
          <p className="text-xl text-gray-700">
            1단계: 테스트 기본 설정을 해주세요 ✨
          </p>
          {initialConfig?.id && (
            <div className="mt-3 inline-block bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full border border-yellow-300">
              편집 모드
            </div>
          )}
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-blue-200">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* 좌측 컬럼 */}
            <div className="space-y-6">
              {/* 테스트 제목 */}
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  📝 테스트 제목
                </label>
                <input
                  type="text"
                  value={testConfig.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="예: Chapter 1 Vocab Test"
                  className={`w-full px-4 py-3 rounded-2xl border-2 outline-none transition-all text-gray-800 ${
                    errors.title ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">❌ {errors.title}</p>
                )}
              </div>

              {/* 문제 수 */}
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  📊 문제 수
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="2"
                    max="50"
                    value={testConfig.numofquestion}
                    onChange={(e) => handleChange('numofquestion', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-full font-bold min-w-[60px] text-center">
                    {testConfig.numofquestion}문제
                  </div>
                </div>
              </div>



              {/* 제한 시간 */}
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  ⏰ 제한 시간
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="600"
                    max="10800"
                    step="300"
                    value={testConfig.time_limit_sec}
                    onChange={(e) => handleChange('time_limit_sec', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold min-w-[80px] text-center">
                    {Math.floor(testConfig.time_limit_sec / 60)}분
                  </div>
                </div>
              </div>
            </div>

            {/* 우측 컬럼 */}
            <div className="space-y-6">
              {/* 응시 기간 */}
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  📅 응시 기간
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">시작일</label>
                    <input
                      type="datetime-local"
                      value={testConfig.open_at}
                      onChange={(e) => handlePeriodChange('open_at', e.target.value)}
                      className={`w-full px-4 py-3 rounded-2xl border-2 outline-none transition-all text-gray-800 ${
                        errors.startDate ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                      }`}
                    />
                    {errors.startDate && (
                      <p className="text-red-500 text-sm mt-1">❌ {errors.startDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">마감일</label>
                    <input
                      type="datetime-local"
                      value={testConfig.close_at}
                      onChange={(e) => handlePeriodChange('close_at', e.target.value)}
                      className={`w-full px-4 py-3 rounded-2xl border-2 outline-none transition-all text-gray-800 ${
                        errors.endDate ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                      }`}
                    />
                    {errors.endDate && (
                      <p className="text-red-500 text-sm mt-1">❌ {errors.endDate}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 합격 점수 */}
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  🎯 합격 점수
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="30"
                    max="100"
                    step="5"
                    value={testConfig.target_score}
                    onChange={(e) => handleChange('target_score', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="bg-yellow-500 text-white px-4 py-2 rounded-full font-bold min-w-[70px] text-center">
                    {testConfig.target_score}점
                  </div>
                </div>
              </div>


            </div>
          </div>

          {/* 버튼들 */}
          <div className="flex justify-between mt-12">
            <button
              onClick={onBack}
              className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-2xl transition-colors"
            >
              ← 돌아가기
            </button>
            
            <button
              onClick={handleNext}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-8 rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              다음 단계 → 문제 작성하기 📝
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 