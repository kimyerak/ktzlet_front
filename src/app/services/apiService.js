import { apiGet, apiPost, apiPut, apiDelete, API_ENDPOINTS } from '../config/api';

// User API 서비스
export const userService = {
  // 사용자 회원가입
  register: (userData) => apiPost(API_ENDPOINTS.USER_REGISTER, userData),
  
  // 사용자 로그인 (새로 추가)
  login: (loginData) => apiPost(API_ENDPOINTS.USER_LOGIN, loginData),
  
  // 사용자 생성 (기존)
  createUser: (userData) => apiPost(API_ENDPOINTS.USERS, userData),
  
  // 사용자 목록 조회
  getUsers: () => apiGet(API_ENDPOINTS.USERS),
  
  // 사용자 상세 조회
  getUserById: (userId) => apiGet(API_ENDPOINTS.USER_BY_ID(userId)),
  
  // 이메일로 사용자 조회
  getUserByEmail: (email) => apiGet(API_ENDPOINTS.USER_BY_EMAIL(email)),
  
  // 사용자 수정
  updateUser: (userId, userData) => apiPut(API_ENDPOINTS.USER_BY_ID(userId), userData),
  
  // 사용자 삭제
  deleteUser: (userId) => apiDelete(API_ENDPOINTS.USER_BY_ID(userId)),
};

// Vocab API 서비스
export const vocabService = {
  // 단어 생성
  createVocab: (vocabData) => apiPost(API_ENDPOINTS.VOCABS, vocabData),
  
  // 단어 목록 조회
  getVocabs: () => apiGet(API_ENDPOINTS.VOCABS),
  
  // 단어 상세 조회
  getVocabById: (vocabId) => apiGet(API_ENDPOINTS.VOCAB_BY_ID(vocabId)),
  
  // 단어 수정
  updateVocab: (vocabId, vocabData) => apiPut(API_ENDPOINTS.VOCAB_BY_ID(vocabId), vocabData),
  
  // 단어 삭제
  deleteVocab: (vocabId) => apiDelete(API_ENDPOINTS.VOCAB_BY_ID(vocabId)),
  
  // 영단어로 검색
  searchVocabByWord: (keyword) => apiGet(`${API_ENDPOINTS.VOCAB_SEARCH_WORD}?keyword=${encodeURIComponent(keyword)}`),
  
  // 한국어 뜻으로 검색
  searchVocabByDefinition: (keyword) => apiGet(`${API_ENDPOINTS.VOCAB_SEARCH_DEFINITION}?keyword=${encodeURIComponent(keyword)}`)
};

// Quiz API 서비스 (새로운 구조)
export const quizService = {
  // 퀴즈 생성 (vocabIds 포함)
  createQuiz: (quizData) => apiPost(API_ENDPOINTS.QUIZZES, quizData),
  
  // 퀴즈 목록 조회
  getQuizzes: () => apiGet(API_ENDPOINTS.QUIZZES),
  
  // 퀴즈 상세 조회 (questions 포함)
  getQuizById: (quizId) => apiGet(API_ENDPOINTS.QUIZ_BY_ID(quizId)),
  
  // 교사별 퀴즈 조회
  getQuizzesByTeacher: (teacherId) => apiGet(API_ENDPOINTS.QUIZZES_BY_TEACHER(teacherId)),
  
  // 퀴즈 수정
  updateQuiz: (quizId, quizData) => apiPut(API_ENDPOINTS.QUIZ_BY_ID(quizId), quizData),
  
  // 퀴즈 삭제
  deleteQuiz: (quizId) => apiDelete(API_ENDPOINTS.QUIZ_BY_ID(quizId)),
  
  // 퀴즈 제출 (새로운 통합 방식)
  submitQuiz: (quizId, submissionData) => apiPost(API_ENDPOINTS.QUIZ_SUBMIT(quizId), submissionData),
  
  // 임시 호환성 함수들 (새로운 API 구조에서는 사용하지 않지만 빌드 에러 방지용)
  getQuizQuestions: (quizId) => {
    console.warn('getQuizQuestions는 더 이상 사용되지 않습니다. getQuizById를 사용하세요.');
    return Promise.resolve({ data: [] });
  },
  
  updateQuizQuestion: (questionId, questionData) => {
    console.warn('updateQuizQuestion는 더 이상 사용되지 않습니다.');
    return Promise.resolve();
  },
  
  createQuizQuestion: (questionData) => {
    console.warn('createQuizQuestion는 더 이상 사용되지 않습니다. 퀴즈 생성 시 vocabIds를 사용하세요.');
    return Promise.resolve();
  },
  
  deleteQuizQuestion: (questionId) => {
    console.warn('deleteQuizQuestion는 더 이상 사용되지 않습니다.');
    return Promise.resolve();
  },
};

// Question API 서비스
export const questionService = {
  // 문제 생성
  createQuestion: (questionData) => apiPost('/questions', questionData),
  
  // 퀴즈별 문제 목록 조회
  getQuestionsByQuiz: (quizId) => apiGet(`/questions/quiz/${quizId}`),
  
  // 문제 수정
  updateQuestion: (questionId, questionData) => apiPut(`/questions/${questionId}`, questionData),
  
  // 문제 삭제
  deleteQuestion: (questionId) => apiDelete(`/questions/${questionId}`),
};

// Quiz Taking API 서비스 (간소화됨)
export const quizTakingService = {
  // 응시 가능한 퀴즈 목록 조회
  getAvailableQuizzes: (studentId) => apiGet(API_ENDPOINTS.QUIZ_TAKING_AVAILABLE(studentId)),
  
  // 완료된 퀴즈 목록 조회
  getCompletedQuizzes: (studentId) => apiGet(API_ENDPOINTS.QUIZ_TAKING_COMPLETED(studentId)),
  
  // 퀴즈 시작 기록 생성
  startQuiz: (quizId, studentId) => apiPost(API_ENDPOINTS.QUIZ_START(quizId), { studentId }),
  
  // 퀴즈 제출 (새로운 통합 방식) - quizService로 위임
  submitQuiz: (quizId, submissionData) => quizService.submitQuiz(quizId, submissionData),
};

// Test API 서비스
export const testService = {
  // 애플리케이션 상태 확인
  getStatus: () => apiGet(API_ENDPOINTS.TEST),
}; 