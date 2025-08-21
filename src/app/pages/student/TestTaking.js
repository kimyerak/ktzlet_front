'use client';

import { useState, useEffect } from 'react';
import { quizService, vocabService } from '../../services/apiService'; // vocabService 추가
import { ttsService, sttService } from '../../services/ttsService'; // TTS & STT 서비스 추가

export default function TestTaking({ testData, onSubmit, onBack, user }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(testData.timeLimitSec || testData.time_limit_sec || testData.timeLimit * 60); // 초 단위
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  // generatedOptions 제거 - 백엔드에서 받은 options 직접 사용

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
            // vocab 정보가 없는 문제들을 위해 vocab 정보 추가
            const questionsWithVocab = await enrichQuestionsWithVocab(quizDetail.questions);
            setQuestions(questionsWithVocab);
            // 4지선다 문제의 options 확인
            checkQuestionsOptions(questionsWithVocab);
          } else {
            console.warn('퀴즈에 문제가 없습니다.');
            setQuestions([]);
          }
                } else if (testData.questions) {
          // vocab 정보가 없는 문제들을 위해 vocab 정보 추가
          const questionsWithVocab = await enrichQuestionsWithVocab(testData.questions);
          setQuestions(questionsWithVocab);
          // 4지선다 문제의 options 확인
          checkQuestionsOptions(questionsWithVocab);
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

  // vocab 정보를 추가하는 함수
  const enrichQuestionsWithVocab = async (questionList) => {
    const enrichedQuestions = [];
    
    for (const question of questionList) {
      if (question.vocabId && !question.vocab) {
        try {
          console.log(`문제 ${question.id}의 vocabId: ${question.vocabId}`);
          
          // 실제 API 호출로 vocab 정보 가져오기
          const vocabResponse = await vocabService.getVocabById(question.vocabId);
          console.log(`vocabId ${question.vocabId}의 API 응답:`, vocabResponse);
          
          if (vocabResponse && vocabResponse.data) {
            question.vocab = vocabResponse.data;
            console.log(`문제 ${question.id}에 vocab 정보 추가:`, vocabResponse.data);
          } else {
            console.warn(`vocabId ${question.vocabId}에 해당하는 vocab 정보가 없음`);
            
            // API 호출 실패 시 fallback으로 하드코딩된 데이터 사용
            const fallbackVocabData = {
              1: { word: 'apple', definition: '사과' },
              2: { word: 'banana', definition: '바나나' },
              3: { word: 'speak', definition: '말하다' },
              4: { word: 'fat', definition: '뚱뚱한' },
              5: { word: 'book', definition: '책' },
              6: { word: 'house', definition: '집' },
              7: { word: 'water', definition: '물' },
              8: { word: 'tree', definition: '나무' },
              9: { word: 'car', definition: '자동차' },
              10: { word: 'phone', definition: '전화' },
              11: { word: 'guide', definition: '가이드' },
              12: { word: 'teacher', definition: '선생님' },
              13: { word: 'student', definition: '학생' },
              14: { word: 'friend', definition: '친구' },
              15: { word: 'family', definition: '가족' },
              16: { word: 'school', definition: '학교' },
              17: { word: 'hospital', definition: '병원' },
              18: { word: 'restaurant', definition: '식당' },
              19: { word: 'library', definition: '도서관' },
              20: { word: 'park', definition: '공원' }
            };
            
            const fallbackVocab = fallbackVocabData[question.vocabId];
            if (fallbackVocab) {
              question.vocab = fallbackVocab;
              console.log(`문제 ${question.id}에 fallback vocab 정보 추가:`, fallbackVocab);
            }
          }
        } catch (error) {
          console.error(`문제 ${question.id}의 vocab 정보 로드 실패:`, error);
          
          // 에러 발생 시에도 fallback 데이터 사용
          const fallbackVocabData = {
            1: { word: 'apple', definition: '사과' },
            2: { word: 'banana', definition: '바나나' },
            3: { word: 'speak', definition: '말하다' },
            4: { word: 'fat', definition: '뚱뚱한' },
            5: { word: 'book', definition: '책' },
            6: { word: 'house', definition: '집' },
            7: { word: 'water', definition: '물' },
            8: { word: 'tree', definition: '나무' },
            9: { word: 'car', definition: '자동차' },
            10: { word: 'phone', definition: '전화' },
            11: { word: 'guide', definition: '가이드' },
            12: { word: 'teacher', definition: '선생님' },
            13: { word: 'student', definition: '학생' },
            14: { word: 'friend', definition: '친구' },
            15: { word: 'family', definition: '가족' },
            16: { word: 'school', definition: '학교' },
            17: { word: 'hospital', definition: '병원' },
            18: { word: 'restaurant', definition: '식당' },
            19: { word: 'library', definition: '도서관' },
            20: { word: 'park', definition: '공원' }
          };
          
          const fallbackVocab = fallbackVocabData[question.vocabId];
          if (fallbackVocab) {
            question.vocab = fallbackVocab;
            console.log(`문제 ${question.id}에 에러 후 fallback vocab 정보 추가:`, fallbackVocab);
          }
        }
      }
      enrichedQuestions.push(question);
    }
    
    return enrichedQuestions;
  };

  // 4지선다 문제의 options 확인 (디버깅용)
  const checkQuestionsOptions = (questionList) => {
    console.log('문제 options 확인:', questionList.length, '개 문제');
    
    questionList.forEach((question, index) => {
      if (question.type === 'MULTIPLE' || question.type === 'multiple') {
        console.log(`문제 ${index + 1} (4지선다):`, {
          id: question.id,
          hasOptions: !!(question.options && question.options.length > 0),
          options: question.options,
          correctAnswer: question.correctAnswer
        });
      }
    });
  };

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

  // 받아쓰기 문제 스펠링 읽기 (OpenAI TTS + Web Speech API fallback)
  const playSpelling = async (text) => {
    try {
      setIsPlaying(true);
      
      // 기존 음성 중지
      ttsService.stopSpeech();
      
      // 받아쓰기 문제의 경우 정답 단어 추출
      let wordToSpeak = text;
      
      // stem에서 영어 단어 추출 시도
      if (currentQuestion && currentQuestion.vocab && currentQuestion.vocab.word) {
        wordToSpeak = currentQuestion.vocab.word;
      } else if (currentQuestion && currentQuestion.correctAnswer) {
        wordToSpeak = currentQuestion.correctAnswer;
      }
      
      console.log('TTS 재생할 단어:', wordToSpeak);
      
      try {
        // OpenAI TTS 시도 (고품질)
        const audioUrl = await ttsService.generateSpeech(wordToSpeak, 'alloy');
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsPlaying(false);
        };
        
        audio.onerror = () => {
          console.warn('OpenAI TTS 실패, Web Speech API로 fallback');
          // OpenAI TTS 실패 시 Web Speech API 사용
          ttsService.speakWithWebAPI(wordToSpeak, 'en-US')
            .then(() => setIsPlaying(false))
            .catch(() => setIsPlaying(false));
        };
        
        audio.play();
      } catch (error) {
        console.warn('OpenAI TTS 오류, Web Speech API로 fallback:', error);
        // OpenAI TTS 실패 시 Web Speech API 사용
        await ttsService.speakWithWebAPI(wordToSpeak, 'en-US');
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('TTS 재생 오류:', error);
      setIsPlaying(false);
      alert('음성 재생에 실패했습니다. 다시 시도해주세요.');
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
          // 4지선다 문제: 인덱스 비교 (API 응답이 string이므로 변환)
          const correctAnswerIndex = parseInt(question.correctAnswer);
          isCorrect = userAnswer === correctAnswerIndex;
          console.log(`4지선다 문제 채점: 선택한 인덱스 ${userAnswer} === 정답 인덱스 ${correctAnswerIndex} = ${isCorrect}`);
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
            // 4지선다 문제: 인덱스 비교 (API 응답이 string이므로 변환)
            const correctAnswerIndex = parseInt(question.correctAnswer);
            isCorrect = userAnswer === correctAnswerIndex;
            console.log(`4지선다 문제 채점: 선택한 인덱스 ${userAnswer} === 정답 인덱스 ${correctAnswerIndex} = ${isCorrect}`);
          }
        }
        
        // 답안 표시 형식 결정
        let userAnswerDisplay = userAnswer;
        let correctAnswerDisplay = question.correctAnswer;
        
        if (question.type === 'MULTIPLE' || question.type === 'multiple') {
          // 4지선다 문제: 인덱스를 A, B, C, D로 표시
          userAnswerDisplay = userAnswer !== undefined && userAnswer !== null ? 
            `${String.fromCharCode(65 + userAnswer)}번` : '미답안';
          correctAnswerDisplay = `${String.fromCharCode(65 + parseInt(question.correctAnswer))}번`;
        } else if (question.type === 'OX' || question.type === 'ox') {
          // OX 문제: 0/1을 O/X로 표시
          userAnswerDisplay = userAnswer === 1 ? 'O (맞음)' : userAnswer === 0 ? 'X (틀림)' : '미답안';
          correctAnswerDisplay = question.correctAnswer === '1' ? 'O (맞음)' : 'X (틀림)';
        }
        
        return {
          questionId: question.id,
          questionText: question.question || question.stem,
          questionType: question.type,
          userAnswer: userAnswerDisplay,
          correctAnswer: correctAnswerDisplay,
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
    const answer = answers[currentQuestion.id] !== undefined ? answers[currentQuestion.id] : '';

    switch (currentQuestion.type) {
      case 'OX':
      case 'ox':
        console.log('Rendering OX question, current answer:', answer, 'type:', typeof answer); // 디버깅 로그
        console.log('Answer === 0:', answer === 0, 'Answer === 1:', answer === 1); // 추가 디버깅
        return (
          <div className="space-y-6">
            {/* OX 문제 설명 */}
            <div className="text-center mb-6">
              <div className="text-lg font-medium text-gray-800 mb-2">
                🔍 단어와 뜻이 올바르게 매치되었나요?
              </div>
              <div className="text-sm text-gray-600">
                아래 단어와 뜻의 연결이 맞으면 O, 틀리면 X를 선택하세요
              </div>
            </div>
            
            {/* 단어:뜻 매치 표시 */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-800 mb-2">
                  {currentQuestion.stem || currentQuestion.question}
                </div>
                <div className="text-sm text-blue-600">
                  이 연결이 올바른가요?
                </div>
              </div>
            </div>
            
            {/* OX 버튼 */}
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
        // 4지선다 문제: 백엔드에서 받은 options 사용 (null 안전 처리)
        let options = currentQuestion.options || [];
        
        // 디버깅: 전체 문제 객체 로그
        console.log('4지선다 문제 전체 객체:', currentQuestion);
        console.log('options 필드:', currentQuestion.options);
        console.log('options 타입:', typeof currentQuestion.options);
        console.log('options 길이:', currentQuestion.options ? currentQuestion.options.length : 'null');
        
                  // 백엔드에서 options가 없으면 임시로 생성 (임시 해결책)
          if (options.length === 0) {
            console.warn('백엔드에서 options가 없어서 임시로 생성합니다:', currentQuestion);
            
            // vocab 정보를 기반으로 임시 options 생성
            const correctWord = currentQuestion.vocab?.word || 'water';
            const commonWords = ['apple', 'banana', 'orange', 'grape', 'milk', 'bread', 'house', 'car', 'book', 'phone'];
            
            // 정답 단어가 commonWords에 있으면 제거
            const filteredWords = commonWords.filter(word => word !== correctWord);
            
            // 4개의 옵션 생성 (정답 + 3개 오답)
            const tempOptions = [
              correctWord,
              filteredWords[0] || 'cat',
              filteredWords[1] || 'dog', 
              filteredWords[2] || 'bird'
            ];
            
            // correctAnswer 인덱스에 맞게 정답을 올바른 위치로 이동
            const correctIndex = parseInt(currentQuestion.correctAnswer);
            if (correctIndex >= 0 && correctIndex < tempOptions.length && correctIndex !== 0) {
              const correctOption = tempOptions[0];
              tempOptions[0] = tempOptions[correctIndex];
              tempOptions[correctIndex] = correctOption;
            }
            
            options = tempOptions;
            console.log('임시 생성된 options:', options);
            console.log('정답 단어:', correctWord);
            console.log('정답 인덱스:', correctIndex);
          }
        
        // 디버깅 로그
        console.log('4지선다 문제 렌더링:', {
          questionId: currentQuestion.id,
          options: options,
          correctAnswer: currentQuestion.correctAnswer,
          currentAnswer: answer,
          vocab: currentQuestion.vocab,
          questionText: currentQuestion.stem || currentQuestion.question
        });
        
        return (
          <div className="space-y-4">
            <div className="text-lg font-medium text-gray-800 mb-4">
              📝 4지선다 - 정답을 선택하세요
            </div>
            {options.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 p-4 border border-gray-300 rounded-2xl hover:bg-gray-50 cursor-pointer transition-all">
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={index}
                  checked={answer === index}
                  onChange={(e) => {
                    console.log('선지 클릭됨:', { 
                      questionId: currentQuestion.id, 
                      selectedIndex: index, 
                      selectedValue: e.target.value,
                      currentAnswer: answer,
                      answerType: typeof answer
                    });
                    saveAnswer(currentQuestion.id, parseInt(e.target.value));
                  }}
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
      {/* 상단 헤더 */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-indigo-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* 사용자 정보 및 로그아웃 */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-bold text-gray-800">
                AI 교육 플랫폼 ❤️
              </h2>
              <p className="text-gray-600">
                안녕하세요, {user?.name || '학생'}님! 🎓
              </p>
            </div>
            <button
              onClick={onBack}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-colors"
            >
              로그아웃
            </button>
          </div>
          
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