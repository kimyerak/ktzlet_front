'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TestTaking from './TestTaking';

export default function StudentDashboard({ user }) {
  const router = useRouter();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedTest, setSelectedTest] = useState(null);
  const [availableTests, setAvailableTests] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);

  // 로컬 스토리지에서 테스트 목록과 완료된 테스트 불러오기
  useEffect(() => {
    const available = JSON.parse(localStorage.getItem('availableTests') || '[]');
    const completed = JSON.parse(localStorage.getItem('completedTests') || '[]');
    setAvailableTests(available);
    setCompletedTests(completed);
  }, []);

  // 테스트 제출 처리
  const handleTestSubmit = (submissionData) => {
    const updatedCompleted = [...completedTests, submissionData];
    setCompletedTests(updatedCompleted);
    localStorage.setItem('completedTests', JSON.stringify(updatedCompleted));
    
    alert('🎉 테스트가 성공적으로 제출되었습니다!');
    setCurrentView('dashboard');
    setSelectedTest(null);
  };

  // 테스트 시작
  const startTest = (test) => {
    // 이미 응시한 테스트인지 확인
    const alreadyTaken = completedTests.find(ct => ct.testId === test.id);
    if (alreadyTaken && !test.autoRetake) {
      alert('이미 응시한 테스트입니다!');
      return;
    }

    // 응시 기간 확인
    const now = new Date();
    const startDate = new Date(test.examPeriod.start);
    const endDate = new Date(test.examPeriod.end);

    if (now < startDate) {
      alert('아직 응시 기간이 아닙니다!');
      return;
    }

    if (now > endDate) {
      alert('응시 기간이 종료되었습니다!');
      return;
    }

    if (confirm(`${test.title || test.subject || '새 테스트'} 테스트를 시작하시겠습니까?\n\n⏰ 제한시간: ${Math.floor((test.time_limit_sec || test.timeLimit * 60) / 60)}분\n📊 문제수: ${test.numofquestion || test.questionCount}개\n🎯 합격점수: ${test.target_score || test.passingScore}점`)) {
      setSelectedTest(test);
      setCurrentView('test-taking');
    }
  };

  if (currentView === 'test-taking' && selectedTest) {
    return (
      <TestTaking
        testData={selectedTest}
        onSubmit={handleTestSubmit}
        onBack={() => {
          setCurrentView('dashboard');
          setSelectedTest(null);
        }}
        user={user}
      />
    );
  }

  // 응시 가능한 테스트들 (기간 내이고 미응시 또는 재응시 가능한 것들)
  const getAvailableTestsForTaking = () => {
    const now = new Date();
    return availableTests.filter(test => {
      const startDate = new Date(test.open_at || test.examPeriod?.start);
      const endDate = new Date(test.close_at || test.examPeriod?.end);
      const alreadyTaken = completedTests.find(ct => ct.testId === test.id);
      
      return now >= startDate && now <= endDate && (!alreadyTaken || test.autoRetake);
    });
  };

  const takableTests = getAvailableTestsForTaking();

  const menuItems = [
    {
      title: '지난 기록 보기',
      description: '지금까지의 학습 기록과 성취를 확인해보세요',
      icon: '📋',
      color: 'from-cyan-400 to-blue-500',
      onClick: () => router.push('/dashboard/student/history')
    },
    {
      title: '테스트 응시',
      description: '새로운 테스트에 도전해서 실력을 키워보세요',
      icon: '✏️',
      color: 'from-orange-400 to-red-500',
      onClick: () => {
        if (takableTests.length === 0) {
          alert('현재 응시 가능한 테스트가 없습니다! 😅');
        } else {
          // 스크롤하여 테스트 목록으로 이동
          document.getElementById('available-tests')?.scrollIntoView({ 
            behavior: 'smooth' 
          });
        }
      }
    }
  ];

  return (
    <div className="pt-8">
      {/* 환영 메시지 */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          학생 대시보드 👨‍🎓
        </h2>
        <p className="text-xl text-gray-700">
          열심히 공부하는 멋진 학생! 오늘도 새로운 것을 배워봐요 🌟
        </p>
        <div className="text-3xl mt-4">📚✨🎯✨📚</div>
      </div>

      {/* 메뉴 카드들 */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
        {menuItems.map((item, index) => (
          <div
            key={index}
            onClick={item.onClick}
            className="bg-white/90 backdrop-blur-sm rounded-3xl p-10 shadow-xl border border-gray-200 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer group"
          >
            {/* 아이콘 */}
            <div className="text-7xl text-center mb-8 group-hover:scale-110 transition-transform duration-300">
              {item.icon}
            </div>

            {/* 제목 */}
            <h3 className="text-3xl font-bold text-gray-800 text-center mb-6">
              {item.title}
            </h3>

            {/* 설명 */}
            <p className="text-gray-700 text-center mb-8 leading-relaxed text-lg">
              {item.description}
            </p>

            {/* 버튼 */}
            <button className={`w-full bg-gradient-to-r ${item.color} text-white font-bold py-5 px-8 rounded-2xl hover:shadow-lg transition-all duration-200 text-lg`}>
              시작하기 🚀
            </button>
          </div>
        ))}
      </div>

      {/* 응시 가능한 테스트 목록 */}
      <div id="available-tests" className="max-w-5xl mx-auto mb-12">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          ✏️ 응시 가능한 테스트
        </h3>
        {takableTests.length > 0 ? (
          <div className="space-y-4">
            {takableTests.map((test) => {
              const alreadyTaken = completedTests.find(ct => ct.testId === test.id);
              const endDate = new Date(test.close_at || test.examPeriod?.end);
              const now = new Date();
              const timeLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={test.id}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-2">
                        {test.title || test.subject || '새 테스트'}
                        {alreadyTaken && (
                          <span className="ml-2 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-sm">
                            재응시
                          </span>
                        )}
                      </h4>
                                             <div className="flex items-center space-x-4 text-sm text-gray-700 mb-2">
                         <span>📊 {test.numofquestion || test.questionCount}문제</span>
                         <span>⏰ {Math.floor((test.time_limit_sec || test.timeLimit * 60) / 60)}분</span>
                         <span>🎯 합격점수 {test.target_score || test.passingScore}점</span>
                       </div>
                       <div className="text-sm text-gray-700">
                         📅 마감까지 {timeLeft}일 남음
                       </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startTest(test)}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-medium"
                      >
                        🚀 시작하기
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
                         <p className="text-xl text-gray-700 mb-2">현재 응시 가능한 테스트가 없습니다</p>
             <p className="text-gray-700">선생님이 새로운 테스트를 만들면 여기에 표시돼요!</p>
          </div>
        )}
      </div>

      {/* 완료된 테스트 목록 */}
      {completedTests.length > 0 && (
        <div className="max-w-5xl mx-auto mb-12">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            📋 완료된 테스트
          </h3>
          <div className="space-y-4">
                         {completedTests.map((result, index) => {
               const test = availableTests.find(t => t.id === result.testId);
               const hasScore = result.score;
               
               return (
                 <div
                   key={index}
                   className={`rounded-2xl p-6 border-2 ${
                     hasScore?.isPassed 
                       ? 'bg-green-50 border-green-200' 
                       : hasScore?.isPassed === false
                       ? 'bg-red-50 border-red-200'
                       : 'bg-gray-50 border-gray-200'
                   }`}
                 >
                   <div className="flex justify-between items-center">
                     <div>
                       <h4 className="text-lg font-bold text-gray-800 mb-2">
                         {test?.subject || '테스트'} 완료 
                         {hasScore?.isPassed === true && ' 🎉'}
                         {hasScore?.isPassed === false && ' 😅'}
                         {!hasScore && ' ✅'}
                       </h4>
                       <div className="text-sm text-gray-700 mb-1">
                         📅 제출일: {new Date(result.submittedAt).toLocaleDateString()}
                       </div>
                       {hasScore && (
                         <div className="text-sm text-gray-700">
                           📝 정답률: {hasScore.correctAnswers}/{hasScore.totalQuestions}문제
                         </div>
                       )}
                     </div>
                     <div className="text-right">
                       {hasScore ? (
                         <div>
                           <div className={`text-2xl font-bold mb-1 ${
                             hasScore.isPassed ? 'text-green-600' : 'text-red-500'
                           }`}>
                             {hasScore.percentage}점
                           </div>
                           <div className={`text-sm font-medium mb-1 ${
                             hasScore.isPassed ? 'text-green-600' : 'text-red-500'
                           }`}>
                             {hasScore.isPassed ? '🎯 합격!' : '📚 불합격'}
                           </div>
                           <div className="text-xs text-gray-700">
                             ({hasScore.earnedPoints}/{hasScore.totalPoints}점)
                           </div>
                         </div>
                       ) : (
                         <div className="text-lg font-bold text-green-600">제출 완료</div>
                       )}
                       <div className="text-sm text-gray-700 mt-2">
                         ⏱️ {Math.floor(result.timeSpent / 60)}분 {result.timeSpent % 60}초
                       </div>
                     </div>
                   </div>
                 </div>
               );
             })}
          </div>
        </div>
      )}

      {/* 학습 팁 */}
      <div className="max-w-3xl mx-auto mt-16">
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-3xl p-8 text-center">
          <h3 className="text-2xl font-bold text-yellow-800 mb-4">
            💡 오늘의 학습 팁
          </h3>
          <p className="text-yellow-700 text-lg leading-relaxed">
            꾸준히 조금씩 공부하는 것이 한 번에 많이 공부하는 것보다 훨씬 효과적이에요!
            <br />
            매일 15분씩이라도 꾸준히 해보세요 🌱
          </p>
          <div className="text-3xl mt-4">🌟📖🌟</div>
        </div>
      </div>

      {/* 하단 메시지 */}
      <div className="text-center mt-12">
        <p className="text-lg text-gray-700 mb-4">
          더 재미있는 학습 기능들이 곧 추가될 예정이에요! 🎉
        </p>
        <div className="text-2xl">
          🎮🎪🎨🎭🎸🎯
        </div>
      </div>
    </div>
  );
} 