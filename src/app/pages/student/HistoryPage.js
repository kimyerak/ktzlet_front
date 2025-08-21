'use client';

import { useState, useEffect } from 'react';
import Card from '../../ui/Card';

export default function HistoryPage({ user, onBack }) {
  const [completedTests, setCompletedTests] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    // 로컬 스토리지에서 완료된 테스트와 사용 가능한 테스트 목록 불러오기
    const completed = JSON.parse(localStorage.getItem('completedTests') || '[]');
    const available = JSON.parse(localStorage.getItem('availableTests') || '[]');
    
    console.log('HistoryPage - 로드된 데이터:', {
      completed: completed.length,
      available: available.length,
      completedData: completed
    });
    
    setCompletedTests(completed);
    setAvailableTests(available);
  }, []);

  // 완료된 테스트에 원본 테스트 정보 추가
  const getCompletedTestsWithDetails = () => {
    return completedTests.map(completed => {
      // StudentDashboard의 데이터 구조 사용
      const hasScore = completed.score;
      const originalTest = availableTests.find(test => 
        test.id === completed.testId || 
        test.quizId === completed.testId
      );
      
      return {
        ...completed,
        originalTest,
        testTitle: completed.title || originalTest?.title || originalTest?.quizTitle || originalTest?.subject || '알 수 없는 테스트',
        questionCount: hasScore ? hasScore.totalQuestions : (originalTest?.questionCount || originalTest?.numOfQuestions || 0),
        timeLimit: originalTest ? (originalTest.timeLimit || Math.floor((originalTest.timeLimitSec || 1800) / 60)) : 0,
        passingScore: originalTest ? (originalTest.passingScore || originalTest.targetScore || originalTest.target_score || 70) : 70,
        totalScore: hasScore ? hasScore.earnedPoints : 0,
        maxScore: hasScore ? hasScore.totalPoints : (originalTest?.questionCount || 0) * 10,
        percentage: hasScore ? hasScore.percentage : 0,
        pass: hasScore ? (hasScore.percentage >= (hasScore.passingScore || originalTest?.passingScore || 70)) : false,
        correctAnswers: hasScore ? hasScore.correctAnswers : 0,
        timeSpent: completed.timeSpent || 0
      };
    }).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)); // 최신순 정렬
  };

  const completedTestsWithDetails = getCompletedTestsWithDetails();

  // 성적 등급 계산
  const getGrade = (score, totalScore) => {
    const percentage = (score / totalScore) * 100;
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (percentage >= 70) return { grade: 'B+', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (percentage >= 60) return { grade: 'B', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (percentage >= 50) return { grade: 'C+', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (percentage >= 40) return { grade: 'C', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { grade: 'F', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  // 통계 계산
  const getStatistics = () => {
    if (completedTestsWithDetails.length === 0) return null;

    const totalTests = completedTestsWithDetails.length;
    
    // 유효한 점수가 있는 테스트만 계산
    const testsWithScore = completedTestsWithDetails.filter(test => 
      test.percentage !== undefined && test.percentage !== null && !isNaN(test.percentage)
    );
    
    const totalPercentage = testsWithScore.reduce((sum, test) => sum + test.percentage, 0);
    const averageScore = testsWithScore.length > 0 ? Math.round(totalPercentage / testsWithScore.length) : 0;
    
    const passedTests = completedTestsWithDetails.filter(test => test.pass === true).length;
    const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    return {
      totalTests,
      averageScore,
      passRate,
      passedTests
    };
  };

  const statistics = getStatistics();

  const handleTestDetail = (test) => {
    console.log('상세보기 클릭:', test);
    setSelectedTest(test);
    setShowDetail(true);
  };

  const renderTestDetail = () => {
    if (!selectedTest) return null;

    const grade = getGrade(selectedTest.totalScore, selectedTest.maxScore || 100);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">테스트 상세 결과</h3>
            <button
              onClick={() => setShowDetail(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* 테스트 기본 정보 */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
              <h4 className="text-xl font-bold text-gray-800 mb-4">
                {selectedTest.testTitle}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-800 font-medium">응시일:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {new Date(selectedTest.submittedAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-800 font-medium">소요시간:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {Math.round((selectedTest.timeSpent || 0) / 60) || 0}분
                  </span>
                </div>
                <div>
                  <span className="text-gray-800 font-medium">문제 수:</span>
                  <span className="ml-2 font-semibold text-gray-900">{selectedTest.questionCount || 0}문제</span>
                </div>
                <div>
                  <span className="text-gray-800 font-medium">합격점수:</span>
                  <span className="ml-2 font-semibold text-gray-900">{selectedTest.passingScore || 70}점</span>
                </div>
              </div>
            </div>

            {/* 점수 정보 */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
              <h4 className="text-lg font-bold text-gray-800 mb-4">📊 성적 결과</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{selectedTest.percentage || 0}점</div>
                  <div className="text-sm text-gray-800 font-medium">총점</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${grade.color}`}>{grade.grade}</div>
                  <div className="text-sm text-gray-800 font-medium">성적</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">{selectedTest.correctAnswers || 0}</div>
                  <div className="text-sm text-gray-800 font-medium">정답 수</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold mb-2 ${
                    selectedTest.pass ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedTest.pass ? '합격' : '불합격'}
                  </div>
                  <div className="text-sm text-gray-800 font-medium">결과</div>
                </div>
              </div>
            </div>

            {/* 틀린 문제 분석 */}
            {selectedTest.score && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">❌ 틀린 문제 분석</h4>
                {(() => {
                  const wrongCount = (selectedTest.questionCount || 0) - (selectedTest.correctAnswers || 0);
                  
                  if (wrongCount === 0) {
                    return (
                      <div className="text-center py-4">
                        <div className="text-2xl mb-2">🎉</div>
                        <p className="text-green-600 font-medium">모든 문제를 맞췄습니다!</p>
                      </div>
                    );
                  }
                  
                  // questionResults가 있으면 상세 분석, 없으면 기본 정보
                  if (selectedTest.questionResults && selectedTest.questionResults.length > 0) {
                    const wrongQuestions = selectedTest.questionResults.filter(q => !q.isCorrect);
                    
                    return (
                      <div className="space-y-3">
                        <div className="text-center mb-4">
                          <span className="text-red-600 font-semibold text-lg">
                            총 {wrongQuestions.length}개 문제를 틀렸습니다
                          </span>
                        </div>
                        
                        <div className="grid gap-3">
                          {wrongQuestions.map((question, index) => (
                            <div key={question.questionId} className="bg-white rounded-lg p-4 border border-red-200">
                              <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <span className="font-medium text-gray-800">문제 {index + 1}</span>
                                    {question.vocab && (
                                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                        {question.vocab.word}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-red-500 font-bold">❌</div>
                                </div>
                                
                                {question.questionText && (
                                  <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                    <strong>문제:</strong> {question.questionText}
                                  </div>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-gray-700">내 답안:</span>
                                    <span className="ml-2 font-medium text-red-600">
                                      {question.userAnswer === 1 ? 'O (맞음)' : 
                                       question.userAnswer === 0 ? 'X (틀림)' : 
                                       question.userAnswer || '답안 없음'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-700">정답:</span>
                                    <span className="ml-2 font-medium text-green-600">
                                      {question.correctAnswer === 1 ? 'O (맞음)' : 
                                       question.correctAnswer === 0 ? 'X (틀림)' : 
                                       question.correctAnswer}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  } else {
                    // 기존 방식 (답안만 있는 경우)
                    return (
                      <div className="space-y-3">
                        <div className="text-center mb-4">
                          <span className="text-red-600 font-semibold text-lg">
                            총 {wrongCount}개 문제를 틀렸습니다
                          </span>
                        </div>
                        
                        <div className="text-center py-4 text-gray-700">
                          <p>이 테스트는 이전 버전으로 응시되어 상세한 오답 분석을 제공할 수 없습니다.</p>
                          <p className="text-sm mt-1">새로운 테스트부터는 상세한 오답 분석을 제공합니다.</p>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            )}

            {/* 닫기 버튼 */}
            <div className="text-center">
              <button
                onClick={() => setShowDetail(false)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-2xl transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pt-8 px-4 max-w-6xl mx-auto">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          📋 지난 기록 보기
        </h1>
        <p className="text-xl text-gray-700">
          지금까지 응시한 테스트들의 결과를 확인해보세요
        </p>
      </div>

      {/* 통계 요약 */}
      {statistics && (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-200 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">📊 전체 통계</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="text-3xl font-bold text-blue-600">{statistics.totalTests}</div>
              <div className="text-sm text-gray-600">총 응시 테스트</div>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-xl">
              <div className="text-3xl font-bold text-green-600">{statistics.averageScore}점</div>
              <div className="text-sm text-gray-600">평균 점수</div>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <div className="text-3xl font-bold text-purple-600">{statistics.passRate}%</div>
              <div className="text-sm text-gray-600">합격률</div>
            </div>
            <div className="text-center p-6 bg-yellow-50 rounded-xl">
              <div className="text-3xl font-bold text-yellow-600">{statistics.passedTests}</div>
              <div className="text-sm text-gray-600">합격한 테스트</div>
            </div>
          </div>
        </div>
      )}

      {/* 테스트 목록 */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          📝 응시한 테스트 목록
        </h3>
        
        {completedTestsWithDetails.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">아직 응시한 테스트가 없습니다</h3>
            <p className="text-gray-600">테스트를 응시하면 여기서 결과를 확인할 수 있어요!</p>
            <div className="mt-4 text-xs text-gray-500">
              디버그: completedTests={completedTests.length}, availableTests={availableTests.length}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs text-gray-500 mb-4">
              디버그: {completedTestsWithDetails.length}개 테스트 표시 중
            </div>
            {completedTestsWithDetails.map((test, index) => {
              const grade = getGrade(test.totalScore, test.maxScore || 100);
              
              return (
                <div
                  key={test.testId || test.id || index}
                  className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-xl font-bold text-gray-800">{test.testTitle}</h4>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${grade.bgColor} ${grade.color}`}>
                          {grade.grade}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          test.pass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {test.pass ? '합격' : '불합격'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-700 mb-2">
                        <span>📊 {test.questionCount || 0}문제</span>
                        <span>⏰ {test.timeLimit || 0}분</span>
                        <span>🎯 {test.passingScore || 70}점</span>
                        <span>📅 {new Date(test.submittedAt).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>소요시간: {Math.round((test.timeSpent || 0) / 60) || 0}분</span>
                        <span>합격점수: {test.passingScore || 70}점</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800 mb-1">{test.percentage || 0}점</div>
                      <div className="text-sm text-gray-500 mb-3">총점</div>
                      <button
                        onClick={() => handleTestDetail(test)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        📊 상세보기
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 뒤로가기 버튼 */}
      <div className="text-center mt-8">
        <button
          onClick={onBack}
          className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold py-3 px-8 rounded-xl hover:shadow-lg transition-all duration-200"
        >
          ← 학생 대시보드로 돌아가기
        </button>
      </div>

      {/* 상세 모달 */}
      {showDetail && renderTestDetail()}
    </div>
  );
} 