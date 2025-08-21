// STT 기반 단어 생성 서비스
import { sttService } from './ttsService';
import { openaiService } from './openaiService';

export const vocabGenerationService = {
  // STT로 영어 단어 입력 받기
  async getWordFromSpeech() {
    try {
      console.log('음성 인식 시작...');
      const transcript = await sttService.startWebSpeechRecognition('en-US');
      console.log('음성 인식 원본 결과:', transcript);
      
      if (!transcript || transcript.trim() === '') {
        throw new Error('음성이 인식되지 않았습니다. 다시 말해주세요.');
      }
      
      // 영어 단어만 추출 (숫자, 특수문자 제거)
      const cleanWord = transcript.toLowerCase().trim().replace(/[^a-zA-Z]/g, '');
      console.log('정제된 단어:', cleanWord);
      
      if (!cleanWord || cleanWord.length < 2) {
        console.error('정제된 단어가 너무 짧거나 없음:', cleanWord);
        throw new Error(`인식된 텍스트: "${transcript}" - 유효한 영어 단어를 인식하지 못했습니다.`);
      }
      
      console.log('최종 인식된 단어:', cleanWord);
      return cleanWord;
    } catch (error) {
      console.error('음성 인식 오류:', error);
      throw error;
    }
  },

  // AI로 한국어 뜻 자동 생성
  async generateKoreanDefinition(englishWord) {
    try {
      console.log(`"${englishWord}"의 한국어 뜻 생성 중...`);
      
      const prompt = `
다음 영어 단어의 한국어 뜻을 간단하게 생성해주세요.

영어 단어: ${englishWord}

요구사항:
1. 가장 기본적이고 간단한 한국어 뜻만 제공하세요
2. 1-3단어로 짧게 답변하세요
3. 여러 뜻이 있다면 가장 일반적인 뜻만 사용하세요
4. 한국어로만 답변하세요
5. 설명이나 추가 정보는 포함하지 마세요

예시:
- apple → 사과
- beautiful → 아름다운
- computer → 컴퓨터
- happiness → 행복
- coffee → 커피
- table → 테이블
- book → 책

답변:`;

      // 기존 openaiService 사용
      const response = await openaiService.generateText(prompt);
      
      console.log(`"${englishWord}" → "${response}"`);
      return response;
    } catch (error) {
      console.error('AI 뜻 생성 오류:', error);
      throw error;
    }
  },

  // STT + AI로 완전한 단어 생성
  async generateVocabFromSpeech() {
    try {
      // 1. STT로 영어 단어 입력
      const englishWord = await this.getWordFromSpeech();
      
      // 2. AI로 한국어 뜻 생성
      const koreanDefinition = await this.generateKoreanDefinition(englishWord);
      
      // 3. 완성된 단어 객체 반환
      return {
        word: englishWord,
        definition: koreanDefinition
      };
    } catch (error) {
      console.error('음성 기반 단어 생성 오류:', error);
      throw error;
    }
  },

  // 여러 단어를 연속으로 생성
  async generateMultipleVocabsFromSpeech(count = 5) {
    const vocabs = [];
    
    for (let i = 0; i < count; i++) {
      try {
        console.log(`${i + 1}번째 단어 생성 중...`);
        const vocab = await this.generateVocabFromSpeech();
        vocabs.push(vocab);
        
        // 잠시 대기 (음성 인식 안정화)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`${i + 1}번째 단어 생성 실패:`, error);
        // 실패해도 계속 진행
      }
    }
    
    return vocabs;
  }
}; 