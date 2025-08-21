// OpenAI API 서비스
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'your-api-key-here';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export const openaiService = {
  // 간단한 텍스트 생성 (한국어 번역용)
  generateText: async (prompt) => {
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 20,
          temperature: 0.3
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API 오류: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI 텍스트 생성 오류:', error);
      throw error;
    }
  },

  // 문제 자동 생성
  generateQuizQuestions: async (vocabList, dictationCount, multipleChoiceCount, oxCount = 0) => {
    try {
      const prompt = `
다음 영어 단어들을 사용해서 퀴즈 문제를 생성해주세요.

단어 목록:
${vocabList.map((vocab, index) => `${index + 1}. ${vocab.word} - ${vocab.definition}`).join('\n')}

사용 가능한 단어들: ${vocabList.map(v => v.word).join(', ')}

요구사항:
1. 받아쓰기 문제 ${dictationCount}개
2. 4지선다 문제 ${multipleChoiceCount}개
3. OX 문제 ${oxCount}개
4. 총 문제 수는 정확히 ${dictationCount + multipleChoiceCount + oxCount}개여야 합니다. 더 많이 만들지 마세요.
5. 각 단어는 정확히 한 번만 사용하세요. 같은 단어로 여러 문제를 만들면 안됩니다.
6. 사용 가능한 단어들: ${vocabList.map(v => v.word).join(', ')} - 이 단어들만 사용하세요.
7. 단어를 골고루 분배해서 다양한 문제를 생성하세요.
8. JSON 배열의 길이가 정확히 ${dictationCount + multipleChoiceCount + oxCount}개인지 확인하세요.
9. 반드시 모든 단어를 사용해야 합니다. 사용하지 않은 단어가 있으면 안됩니다.
10. 문제 수가 부족하면 더 만들어서 정확히 ${dictationCount + multipleChoiceCount + oxCount}개를 맞추세요.
11. 최종 JSON 응답에서 배열의 길이를 다시 한 번 확인하세요.
12. 요청한 문제 수와 생성된 문제 수가 정확히 일치해야 합니다.

각 문제는 다음 JSON 형식으로 생성해주세요:

받아쓰기 문제 형식:
{
  "type": "DICTATION",
  "stem": "이 단어를 듣고 스펠링을 쓰시오:",
  "correctAnswer": "실제영어단어",
  "explanation": "설명",
  "points": 1
}

4지선다 문제 형식:
{
  "type": "MULTIPLE",
  "stem": "실제한국어뜻 - 이 뜻을 가진 단어는?",
  "correctAnswer": 0,
  "explanation": "설명",
  "points": 1
}

OX 문제 형식:
{
  "type": "OX",
  "stem": "실제영어단어 : 실제한국어뜻",
  "correctAnswer": 1,
  "explanation": "설명",
  "points": 1
}

중요한 규칙들:

1. 4지선다 문제:
   - stem에는 반드시 해당 단어의 실제 한국어 뜻을 사용하세요
   - correctAnswer는 항상 0으로 설정하세요 (첫 번째 옵션이 정답)
   - explanation에는 "단어는 한국어뜻을 뜻합니다" 형식으로 작성하세요

2. OX 문제:
   - stem은 반드시 "영어단어 : 한국어뜻" 형식이어야 합니다
   - correctAnswer: 1 = O (올바른 매치), 0 = X (잘못된 매치)
   - 올바른 매치 예시: "altitude : 고도" (correctAnswer: 1)
   - 잘못된 매치 예시: "altitude : 바다" (correctAnswer: 0)
   - 절대 "한국어 : 한국어" 형식을 사용하지 마세요
   - 절대 "영어단어 : 영어단어" 중복 형식을 사용하지 마세요

3. 받아쓰기 문제:
   - stem은 "이 단어를 듣고 스펠링을 쓰시오:"만 사용하세요
   - correctAnswer에는 실제 영어 단어를 사용하세요
   - explanation에는 "단어는 한국어뜻을 뜻합니다" 형식으로 작성하세요

4. 정확성 검증:
   - 각 문제의 correctAnswer가 해당 단어의 실제 뜻과 일치하는지 확인하세요
   - OX 문제에서 correctAnswer: 1일 때는 올바른 매치, 0일 때는 잘못된 매치인지 확인하세요
   - 모든 단어가 정확히 한 번씩만 사용되었는지 확인하세요

주의사항:
1. vocabId는 포함하지 마세요. 프론트에서 자동으로 매핑됩니다.
2. 받아쓰기 문제의 stem에는 "이 단어를 듣고 스펠링을 쓰시오:"만 사용하고, 영단어를 포함하지 마세요
3. 4지선다 문제는 correctAnswer를 0으로 설정하세요 (학생 응시 시 동적으로 선지 생성)
4. OX 문제는 50% 확률로 정답/오답을 생성하세요 (correctAnswer: 1은 O, 0은 X)
5. 정확한 JSON 형식으로만 응답해주세요

JSON 배열로 응답해주세요. 받아쓰기, 4지선다, OX 문제를 골고루 섞어서 생성해주세요.

중요: 
1. 각 문제에서 stem과 correctAnswer는 반드시 제공된 vocab 목록의 실제 definition과 word를 사용해야 합니다. "한국어뜻"이나 "정답단어" 같은 일반적인 텍스트를 사용하지 마세요.
2. 받아쓰기 문제의 stem에는 영단어를 포함하지 마세요. "이 단어를 듣고 스펠링을 쓰시오:"만 사용하세요.
3. OX 문제는 정확히 50% 확률로 정답/오답을 생성하세요. correctAnswer: 1은 O(맞음), 0은 X(틀림)입니다.
   - OX 문제의 stem은 반드시 "영어단어 : 한국어뜻" 형식이어야 합니다.
   - 영어 부분에는 반드시 영어 단어만 사용하세요 (예: "battery", "camera", "phone").
   - 한국어 부분에는 반드시 한국어 뜻만 사용하세요 (예: "배터리", "카메라", "전화").
   - correctAnswer: 1일 때는 올바른 매치, 0일 때는 잘못된 매치를 생성하세요.
   - 잘못된 매치 예시: "apple : 바나나" (사과가 바나나로 잘못 매치됨)
   - 절대 "배터리 : 카메라" 같은 한국어:한국어 형식을 사용하지 마세요.
   - 절대 "인구 : 인구" 같은 중복 형식을 사용하지 마세요.
   - 영어 단어는 반드시 영어 알파벳으로만 구성되어야 합니다.
4. 문제 수는 정확히 ${dictationCount + multipleChoiceCount + oxCount}개여야 합니다. 더 많이 만들지 마세요.
5. 각 단어는 정확히 한 번만 사용하세요. 같은 단어로 여러 문제를 만들면 안됩니다.
6. 사용 가능한 단어들: ${vocabList.map(v => v.word).join(', ')} - 이 단어들만 사용하세요.
7. 단어를 골고루 분배해서 다양한 문제를 생성하세요.
8. JSON 배열의 길이가 정확히 ${dictationCount + multipleChoiceCount + oxCount}개인지 확인하세요.
9. 반드시 모든 단어를 사용해야 합니다. 사용하지 않은 단어가 있으면 안됩니다.
10. 문제 수가 부족하면 더 만들어서 정확히 ${dictationCount + multipleChoiceCount + oxCount}개를 맞추세요.
11. 최종 JSON 응답에서 배열의 길이를 다시 한 번 확인하세요.
12. 요청한 문제 수와 생성된 문제 수가 정확히 일치해야 합니다.
`;

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that generates educational quiz questions. Always respond with valid JSON arrays.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedQuestions = JSON.parse(data.choices[0].message.content);
      
      console.log('OpenAI에서 생성된 문제들:', generatedQuestions);
      
      return generatedQuestions;
    } catch (error) {
      console.error('OpenAI API 호출 오류:', error);
      throw error;
    }
  },

  // 사용자 요청 처리 (단어 생성 + 문제 생성)
  processUserRequest: async (userRequest) => {
    try {
      const prompt = `
사용자의 요청을 분석하여 적절한 영단어 목록과 퀴즈 문제를 생성해주세요.

사용자 요청: ${userRequest}

다음 단계로 진행해주세요:

1. 요청을 분석하여 적절한 주제의 영단어 목록을 생성하세요
2. 생성된 단어들로 다양한 유형의 퀴즈 문제를 만드세요

응답 형식:
{
  "vocabs": [
    {
      "word": "영어단어",
      "definition": "한국어뜻"
    }
  ],
  "questions": [
    {
      "type": "DICTATION",
      "stem": "이 단어를 듣고 스펠링을 쓰시오:",
      "correctAnswer": "실제영어단어",
      "explanation": "설명",
      "points": 1,
      "vocabId": 1
    },
    {
      "type": "MULTIPLE",
      "stem": "실제한국어뜻 - 이 뜻을 가진 단어는?",
      "correctAnswer": 0,
      "explanation": "설명",
      "points": 1,
      "vocabId": 2,
      "options": ["정답단어", "오답1", "오답2", "오답3"]
    },
    {
      "type": "OX",
      "stem": "실제영어단어 : 실제한국어뜻",
      "correctAnswer": 1,
      "explanation": "설명",
      "points": 1,
      "vocabId": 3
    }
  ]
}

주의사항:
1. vocabId는 1부터 시작하는 순차적인 번호를 사용하세요
2. 받아쓰기 문제의 stem에는 "이 단어를 듣고 스펠링을 쓰시오:"만 사용하세요
3. 4지선다 문제는 반드시 다음을 준수하세요:
   - correctAnswer: 정답이 몇 번째 선지인지 (0, 1, 2, 3) - 숫자로만 작성
   - options: 4개의 선지를 배열로 제공 (정답 + 3개 오답) - 필수 포함
   - 오답은 정답과 비슷한 난이도의 다른 영어 단어로 생성
   - options 배열이 없으면 문제가 작동하지 않습니다
4. OX 문제는 50% 확률로 정답/오답을 생성하세요 (correctAnswer: 1은 O, 0은 X)
5. 문제 유형은 균형있게 분배하세요
6. 정확한 JSON 형식으로만 응답해주세요

중요한 규칙들:

1. 4지선다 문제:
   - stem에는 반드시 해당 단어의 실제 한국어 뜻을 사용하세요
   - correctAnswer는 정답이 몇 번째 선지인지 (0, 1, 2, 3) 숫자로만 작성
   - options 배열에 4개의 선지를 제공하세요 (정답 + 3개 오답)
   - 오답은 정답과 비슷한 난이도의 다른 영어 단어로 생성
   - explanation에는 "단어는 한국어뜻을 뜻합니다" 형식으로 작성하세요

2. OX 문제:
   - stem은 반드시 "영어단어 : 한국어뜻" 형식이어야 합니다
   - correctAnswer: 1 = O (올바른 매치), 0 = X (잘못된 매치)
   - 올바른 매치 예시: "altitude : 고도" (correctAnswer: 1)
   - 잘못된 매치 예시: "altitude : 바다" (correctAnswer: 0)
   - 절대 "한국어 : 한국어" 형식을 사용하지 마세요
   - 절대 "영어단어 : 영어단어" 중복 형식을 사용하지 마세요

3. 받아쓰기 문제:
   - stem은 "이 단어를 듣고 스펠링을 쓰시오:"만 사용하세요
   - correctAnswer에는 실제 영어 단어를 사용하세요
   - explanation에는 "단어는 한국어뜻을 뜻합니다" 형식으로 작성하세요

4. 정확성 검증:
   - 각 문제의 correctAnswer가 해당 단어의 실제 뜻과 일치하는지 확인하세요
   - OX 문제에서 correctAnswer: 1일 때는 올바른 매치, 0일 때는 잘못된 매치인지 확인하세요
   - 모든 단어가 정확히 한 번씩만 사용되었는지 확인하세요

중요: 
1. 각 문제에서 stem과 correctAnswer는 반드시 제공된 vocab 목록의 실제 definition과 word를 사용해야 합니다
2. 받아쓰기 문제의 stem에는 영단어를 포함하지 마세요
3. OX 문제는 정확히 50% 확률로 정답/오답을 생성하세요
4. 단어 수와 문제 수는 요청에 맞게 적절히 조정하세요
5. 4지선다 문제는 반드시 options 배열을 포함해야 합니다 (4개의 선지)
6. vocabId는 1부터 시작하는 순차적인 번호를 정확히 사용하세요
`;

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that generates educational content. Always respond with valid JSON objects.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 3000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      
      console.log('사용자 요청 처리 결과:', result);
      
      return result;
    } catch (error) {
      console.error('사용자 요청 처리 오류:', error);
      throw error;
    }
  },

  // 사용자 입력 단어 목록 파싱
  parseUserVocabInput: async (userInput) => {
    try {
      const prompt = `
다음 형식의 단어 목록을 파싱해서 JSON 배열로 변환해주세요:

입력:
${userInput}

위의 입력을 다음 JSON 형식으로 변환해주세요:
[
  {
    "word": "영어단어",
    "definition": "한국어뜻"
  }
]

주의사항:
1. ('영어단어', '한국어뜻') 형식을 정확히 파싱해주세요
2. 따옴표와 괄호를 제거하고 word와 definition으로 분리해주세요
3. 유효한 JSON 배열만 반환해주세요
4. 파싱할 수 없는 항목은 제외해주세요
`;

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that parses user input into structured data. Always respond with valid JSON arrays only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const parsedVocabs = JSON.parse(data.choices[0].message.content);
      
      console.log('파싱된 단어들:', parsedVocabs);
      
      return parsedVocabs;
    } catch (error) {
      console.error('단어 파싱 오류:', error);
      throw error;
    }
  },

  // 더미 단어 자동 생성 (기존 함수 유지)
  generateDummyVocabs: async (count = 10) => {
    try {
      const prompt = `
${count}개의 영어 단어와 한국어 뜻을 생성해주세요.
초등학교~중학교 수준의 기본적인 단어들로 구성해주세요.

JSON 형식으로 응답해주세요:
[
  {
    "word": "영어단어",
    "definition": "한국어뜻"
  }
]
`;

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that generates educational vocabulary words. Always respond with valid JSON arrays.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedVocabs = JSON.parse(data.choices[0].message.content);
      
      console.log('OpenAI에서 생성된 단어들:', generatedVocabs);
      
      return generatedVocabs;
    } catch (error) {
      console.error('OpenAI API 호출 오류:', error);
      throw error;
    }
  }
}; 