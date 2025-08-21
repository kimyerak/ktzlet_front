'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TestSetup from './TestSetup';
import TestCreation from './TestCreation';
import StudentManagement from './StudentManagement';
import { quizService } from '../../services/apiService';

export default function TeacherDashboard({ user }) {
  const router = useRouter();
  const [currentView, setCurrentView] = useState('dashboard');
  const [testConfig, setTestConfig] = useState(null);
  const [createdTests, setCreatedTests] = useState([]);
  const [mode, setMode] = useState('create'); // 'create' | 'edit'
  const [editingTestId, setEditingTestId] = useState(null);

  // 백엔드에서 퀴즈 목록 불러오기
  const loadCreatedTests = async () => {
    try {
      if (user?.id) {
        const quizzes = await quizService.getQuizzesByTeacher(user.id);
        setCreatedTests(quizzes);
      }
    } catch (error) {
      console.error('퀴즈 목록 로드 오류:', error);
      // 백엔드 연결 실패 시 로컬 스토리지에서 불러오기
      const savedTests = localStorage.getItem('createdTests');
      if (savedTests) {
        setCreatedTests(JSON.parse(savedTests));
      }
    }
  };

  useEffect(() => {
    loadCreatedTests();
  }, [user?.id]);

  // 테스트 저장 (생성/수정 공용)
  const saveTest = (testData) => {
    if (mode === 'edit' && editingTestId) {
      const updated = createdTests.map(t => 
        t.id === editingTestId ? { ...testData, id: editingTestId, createdAt: t.createdAt } : t
      );
      setCreatedTests(updated);
      localStorage.setItem('createdTests', JSON.stringify(updated));

      // 학생용 목록 업데이트
      const availableTests = JSON.parse(localStorage.getItem('availableTests') || '[]');
      const updatedAvailable = availableTests.map(t => 
        t.id === editingTestId ? { ...testData, id: editingTestId, createdAt: t.createdAt } : t
      );
      localStorage.setItem('availableTests', JSON.stringify(updatedAvailable));

      alert('✅ 테스트가 수정되었습니다!');
    } else {
      const updatedTests = [...createdTests, testData];
      setCreatedTests(updatedTests);
      localStorage.setItem('createdTests', JSON.stringify(updatedTests));
      
      // 학생용 테스트 목록에도 저장
      const availableTests = JSON.parse(localStorage.getItem('availableTests') || '[]');
      availableTests.push(testData);
      localStorage.setItem('availableTests', JSON.stringify(availableTests));
      
      alert('🎉 테스트가 성공적으로 생성되었습니다!');
    }

    // 공통 초기화
    setCurrentView('dashboard');
    setTestConfig(null);
    setMode('create');
    setEditingTestId(null);
  };

  // 삭제 중인 퀴즈 ID들을 추적
  const [deletingQuizIds, setDeletingQuizIds] = useState(new Set());

  // 테스트 삭제
  const deleteTest = async (testId) => {
    // 이미 삭제 중인지 확인
    if (deletingQuizIds.has(testId)) {
      console.log('이미 삭제 중인 퀴즈입니다:', testId);
      return;
    }

    if (confirm('정말 이 테스트를 삭제하시겠습니까?')) {
      try {
        // 삭제 중 상태로 설정
        setDeletingQuizIds(prev => new Set(prev).add(testId));
        
        console.log('퀴즈 삭제 시작:', testId);
        console.log('삭제할 퀴즈 ID 타입:', typeof testId);
        console.log('삭제할 퀴즈 ID 값:', testId);
        
        // 백엔드 API 호출
        console.log('삭제 API 호출 전:', {
          testId: testId,
          endpoint: `/api/quizzes/${testId}`,
          method: 'DELETE'
        });
        
        let result;
        try {
          result = await quizService.deleteQuiz(testId);
          console.log('퀴즈 삭제 API 응답:', result);
          console.log('퀴즈 삭제 완료:', testId);
        } catch (apiError) {
          console.error('API 호출 자체에서 오류:', {
            apiError: apiError,
            apiErrorMessage: apiError.message,
            apiErrorStack: apiError.stack
          });
          throw apiError;
        }
        
        // 로컬 상태 업데이트
        const updatedTests = createdTests.filter(test => test.id !== testId);
        setCreatedTests(updatedTests);
        localStorage.setItem('createdTests', JSON.stringify(updatedTests));
        
        // 학생용 테스트 목록에서도 제거
        const availableTests = JSON.parse(localStorage.getItem('availableTests') || '[]');
        const updatedAvailable = availableTests.filter(test => test.id !== testId);
        localStorage.setItem('availableTests', JSON.stringify(updatedAvailable));
        
        // 성공 메시지
        alert('퀴즈가 성공적으로 삭제되었습니다.');
        
        // 목록 새로고침
        loadCreatedTests();
        
      } catch (error) {
        console.error('퀴즈 삭제 오류 상세:', {
          message: error.message,
          stack: error.stack,
          testId: testId,
          testIdType: typeof testId,
          errorObject: error,
          errorType: error.constructor.name,
          errorKeys: Object.keys(error),
          errorString: error.toString()
        });
        
        let errorMessage = '퀴즈 삭제에 실패했습니다.';
        
        if (error.message.includes('OptimisticLockingFailureException') || 
            error.message.includes('Row was updated or deleted by another transaction')) {
          errorMessage = '퀴즈가 이미 삭제되었거나 다른 사용자에 의해 수정되었습니다.';
        } else if (error.message.includes('백엔드 서버가 시작되지 않았습니다')) {
          errorMessage = '백엔드 서버가 시작되지 않았습니다. 서버를 확인해주세요.';
        } else if (error.message.includes('404')) {
          errorMessage = '삭제할 퀴즈를 찾을 수 없습니다.';
        } else if (error.message.includes('403')) {
          errorMessage = '삭제 권한이 없습니다.';
        } else if (error.message.includes('500')) {
          errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }
        
        alert(errorMessage);
      } finally {
        // 삭제 중 상태 해제
        setDeletingQuizIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(testId);
          return newSet;
        });
      }
    }
  };

  // 보기 시작
  const startEdit = async (test) => {
    try {
      // 보기 전용 페이지로 이동
      router.push(`/dashboard/teacher/test-view?id=${test.id}`);
    } catch (error) {
      console.error('퀴즈 정보 로드 오류:', error);
      alert('퀴즈 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const menuItems = [
    {
      title: '단어 관리',
      description: '테스트에 사용할 영단어를 등록하고 관리하세요',
      icon: '📚',
      color: 'from-amber-400 to-orange-500',
      onClick: () => router.push('/dashboard/teacher/vocab')
    },
    {
      title: '테스트 제작',
      description: '새로운 테스트를 만들어 학생들에게 제공해보세요',
      icon: '📝',
      color: 'from-green-400 to-emerald-500',
      onClick: () => router.push('/dashboard/teacher/test-setup')
    },
    {
      title: 'AI 자동 생성',
      description: 'AI가 자동으로 단어와 문제를 생성해드립니다',
      icon: '🤖',
      color: 'from-indigo-400 to-purple-500',
      onClick: () => router.push('/dashboard/teacher/auto-quiz-generator')
    },
    {
      title: '학생 목록',
      description: '담당 학생들의 정보와 학습 진도를 관리하세요',
      icon: '👥',
      color: 'from-purple-400 to-pink-500',
      onClick: () => router.push('/dashboard/teacher/students')
    }
  ];

  return (
    <div className="pt-8">
      {/* 환영 메시지 */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          교사 대시보드 👩‍🏫
        </h2>
        <p className="text-xl text-gray-700">
          학생들의 학습을 도와주는 멋진 선생님! 오늘도 화이팅이에요 ✨
        </p>
        <div className="text-3xl mt-4">🌟📚🎓🌟</div>
      </div>

      {/* 메뉴 카드들 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12 justify-items-center">
        {menuItems.map((item, index) => (
          <div
            key={index}
            onClick={item.onClick}
            className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-200 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer group"
          >
            {/* 아이콘 */}
            <div className="text-6xl text-center mb-6 group-hover:scale-110 transition-transform duration-300">
              {item.icon}
            </div>

            {/* 제목 */}
            <h3 className="text-2xl font-bold text-gray-800 text-center mb-4">
              {item.title}
            </h3>

            {/* 설명 */}
            <p className="text-gray-700 text-center mb-6 leading-relaxed">
              {item.description}
            </p>

            {/* 버튼 */}
            <button className={`w-full bg-gradient-to-r ${item.color} text-white font-bold py-4 px-6 rounded-2xl hover:shadow-lg transition-all duration-200`}>
              시작하기 🚀
            </button>
          </div>
        ))}
      </div>

      {/* 생성된 테스트 목록 */}
      {createdTests.length > 0 && (
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            📋 생성된 테스트 목록
          </h3>
          <div className="space-y-4">
            {createdTests.map((test) => (
              <div
                key={test.id}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <button
                      onClick={() => startEdit(test)}
                      className="text-left"
                    >
                      <h4 className="text-xl font-bold text-gray-800 mb-2 hover:underline">
                        {test.title || test.subject || '새 테스트'}
                      </h4>
                    </button>
                    <div className="flex items-center space-x-4 text-sm text-gray-700">
                      <span>📊 {test.numOfQuestions || test.numofquestion || test.questionCount || 0}문제</span>
                      <span>⏰ {Math.floor((test.timeLimitSec || test.time_limit_sec || test.timeLimit * 60 || 0) / 60)}분</span>
                      <span>🎯 합격점수 {test.targetScore || test.target_score || test.passingScore || 0}점</span>
                      <span>📅 {new Date(test.createdAt || test.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEdit(test)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition-colors"
                    >
                      👁️ 보기
                    </button>
                    <button
                      onClick={() => deleteTest(test.id)}
                      disabled={deletingQuizIds.has(test.id)}
                      className={`px-4 py-2 rounded-xl transition-colors ${
                        deletingQuizIds.has(test.id)
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-red-400 hover:bg-red-500 text-white'
                      }`}
                    >
                      {deletingQuizIds.has(test.id) ? '삭제 중...' : '🗑️ 삭제'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 하단 메시지 */}
      <div className="text-center mt-16">
        <p className="text-lg text-gray-700 mb-4">
          더 많은 기능들이 곧 추가될 예정이에요! 💫
        </p>
        <div className="text-2xl">
          🎪🎨🎭🎸🎯🎲
        </div>
      </div>
    </div>
  );
} 