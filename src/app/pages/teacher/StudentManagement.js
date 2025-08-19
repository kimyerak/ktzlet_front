'use client';

import { useState, useEffect } from 'react';
import Input from '../../ui/Input';
import Card from '../../ui/Card';

export default function StudentManagement({ user, onBack }) {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageScore: 0,
    topStudents: 0,
    middleStudents: 0,
    bottomStudents: 0
  });

  // 샘플 학생 데이터 (실제로는 API에서 가져올 데이터)
  useEffect(() => {
    const sampleStudents = [
      {
        id: 1,
        email: 'student1@school.com',
        name: '김철수',
        role: 'student',
        status: 'active',
        created_at: '2024-01-15',
        totalScore: 85,
        completedQuizzes: 12,
        averageScore: 78.5,
        lastActivity: '2024-01-20'
      },
      {
        id: 2,
        email: 'student2@school.com',
        name: '이영희',
        role: 'student',
        status: 'active',
        created_at: '2024-01-16',
        totalScore: 92,
        completedQuizzes: 15,
        averageScore: 88.2,
        lastActivity: '2024-01-21'
      },
      {
        id: 3,
        email: 'student3@school.com',
        name: '박민수',
        role: 'student',
        status: 'active',
        created_at: '2024-01-17',
        totalScore: 76,
        completedQuizzes: 10,
        averageScore: 72.1,
        lastActivity: '2024-01-19'
      },
      {
        id: 4,
        email: 'student4@school.com',
        name: '정수진',
        role: 'student',
        status: 'inactive',
        created_at: '2024-01-18',
        totalScore: 68,
        completedQuizzes: 8,
        averageScore: 65.3,
        lastActivity: '2024-01-15'
      },
      {
        id: 5,
        email: 'student5@school.com',
        name: '최동현',
        role: 'student',
        status: 'active',
        created_at: '2024-01-19',
        totalScore: 95,
        completedQuizzes: 18,
        averageScore: 91.7,
        lastActivity: '2024-01-21'
      }
    ];

    setStudents(sampleStudents);
    setFilteredStudents(sampleStudents);
    
    // 통계 계산
    const activeStudents = sampleStudents.filter(s => s.status === 'active');
    const scores = activeStudents.map(s => s.averageScore);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    
    const sortedScores = [...scores].sort((a, b) => b - a);
    const topCount = Math.ceil(sortedScores.length * 0.3);
    const middleCount = Math.ceil(sortedScores.length * 0.4);
    
    setStats({
      totalStudents: activeStudents.length,
      averageScore: Math.round(avgScore * 10) / 10,
      topStudents: topCount,
      middleStudents: middleCount,
      bottomStudents: activeStudents.length - topCount - middleCount
    });
  }, []);

  // 검색 필터링
  useEffect(() => {
    const filtered = students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreLevel = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            👥 학생 관리
          </h1>
          <p className="text-gray-700">
            학생들의 학습 현황과 성과를 관리하세요
          </p>
        </div>
        <button
          onClick={onBack}
          className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-2xl transition-colors"
        >
          ← 돌아가기
        </button>
      </div>

      {/* 검색 */}
      <Card className="mb-8">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="학생 이름이나 이메일로 검색..."
              label="🔍 학생 검색"
            />
          </div>
          <div className="text-sm text-gray-600">
            총 {filteredStudents.length}명의 학생
          </div>
        </div>
      </Card>

      {/* 통계 카드 */}
      <div className="grid md:grid-cols-5 gap-6 mb-8">
        <Card className="text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {stats.totalStudents}
          </div>
          <div className="text-gray-700">전체 학생</div>
        </Card>
        
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {stats.averageScore}점
          </div>
          <div className="text-gray-700">반 평균</div>
        </Card>
        
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {stats.topStudents}
          </div>
          <div className="text-gray-700">상위권</div>
        </Card>
        
        <Card className="text-center">
          <div className="text-3xl font-bold text-yellow-600 mb-2">
            {stats.middleStudents}
          </div>
          <div className="text-gray-700">중위권</div>
        </Card>
        
        <Card className="text-center">
          <div className="text-3xl font-bold text-red-600 mb-2">
            {stats.bottomStudents}
          </div>
          <div className="text-gray-700">하위권</div>
        </Card>
      </div>

      {/* 학생 목록 */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          📋 학생 목록
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">학생명</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">이메일</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">상태</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">평균 점수</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">완료한 퀴즈</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">마지막 활동</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">가입일</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-800">{student.name}</div>
                  </td>
                  <td className="py-4 px-4 text-gray-600">
                    {student.email}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                      {student.status === 'active' ? '활성' : 
                       student.status === 'inactive' ? '비활성' : '정지'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getScoreLevel(student.averageScore)}`}>
                      {student.averageScore}점
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600">
                    {student.completedQuizzes}개
                  </td>
                  <td className="py-4 px-4 text-gray-600">
                    {new Date(student.lastActivity).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 text-gray-600">
                    {new Date(student.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        상세보기
                      </button>
                      <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                        성적관리
                      </button>
                      <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                        메시지
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-xl text-gray-700 mb-2">검색 결과가 없습니다</p>
            <p className="text-gray-600">다른 검색어를 시도해보세요</p>
          </div>
        )}
      </Card>
    </div>
  );
} 