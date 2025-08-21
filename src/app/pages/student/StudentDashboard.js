'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TestTaking from './TestTaking';
import { quizTakingService } from '../../services/apiService';

export default function StudentDashboard({ user }) {
  const router = useRouter();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedTest, setSelectedTest] = useState(null);
  const [availableTests, setAvailableTests] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [activeTab, setActiveTab] = useState('available'); // 'available' 또는 'completed'
  const [debugData, setDebugData] = useState(null); // 디버깅용 원본 데이터

  // 백엔드에서 응시 가능한 퀴즈 목록과 완료된 퀴즈 불러오기
  useEffect(() => {
    const loadData = async () => {
      try {
        // 응시 가능한 퀴즈 목록 조회
        if (user?.id) {
          const available = await quizTakingService.getAvailableQuizzes(user.id);
          console.log('Rendering test:', available[0]); // 로그로 available quiz 확인
          console.log('Rendering test:', available[0]); // 로그로 available quiz 확인
          
          const formattedAvailable = available.map(quiz => ({
            id: quiz.quizId,
            quizId: quiz.quizId,
            title: quiz.quizTitle || '새 테스트',
            quizTitle: quiz.quizTitle || '새 테스트',
            subject: quiz.quizTitle || '새 테스트',
            numOfQuestions: quiz.numOfQuestions || 0,
            numofquestion: quiz.numOfQuestions || 0,
            questionCount: quiz.numOfQuestions || 0,
            timeLimitSec: quiz.timeLimitSec || 1800,
            time_limit_sec: quiz.timeLimitSec || 1800,
            timeLimit: Math.floor((quiz.timeLimitSec || 1800) / 60),
            targetScore: quiz.targetScore || 70,
            target_score: quiz.targetScore || 70,
            passingScore: quiz.targetScore || 70,
            openAt: quiz.openAt,
            open_at: quiz.openAt,
            closeAt: quiz.closeAt,
            close_at: quiz.closeAt,
            examPeriod: {
              start: quiz.openAt,
              end: quiz.closeAt
            },
            createdAt: quiz.createdAt,
            createdBy: quiz.createdBy,
            creatorName: quiz.creatorName
          }));
          
          setAvailableTests(formattedAvailable);
          
          // 완료된 퀴즈 목록 조회
          const history = await quizTakingService.getCompletedQuizzes(user.id);
          console.log('Completed quizzes:', history);
          console.log('Completed quizzes count:', history.length);
          
          const formattedHistory = history.map(item => {
               const totalQuestions = item.numOfQuestions || 0;
               const totalScore = item.totalScore || 0;
               const maxScore = totalQuestions * 10; // 문제당 10점 가정
               const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
               
               // 실제 합격점수 확인 (백엔드의 targetScore 또는 기본값 70)
               const passingScore = item.targetScore || 70;
               const isPassed = item.pass !== undefined ? item.pass : (percentage >= passingScore);
               
               return {
                 testId: item.quizId,
                 title: item.quizTitle || '테스트',
                 submittedAt: item.submittedAt,
                 timeSpent: 0, // 백엔드에서 제공하지 않음, 로컬 데이터에서 가져올 예정
                 score: {
                   correctAnswers: 0, // 백엔드에서 제공하지 않음, 총점으로만 판단
                   totalQuestions: totalQuestions,
                   earnedPoints: totalScore,
                   totalPoints: maxScore,
                   percentage: percentage,
                   isPassed: isPassed,
                   passingScore: passingScore
                 }
               };
             });
          
          console.log('Formatted history:', formattedHistory);
          
          // 로컬 저장소의 최신 데이터와 백엔드 데이터 병합
          const allLocalCompleted = JSON.parse(localStorage.getItem('completedTests') || '[]');
          // 현재 로그인한 학생의 데이터만 필터링
          const localCompleted = allLocalCompleted.filter(test => {
            // testId가 현재 학생이 응시한 테스트인지 확인
            // 또는 userId가 있다면 userId로 필터링
            if (test.userId && test.userId === user.id) {
              return true;
            }
            // userId가 없는 기존 데이터의 경우, 백엔드 데이터와 일치하는지 확인
            return formattedHistory.some(backendTest => backendTest.testId === test.testId);
          });
          
          console.log('All local completed tests:', allLocalCompleted);
          console.log('Filtered local completed tests for current user:', localCompleted);
          
          // 로컬 데이터가 더 최신이면 우선 사용, 없으면 백엔드 데이터 사용
          const mergedHistory = [...formattedHistory];
          localCompleted.forEach(localTest => {
            const existingIndex = mergedHistory.findIndex(t => t.testId === localTest.testId);
            if (existingIndex >= 0) {
              // 로컬 데이터에 상세한 채점 정보가 있으면 우선 사용
              if (localTest.score && (
                localTest.score.totalQuestions > 0 || 
                localTest.score.correctAnswers > 0 || 
                localTest.answers
              )) {
                // 백엔드 데이터의 기본 정보와 로컬 데이터의 상세 정보 병합
                mergedHistory[existingIndex] = {
                  ...mergedHistory[existingIndex], // 백엔드 기본 정보 유지
                  ...localTest, // 로컬 상세 정보로 덮어쓰기
                  title: localTest.title || mergedHistory[existingIndex].title // 제목 우선순위
                };
                console.log(`Replaced with local data for test ${localTest.testId}:`, mergedHistory[existingIndex]);
              }
            } else {
              // 새로운 로컬 데이터 추가
              mergedHistory.push(localTest);
              console.log(`Added local data for test ${localTest.testId}:`, localTest);
            }
          });
          
          console.log('Merged history:', mergedHistory);
          setCompletedTests(mergedHistory);
          
          // 로컬 스토리지도 백업으로 업데이트
          localStorage.setItem('availableTests', JSON.stringify(formattedAvailable));
        }
      } catch (error) {
        console.error('데이터 로드 오류:', error);
        // 백엔드 연결 실패 시 로컬 데이터 사용
        const availableFromStorage = JSON.parse(localStorage.getItem('availableTests') || '[]');
        const completedFromStorage = JSON.parse(localStorage.getItem('completedTests') || '[]');
        setAvailableTests(availableFromStorage);
        setCompletedTests(completedFromStorage);
      }
    };

    // 로컬 스토리지의 잘못된 데이터 정리 (한 번만 실행)
    const cleanupKey = 'localStorageCleanupV2';
    if (!localStorage.getItem(cleanupKey)) {
      console.log('로컬 스토리지 데이터 정리 중...');
      
      // 제목이 없거나 잘못된 완료 테스트 데이터 제거
      const localCompleted = JSON.parse(localStorage.getItem('completedTests') || '[]');
      const cleanedCompleted = localCompleted.filter(test => 
        test.title && test.title !== '테스트' && test.title !== 'undefined'
      );
      
      if (cleanedCompleted.length !== localCompleted.length) {
        localStorage.setItem('completedTests', JSON.stringify(cleanedCompleted));
        console.log(`정리 완료: ${localCompleted.length - cleanedCompleted.length}개 항목 제거`);
      }
      
      localStorage.setItem(cleanupKey, 'done');
    }
    
    loadData();
  }, [user?.id]);

  // 로컬 스토리지 정리 - userId가 없는 기존 데이터 제거
  useEffect(() => {
    if (user && user.id) {
      const cleanupLocalStorage = () => {
        try {
          const allCompleted = JSON.parse(localStorage.getItem('completedTests') || '[]');
          // userId가 있는 데이터만 유지하거나, 현재 사용자가 실제로 응시한 테스트만 유지
          const cleanedCompleted = allCompleted.filter(test => {
            // userId가 현재 사용자와 일치하는 데이터만 유지
            return test.userId === user.id;
          });
          
          console.log(`로컬 스토리지 정리: ${allCompleted.length}개 -> ${cleanedCompleted.length}개`);
          localStorage.setItem('completedTests', JSON.stringify(cleanedCompleted));
        } catch (error) {
          console.error('로컬 스토리지 정리 오류:', error);
        }
      };
      
      cleanupLocalStorage();
    }
  }, [user]);

  // 테스트 제출 처리
  const handleTestSubmit = async (submissionData) => {
    try {
      // 새로운 통합 제출 API 사용
      if (submissionData.testId && user?.id && submissionData.score) {
        try {
          console.log('백엔드에 퀴즈 제출 시작:', submissionData);
          
          // 새로운 API 형식에 맞춰 데이터 변환
          const quizSubmissionData = {
            studentId: user.id,
            answers: Object.entries(submissionData.answers || {}).map(([questionId, answer]) => ({
              questionId: parseInt(questionId),
              answer: answer
            }))
          };
          
          console.log('백엔드로 전송할 제출 데이터:', quizSubmissionData);
          
          // 통합된 퀴즈 제출 API 사용
          const result = await quizTakingService.submitQuiz(submissionData.testId, quizSubmissionData);
          console.log('백엔드 퀴즈 제출 처리 완료:', result);
          
        } catch (backendError) {
          console.error('백엔드 저장 오류:', backendError);
          
          // 백엔드 오류 메시지 개선
          let errorMessage = '백엔드 서버 오류가 발생했습니다.';
          if (backendError.message.includes('서버 내부 오류')) {
            errorMessage = '백엔드 서버가 일시적으로 응답하지 않습니다. 로컬에 저장됩니다.';
          } else if (backendError.message.includes('Failed to fetch')) {
            errorMessage = '백엔드 서버에 연결할 수 없습니다. 로컬에 저장됩니다.';
          }
          
          console.warn(errorMessage);
          // 백엔드 오류는 무시하고 계속 진행
        }
      }
      
      const updatedCompleted = [...completedTests, submissionData];
      setCompletedTests(updatedCompleted);
      localStorage.setItem('completedTests', JSON.stringify(updatedCompleted));
      
      alert('🎉 테스트가 성공적으로 제출되었습니다!');
      setCurrentView('dashboard');
      setSelectedTest(null);
    } catch (error) {
      console.error('테스트 제출 오류:', error);
      // 백엔드 저장 실패해도 로컬에는 저장
      const updatedCompleted = [...completedTests, submissionData];
      setCompletedTests(updatedCompleted);
      localStorage.setItem('completedTests', JSON.stringify(updatedCompleted));
      
      alert('🎉 테스트가 제출되었습니다! (일부 데이터 저장에 실패했을 수 있습니다)');
      setCurrentView('dashboard');
      setSelectedTest(null);
    }
  };

  // 테스트 시작
  const startTest = async (test) => {
    // 이미 응시한 테스트인지 확인
    const alreadyTaken = completedTests.find(ct => ct.testId === test.quizId || ct.testId === test.id);
    if (alreadyTaken && !test.autoRetake) {
      alert('이미 응시한 테스트입니다!');
      return;
    }

    // 응시 기간 확인
    const now = new Date();
    const startDate = new Date(test.openAt || test.open_at || test.examPeriod?.start);
    const endDate = new Date(test.closeAt || test.close_at || test.examPeriod?.end);

    if (now < startDate) {
      alert('아직 응시 기간이 아닙니다!');
      return;
    }

    if (now > endDate) {
      alert('응시 기간이 종료되었습니다!');
      return;
    }

    if (confirm(`${test.quizTitle || test.title || test.subject || '새 테스트'} 테스트를 시작하시겠습니까?\n\n⏰ 제한시간: ${Math.floor((test.timeLimitSec || test.time_limit_sec || test.timeLimit * 60) / 60)}분\n📊 문제수: ${test.numOfQuestions || test.numofquestion || test.questionCount}개\n🎯 합격점수: ${test.targetScore || test.target_score || test.passingScore}점`)) {
      try {
        // 백엔드에 퀴즈 시작 기록 생성 (선택적)
        if (test.quizId && user?.id && quizTakingService.startQuiz) {
          try {
            await quizTakingService.startQuiz(test.quizId, user.id);
          } catch (startError) {
            console.warn('퀴즈 시작 기록 생성 실패 (무시됨):', startError);
            // 백엔드 오류가 있어도 프론트엔드에서는 테스트 시작
          }
        }
        
        setSelectedTest(test);
        setCurrentView('test-taking');
      } catch (error) {
        console.error('퀴즈 시작 오류:', error);
        // 백엔드 오류가 있어도 프론트엔드에서는 테스트 시작
        setSelectedTest(test);
        setCurrentView('test-taking');
      }
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
      // 백엔드에서 받은 필드명과 프론트엔드 필드명 모두 확인
      const startDate = new Date(test.openAt || test.open_at || test.examPeriod?.start);
      const endDate = new Date(test.closeAt || test.close_at || test.examPeriod?.end);
      const alreadyTaken = completedTests.find(ct => ct.testId === test.quizId || ct.testId === test.id);
      
      return now >= startDate && now <= endDate && (!alreadyTaken || test.autoRetake);
    });
  };

  const takableTests = getAvailableTestsForTaking();

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
        <div className="text-sm text-gray-500 mb-4">
          사용자 ID: {user?.id} | 이름: {user?.name}
        </div>
        <div className="text-3xl mt-4">📚✨🎯✨📚</div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex justify-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('available')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === 'available'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                ✏️ 응시 가능한 테스트 ({takableTests.length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === 'completed'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                📋 완료된 테스트 ({completedTests.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-5xl mx-auto mb-12">
        {activeTab === 'available' && (
          <div>
            {takableTests.length > 0 ? (
              <div className="space-y-4">
                {takableTests.map((test) => {
                  console.log('Rendering test:', test); // 디버깅 로그 추가
                  const alreadyTaken = completedTests.find(ct => ct.testId === test.quizId || ct.testId === test.id);
                  const endDate = new Date(test.closeAt || test.close_at || test.examPeriod?.end);
                  const now = new Date();
                  const timeLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

                  return (
                    <div
                      key={test.quizId || test.id}
                      className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-xl font-bold text-gray-800 mb-2">
                            {test.quizTitle || test.title || test.subject || '새 테스트'}
                            {alreadyTaken && (
                              <span className="ml-2 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-sm">
                                재응시
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-700 mb-2">
                            <span>📊 {test.numOfQuestions || test.numofquestion || test.questionCount}문제</span>
                            <span>⏰ {Math.floor((test.timeLimitSec || test.time_limit_sec || test.timeLimit * 60) / 60)}분</span>
                            <span>🎯 합격점수 {test.targetScore || test.target_score || test.passingScore}점</span>
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
        )}

        {activeTab === 'completed' && (
          <div>
            {completedTests.length > 0 ? (
              <div className="space-y-4">
                {completedTests.map((result, index) => {
                  const test = availableTests.find(t => t.quizId === result.testId || t.id === result.testId);
                  const hasScore = result.score;
                  
                  return (
                    <div
                      key={`completed-${result.testId}-${result.submittedAt}-${index}`}
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
                            {result.title || test?.quizTitle || test?.title || test?.subject || '테스트'} 완료 
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
                              <div className="text-xs text-gray-700 mb-2">
                                ({hasScore.earnedPoints}/{hasScore.totalPoints}점)
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-lg font-bold text-green-600 mb-2">제출 완료</div>
                            
                            </div>
                          )}
                          <div className="text-sm text-gray-700 mt-2">
                            ⏱️ {Math.floor((result.timeSpent || 0) / 60)}분 {(result.timeSpent || 0) % 60}초
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-xl text-gray-700 mb-2">완료된 테스트가 없습니다</p>
                <p className="text-gray-700">테스트를 응시하면 여기에 기록이 표시돼요!</p>
              </div>
            )}
          </div>
        )}
      </div>

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

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => router.push('/dashboard/student/history')}
          className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 flex items-center space-x-2"
          title="지난 기록 보기"
        >
          <span className="text-2xl">📋</span>
          <span className="font-bold text-sm">상세 기록</span>
        </button>
      </div>
    </div>
  );
} 