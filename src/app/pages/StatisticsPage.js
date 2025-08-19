'use client';

import { useState, useEffect } from 'react';
import Card from '../ui/Card';

export default function StatisticsPage({ user, onBack }) {
  const [activeTab, setActiveTab] = useState('wrong-answers');
  const [createdTests, setCreatedTests] = useState([]);

  useEffect(() => {
    // 로컬 스토리지에서 테스트 목록 불러오기
    const savedTests = localStorage.getItem('createdTests');
    if (savedTests) {
      setCreatedTests(JSON.parse(savedTests));
    }
  }, []);

  // 샘플 데이터 (실제로는 API에서 가져올 데이터)
  const wrongAnswerData = [
    { word: 'algorithm', wrongCount: 45, correctCount: 12 },
    { word: 'recursion', wrongCount: 38, correctCount: 8 },
    { word: 'polymorphism', wrongCount: 32, correctCount: 15 },
    { word: 'inheritance', wrongCount: 28, correctCount: 22 },
    { word: 'encapsulation', wrongCount: 25, correctCount: 18 },
    { word: 'abstraction', wrongCount: 22, correctCount: 20 },
    { word: 'interface', wrongCount: 20, correctCount: 25 },
    { word: 'overloading', wrongCount: 18, correctCount: 28 },
    { word: 'overriding', wrongCount: 15, correctCount: 30 },
    { word: 'constructor', wrongCount: 12, correctCount: 35 }
  ];

  const questionTypeData = [
    { type: '객관식', correctRate: 75, responseRate: 92 },
    { type: '주관식', correctRate: 68, responseRate: 88 },
    { type: 'OX', correctRate: 62, responseRate: 85 }
  ];

  // 엔티티 기반 테스트 데이터 생성
  const testAnalysisData = createdTests.map(test => {
    const testTitle = `Chapter ${Math.floor(Math.random() * 10) + 1} Vocab Test`;
    return {
      ...test,
      title: testTitle,
      averageScore: Math.floor(Math.random() * 30) + 60, // 60-90점 랜덤
      participationRate: Math.floor(Math.random() * 20) + 80, // 80-100% 랜덤
      totalStudents: Math.floor(Math.random() * 20) + 10, // 10-30명 랜덤
      questionTypes: {
        객관식: Math.floor(Math.random() * 5) + 3, // 3-7문제
        주관식: Math.floor(Math.random() * 3) + 1, // 1-3문제
        OX: Math.floor(Math.random() * 2) + 1 // 1-2문제
      }
    };
  });

  const tabs = [
    { id: 'wrong-answers', label: '오답분석', icon: '❌' },
    { id: 'question-types', label: '문제유형별 분석', icon: '📊' },
    { id: 'test-analysis', label: '테스트별 분석', icon: '📈' }
  ];

  const renderWrongAnswerAnalysis = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">오답률 TOP 10 단어</h3>
        <p className="text-gray-600">학생들이 가장 많이 틀린 단어들을 확인해보세요</p>
      </div>
      
      <div className="grid gap-4">
        {wrongAnswerData.map((item, index) => {
          const total = item.wrongCount + item.correctCount;
          const wrongRate = Math.round((item.wrongCount / total) * 100);
          
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl font-bold text-red-500">#{index + 1}</span>
                  <span className="text-xl font-semibold text-gray-800">{item.word}</span>
                </div>
                <span className="text-lg font-bold text-red-500">{wrongRate}%</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>오답: {item.wrongCount}회</span>
                  <span>정답: {item.correctCount}회</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-red-400 to-red-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${wrongRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderQuestionTypeAnalysis = () => (
    <div className="space-y-6">
              <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">문제유형별 정답률/응답률</h3>
          <p className="text-gray-600">영어 테스트의 객관식, 주관식, OX 문제별 성과를 원형 차트로 확인해보세요</p>
        </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {questionTypeData.map((item, index) => {
          const correctAngle = (item.correctRate / 100) * 360;
          const responseAngle = (item.responseRate / 100) * 360;
          
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-md">
              <h4 className="text-lg font-bold text-gray-800 text-center mb-4">{item.type}</h4>
              
              <div className="flex justify-center mb-4">
                <div className="relative w-32 h-32">
                  {/* 정답률 원형 차트 */}
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="8"
                      strokeDasharray={`${(item.correctRate / 100) * 251.2} 251.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  
                  {/* 응답률 원형 차트 */}
                  <svg className="w-32 h-32 transform -rotate-90 absolute top-0 left-0" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="30"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="30"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="6"
                      strokeDasharray={`${(item.responseRate / 100) * 188.4} 188.4`}
                      strokeLinecap="round"
                    />
                  </svg>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{item.correctRate}%</div>
                      <div className="text-xs text-gray-600">정답률</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-center">
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-semibold">정답률: {item.correctRate}%</span>
                  <span className="text-blue-600 font-semibold">응답률: {item.responseRate}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderTestAnalysis = () => (
    <div className="space-y-6">
              <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">테스트별 분석</h3>
          <p className="text-gray-600">영어 단어 테스트들의 평균점수와 응시율을 확인해보세요</p>
        </div>
      
      {testAnalysisData.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">아직 생성된 영어 테스트가 없습니다</h3>
          <p className="text-gray-600">영어 단어 테스트를 생성하면 여기서 통계를 확인할 수 있어요!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {testAnalysisData.map((test, index) => (
            <div key={test.id || index} className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-gray-800">{test.title || `${test.subject} 테스트`}</h4>
                <span className="text-sm text-gray-500">
                  {new Date(test.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{test.averageScore}점</div>
                  <div className="text-sm text-gray-600">평균점수</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{test.participationRate}%</div>
                  <div className="text-sm text-gray-600">응시율</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{test.totalStudents}명</div>
                  <div className="text-sm text-gray-600">응시자수</div>
                </div>
              </div>
              
              {/* 문제 유형별 세부 정보 */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-semibold text-gray-800 mb-2">📝 문제 구성</h5>
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    객관식 {test.questionTypes?.객관식 || 0}문제
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    주관식 {test.questionTypes?.주관식 || 0}문제
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    OX {test.questionTypes?.OX || 0}문제
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>평균점수</span>
                    <span>{test.averageScore}점</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                      style={{ width: `${test.averageScore}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>응시율</span>
                    <span>{test.participationRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                      style={{ width: `${test.participationRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="pt-8 px-4 max-w-6xl mx-auto">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          📊 전체 통계 보기
        </h1>
        <p className="text-xl text-gray-700">
          학생들의 학습 현황을 한눈에 파악해보세요
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-xl p-2 shadow-md">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-200">
        {activeTab === 'wrong-answers' && renderWrongAnswerAnalysis()}
        {activeTab === 'question-types' && renderQuestionTypeAnalysis()}
        {activeTab === 'test-analysis' && renderTestAnalysis()}
      </div>

      {/* 뒤로가기 버튼 */}
      <div className="text-center mt-8">
        <button
          onClick={onBack}
          className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold py-3 px-8 rounded-xl hover:shadow-lg transition-all duration-200"
        >
          ← 교사 대시보드로 돌아가기
        </button>
      </div>
    </div>
  );
} 