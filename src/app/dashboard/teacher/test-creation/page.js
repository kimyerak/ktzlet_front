'use client';

import { useAuth } from '../../../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import TestCreation from '../../../pages/teacher/TestCreation';
import Header from '../../../ui/Header';
import { quizService, questionService } from '../../../services/apiService';

export default function TestCreationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [testConfig, setTestConfig] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (!loading && user && user.type !== 'teacher') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // URL 파라미터에서 설정 데이터 읽기
    const configParam = searchParams.get('config');
    if (configParam) {
      try {
        const config = JSON.parse(decodeURIComponent(configParam));
        setTestConfig(config);
        
        // 편집 모드인 경우 기존 문제들 로드
        if (config.id) {
          loadExistingQuestions(config.id);
        }
      } catch (error) {
        console.error('설정 데이터 파싱 오류:', error);
        // 기본값으로 설정
        setTestConfig({
          title: '새 테스트',
          numofquestion: 2,
          time_limit_sec: 3600,
          open_at: '',
          close_at: '',
          target_score: 70
        });
      }
    }
  }, [searchParams]);

  // 기존 문제들 로드 함수
  const loadExistingQuestions = async (quizId) => {
    try {
      console.log('기존 문제들 로드 시작:', quizId);
      const existingQuestions = await questionService.getQuestionsByQuiz(quizId);
      console.log('로드된 기존 문제들:', existingQuestions);
      
      // 기존 문제들을 testConfig에 추가
      setTestConfig(prev => ({
        ...prev,
        questions: existingQuestions.map(q => ({
          id: q.id,
          type: q.type === 'DICTATION' ? 'dictation' : 
                q.type === 'OX' ? 'ox' : 
                q.type === 'MULTIPLE_CHOICE' ? 'multiple' : 'dictation',
          question: q.stem,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
          points: q.points || 1,
          vocabId: q.vocabId
        }))
      }));
    } catch (error) {
      console.error('기존 문제 로드 오류:', error);
    }
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (!user || user.type !== 'teacher') {
    return null;
  }

  const handleSubmit = async (testData) => {
    try {
      console.log('=== 퀴즈/문제 저장 디버깅 ===');
      console.log('testData:', testData);
      console.log('user.id:', user.id);
      console.log('questions:', testData.questions);
      console.log('=======================');
      
      let quizId = testData.quizId || testData.id;
      
      if (quizId) {
        // 편집 모드: 기존 퀴즈 업데이트
        console.log('기존 퀴즈 업데이트:', quizId);
        const updateData = {
          title: testData.title,
          numOfQuestions: testData.numofquestion,
          timeLimitSec: testData.time_limit_sec,
          targetScore: testData.target_score,
          openAt: testData.open_at,
          closeAt: testData.close_at,
          createdBy: user.id
        };
        
        await quizService.updateQuiz(quizId, updateData);
        console.log('퀴즈 업데이트 완료');
        
        // 기존 문제들 삭제
        try {
          const existingQuestions = await questionService.getQuestionsByQuiz(quizId);
          console.log(`기존 문제 ${existingQuestions.length}개 삭제 시작`);
          
          for (const question of existingQuestions) {
            await questionService.deleteQuestion(question.id);
            console.log(`문제 ${question.id} 삭제 완료`);
          }
          
          console.log('기존 문제 삭제 완료');
        } catch (deleteError) {
          console.error('기존 문제 삭제 오류:', deleteError);
        }
      } else {
        // 생성 모드: 새 퀴즈 생성
        console.log('새 퀴즈 생성 시작...');
        const quizData = {
          title: testData.title,
          numOfQuestions: testData.numofquestion,
          timeLimitSec: testData.time_limit_sec,
          targetScore: testData.target_score,
          openAt: testData.open_at,
          closeAt: testData.close_at,
          createdBy: user.id
        };
        
        console.log('Creating quiz with data:', quizData);
        const createdQuiz = await quizService.createQuiz(quizData);
        console.log('Quiz created:', createdQuiz);
        quizId = createdQuiz.id;
      }
      
      // 수정된 문제들을 사용하여 문제 생성
      if (testData.questions && testData.questions.length > 0) {
        console.log('수정된 문제들로 문제 생성 시작...');
        
      for (let i = 0; i < testData.questions.length; i++) {
        const question = testData.questions[i];
        
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
              backendType = 'MULTIPLE'; // 백엔드 enum과 일치
              break;
          default:
            backendType = 'DICTATION';
        }
        
        const questionData = {
            quizId: quizId,
          type: backendType,
            stem: question.question, // 수정된 문제 내용 사용
            correctAnswer: question.correctAnswer, // 수정된 정답 사용
            explanation: question.explanation, // 수정된 해설 사용
            points: question.points || 1,
            vocabId: question.vocabId || null
          };
          
          console.log(`문제 ${i + 1} 데이터:`, questionData);
          
          // 문제 생성 API 호출
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
      
      alert('퀴즈가 성공적으로 완성되었습니다!');
      router.push('/dashboard/teacher');
    } catch (error) {
      console.error('퀴즈 생성 오류:', error);
      alert('퀴즈 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100">
      <Header user={user} onHomeClick={() => router.push('/dashboard/teacher')} />
      <TestCreation
        testConfig={testConfig}
        onBack={() => router.push('/dashboard/teacher/test-setup')}
        onSubmit={handleSubmit}
        user={user}
      />
    </div>
  );
} 