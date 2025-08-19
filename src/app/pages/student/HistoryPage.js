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
    setCompletedTests(completed);
    setAvailableTests(available);
  }, []);

  // 완료된 테스트에 원본 테스트 정보 추가
  const getCompletedTestsWithDetails = () => {
    return completedTests.map(completed => {
      const originalTest = availableTests.find(test => test.id === completed.testId);
      return {
        ...completed,
        originalTest,
        testTitle: originalTest ? originalTest.subject : '알 수 없는 테스트',
        questionCount: originalTest ? originalTest.questionCount : 0,
        timeLimit: originalTest ? originalTest.timeLimit : 0,
        passingScore: originalTest ? originalTest.passingScore : 0
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
    const totalScore = completedTestsWithDetails.reduce((sum, test) => sum + test.totalScore, 0);
    const averageScore = Math.round(totalScore / totalTests);
    const passedTests = completedTestsWithDetails.filter(test => test.pass).length;
    const passRate = Math.round((passedTests / totalTests) * 100);

    return {
      totalTests,
      averageScore,
      passRate,
      passedTests
    };
  };

  const statistics = getStatistics();

  const handleTestDetail = (test) => {
    setSelectedTest(test);
    setShowDetail(true);
  };

  const renderTestDetail = () => {
    if (!selectedTest) return null;

    const grade = getGrade(selectedTest.totalScore, selectedTest.originalTest?.questionCount * 10 || 100);

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
                {selectedTest.testTitle} 테스트
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">응시일:</span>
                  <span className="ml-2 font-semibold">
                    {new Date(selectedTest.submittedAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">소요시간:</span>
                  <span className="ml-2 font-semibold">
                    {Math.round((new Date(selectedTest.submittedAt) - new Date(selectedTest.startedAt)) / 1000 / 60)}분
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">문제수:</span>
                  <span className="ml-2 font-semibold">{selectedTest.questionCount}문제</span>
                </div>
                <div>
                  <span className="text-gray-600">제한시간:</span>
                  <span className="ml-2 font-semibold">{selectedTest.timeLimit}분</span>
                </div>
              </div>
            </div>

            {/* 성적 정보 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-3xl font-bold text-blue-600">{selectedTest.totalScore}점</div>
                <div className="text-sm text-gray-600">총점</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className={`text-3xl font-bold ${grade.color}`}>{grade.grade}</div>
                <div className="text-sm text-gray-600">등급</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className={`text-3xl font-bold ${selectedTest.pass ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedTest.pass ? '합격' : '불합격'}
                </div>
                <div className="text-sm text-gray-600">결과</div>
              </div>
            </div>

            {/* 문제별 결과 (샘플) */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h5 className="font-semibold text-gray-800 mb-4">📝 문제별 결과</h5>
              <div className="space-y-3">
                {Array.from({ length: Math.min(5, selectedTest.questionCount) }, (_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <span className="font-medium">문제 {i + 1}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        Math.random() > 0.3 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {Math.random() > 0.3 ? '정답' : '오답'}
                      </span>
                      <span className="text-sm text-gray-600">10점</span>
                    </div>
                  </div>
                ))}
                {selectedTest.questionCount > 5 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... 외 {selectedTest.questionCount - 5}문제
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setShowDetail(false)}
              className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold py-3 px-8 rounded-xl hover:shadow-lg transition-all duration-200"
            >
              닫기
            </button>
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
          </div>
        ) : (
          <div className="space-y-4">
            {completedTestsWithDetails.map((test, index) => {
              const grade = getGrade(test.totalScore, test.questionCount * 10);
              
              return (
                <div
                  key={test.id || index}
                  className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleTestDetail(test)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-xl font-bold text-gray-800">{test.testTitle} 테스트</h4>
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
                        <span>📊 {test.questionCount}문제</span>
                        <span>⏰ {test.timeLimit}분</span>
                        <span>🎯 {test.totalScore}점</span>
                        <span>📅 {new Date(test.submittedAt).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>소요시간: {Math.round((new Date(test.submittedAt) - new Date(test.startedAt)) / 1000 / 60)}분</span>
                        <span>합격점수: {test.passingScore}점</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800 mb-1">{test.totalScore}점</div>
                      <div className="text-sm text-gray-500">총점</div>
                      <div className="text-xs text-blue-600 mt-2">클릭하여 상세보기</div>
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