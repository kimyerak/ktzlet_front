'use client';

import { useState, useEffect } from 'react';
import Header from '../../ui/Header';
import { quizService } from '../../services/apiService'; // 추가: quizService import

export default function TestTaking({ testData, onSubmit, onBack, user }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(testData.timeLimitSec || testData.time_limit_sec || testData.timeLimit * 60); // 초 단위
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // 문제 목록이 없으면 빈 배열로 초기화
  const safeQuestions = questions.length > 0 ? questions : (testData.questions || []);

  const currentQuestion = safeQuestions[currentQuestionIndex];

  // 문제 목록 로드
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        if (testData.quizId && !testData.questions) {
          // 새로운 API: 퀴즈 상세 조회 시 questions 포함
          const quizDetail = await quizService.getQuizById(testData.quizId);
          console.log('퀴즈 상세 데이터:', quizDetail);
          
          if (quizDetail.questions && quizDetail.questions.length > 0) {
            setQuestions(quizDetail.questions);
          } else {
            console.warn('퀴즈에 문제가 없습니다.');
            setQuestions([]);
          }
        } else if (testData.questions) {
          setQuestions(testData.questions);
        } else {
          console.warn('문제 데이터를 찾을 수 없습니다.');
          setQuestions([]);
        }
      } catch (error) {
        console.error('문제 로드 오류:', error);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [testData.quizId]);

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
    console.log('Saving answer:', { questionId, answer, type: typeof answer }); // 디버깅 로그
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionId]: answer
      };
      console.log('Updated answers:', newAnswers); // 디버깅 로그
      return newAnswers;
    });
  };

  // 다음 문제
  const nextQuestion = () => {
    if (currentQuestionIndex < safeQuestions.length - 1) {
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

    safeQuestions.forEach(question => {
      totalPoints += question.points || 1;
      const userAnswer = answers[question.id];
      
      console.log(`문제 ${question.id} 채점:`, {
        questionType: question.type,
        correctAnswer: question.correctAnswer,
        userAnswer: userAnswer,
        questionText: question.question || question.stem
      });
      
      if (userAnswer !== undefined && userAnswer !== null && userAnswer !== '') {
        let isCorrect = false;
        
        if (question.type === 'OX' || question.type === 'ox') {
          // OX 문제: 정답을 숫자로 변환하여 비교
          const correctAnswer = parseInt(question.correctAnswer);
          isCorrect = userAnswer === correctAnswer;
          console.log(`OX 문제 채점: ${userAnswer} === ${correctAnswer} = ${isCorrect}`);
        } else if (question.type === 'DICTATION' || question.type === 'dictation' || question.type === 'essay') {
          // 받아쓰기 문제: 정확한 철자 비교 (대소문자 무시)
          const correctAnswer = (question.correctAnswer || '').toLowerCase().trim();
          const userAnswerLower = (userAnswer || '').toLowerCase().trim();
          isCorrect = userAnswerLower === correctAnswer;
          console.log(`받아쓰기 문제 채점: "${userAnswerLower}" === "${correctAnswer}" = ${isCorrect}`);
        } else if (question.type === 'MULTIPLE' || question.type === 'multiple') {
          // 4지선다 문제: 선택한 영어 단어가 정답인지 확인
          const selectedOption = question.options && question.options[userAnswer];
          const correctOption = question.options && question.options[question.correctAnswer];
          isCorrect = selectedOption === correctOption;
          console.log(`4지선다 문제 채점: 선택한 "${selectedOption}" === 정답 "${correctOption}" = ${isCorrect}`);
        }
        
        if (isCorrect) {
          correctAnswers++;
          earnedPoints += question.points || 1;
        }
      }
    });

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    
    // 합격점수 확인 (다양한 필드명 확인)
    const passingScore = testData.targetScore || testData.target_score || testData.passingScore || 70;
    const isPassed = percentage >= passingScore;
    
    console.log(`합격 판정: ${percentage}점 >= ${passingScore}점 = ${isPassed}`);

    return {
      correctAnswers,
      totalQuestions: safeQuestions.length,
      earnedPoints,
      totalPoints,
      percentage,
      isPassed,
      passingScore // 합격점수도 함께 반환
    };
  };

  // 제출
  const handleSubmit = () => {
    if (isSubmitted) return;

    const unansweredQuestions = safeQuestions.filter(q => 
      answers[q.id] === undefined || answers[q.id] === null || answers[q.id] === ''
    );

    if (unansweredQuestions.length > 0) {
      const confirmSubmit = confirm(
        `${unansweredQuestions.length}개의 문제가 답이 입력되지 않았습니다. 정말 제출하시겠습니까?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitted(true);
    
    const scoreResult = calculateScore();
    
    // 디버깅용 로그
    console.log('Score calculation debug:', {
      questions: safeQuestions,
      answers,
      scoreResult,
      timeSpent: Math.max(0, (testData.timeLimitSec || testData.time_limit_sec || testData.timeLimit * 60) - timeRemaining)
    });
    
    const submissionData = {
      testId: testData.quizId || testData.id,
      title: testData.quizTitle || testData.title || testData.subject || '새 테스트',
      userId: user?.id, // 현재 로그인한 학생의 ID 추가
      answers,
      submittedAt: new Date().toISOString(),
      timeSpent: Math.max(0, (testData.timeLimitSec || testData.time_limit_sec || testData.timeLimit * 60) - timeRemaining),
      score: scoreResult,
      // 오답 분석을 위한 상세 정보 추가
      questionResults: safeQuestions.map(question => {
        const userAnswer = answers[question.id];
        let isCorrect = false;
        
        if (userAnswer !== undefined && userAnswer !== null && userAnswer !== '') {
          if (question.type === 'OX' || question.type === 'ox') {
            const correctAnswer = parseInt(question.correctAnswer);
            isCorrect = userAnswer === correctAnswer;
          } else if (question.type === 'DICTATION' || question.type === 'dictation' || question.type === 'essay') {
            const correctAnswer = (question.correctAnswer || '').toLowerCase().trim();
            const userAnswerLower = (userAnswer || '').toLowerCase().trim();
            isCorrect = userAnswerLower === correctAnswer;
          } else if (question.type === 'MULTIPLE' || question.type === 'multiple') {
            // 4지선다 문제: 선택한 영어 단어가 정답인지 확인
            const selectedOption = question.options && question.options[userAnswer];
            const correctOption = question.options && question.options[question.correctAnswer];
            isCorrect = selectedOption === correctOption;
          }
        }
        
        return {
          questionId: question.id,
          questionText: question.question || question.stem,
          questionType: question.type,
          userAnswer: userAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect: isCorrect,
          points: question.points || 1,
          vocab: question.vocab // vocab 정보가 있으면 포함
        };
      })
    };

    onSubmit(submissionData);
  };

    // 문제 렌더링
  const renderQuestion = () => {
    const answer = answers[currentQuestion.id] || '';

    switch (currentQuestion.type) {
      case 'OX':
      case 'ox':
        console.log('Rendering OX question, current answer:', answer, 'type:', typeof answer); // 디버깅 로그
        console.log('Answer === 0:', answer === 0, 'Answer === 1:', answer === 1); // 추가 디버깅
        return (
          <div className="flex space-x-6 justify-center">
            <button
              onClick={() => {
                console.log('맞음(O) 버튼 클릭됨'); // 디버깅 로그
                saveAnswer(currentQuestion.id, 1);
              }}
              className={`px-12 py-8 rounded-3xl border-3 font-bold text-2xl transition-all ${
                (answer === 1 || answer === '1')
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-gray-300 hover:border-green-400 text-gray-800'
              }`}
            >
              ⭕ 맞음 (O)
            </button>
            <button
              onClick={() => {
                console.log('틀림(X) 버튼 클릭됨'); // 디버깅 로그
                saveAnswer(currentQuestion.id, 0);
              }}
              className={`px-12 py-8 rounded-3xl border-3 font-bold text-2xl transition-all ${
                (answer === 0 || answer === '0')
                  ? 'border-red-500 bg-red-500 text-white'
                  : 'border-gray-300 hover:border-red-400 text-gray-800'
              }`}
            >
              ❌ 틀림 (X)
            </button>
          </div>
        );

      case 'DICTATION':
      case 'dictation':
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
                  onClick={() => playSpelling(currentQuestion.stem || currentQuestion.question)}
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

      case 'MULTIPLE':
      case 'multiple':
        return (
          <div className="space-y-4">
            <div className="text-lg font-medium text-gray-800 mb-4">
              📝 4지선다 - 정답을 선택하세요
            </div>
            {currentQuestion.options && currentQuestion.options.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 p-4 border border-gray-300 rounded-2xl hover:bg-gray-50 cursor-pointer transition-all">
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={index}
                  checked={answer === index}
                  onChange={(e) => saveAnswer(currentQuestion.id, parseInt(e.target.value))}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="text-lg text-gray-800 font-medium">
                  {String.fromCharCode(65 + index)}. {option}
                </span>
              </label>
            ))}
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <div className="text-2xl text-gray-500 mb-2">⚠️</div>
            <div className="text-gray-600">지원하지 않는 문제 유형입니다.</div>
          </div>
        );
    }
  };

  // 로딩 중일 때 표시
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100">
        <Header user={user} onHomeClick={onBack} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">📚</div>
            <div className="text-2xl font-bold text-gray-800 mb-2">문제를 불러오는 중...</div>
            <div className="text-gray-600">잠시만 기다려주세요</div>
          </div>
        </div>
      </div>
    );
  }

  // 문제가 없을 때 표시
  if (safeQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100">
        <Header user={user} onHomeClick={onBack} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <div className="text-2xl font-bold text-gray-800 mb-2">문제를 불러올 수 없습니다</div>
            <div className="text-gray-600">문제가 없거나 로드 중 오류가 발생했습니다</div>
            <button
              onClick={onBack}
              className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-colors"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100">
      <Header user={user} onHomeClick={onBack} />
      
      {/* 상단 헤더 */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-indigo-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                📝 {testData.quizTitle || testData.title || testData.subject || '새 테스트'}
              </h1>
              <p className="text-gray-700">
                문제 {currentQuestionIndex + 1} / {safeQuestions.length}
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
            {safeQuestions.map((question, index) => (
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
                    {currentQuestion.type === 'OX' || currentQuestion.type === 'ox' ? 'OX문제' : 
                     currentQuestion.type === 'MULTIPLE' || currentQuestion.type === 'multiple' ? '4지선다' : '받아쓰기'}
                  </span>
                  <span>{currentQuestion.points || 1}점</span>
                </div>
            </div>
          </div>

          {/* 문제 내용 */}
          <div className="mb-8">
            <div className="text-xl leading-relaxed text-gray-800 bg-gray-50 p-6 rounded-2xl">
              {currentQuestion.stem || currentQuestion.question}
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
                {currentQuestionIndex + 1} / {safeQuestions.length}
              </span>
            </div>

            <button
              onClick={nextQuestion}
              disabled={currentQuestionIndex === safeQuestions.length - 1}
              className={`px-6 py-3 rounded-2xl font-medium transition-all ${
                currentQuestionIndex === safeQuestions.length - 1
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
          <p>시간이 부족하면 자동으로 제출됩니다. 답안은 자동 저장되니 안심하세요 ��</p>
        </div>
      </div>
    </div>
  );
} 