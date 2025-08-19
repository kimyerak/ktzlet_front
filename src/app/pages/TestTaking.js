'use client';

import { useState, useEffect } from 'react';
import Header from '../ui/Header';

export default function TestTaking({ testData, onSubmit, onBack, user }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(testData.time_limit_sec || testData.timeLimit * 60); // 초 단위
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentQuestion = testData.questions[currentQuestionIndex];

  // 타이머 효과
  useEffect(() => {
    if (timeRemaining <= 0 || isSubmitted) {
      if (!isSubmitted) {
        handleSubmit();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isSubmitted]);

  // 시간 포맷팅
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // 답안 저장
  const saveAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // 다음 문제
  const nextQuestion = () => {
    if (currentQuestionIndex < testData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // 이전 문제
  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // 특정 문제로 이동
  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  // 받아쓰기 문제 스펠링 읽기
  const playSpelling = (text) => {
    if ('speechSynthesis' in window) {
      setIsPlaying(true);
      
      // 기존 음성 중지
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8; // 속도 조절
      utterance.pitch = 1.0;
      
      utterance.onend = () => {
        setIsPlaying(false);
      };
      
      utterance.onerror = () => {
        setIsPlaying(false);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert('이 브라우저는 음성 합성을 지원하지 않습니다.');
    }
  };

  // 점수 계산 함수
  const calculateScore = () => {
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    testData.questions.forEach(question => {
      totalPoints += question.points;
      const userAnswer = answers[question.id];
      
      if (userAnswer !== undefined && userAnswer !== '') {
        let isCorrect = false;
        
        if (question.type === 'multiple') {
          // 4지선다: userAnswer는 선택한 옵션의 인덱스, correctAnswer는 정답 옵션의 인덱스
          isCorrect = userAnswer === question.correctAnswer;
        } else if (question.type === 'ox') {
          isCorrect = userAnswer === question.correctAnswer;
        } else if (question.type === 'essay') {
          // 서술형은 일단 답을 작성했으면 부분 점수 부여 (실제로는 교사가 채점해야 함)
          isCorrect = userAnswer.trim().length > 0;
        }
        
        if (isCorrect) {
          correctAnswers++;
          earnedPoints += question.points;
        }
      }
    });

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const isPassed = percentage >= (testData.target_score || testData.passingScore);

    return {
      correctAnswers,
      totalQuestions: testData.questions.length,
      earnedPoints,
      totalPoints,
      percentage,
      isPassed
    };
  };

  // 제출
  const handleSubmit = () => {
    if (isSubmitted) return;

    const unansweredQuestions = testData.questions.filter(q => 
      !answers[q.id] || answers[q.id] === ''
    );

    if (unansweredQuestions.length > 0) {
      const confirmSubmit = confirm(
        `${unansweredQuestions.length}개의 문제가 답이 입력되지 않았습니다. 정말 제출하시겠습니까?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitted(true);
    
    const scoreResult = calculateScore();
    
    const submissionData = {
      testId: testData.id,
      answers,
      submittedAt: new Date().toISOString(),
      timeSpent: (testData.time_limit_sec || testData.timeLimit * 60) - timeRemaining,
      score: scoreResult
    };

    onSubmit(submissionData);
  };

  // 문제 렌더링
  const renderQuestion = () => {
    const answer = answers[currentQuestion.id] || '';

    switch (currentQuestion.type) {
      case 'multiple':
        return (
          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => saveAnswer(currentQuestion.id, index)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                  answer === index
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50 text-gray-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold ${
                    answer === index
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-lg font-medium">{option}</span>
                </div>
              </button>
            ))}
          </div>
        );

      case 'ox':
        return (
          <div className="flex space-x-6 justify-center">
            <button
              onClick={() => saveAnswer(currentQuestion.id, 1)}
              className={`px-12 py-8 rounded-3xl border-3 font-bold text-2xl transition-all ${
                answer === 1
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-gray-300 hover:border-green-400 text-gray-800'
              }`}
            >
              ⭕ 맞음 (O)
            </button>
            <button
              onClick={() => saveAnswer(currentQuestion.id, 0)}
              className={`px-12 py-8 rounded-3xl border-3 font-bold text-2xl transition-all ${
                answer === 0
                  ? 'border-red-500 bg-red-500 text-white'
                  : 'border-gray-300 hover:border-red-400 text-gray-800'
              }`}
            >
              ❌ 틀림 (X)
            </button>
          </div>
        );

      case 'essay':
        return (
          <div>
            {/* 받아쓰기 문제 헤더 */}
            <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-medium text-blue-800">📝 받아쓰기</span>
                  <span className="text-sm text-blue-600">아래 단어의 스펠링을 들고 정확히 입력하세요</span>
                </div>
                <button
                  onClick={() => playSpelling(currentQuestion.question)}
                  disabled={isPlaying}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    isPlaying
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  <span className="text-xl">
                    {isPlaying ? '🔊' : '🔊'}
                  </span>
                  <span>{isPlaying ? '재생 중...' : '스펠링 듣기'}</span>
                </button>
              </div>
            </div>
            
            <textarea
              value={answer}
              onChange={(e) => saveAnswer(currentQuestion.id, e.target.value)}
              placeholder="들은 스펠링을 정확히 입력하세요..."
              className="w-full px-4 py-4 rounded-2xl border-2 border-gray-300 focus:border-blue-500 outline-none resize-none text-gray-800"
              rows={8}
            />
            <div className="text-right text-sm text-gray-700 mt-2">
              {answer.length}/1000자
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100">
      <Header user={user} onHomeClick={onBack} />
      
      {/* 상단 헤더 */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-indigo-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                📝 {testData.title || testData.subject || '새 테스트'}
              </h1>
              <p className="text-gray-700">
                문제 {currentQuestionIndex + 1} / {testData.questions.length}
              </p>
            </div>

            {/* 타이머 */}
            <div className="flex items-center space-x-6">
              <div className={`text-2xl font-bold px-6 py-3 rounded-2xl ${
                timeRemaining <= 300 // 5분 이하
                  ? 'bg-red-100 text-red-600 border-2 border-red-300'
                  : timeRemaining <= 900 // 15분 이하
                  ? 'bg-yellow-100 text-yellow-600 border-2 border-yellow-300'
                  : 'bg-green-100 text-green-600 border-2 border-green-300'
              }`}>
                ⏰ {formatTime(timeRemaining)}
              </div>
              
              <button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold px-6 py-3 rounded-2xl hover:shadow-lg transition-all"
              >
                📤 제출하기
              </button>
            </div>
          </div>

          {/* 문제 네비게이션 */}
          <div className="flex space-x-2 overflow-x-auto mt-4 pb-2">
            {testData.questions.map((question, index) => (
              <button
                key={question.id}
                onClick={() => goToQuestion(index)}
                className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                  currentQuestionIndex === index
                    ? 'bg-blue-500 text-white'
                    : answers[question.id] !== undefined && answers[question.id] !== ''
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-indigo-200 mb-8">
          {/* 문제 헤더 */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                문제 {currentQuestionIndex + 1}번
              </h2>
                              <div className="flex items-center space-x-4 text-sm text-gray-700">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                    {currentQuestion.type === 'multiple' ? '4지선다' : 
                     currentQuestion.type === 'ox' ? 'OX문제' : '받아쓰기'}
                  </span>
                  <span>{currentQuestion.points}점</span>
                </div>
            </div>
          </div>

          {/* 문제 내용 */}
          <div className="mb-8">
            <div className="text-xl leading-relaxed text-gray-800 bg-gray-50 p-6 rounded-2xl">
              {currentQuestion.question}
            </div>
          </div>

          {/* 답안 영역 */}
          <div className="mb-8">
            {renderQuestion()}
          </div>

          {/* 네비게이션 버튼 */}
          <div className="flex justify-between">
            <button
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className={`px-6 py-3 rounded-2xl font-medium transition-all ${
                currentQuestionIndex === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-400 text-white hover:bg-gray-500'
              }`}
            >
              ← 이전 문제
            </button>

            <div className="text-center">
              <span className="text-lg text-gray-700">
                {currentQuestionIndex + 1} / {testData.questions.length}
              </span>
            </div>

            <button
              onClick={nextQuestion}
              disabled={currentQuestionIndex === testData.questions.length - 1}
              className={`px-6 py-3 rounded-2xl font-medium transition-all ${
                currentQuestionIndex === testData.questions.length - 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              다음 문제 →
            </button>
          </div>
        </div>

        {/* 하단 도움말 */}
        <div className="text-center text-gray-700">
          <p className="mb-2">💡 상단의 문제 번호를 클릭하면 원하는 문제로 바로 이동할 수 있어요!</p>
          <p>시간이 부족하면 자동으로 제출됩니다. 답안은 자동 저장되니 안심하세요 😊</p>
        </div>
      </div>
    </div>
  );
} 