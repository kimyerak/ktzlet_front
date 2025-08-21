'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { vocabService, quizService } from '../../services/apiService';

export default function TestCreation({ testConfig, onBack, onSubmit, user }) {
  const [vocabs, setVocabs] = useState([]); // vocab 목록
  const [selectedVocabs, setSelectedVocabs] = useState([]); // 선택된 vocab들
  const [loading, setLoading] = useState(true);
  
  // vocab 목록 로드
  useEffect(() => {
    const loadVocabs = async () => {
      try {
        const vocabList = await vocabService.getVocabs();
        console.log('Loaded vocabs:', vocabList);
        setVocabs(vocabList);
      } catch (error) {
        console.error('Vocab 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadVocabs();
  }, []);
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
  
  console.log('TestCreation testConfig:', testConfig);
  console.log('TestCreation safeTestConfig:', safeTestConfig);
  console.log('TestCreation safeTestConfig.id:', safeTestConfig.id);
  const normalizeQuestion = (q, id) => ({
    id: id || q?.id || Date.now() + Math.random(), // 고유 ID 보장
    type: q?.type || 'dictation', // essay -> dictation으로 변경
    question: q?.question || '',
    correctAnswer: q?.correctAnswer ?? '',
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
  const [savedQuestions, setSavedQuestions] = useState([]); // 저장된 문제들
  const [savingQuestion, setSavingQuestion] = useState(false); // 문제 저장 중 상태

  // safeTestConfig가 변경될 때 questions 업데이트
  useEffect(() => {
    if (!safeTestConfig) return; // safeTestConfig가 없으면 리턴
    
    // 기존 문제들이 있는 경우 (편집 모드)
    if (safeTestConfig.questions && Array.isArray(safeTestConfig.questions) && safeTestConfig.questions.length > 0) {
      console.log('기존 문제들 로드:', safeTestConfig.questions);
      const existingQuestions = safeTestConfig.questions.map((q, index) => ({
        id: q.id || index + 1,
        type: q.type || 'dictation',
        vocabId: q.vocabId,
        question: q.question || q.stem || '',
        correctAnswer: q.correctAnswer || '',
        explanation: q.explanation || '',
        points: q.points || 1,
        vocab: q.vocab
      }));
      
      setQuestions(existingQuestions);
      
      // 편집 모드인 경우 기존 문제들을 savedQuestions에 미리 로드
      if (safeTestConfig.id) {
        setSavedQuestions(existingQuestions.map(q => ({ ...q, saved: true })));
        console.log('기존 문제들을 저장된 상태로 설정');
      }
      
      return;
    }
    
    // 선택된 vocab이 있으면 자동으로 문제 생성
    if (safeTestConfig.selectedVocabs && safeTestConfig.selectedVocabs.length > 0) {
      const generatedQuestions = safeTestConfig.selectedVocabs.map((vocab, index) => {
        return {
          id: index + 1,
          type: 'dictation', // 받아쓰기 문제로 생성 (백엔드 타입명 사용)
          vocabId: vocab.id,
          question: `다음 단어를 듣고 정확한 철자로 입력하세요: `,
          correctAnswer: vocab.word, // 정답은 영단어
          explanation: `${vocab.word}는 ${vocab.definition}을 의미합니다.`,
          points: 1,
          vocab: vocab // vocab 정보 저장
        };
      });
      
      setQuestions(generatedQuestions);
      
      // 편집 모드인 경우 기존 문제들을 savedQuestions에 미리 로드
      if (safeTestConfig.id) {
        setSavedQuestions(generatedQuestions.map(q => ({ ...q, saved: true })));
      }
      
      return;
    }
    
    // vocab이 없으면 기본 문제 생성
    const existing = Array.isArray(safeTestConfig.questions) ? safeTestConfig.questions : [];
    const count = safeTestConfig.numofquestion || 2; // 기본값 추가
    
    const arr = Array.from({ length: count }, (_, index) => {
      const existingQ = existing[index];
      return normalizeQuestion(existingQ, index + 1);
    });
    
    // 항상 업데이트하도록 변경 (안전성을 위해)
    setQuestions(arr);
    
    // 편집 모드인 경우 기존 문제들을 savedQuestions에 미리 로드
    if (safeTestConfig.id && arr.length > 0) {
      setSavedQuestions(arr.map(q => ({ ...q, saved: true })));
    }
  }, [safeTestConfig]);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  
  // questions가 변경될 때 currentQuestion이 유효한 범위인지 확인
  useEffect(() => {
    if (questions.length > 0 && currentQuestion >= questions.length) {
      setCurrentQuestion(0);
    }
  }, [questions.length, currentQuestion]);

  // 모든 문제가 완성되었는지 확인
  const areAllQuestionsComplete = () => {
    if (questions.length === 0) return false;
    
    return questions.every(question => 
      question && 
      question.question && 
      question.question.trim() && 
      question.vocabId &&
      question.correctAnswer !== undefined && 
      question.correctAnswer !== null && 
      question.correctAnswer !== ''
    );
  };

  // 나가기 시도 시 경고
  const handleExitAttempt = async () => {
    const completedQuestions = questions.filter(q => 
      q && q.question && q.question.trim() && q.vocabId && q.correctAnswer !== undefined && q.correctAnswer !== null && q.correctAnswer !== ''
    );
    
    if (completedQuestions.length < questions.length) {
      const incompleteCount = questions.length - completedQuestions.length;
      const confirmExit = confirm(
        `아직 ${incompleteCount}개의 질문이 모두 작성되지 않았어요!\n\n그래도 나가시겠어요? 그러면 저장되지 않습니다!`
      );
      
      if (confirmExit) {
        // 퀴즈 삭제
        if (safeTestConfig.id) {
          try {
            console.log('미완성 퀴즈 삭제 시작:', safeTestConfig.id);
            await quizService.deleteQuiz(safeTestConfig.id);
            console.log('미완성 퀴즈 삭제 완료');
          } catch (error) {
            console.error('퀴즈 삭제 오류:', error);
          }
        }
        onBack();
      }
    } else {
      onBack();
    }
  };
  const questionRefs = useRef([]);

  const updateQuestion = (index, field, value) => {
    setQuestions(prev => {
      const updated = prev.map((q, i) => {
        if (i === index) {
          const newQuestion = { ...q, [field]: value };
          
          // 문제 유형이 변경되면 자동으로 문제 내용 채우기
          if (field === 'type' && value !== q.type) {
            const vocab = newQuestion.vocab;
            if (vocab) {
              switch (value) {
                case 'dictation':
                  newQuestion.question = `이 단어를 듣고 스펠링을 쓰시오: "${vocab.word}"`;
                  newQuestion.correctAnswer = vocab.word;
                  newQuestion.explanation = `${vocab.word}는 ${vocab.definition}을 의미합니다.`;
                  break;
                  
                case 'ox':
                  // 랜덤하게 O 또는 X 결정 (50% 확률)
                  const isCorrect = Math.random() > 0.5;
                  if (isCorrect) {
                    newQuestion.question = `${vocab.word}는 ${vocab.definition}이다.`;
                    newQuestion.correctAnswer = 1; // O
                  } else {
                    // 다른 단어의 뜻을 사용해서 틀린 문장 만들기
                    const otherVocabs = vocabs.filter(v => v.id !== vocab.id);
                    const randomVocab = otherVocabs[Math.floor(Math.random() * otherVocabs.length)];
                    if (randomVocab) {
                      newQuestion.question = `${vocab.word}는 ${randomVocab.definition}이다.`;
                      newQuestion.correctAnswer = 0; // X
                    } else {
                      newQuestion.question = `${vocab.word}는 ${vocab.definition}이 아니다.`;
                      newQuestion.correctAnswer = 0; // X
                    }
                  }
                  newQuestion.explanation = `${vocab.word}는 ${vocab.definition}을 의미합니다.`;
                  break;
                  
                case 'multiple':
                  // 4지선다 문제 생성 (한국어 뜻을 문제로, 영어 단어를 선지로)
                  const otherVocabs = vocabs.filter(v => v.id !== vocab.id);
                  const shuffledVocabs = [...otherVocabs].sort(() => Math.random() - 0.5);
                  const options = [
                    vocab.word, // 정답 (영어 단어)
                    ...shuffledVocabs.slice(0, 3).map(v => v.word) // 오답 3개 (영어 단어)
                  ].sort(() => Math.random() - 0.5); // 옵션 순서 섞기
                  
                  const correctIndex = options.indexOf(vocab.word);
                  
                  newQuestion.question = `${vocab.definition} - 이 뜻을 가진 단어는?`;
                  newQuestion.correctAnswer = correctIndex;
                  newQuestion.options = options;
                  newQuestion.explanation = `${vocab.definition}는 ${vocab.word}을 의미합니다.`;
                  break;
              }
            }
          }
          
          return newQuestion;
        }
        return q;
      });
      return updated;
    });
  };

  // 개별 문제 저장 함수
  const saveCurrentQuestion = async () => {
    const currentQ = questions[currentQuestion];
    if (!currentQ || !currentQ.question || !currentQ.question.trim()) {
      alert('문제 내용을 입력해주세요!');
      return;
    }
    
    if (!currentQ.vocabId) {
      alert('문제와 관련된 단어장을 선택해주세요!');
      return;
    }

    setSavingQuestion(true);
    try {
      // 현재 문제를 저장된 문제 목록에 추가/업데이트
      setSavedQuestions(prev => {
        const updated = [...prev];
        updated[currentQuestion] = { ...currentQ, saved: true };
        return updated;
      });

      // 다음 문제로 이동
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      }
      
      console.log(`문제 ${currentQuestion + 1} 저장 완료:`, currentQ);
      alert('✅ 문제가 저장되었습니다!');
    } catch (error) {
      console.error('문제 저장 오류:', error);
      alert('문제 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSavingQuestion(false);
    }
  };

  // 모든 문제가 저장되었는지 확인
  const isAllQuestionsSaved = () => {
    console.log('=== 저장 상태 확인 ===');
    console.log('questions:', questions);
    console.log('savedQuestions:', savedQuestions);
    console.log('questions.length:', questions.length);
    console.log('savedQuestions.length:', savedQuestions.length);
    
    // questions 배열의 길이만큼 확인
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const savedQuestion = savedQuestions[i];
      
      console.log(`문제 ${i + 1}:`, {
        hasQuestion: !!question,
        hasContent: question && question.question && question.question.trim(),
        isSaved: savedQuestion && savedQuestion.saved,
        questionContent: question?.question,
        savedQuestionContent: savedQuestion?.question
      });
      
      // 문제가 없거나 내용이 없으면 false
      if (!question || !question.question || !question.question.trim()) {
        console.log(`문제 ${i + 1} 실패: 내용 없음`);
        return false;
      }
      
      // vocabId가 없으면 false
      if (!question.vocabId) {
        console.log(`문제 ${i + 1} 실패: vocabId 없음`);
        return false;
      }
      
      // 저장되지 않았으면 false
      if (!savedQuestion || !savedQuestion.saved) {
        console.log(`문제 ${i + 1} 실패: 저장되지 않음`);
        return false;
      }
    }
    
    console.log('모든 문제 저장됨!');
    return questions.length > 0; // 최소 1개 이상의 문제가 있어야 함
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
    // 모든 문제가 저장되었는지 확인
    if (!isAllQuestionsSaved()) {
      alert('모든 문제를 저장해주세요! 저장되지 않은 문제가 있습니다.');
      return;
    }
    
    // 저장된 문제들 사용
    const finalQuestions = savedQuestions.filter(q => q && q.saved);
    
    if (finalQuestions.length === 0) {
      alert('저장된 문제가 없습니다. 문제를 작성하고 저장해주세요.');
      return;
    }
    
    // 유효성 검사
    const invalidQuestions = finalQuestions.filter(q => 
      !q || !q.question || !q.question.trim() || 
      (q.type === 'multiple' && q.options && q.options.some(opt => !opt.trim()))
    );

    if (invalidQuestions.length > 0) {
      alert(`${invalidQuestions.length}개의 문제가 완성되지 않았습니다. 모든 문제를 완성해주세요! 📝`);
      return;
    }

    console.log('handleSubmit - safeTestConfig:', safeTestConfig);
    console.log('handleSubmit - safeTestConfig.id:', safeTestConfig?.id);
    
    const testData = {
      ...safeTestConfig,
      questions: finalQuestions,
      createdAt: safeTestConfig?.createdAt || new Date().toISOString()
    };

    console.log('최종 퀴즈 데이터:', testData);
    console.log('최종 퀴즈 데이터의 id:', testData.id);
    
    // 확인 후 제출
    if (confirm('퀴즈를 완성하시겠습니까?')) {
      onSubmit(testData);
    }
  };

  // 선택된 vocab으로 문제 자동 생성
  const generateQuestionsFromVocabs = () => {
    if (selectedVocabs.length === 0) {
      alert('먼저 단어를 선택해주세요!');
      return;
    }
    
    if (selectedVocabs.length < safeTestConfig.numofquestion) {
      alert(`${safeTestConfig.numofquestion}개의 문제를 만들려면 최소 ${safeTestConfig.numofquestion}개의 단어가 필요합니다.\n\n현재 선택된 단어: ${selectedVocabs.length}개\n필요한 단어: ${safeTestConfig.numofquestion}개`);
      return;
    }
    
    // 선택된 vocab들 중에서 문제 수만큼 랜덤 선택
    const shuffled = [...selectedVocabs].sort(() => 0.5 - Math.random());
    const selectedForQuestions = shuffled.slice(0, safeTestConfig.numofquestion);
    
    const generatedQuestions = selectedForQuestions.map((vocabId, index) => {
      const vocab = vocabs.find(v => v.id === vocabId);
      return {
        id: index + 1,
        type: 'dictation', // 기본적으로 받아쓰기로 생성
        vocabId: vocabId, // vocabId는 이미 숫자
        question: `다음 단어를 듣고 정확한 철자로 입력하세요: "${vocab.word}"`,
        correctAnswer: vocab.word,
        explanation: `${vocab.word}는 ${vocab.definition}을 의미합니다.`,
        points: 1,
        vocab: vocab // vocab 정보 저장
      };
    });
    
    setQuestions(generatedQuestions);
    console.log('자동 생성된 문제들:', generatedQuestions);
    alert(`${generatedQuestions.length}개의 문제가 자동 생성되었습니다!`);
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
          <div className="flex items-center space-x-3">
            <h3 className="text-2xl font-bold text-gray-800">
              📋 문제 {questionId}번
            </h3>
            {savedQuestions[index]?.saved && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                ✅ 저장됨
              </span>
            )}
            {!savedQuestions[index]?.saved && question.question && question.question.trim() && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                ⚠️ 저장 필요
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {/* 문제 유형 선택 */}
            <select
              value={question.type}
              onChange={(e) => updateQuestion(index, 'type', e.target.value)}
              className="px-4 py-2 rounded-2xl border border-gray-300 focus:border-blue-500 outline-none text-gray-800 font-medium"
            >
              <option value="dictation" className="text-gray-800">받아쓰기</option>
              <option value="ox" className="text-gray-800">OX 문제</option>
              <option value="multiple" className="text-gray-800">4지선다</option>
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

        {/* 단어장 선택 */}
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-700 mb-3">
            📚 관련 단어장 선택 <span className="text-red-500">*</span>
          </label>
          <select
            value={question.vocabId || ''}
            onChange={(e) => updateQuestion(index, 'vocabId', e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-500 outline-none text-gray-800"
            required
          >
            <option value="">단어장을 선택하세요 (필수)</option>
            {vocabs.map((vocab) => (
              <option key={vocab.id} value={vocab.id}>
                {vocab.word} - {vocab.definition}
              </option>
            ))}
          </select>
          {!question.vocabId && (
            <p className="text-red-500 text-sm mt-2">⚠️ 문제와 관련된 단어장을 선택해야 합니다.</p>
          )}
        </div>

        {/* 문제 내용 */}
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-700 mb-3">
            ❓ 문제
            {question.type === 'dictation' && (
              <button
                type="button"
                onClick={() => {
                  if (question.correctAnswer && 'speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(question.correctAnswer);
                    utterance.lang = 'en-US';
                    utterance.rate = 0.8;
                    speechSynthesis.speak(utterance);
                  }
                }}
                className="ml-4 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                title="정답 단어 듣기"
              >
                🔊 들어보기
              </button>
            )}
          </label>
          <textarea
            value={question.question}
            onChange={(e) => updateQuestion(index, 'question', e.target.value)}
            placeholder="문제를 입력하세요..."
            className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-500 outline-none resize-none text-gray-800"
            rows={3}
          />
        </div>

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

        {question.type === 'dictation' && (
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-700 mb-3">
              ✍️ 정답 (영단어 입력)
            </label>
            <textarea
              value={question.correctAnswer || ''}
              onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
              placeholder="학생이 입력해야 할 정답 영단어를 입력하세요..."
              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-500 outline-none resize-none text-gray-800"
              rows={3}
            />
          </div>
        )}

        {question.type === 'multiple' && (
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-700 mb-3">
              📝 보기 옵션
            </label>
            <div className="space-y-3">
              {[0, 1, 2, 3].map((optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`correct-${index}`}
                      checked={question.correctAnswer === optionIndex}
                      onChange={() => updateQuestion(index, 'correctAnswer', optionIndex)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {String.fromCharCode(65 + optionIndex)}.
                    </span>
                  </div>
                  <input
                    type="text"
                    value={question.options?.[optionIndex] || ''}
                    onChange={(e) => {
                      const newOptions = [...(question.options || ['', '', '', ''])];
                      newOptions[optionIndex] = e.target.value;
                      updateQuestion(index, 'options', newOptions);
                    }}
                    placeholder={`보기 ${optionIndex + 1} 입력...`}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none text-gray-800"
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              💡 정답인 보기를 선택하고, 각 보기의 내용을 입력하세요.
            </p>
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
          {/* 단어 선택 섹션 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-blue-200 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📚 단어 선택</h2>
            <p className="text-gray-600 mb-4">문제에 사용할 단어들을 선택하세요.</p>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-600">단어 목록을 불러오는 중...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                {vocabs.map((vocab) => (
                  <div
                    key={vocab.id}
                    onClick={() => {
                      setSelectedVocabs(prev => 
                        prev.includes(vocab.id) 
                          ? prev.filter(id => id !== vocab.id)
                          : [...prev, vocab.id]
                      );
                    }}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedVocabs.includes(vocab.id)
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-200 hover:border-blue-300 text-gray-700'
                    }`}
                  >
                    <div className="font-medium">{vocab.word}</div>
                    <div className="text-sm text-gray-500">{vocab.definition}</div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                선택된 단어: {selectedVocabs.length}개 | 필요한 문제 수: {safeTestConfig.numofquestion}개
                {console.log('Debug - selectedVocabs:', selectedVocabs, 'numofquestion:', safeTestConfig.numofquestion, 'loading:', loading)}
              </div>
              <button
                onClick={generateQuestionsFromVocabs}
                disabled={loading || selectedVocabs.length === 0}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  loading || selectedVocabs.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {loading ? '🔄 로딩 중...' : '🎲 문제 자동 생성'}
              </button>
            </div>
          </div>

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
                      ? 'bg-blue-500 text-white shadow-lg'
                      : savedQuestions[index]?.saved
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : question && question.question && question.question.trim() && question.vocabId
                      ? 'bg-yellow-400 text-yellow-800 hover:bg-yellow-500'
                      : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                  }`}
                  title={
                    currentQuestion === index
                      ? '현재 문제'
                      : savedQuestions[index]?.saved 
                      ? '저장됨' 
                      : question && question.question && question.question.trim() && question.vocabId
                      ? '수정됨 (저장 필요)'
                      : !question.vocabId
                      ? '단어장 선택 필요'
                      : '미완성'
                  }
                >
                  {index + 1}
                </button>
              ))}
            </div>
            
            <div className="flex space-x-4">
              {currentQuestion < questions.length - 1 ? (
                <button
                  onClick={saveCurrentQuestion}
                  disabled={savingQuestion || !questions[currentQuestion]?.question?.trim() || !questions[currentQuestion]?.vocabId}
                  className={`px-6 py-3 rounded-2xl transition-colors ${
                    savingQuestion || !questions[currentQuestion]?.question?.trim() || !questions[currentQuestion]?.vocabId
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {savingQuestion ? '💾 저장 중...' : '💾 저장하고 다음문제 →'}
                </button>
              ) : (
                <button
                  onClick={saveCurrentQuestion}
                  disabled={savingQuestion || !questions[currentQuestion]?.question?.trim() || !questions[currentQuestion]?.vocabId}
                  className={`px-6 py-3 rounded-2xl transition-colors ${
                    savingQuestion || !questions[currentQuestion]?.question?.trim() || !questions[currentQuestion]?.vocabId
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {savingQuestion ? '💾 저장 중...' : '💾 마지막 문제 저장'}
                </button>
              )}
              
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
                disabled={!isAllQuestionsSaved()}
                className={`px-6 py-3 rounded-2xl transition-colors ${
                  isAllQuestionsSaved()
                    ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                title={
                  isAllQuestionsSaved() 
                    ? '퀴즈 완성하기' 
                    : `저장되지 않은 문제: ${questions.length - savedQuestions.filter(q => q?.saved).length}개`
                }
              >
                🎯 퀴즈 완성
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
