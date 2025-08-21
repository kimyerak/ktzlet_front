'use client';

import { useState, useEffect } from 'react';
import { quizService } from '../../services/apiService';
import Header from '../../ui/Header';
import Button from '../../ui/Button';

export default function TestView({ testId, onBack, user }) {
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 테스트 정보 로드
  useEffect(() => {
    const loadTest = async () => {
      try {
        setLoading(true);
        const testData = await quizService.getQuizById(testId);
        setTest(testData);
        setError('');
      } catch (error) {
        console.error('테스트 로드 오류:', error);
        setError('테스트 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      loadTest();
    }
  }, [testId]);

  const renderQuestion = (question, index) => {
    if (!question) return null;
    
    // 4지선다 문제의 경우 options에서 정답 표시
    let correctWord = null;
    if (question.type === 'MULTIPLE' && question.options && question.options.length > 0) {
      correctWord = question.options[question.correctAnswer];
    } else if (!correctWord && question.vocab?.word) {
      correctWord = question.vocab.word;
    }
    
    return (
      <div
        key={question.id || index}
        className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-blue-200 mb-6"
      >
        {/* 문제 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <h3 className="text-2xl font-bold text-gray-800">
              📋 문제 {index + 1}번
            </h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {question.type === 'DICTATION' && '받아쓰기'}
              {question.type === 'OX' && 'OX 문제'}
              {question.type === 'MULTIPLE' && '4지선다'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-lg font-medium text-gray-700">
              배점: {question.points}점
            </span>
          </div>
        </div>

        {/* 관련 단어 */}
        {question.vocab && (
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-700 mb-3">
              📚 관련 단어
            </label>
            <div className="px-4 py-3 rounded-2xl border border-gray-300 bg-gray-50 text-gray-800">
              <div className="font-medium">{question.vocab.word}</div>
              <div className="text-sm text-gray-600">{question.vocab.definition}</div>
            </div>
          </div>
        )}

        {/* 문제 내용 */}
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-700 mb-3">
            ❓ 문제
          </label>
          <div className="px-4 py-3 rounded-2xl border border-gray-300 bg-gray-50 text-gray-800">
            {question.stem || question.question}
          </div>
        </div>

        {/* 정답 */}
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-700 mb-3">
            ✅ 정답
          </label>
          <div className="px-4 py-3 rounded-2xl border border-gray-300 bg-gray-50 text-gray-800">
            {question.type === 'OX' ? (
              parseInt(question.correctAnswer) === 1 ? '⭕ 맞음 (O)' : '❌ 틀림 (X)'
            ) : question.type === 'MULTIPLE' ? (
              <div>
                {question.options && question.options.length > 0 ? (
                  <div>
                    <div className="font-medium mb-2">정답: {question.options[parseInt(question.correctAnswer)] || '정답 없음'}</div>
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center space-x-2 mb-1">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                          optionIndex === parseInt(question.correctAnswer) 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {String.fromCharCode(65 + optionIndex)}
                        </span>
                        <span className={optionIndex === parseInt(question.correctAnswer) ? 'font-medium text-green-700' : 'text-gray-600'}>
                          {option}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  // 4지선다 문제는 vocab 정보에서 정답 표시
                  <div className="font-medium">
                    정답: {correctWord || question.vocab?.word || question.correctAnswer || '정답 없음'}
                  </div>
                )}
              </div>
            ) : (
              question.correctAnswer
            )}
          </div>
        </div>

        {/* 설명 */}
        {question.explanation && (
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-700 mb-3">
              💡 설명
            </label>
            <div className="px-4 py-3 rounded-2xl border border-gray-300 bg-gray-50 text-gray-800">
              {question.explanation}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">테스트 정보를 로딩 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️ 오류가 발생했습니다</div>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={onBack} variant="primary">
              ← 뒤로가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-gray-500 text-xl mb-4">📋 테스트를 찾을 수 없습니다</div>
            <Button onClick={onBack} variant="primary">
              ← 뒤로가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header user={user} />
      
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              👁️ 테스트 보기
            </h1>
            <p className="text-gray-600">
              테스트 상세정보와 문제를 확인합니다
            </p>
          </div>
          <Button onClick={onBack} variant="secondary">
            ← 뒤로가기
          </Button>
        </div>

        {/* 테스트 정보 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-blue-200 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            📋 {test.title}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-lg font-medium text-gray-800">
                {test.numOfQuestions || test.numofquestion || 0}문제
              </div>
              <div className="text-sm text-gray-600">문제 수</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-2">⏰</div>
              <div className="text-lg font-medium text-gray-800">
                {Math.floor((test.timeLimitSec || test.time_limit_sec || 0) / 60)}분
              </div>
              <div className="text-sm text-gray-600">제한 시간</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-lg font-medium text-gray-800">
                {test.targetScore || test.target_score || 0}점
              </div>
              <div className="text-sm text-gray-600">합격 점수</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-2">📅</div>
              <div className="text-lg font-medium text-gray-800">
                {new Date(test.createdAt || test.updatedAt).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-600">생성일</div>
            </div>
          </div>

          {/* 시간 설정 */}
          {(test.openAt || test.closeAt) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-4">⏰ 시간 설정</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {test.openAt && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">시작 시간</div>
                    <div className="text-gray-800">{new Date(test.openAt).toLocaleString()}</div>
                  </div>
                )}
                {test.closeAt && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">종료 시간</div>
                    <div className="text-gray-800">{new Date(test.closeAt).toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 문제 목록 */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            📝 문제 목록
          </h3>
          
          {test.questions && test.questions.length > 0 ? (
            <div>
              {test.questions.map((question, index) => 
                renderQuestion(question, index)
              )}
            </div>
          ) : (
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-blue-200 text-center">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-600 text-lg">
                아직 문제가 등록되지 않았습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 