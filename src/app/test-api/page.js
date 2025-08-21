'use client';

import { useState } from 'react';
import { testService, userService, quizTakingService } from '../services/apiService';

export default function TestAPIPage() {
  const [status, setStatus] = useState('');
  const [users, setUsers] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [completedQuizzes, setCompletedQuizzes] = useState([]);

  const testConnection = async () => {
    try {
      setStatus('백엔드 연결 테스트 중...');
      const result = await testService.getStatus();
      setStatus(`✅ 백엔드 연결 성공: ${result.message || 'OK'}`);
    } catch (error) {
      setStatus(`❌ 백엔드 연결 실패: ${error.message}`);
    }
  };

  const loadUsers = async () => {
    try {
      setStatus('사용자 목록 로드 중...');
      const result = await userService.getUsers();
      setUsers(result);
      setStatus(`✅ 사용자 ${result.length}명 로드 완료`);
    } catch (error) {
      setStatus(`❌ 사용자 로드 실패: ${error.message}`);
    }
  };

  const testAvailableQuizzes = async () => {
    try {
      setStatus('응시 가능한 퀴즈 로드 중...');
      // 학생 사용자 찾기 (ID 1 또는 첫 번째 학생)
      const studentUser = users.find(u => u.userType === 'STUDENT') || { id: 1 };
      console.log('Testing with student:', studentUser);
      
      const result = await quizTakingService.getAvailableQuizzes(studentUser.id);
      setQuizzes(result);
      setStatus(`✅ 응시 가능한 퀴즈 ${result.length}개 로드 완료`);
      console.log('Available quizzes:', result);
    } catch (error) {
      setStatus(`❌ 퀴즈 로드 실패: ${error.message}`);
      console.error('Quiz load error:', error);
    }
  };

  const testCompletedQuizzes = async () => {
    try {
      setStatus('완료된 퀴즈 로드 중...');
      // 학생 사용자 찾기 (ID 1 또는 첫 번째 학생)
      const studentUser = users.find(u => u.userType === 'STUDENT') || { id: 1 };
      console.log('Testing completed quizzes with student:', studentUser);
      
      const result = await quizTakingService.getCompletedQuizzes(studentUser.id);
      setCompletedQuizzes(result);
      setStatus(`✅ 완료된 퀴즈 ${result.length}개 로드 완료`);
      console.log('Completed quizzes:', result);
    } catch (error) {
      setStatus(`❌ 완료된 퀴즈 로드 실패: ${error.message}`);
      console.error('Completed quiz load error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API 테스트 페이지</h1>
        
        <div className="space-y-4 mb-8">
          <button 
            onClick={testConnection}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            백엔드 연결 테스트
          </button>
          
          <button 
            onClick={loadUsers}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            사용자 목록 로드
          </button>

          <button 
            onClick={testAvailableQuizzes}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            응시 가능한 퀴즈 테스트
          </button>

          <button 
            onClick={testCompletedQuizzes}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
          >
            완료된 퀴즈 테스트
          </button>
        </div>

        <div className="bg-white p-4 rounded shadow mb-4">
          <h2 className="text-xl font-bold mb-2">상태</h2>
          <p className="text-gray-700">{status}</p>
        </div>

        {users.length > 0 && (
          <div className="bg-white p-4 rounded shadow mb-4">
            <h2 className="text-xl font-bold mb-2">사용자 목록</h2>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(users, null, 2)}
            </pre>
          </div>
        )}

        {quizzes.length > 0 && (
          <div className="bg-white p-4 rounded shadow mb-4">
            <h2 className="text-xl font-bold mb-2">응시 가능한 퀴즈</h2>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(quizzes, null, 2)}
            </pre>
          </div>
        )}

        {completedQuizzes.length > 0 && (
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-bold mb-2">완료된 퀴즈</h2>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(completedQuizzes, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 