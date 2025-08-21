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
  useEffect(() => {
    const loadQuizzes = async () => {
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
    
    loadQuizzes();
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

  // 테스트 삭제
  const deleteTest = (testId) => {
    if (confirm('정말 이 테스트를 삭제하시겠습니까?')) {
      const updatedTests = createdTests.filter(test => test.id !== testId);
      setCreatedTests(updatedTests);
      localStorage.setItem('createdTests', JSON.stringify(updatedTests));
      
      // 학생용 테스트 목록에서도 제거
      const availableTests = JSON.parse(localStorage.getItem('availableTests') || '[]');
      const updatedAvailable = availableTests.filter(test => test.id !== testId);
      localStorage.setItem('availableTests', JSON.stringify(updatedAvailable));
    }
  };

  // 편집 시작
  const startEdit = async (test) => {
    try {
      // 퀴즈 상세 정보 가져오기 (questions 포함)
      const quizDetail = await quizService.getQuizById(test.id);
      
      const questions = quizDetail.questions || [];
      console.log(`퀴즈 ${test.id}의 문제 수: ${questions.length}`);
      
      // 프론트엔드 형식으로 변환
    const configData = {
        id: quizDetail.id,
        title: quizDetail.title,
        numofquestion: quizDetail.numOfQuestions,
        time_limit_sec: quizDetail.timeLimitSec,
        open_at: quizDetail.openAt,
        close_at: quizDetail.closeAt,
        target_score: quizDetail.targetScore,
        questions: questions.map(q => {
          // 백엔드 타입을 프론트엔드 타입으로 매핑
          let frontendType;
          switch (q.type) {
            case 'DICTATION':
              frontendType = 'dictation';
              break;
            case 'OX':
              frontendType = 'ox';
              break;
            case 'MULTIPLE':
              frontendType = 'multiple';
              break;
            default:
              frontendType = 'dictation';
          }
          
          return {
            id: q.id,
            type: frontendType,
            question: q.stem,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || '',
            points: q.points
          };
        })
      };
      
    router.push(`/dashboard/teacher/test-setup?edit=${encodeURIComponent(JSON.stringify(configData))}`);
    } catch (error) {
      console.error('퀴즈 정보 로드 오류:', error);
      alert('퀴즈 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const menuItems = [
    {
      title: '전체 통계 보기',
      description: '학생들의 학습 현황과 성과를 한눈에 확인해보세요',
      icon: '📊',
      color: 'from-blue-400 to-indigo-500',
      onClick: () => router.push('/dashboard/teacher/statistics')
    },
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
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12">
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
                      ✏️ 보기/수정
                    </button>
                    <button
                      onClick={() => deleteTest(test.id)}
                      className="bg-red-400 hover:bg-red-500 text-white px-4 py-2 rounded-xl transition-colors"
                    >
                      🗑️ 삭제
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