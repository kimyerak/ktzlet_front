'use client';

import { useAuth } from '../../../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import TestSetup from '../../../pages/teacher/TestSetup';
import VocabSelection from '../../../pages/teacher/VocabSelection';
import TestCreation from '../../../pages/teacher/TestCreation';
import { quizService } from '../../../services/apiService';
import { questionService } from '../../../services/apiService';

export default function TestSetupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1); // 1: setup, 2: vocab, 3: creation
  const [testConfig, setTestConfig] = useState(null);
  const [initialConfig, setInitialConfig] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (!loading && user && user.type !== 'teacher') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // URL 파라미터에서 편집 데이터 읽기
    const editParam = searchParams.get('edit');
    const configParam = searchParams.get('config');
    
    if (editParam) {
      try {
        const editData = JSON.parse(decodeURIComponent(editParam));
        console.log('편집 모드 데이터:', editData);
        console.log('편집 모드 ID:', editData.id);
        
        // 편집 모드임을 명확히 표시
        const editConfigWithFlag = {
          ...editData,
          isEditMode: true,
          id: editData.id // id가 확실히 포함되도록
        };
        
        console.log('편집 모드 설정:', editConfigWithFlag);
        setInitialConfig(editConfigWithFlag);
        setTestConfig(editConfigWithFlag);
        // 편집 모드일 때는 바로 문제 작성 단계로
        setCurrentStep(3);
      } catch (error) {
        console.error('편집 데이터 파싱 오류:', error);
      }
    } else if (configParam) {
      try {
        const configData = JSON.parse(decodeURIComponent(configParam));
        setTestConfig(configData);
        // vocab이 이미 선택되었다면 문제 작성 단계로
        if (configData.selectedVocabs) {
          setCurrentStep(3);
        } else {
          setCurrentStep(2);
        }
      } catch (error) {
        console.error('설정 데이터 파싱 오류:', error);
      }
    }
  }, [searchParams]);

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (!user || user.type !== 'teacher') {
    return null;
  }

  // 1단계: 기본 설정
  if (currentStep === 1) {
    return (
      <TestSetup
        initialConfig={initialConfig}
        onNext={(config) => {
          setTestConfig(config);
          setCurrentStep(2);
        }}
        onBack={() => router.push('/dashboard/teacher')}
      />
    );
  }

  // 2단계: 단어 선택
  if (currentStep === 2) {
    return (
      <VocabSelection
        testConfig={testConfig}
        onNext={async (configWithVocabs) => {
          try {
            // 단어 선택 후 퀴즈를 미리 생성
            console.log('단어 선택 완료, 퀴즈 생성 시작:', configWithVocabs);
            
            const quizData = {
              title: configWithVocabs.title,
              numOfQuestions: configWithVocabs.numofquestion,
              timeLimitSec: configWithVocabs.time_limit_sec,
              targetScore: configWithVocabs.target_score,
              openAt: configWithVocabs.open_at,
              closeAt: configWithVocabs.close_at,
              createdBy: user.id
            };
            
            console.log('퀴즈 생성 데이터:', quizData);
            const createdQuiz = await quizService.createQuiz(quizData);
            console.log('퀴즈 생성 완료:', createdQuiz);
            
            // 생성된 퀴즈 ID를 포함하여 다음 단계로 전달
            const configWithQuizId = {
              ...configWithVocabs,
              id: createdQuiz.id
            };
            
            setTestConfig(configWithQuizId);
            setCurrentStep(3);
            
          } catch (error) {
            console.error('퀴즈 생성 오류:', error);
            alert('퀴즈 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
          }
        }}
        onBack={() => setCurrentStep(1)}
        user={user}
      />
    );
  }

  // 3단계: 문제 작성
  if (currentStep === 3) {
    return (
      <TestCreation
        testConfig={testConfig}
        onSubmit={async (submittedConfig) => {
          console.log('TestCreation에서 제출됨:', submittedConfig);
          
          try {
            // 백엔드 연결 확인
            try {
              const testResponse = await fetch('/api/test');
              if (!testResponse.ok) {
                throw new Error('백엔드 서버에 연결할 수 없습니다.');
              }
              console.log('백엔드 연결 확인됨');
            } catch (connectionError) {
              console.error('백엔드 연결 오류:', connectionError);
              alert('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
              return;
            }
            
            const quizId = submittedConfig.id;
            
            if (!quizId) {
              throw new Error('퀴즈 ID가 없습니다. 다시 시도해주세요.');
            }
            
            console.log('기존 퀴즈에 문제 추가:', quizId);
            
            // 새로운 문제들 생성
            if (submittedConfig.questions && submittedConfig.questions.length > 0) {
              console.log('새로운 문제들 생성 시작...');
              
              for (let i = 0; i < submittedConfig.questions.length; i++) {
                const question = submittedConfig.questions[i];
                
                // vocabId 검증
                if (!question.vocabId) {
                  console.error(`문제 ${i + 1}에 vocabId가 없습니다:`, question);
                  throw new Error(`문제 ${i + 1}에 관련 단어장이 선택되지 않았습니다.`);
                }
                
                // 프론트엔드 문제 유형을 백엔드 enum에 매핑
                let backendType;
                switch (question.type) {
                  case 'dictation':
                    backendType = 'DICTATION';
                    break;
                  case 'ox':
                    backendType = 'OX';
                    break;
                  case 'multiple':
                    backendType = 'MULTIPLE';
                    break;
                  default:
                    backendType = 'DICTATION';
                }
                
                const questionData = {
                  quizId: quizId,
                  type: backendType,
                  stem: question.question,
                  correctAnswer: String(question.correctAnswer),
                  explanation: question.explanation || '',
                  points: question.points || 1,
                  vocabId: question.vocabId
                };
                
                console.log(`문제 ${i + 1} 생성 데이터:`, questionData);
                
                try {
                  const createdQuestion = await questionService.createQuestion(questionData);
                  console.log(`문제 ${i + 1} 생성 완료:`, createdQuestion);
                } catch (error) {
                  console.error(`문제 ${i + 1} 생성 실패:`, error);
                  throw error;
                }
              }
              
              console.log('모든 문제 생성 완료');
            }
            
            alert('🎉 퀴즈가 성공적으로 완성되었습니다!');
            router.push('/dashboard/teacher');
            
          } catch (error) {
            console.error('퀴즈 처리 오류:', error);
            alert('❌ 퀴즈 처리 중 오류가 발생했습니다.');
          }
        }}
        onBack={async () => {
          // 나가기 시도 시 경고
          const completedQuestions = testConfig?.questions?.filter(q => 
            q && q.question && q.question.trim() && q.vocabId && q.correctAnswer !== undefined && q.correctAnswer !== null && q.correctAnswer !== ''
          ) || [];
          
          if (completedQuestions.length < (testConfig?.questions?.length || 0)) {
            const incompleteCount = (testConfig?.questions?.length || 0) - completedQuestions.length;
            const confirmExit = confirm(
              `아직 ${incompleteCount}개의 질문이 모두 작성되지 않았어요!\n\n그래도 나가시겠어요? 그러면 저장되지 않습니다!`
            );
            
            if (confirmExit) {
              // 퀴즈 삭제
              if (testConfig?.id) {
                try {
                  console.log('미완성 퀴즈 삭제 시작:', testConfig.id);
                  await quizService.deleteQuiz(testConfig.id);
                  console.log('미완성 퀴즈 삭제 완료');
                } catch (error) {
                  console.error('퀴즈 삭제 오류:', error);
                }
              }
              setCurrentStep(2);
            }
          } else {
            setCurrentStep(2);
          }
        }}
        user={user}
      />
    );
  }

  return null;
} 