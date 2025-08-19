'use client';

import { useState, useRef, useMemo, useEffect } from 'react';

export default function TestCreation({ testConfig, onBack, onSubmit, user }) {
  // testConfig가 null일 때 기본값 제공
  const safeTestConfig = testConfig || {
    title: '새 테스트',
    numofquestion: 2,
    time_limit_sec: 3600,
    open_at: '',
    close_at: '',
    target_score: 70,
    questions: [] // questions 배열 추가
  };
  const normalizeQuestion = (q, id) => ({
    id: id || q?.id || Date.now() + Math.random(), // 고유 ID 보장
    type: q?.type || 'multiple',
    question: q?.question || '',
    options: Array.isArray(q?.options) && q.options.length ? q.options : ['', '', '', ''],
    correctAnswer: q?.correctAnswer ?? 0,
    explanation: q?.explanation || '',
    points: q?.points ?? 1,
  });

  const initialQuestions = useMemo(() => {
    if (!safeTestConfig) return []; // safeTestConfig가 없으면 빈 배열 반환
    
    const existing = Array.isArray(safeTestConfig.questions) ? safeTestConfig.questions : [];
    const count = safeTestConfig.numofquestion || 2; // 기본값 추가
    const arr = Array.from({ length: count }, (_, index) => {
      const existingQ = existing[index];
      return normalizeQuestion(existingQ, index + 1);
    });
    return arr;
  }, [safeTestConfig]);

  const [questions, setQuestions] = useState([]); // 빈 배열로 초기화

  // safeTestConfig가 변경될 때 questions 업데이트
  useEffect(() => {
    if (!safeTestConfig) return; // safeTestConfig가 없으면 리턴
    
    const existing = Array.isArray(safeTestConfig.questions) ? safeTestConfig.questions : [];
    const count = safeTestConfig.numofquestion || 2; // 기본값 추가
    
    const arr = Array.from({ length: count }, (_, index) => {
      const existingQ = existing[index];
      return normalizeQuestion(existingQ, index + 1);
    });
    
    // 항상 업데이트하도록 변경 (안전성을 위해)
    setQuestions(arr);
  }, [safeTestConfig]);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  
  // questions가 변경될 때 currentQuestion이 유효한 범위인지 확인
  useEffect(() => {
    if (questions.length > 0 && currentQuestion >= questions.length) {
      setCurrentQuestion(0);
    }
  }, [questions.length, currentQuestion]);
  const questionRefs = useRef([]);

  const updateQuestion = (index, field, value) => {
    setQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    ));
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setQuestions(prev => prev.map((q, i) => 
      i === questionIndex 
        ? { ...q, options: q.options.map((opt, oi) => oi === optionIndex ? value : opt) }
        : q
    ));
  };

  const scrollToQuestion = (index) => {
    questionRefs.current[index]?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
    setCurrentQuestion(index);
  };

  const handleSubmit = () => {
    // questions가 비어있으면 리턴
    if (!questions || questions.length === 0) {
      alert('문제가 로딩되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    // 유효성 검사
    const invalidQuestions = questions.filter(q => 
      !q || !q.question || !q.question.trim() || 
      (q.type === 'multiple' && q.options && q.options.some(opt => !opt.trim()))
    );

    if (invalidQuestions.length > 0) {
      alert(`${invalidQuestions.length}개의 문제가 완성되지 않았습니다. 모든 문제를 완성해주세요! 📝`);
      return;
    }

    const testData = {
      ...safeTestConfig,
      questions,
      createdAt: safeTestConfig?.createdAt || new Date().toISOString(),
      // 편집 모드일 때만 id 포함
      ...(safeTestConfig?.id && { id: safeTestConfig.id })
    };
    
    // 새 테스트 생성 시 id 제거
    if (!safeTestConfig?.id) {
      delete testData.id;
    }

    onSubmit(testData);
  };

  const renderQuestionEditor = (question, index) => {
    // question이 없으면 null 반환
    if (!question) return null;
    
    const questionId = question.id || index + 1; // 안전한 ID 사용
    
    return (
      <div
        key={questionId}
        ref={el => questionRefs.current[index] = el}
        className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-blue-200 mb-8"
      >
        {/* 문제 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            📋 문제 {questionId}번
          </h3>
          <div className="flex items-center space-x-4">
            {/* 문제 유형 선택 */}
            <select
              value={question.type}
              onChange={(e) => updateQuestion(index, 'type', e.target.value)}
              className="px-4 py-2 rounded-2xl border border-gray-300 focus:border-blue-500 outline-none text-gray-800 font-medium"
            >
              <option value="multiple" className="text-gray-800">4지선다</option>
              <option value="essay" className="text-gray-800">받아쓰기</option>
              <option value="ox" className="text-gray-800">OX 문제</option>
            </select>
            
            {/* 배점 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">배점:</span>
              <input
                type="number"
                min="1"
                max="10"
                value={question.points}
                onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value))}
                className="w-16 px-2 py-1 rounded-lg border border-gray-300 focus:border-blue-500 outline-none text-center text-gray-800"
              />
              <span className="text-sm text-gray-700">점</span>
            </div>
          </div>
        </div>

        {/* 문제 내용 */}
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-700 mb-3">
            ❓ 문제
          </label>
          <textarea
            value={question.question}
            onChange={(e) => updateQuestion(index, 'question', e.target.value)}
            placeholder="문제를 입력하세요..."
            className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-500 outline-none resize-none text-gray-800"
            rows={3}
          />
        </div>

        {/* 문제 유형별 템플릿 */}
        {question.type === 'multiple' && (
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-700 mb-3">
              📝 선택지 (정답 선택: {question.correctAnswer + 1}번)
            </label>
            <div className="space-y-3">
              {question.options.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => updateQuestion(index, 'correctAnswer', optIndex)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold transition-all ${
                      question.correctAnswer === optIndex
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {optIndex + 1}
                  </button>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, optIndex, e.target.value)}
                    placeholder={`${optIndex + 1}번 선택지`}
                    className="flex-1 px-4 py-2 rounded-2xl border border-gray-300 focus:border-blue-500 outline-none text-gray-800"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {question.type === 'ox' && (
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-700 mb-3">
              ⭕❌ 정답 선택
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => updateQuestion(index, 'correctAnswer', 1)}
                className={`px-8 py-4 rounded-2xl border-2 font-bold transition-all ${
                  question.correctAnswer === 1
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-green-400'
                }`}
              >
                ⭕ 맞음 (O)
              </button>
              <button
                type="button"
                onClick={() => updateQuestion(index, 'correctAnswer', 0)}
                className={`px-8 py-4 rounded-2xl border-2 font-bold transition-all ${
                  question.correctAnswer === 0
                    ? 'bg-red-500 border-red-500 text-white'
                    : 'border-gray-300 hover:border-red-400'
                }`}
              >
                ❌ 틀림 (X)
              </button>
            </div>
          </div>
        )}

        {question.type === 'essay' && (
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-700 mb-3">
              ✍️ 모범 답안 (채점 기준)
            </label>
            <textarea
              value={question.correctAnswer}
              onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
              placeholder="모범 답안이나 채점 기준을 입력하세요..."
              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-500 outline-none resize-none text-gray-800"
              rows={3}
            />
          </div>
        )}

        {/* 해설 */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-3">
            💡 해설 (선택사항)
          </label>
          <textarea
            value={question.explanation}
            onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
            placeholder="문제 해설을 입력하세요..."
            className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-500 outline-none resize-none text-gray-800"
            rows={2}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100">
      {/* 메인 컨텐츠 */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="pt-8">
          {/* 현재 문제만 표시 */}
          {questions.length > 0 && questions[currentQuestion] ? (
            renderQuestionEditor(questions[currentQuestion], currentQuestion)
          ) : (
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-blue-200">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">문제를 로딩 중입니다...</p>
              </div>
            </div>
          )}
          
          {/* 하단 네비게이션 */}
          <div className="flex justify-between items-center mt-8">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className={`px-6 py-3 rounded-2xl transition-colors ${
                currentQuestion === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              ← 이전 문제
            </button>
            
            <div className="flex space-x-2">
              {questions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`px-3 py-2 rounded-full font-medium transition-all ${
                    currentQuestion === index
                      ? 'bg-blue-500 text-white'
                      : question && question.question && question.question.trim()
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                disabled={currentQuestion === questions.length - 1}
                className={`px-6 py-3 rounded-2xl transition-colors ${
                  currentQuestion === questions.length - 1
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                다음 문제 →
              </button>
              
              <button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold px-6 py-3 rounded-2xl hover:shadow-lg transition-all"
              >
                🎯 {safeTestConfig?.id ? '수정 저장' : '테스트 완성!'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 