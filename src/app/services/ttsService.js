// TTS & STT Service for dictation questions
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

export const ttsService = {
  // OpenAI TTS API 사용
  async generateSpeech(text, voice = 'alloy') {
    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: voice, // alloy, echo, fable, onyx, nova, shimmer
          response_format: 'mp3',
          speed: 1.0
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS API 오류: ${response.status}`);
      }

      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error('TTS 생성 오류:', error);
      throw error;
    }
  },

  // Web Speech API 사용 (무료 대안)
  speakWithWebAPI(text, lang = 'en-US') {
    return new Promise((resolve, reject) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.8; // 속도 조절
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onend = () => resolve();
        utterance.onerror = (error) => reject(error);

        speechSynthesis.speak(utterance);
      } else {
        reject(new Error('Web Speech API를 지원하지 않는 브라우저입니다.'));
      }
    });
  },

  // 음성 정지
  stopSpeech() {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }
};

// STT Service 추가
export const sttService = {
  // OpenAI Whisper API 사용 (고품질)
  async transcribeAudio(audioBlob, language = 'en') {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', language);
      formData.append('response_format', 'text');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`STT API 오류: ${response.status}`);
      }

      const transcription = await response.text();
      return transcription.trim();
    } catch (error) {
      console.error('STT 변환 오류:', error);
      throw error;
    }
  },

  // Web Speech API 사용 (무료 대안)
  startWebSpeechRecognition(language = 'en-US') {
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        reject(new Error('Web Speech API를 지원하지 않는 브라우저입니다.'));
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = language;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 3; // 여러 대안 제공

      let finalTranscript = '';
      let isResolved = false;

      recognition.onstart = () => {
        console.log('음성 인식 시작...');
        isResolved = false;
      };

      recognition.onresult = (event) => {
        console.log('음성 인식 결과 이벤트:', event);
        
        if (event.results.length > 0) {
          // 가장 신뢰도가 높은 결과 선택
          const result = event.results[0];
          console.log('인식 결과들:', result);
          
          if (result.isFinal) {
            finalTranscript = result[0].transcript;
            console.log('최종 인식 결과:', finalTranscript);
          }
        }
      };

      recognition.onend = () => {
        console.log('음성 인식 종료, 최종 결과:', finalTranscript);
        if (!isResolved) {
          isResolved = true;
          resolve(finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('음성 인식 오류:', event.error);
        if (!isResolved) {
          isResolved = true;
          reject(new Error(`음성 인식 오류: ${event.error}`));
        }
      };

      recognition.onnomatch = () => {
        console.log('음성 인식 실패: 매치되는 결과 없음');
        if (!isResolved) {
          isResolved = true;
          reject(new Error('음성을 인식하지 못했습니다. 다시 말해주세요.'));
        }
      };

      try {
        recognition.start();
        console.log('음성 인식 시작됨');
      } catch (error) {
        console.error('음성 인식 시작 실패:', error);
        reject(new Error('음성 인식을 시작할 수 없습니다.'));
      }
    });
  },

  // 음성 인식 중지
  stopWebSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      // 현재 실행 중인 인식 인스턴스를 중지하는 방법은 브라우저마다 다름
      // 일반적으로 자동으로 중지됨
    }
  }
}; 