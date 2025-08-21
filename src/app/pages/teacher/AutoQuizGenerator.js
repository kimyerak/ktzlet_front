'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../ui/Header';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import LoadingSpinner from '../../ui/LoadingSpinner';
import { openaiService } from '../../services/openaiService';
import { vocabService } from '../../services/apiService';


export default function AutoQuizGenerator({ user, onBack }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 설정 상태
  const [userRequest, setUserRequest] = useState('');
  
  // 사용자 입력 단어 목록
  const [userVocabInput, setUserVocabInput] = useState('');
  

  
  // 생성된 데이터 상태
  const [generatedVocabs, setGeneratedVocabs] = useState([]);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState(1); // 1: 설정, 2: 단어 생성, 3: 문제 생성, 4: 완료

  // 설정 변경 핸들러
  const handleRequestChange = (value) => {
    setUserRequest(value);
  };

  // 1단계: 사용자 요청 처리
  const processUserRequest = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('사용자 요청 처리 시작...');
      
      if (!userRequest.trim()) {
        throw new Error('요구사항을 입력해주세요.');
      }
      
      // OpenAI를 사용해서 요청을 처리하고 단어와 문제를 생성
      const result = await openaiService.processUserRequest(userRequest);
      setGeneratedVocabs(result.vocabs);
      setGeneratedQuestions(result.questions);
      setCurrentStep(2); // 2단계(단어 목록 확인)로 이동
      console.log('요청 처리 완료:', result);
    } catch (error) {
      console.error('요청 처리 오류:', error);
      setError(error.message || '요청 처리에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 2단계: 단어들을 DB에 저장
  const saveVocabsToDatabase = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('단어들을 DB에 저장 시작...');
      const savedVocabs = [];
      
      for (const vocab of generatedVocabs) {
        try {
          // 먼저 기존 단어가 있는지 확인
          let existingVocab = null;
          try {
            const searchResults = await vocabService.searchVocabByWord(vocab.word);
            existingVocab = searchResults.find(v => v.word.toLowerCase() === vocab.word.toLowerCase());
          } catch (searchError) {
            console.log(`단어 검색 실패: ${vocab.word}`, searchError);
          }
          
          let savedVocab;
          if (existingVocab) {
            // 기존 단어가 있으면 그대로 사용
            savedVocab = existingVocab;
            console.log(`기존 단어 사용: ${vocab.word} (ID: ${existingVocab.id})`);
          } else {
            // 기존 단어가 없으면 새로 저장
            const response = await vocabService.createVocab(vocab);
            console.log(`단어 저장 응답: ${vocab.word}`, response);
            savedVocab = response.data || response;
            console.log(`새 단어 저장 완료: ${vocab.word} (ID: ${savedVocab.id})`);
          }
          
          if (savedVocab && savedVocab.id) {
            savedVocabs.push(savedVocab);
          } else {
            console.error(`단어 처리 실패 - ID 없음: ${vocab.word}`);
          }
        } catch (error) {
          console.error(`단어 처리 실패: ${vocab.word}`, error);
          // 실패해도 계속 진행
        }
      }
      
      setGeneratedVocabs(savedVocabs);
      setCurrentStep(3);
      console.log('모든 단어 저장 완료:', savedVocabs);
    } catch (error) {
      console.error('단어 저장 오류:', error);
      
      // 더 구체적인 오류 메시지
      let errorMessage = '단어 저장에 실패했습니다. 다시 시도해주세요.';
      
      if (error.message.includes('이미 존재하는 단어입니다')) {
        errorMessage = '일부 단어가 이미 존재합니다. 다른 단어로 시도해주세요.';
      } else if (error.message.includes('유효성 검사 실패')) {
        errorMessage = '생성된 단어 정보에 문제가 있습니다. 다시 시도해주세요.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 3단계: 문제 자동 생성
  const generateQuestions = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('문제 자동 생성 시작...');
      const questions = await openaiService.generateQuizQuestions(
        generatedVocabs,
        settings.dictationCount,
        settings.multipleChoiceCount,
        settings.oxCount
      );
      
      // vocabId 매핑
      const questionsWithVocabId = questions.map(question => {
        const vocab = generatedVocabs.find(v => v.word === question.correctAnswer || v.definition === question.stem.split(' - ')[0]);
        return {
          ...question,
          vocabId: vocab ? vocab.id : null
        };
      });
      
      setGeneratedQuestions(questionsWithVocabId);
      setCurrentStep(4);
      console.log('문제 생성 완료:', questionsWithVocabId);
    } catch (error) {
      console.error('문제 생성 오류:', error);
      setError('문제 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };



  // 4단계: test-setup 페이지로 이동
  const goToTestSetup = async () => {
    setLoading(true);
    setError('');
    
    try {
      // 자동 생성된 데이터 준비
      const autoGeneratedData = {
        isAutoGenerated: true,
        autoGeneratedVocabs: generatedVocabs,
        autoGeneratedQuestions: generatedQuestions
      };
      
      console.log('자동 생성 데이터:', autoGeneratedData);
      
      // test-setup 페이지로 이동 (데이터와 함께)
      router.push(`/dashboard/teacher/test-setup?autoGenerated=${encodeURIComponent(JSON.stringify(autoGeneratedData))}`);
      
    } catch (error) {
      console.error('페이지 이동 오류:', error);
      setError('페이지 이동에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 단계별 렌더링
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🤖 AI 자동 퀴즈 생성
        </h2>
        <p className="text-gray-600">
          자연어로 요구사항을 입력하면 AI가 단어와 문제를 자동으로 생성해드립니다
        </p>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-blue-200">
        <h3 className="text-xl font-bold text-gray-800 mb-6">📝 요구사항 입력</h3>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            요구사항 (자연어로 자유롭게 입력하세요)
          </label>
          <textarea
            value={userRequest}
            onChange={(e) => handleRequestChange(e.target.value)}
            placeholder={`예시:
여행관련 영단어 10개 문제내고 싶어. 객관식/주관식/ox 문제는 너가 적당히 섞어줘

음식 관련 단어 8개로 받아쓰기와 ox 문제 만들어줘

비즈니스 영어 단어 15개로 다양한 문제 유형으로 퀴즈 만들어줘`}
            className="w-full h-48 px-4 py-3 rounded-2xl border-2 border-gray-300 focus:border-blue-500 outline-none resize-none text-gray-800 font-mono text-sm"
          />
          <div className="text-sm text-gray-600 mt-2">
            원하는 주제, 단어 수, 문제 유형 등을 자연어로 자유롭게 입력하세요
          </div>
        </div>



        <div className="mt-8 text-center">
          <Button
            onClick={processUserRequest}
            disabled={loading || !userRequest.trim()}
            variant="primary"
            size="lg"
          >
            {loading ? <LoadingSpinner message="AI가 요구사항을 분석 중..." /> : '🚀 AI 자동 생성 시작'}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          📚 AI가 생성한 단어 목록
        </h2>
        <p className="text-gray-600">
          요청에 따라 생성된 {generatedVocabs.length}개의 단어입니다
        </p>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-blue-200">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {generatedVocabs.map((vocab, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-2xl">
              <div className="font-bold text-lg text-gray-800">{vocab.word}</div>
              <div className="text-gray-600">{vocab.definition}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button
            onClick={saveVocabsToDatabase}
            disabled={loading}
            variant="primary"
            size="lg"
          >
            {loading ? <LoadingSpinner message="단어들을 저장 중..." /> : '💾 단어들을 DB에 저장'}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🎯 문제 생성 준비 완료
        </h2>
        <p className="text-gray-600">
          저장된 단어들을 사용해서 문제를 생성합니다
        </p>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-blue-200">
        <div className="text-center">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            AI가 문제를 생성하고 있습니다...
          </h3>
          <p className="text-gray-600 mb-6">
            이미 생성된 문제들을 확인합니다.
          </p>
          
          <Button
            onClick={() => setCurrentStep(4)}
            disabled={loading}
            variant="primary"
            size="lg"
          >
            {loading ? <LoadingSpinner message="문제를 확인 중..." /> : '📝 생성된 문제 확인하기'}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          ✅ 문제 생성 완료!
        </h2>
        <p className="text-gray-600">
          {generatedQuestions.length}개의 문제가 생성되었습니다
        </p>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-blue-200">
        <h3 className="text-xl font-bold text-gray-800 mb-6">📝 생성된 문제 미리보기</h3>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {generatedQuestions.slice(0, 5).map((question, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-800">문제 {index + 1}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {question.type}
                </span>
              </div>
              <div className="text-gray-700">{question.stem}</div>
            </div>
          ))}
          {generatedQuestions.length > 5 && (
            <div className="text-center text-gray-500">
              ... 외 {generatedQuestions.length - 5}개 문제
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <Button
            onClick={goToTestSetup}
            disabled={loading}
            variant="primary"
            size="lg"
          >
            {loading ? <LoadingSpinner message="페이지 이동 중..." /> : '🎉 상세정보 설정으로 이동'}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header user={user} />
      
      <div className="max-w-4xl mx-auto p-4 pt-8">
        {/* 진행 단계 표시 */}
        <div className="mb-8">
          <div className="flex justify-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                  currentStep >= step
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="text-center mt-2 text-sm text-gray-600">
            {currentStep === 1 && '설정'}
            {currentStep === 2 && '단어 생성'}
            {currentStep === 3 && '문제 생성'}
            {currentStep === 4 && '완료'}
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* 단계별 컨텐츠 */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}

        {/* 뒤로가기 버튼 */}
        <div className="mt-8 text-center">
          <Button onClick={onBack} variant="outline">
            ← 뒤로가기
          </Button>
        </div>
      </div>
    </div>
  );
} 