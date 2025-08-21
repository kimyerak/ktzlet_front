// API 기본 설정
export const API_BASE_URL = '/api';

// API 엔드포인트
export const API_ENDPOINTS = {
  // User API
  USERS: '/users',
  USER_BY_ID: (id) => `/users/${id}`,
  USER_BY_EMAIL: (email) => `/users/email?email=${encodeURIComponent(email)}`,
  USER_REGISTER: '/users/register',
  USER_LOGIN: '/users/login', // 새로 추가
  
  // Vocab API
  VOCABS: '/vocabs',
  VOCAB_BY_ID: (id) => `/vocabs/${id}`,
  VOCAB_SEARCH_WORD: '/vocabs/search/word',
  VOCAB_SEARCH_DEFINITION: '/vocabs/search/definition',
  
  // Quiz API
  QUIZZES: '/quizzes',
  QUIZ_BY_ID: (id) => `/quizzes/${id}`,
  QUIZZES_BY_TEACHER: (teacherId) => `/quizzes/teacher/${teacherId}`,
  QUIZ_SUBMIT: (quizId) => `/quizzes/${quizId}/submit`, // 새로운 제출 방식
  QUIZ_START: (quizId) => `/quizzes/${quizId}/start`, // 퀴즈 시작 기록
  
  // 기존 Question API는 제거됨 (Quiz 내부로 통합)
  
  // 기존 Quiz Taking API도 새로운 방식으로 변경
  QUIZ_TAKING_AVAILABLE: (studentId) => `/quiz-taking/available/${studentId}`,
  QUIZ_TAKING_COMPLETED: (studentId) => `/quiz-taking/completed/${studentId}`,
  
  // Test API
  TEST: '/test'
};

// HTTP 메서드별 API 호출 함수
export const apiCall = async (endpoint, options = {}) => {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API 호출 오류:', error);
    
    // 백엔드 서버가 시작되지 않은 경우 특별 처리
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('백엔드 서버가 시작되지 않았습니다. 잠시 후 다시 시도해주세요.');
    }
    
    throw error;
  }
};

// GET 요청
export const apiGet = (endpoint) => apiCall(endpoint);

// POST 요청
export const apiPost = (endpoint, data) => apiCall(endpoint, {
  method: 'POST',
  body: JSON.stringify(data),
});

// PUT 요청
export const apiPut = (endpoint, data) => apiCall(endpoint, {
  method: 'PUT',
  body: JSON.stringify(data),
});

// DELETE 요청
export const apiDelete = (endpoint) => apiCall(endpoint, {
  method: 'DELETE',
}); 