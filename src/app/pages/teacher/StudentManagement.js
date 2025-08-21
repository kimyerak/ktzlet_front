'use client';

import { useState, useEffect } from 'react';
import Input from '../../ui/Input';
import Card from '../../ui/Card';
import { userService, quizTakingService } from '../../services/apiService';

export default function StudentManagement({ user, onBack }) {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageScore: 0,
    topStudents: 0,
    middleStudents: 0,
    bottomStudents: 0
  });

  // 백엔드에서 학생 데이터 가져오기
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        setError('');
        
        // 모든 사용자 조회
        const allUsers = await userService.getUsers();
        console.log('모든 사용자 데이터:', allUsers);
        
        // 학생만 필터링 (userType이 STUDENT이고 ACTIVE 상태인 사용자들만)
        const studentUsers = allUsers.filter(user => 
          (user.userType === 'STUDENT' || user.role === 'student') &&
          user.status === 'ACTIVE'
        );
        console.log('필터링된 학생 데이터 (ACTIVE만):', studentUsers);
        
        // 제외된 학생들 로그로 확인 (ACTIVE가 아닌 모든 상태)
        const excludedStudents = allUsers.filter(user => 
          (user.userType === 'STUDENT' || user.role === 'student') &&
          user.status !== 'ACTIVE'
        );
        if (excludedStudents.length > 0) {
          console.log('제외된 학생들 (ACTIVE가 아님):', excludedStudents.map(s => ({
            id: s.id,
            name: s.name,
            status: s.status
          })));
        }
        
        // 각 학생의 상세 정보 로깅
        studentUsers.forEach(student => {
          console.log(`\n📋 학생 정보 - ID: ${student.id}`);
          console.log('- 이름:', student.userInfo?.name || student.name);
          console.log('- 이메일:', student.userInfo?.email || student.email);
          console.log('- 레벨:', student.level);
          console.log('- userType:', student.userType);
          console.log('- 생성일:', student.createdAt);
          console.log('- 전체 객체:', student);
        });
        
        // 각 학생의 퀴즈 성적 정보 가져오기 (오류 발생 시에도 계속 진행)
        const studentsWithStats = await Promise.allSettled(
          studentUsers.map(async (student) => {
            try {
              console.log(`\n=== 학생 ${student.id} (${student.userInfo?.name || student.name}) 퀴즈 데이터 로드 중 ===`);
              
              // 학생의 완료된 퀴즈 목록 가져오기
              let completedQuizzes = [];
              try {
                completedQuizzes = await quizTakingService.getCompletedQuizzes(student.id);
                console.log(`학생 ${student.id}의 완료된 퀴즈:`, completedQuizzes);
              } catch (quizError) {
                console.warn(`학생 ${student.id}의 퀴즈 데이터를 가져올 수 없습니다:`, quizError.message);
                // 퀴즈 데이터를 가져올 수 없어도 기본 정보는 표시
                completedQuizzes = [];
              }
              
              // 유효한 퀴즈만 필터링 (삭제된 퀴즈 제외)
              const validQuizzes = completedQuizzes.filter(quiz => 
                quiz && quiz.quizId && quiz.totalScore !== undefined
              );
              
              console.log(`학생 ${student.id}의 유효한 퀴즈 수: ${validQuizzes.length}/${completedQuizzes.length}`);
              
              // 각 퀴즈별 점수 상세 분석
              validQuizzes.forEach((quiz, index) => {
                console.log(`\n📊 퀴즈 ${index + 1} 상세:`, {
                  quizId: quiz.quizId,
                  quizTitle: quiz.quizTitle,
                  totalScore: quiz.totalScore,
                  numOfQuestions: quiz.numOfQuestions,
                  pass: quiz.pass,
                  submittedAt: quiz.submittedAt
                });
              });
              
              // 통계 계산 (유효한 퀴즈만 사용)
              const totalQuizzes = validQuizzes.length;
              const totalScore = validQuizzes.reduce((sum, quiz) => {
                console.log(`퀴즈 ${quiz.quizId} 점수 추가: ${quiz.totalScore || 0}`);
                return sum + (quiz.totalScore || 0);
              }, 0);
              const averageScore = totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0;
              const passedQuizzes = validQuizzes.filter(quiz => quiz.pass).length;
              
              console.log(`\n🔢 학생 ${student.id} 계산된 통계:`, {
                totalQuizzes,
                totalScore,
                averageScore,
                passedQuizzes,
                calculation: `${totalScore} / ${totalQuizzes} = ${averageScore}`
              });
              
              // 레벨 계산 제거 - 단순히 평균 점수만 사용
              console.log(`학생 ${student.id} 평균 점수: ${averageScore}점`);
              
              return {
                id: student.id,
                email: student.userInfo?.email || student.email || 'N/A',
                name: student.userInfo?.name || student.name || '이름 없음',
                userType: student.userType || student.role,
                status: 'active', // 기본값
                level: student.level || '학생', // 기본값으로 '학생' 사용
                created_at: student.createdAt || new Date().toISOString(),
                totalScore: totalScore,
                completedQuizzes: totalQuizzes,
                passedQuizzes: passedQuizzes,
                averageScore: averageScore,
                lastActivity: validQuizzes.length > 0 ? 
                  validQuizzes[validQuizzes.length - 1].submittedAt : 
                  student.createdAt || new Date().toISOString()
              };
            } catch (error) {
              console.error(`❌ 학생 ${student.id}의 퀴즈 데이터 로드 오류:`, error);
              // 퀴즈 데이터를 가져올 수 없어도 기본 학생 정보는 표시
              const defaultLevel = student.level || '학생';
              return {
                id: student.id,
                email: student.userInfo?.email || student.email || 'N/A',
                name: student.userInfo?.name || student.name || '이름 없음',
                userType: student.userType || student.role,
                status: 'active',
                level: defaultLevel,
                created_at: student.createdAt || new Date().toISOString(),
                totalScore: 0,
                completedQuizzes: 0,
                passedQuizzes: 0,
                averageScore: 0,
                lastActivity: student.createdAt || new Date().toISOString()
              };
            }
          })
        );
        
        // Promise.allSettled 결과 처리
        const successfulStudents = studentsWithStats
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value);
        
        const failedStudents = studentsWithStats
          .filter(result => result.status === 'rejected')
          .map(result => result.reason);
        
        console.log('성공적으로 로드된 학생:', successfulStudents.length);
        console.log('로드 실패한 학생:', failedStudents.length);
        
        if (failedStudents.length > 0) {
          console.warn('일부 학생 데이터 로드 실패:', failedStudents);
        }
        
        setStudents(successfulStudents);
        
        // 통계 계산 (상위권/중위권/하위권 제거)
        const activeStudents = successfulStudents.filter(s => s.status === 'active');
        const scores = activeStudents.map(s => s.averageScore).filter(score => score > 0);
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        
        // 명예의 전당 계산 (평균 성적이 가장 높은 학생)
        const topStudent = activeStudents
          .filter(s => s.averageScore > 0)
          .sort((a, b) => b.averageScore - a.averageScore)[0];
        
        setStats({
          totalStudents: activeStudents.length,
          averageScore: Math.round(avgScore * 10) / 10,
          topStudent: topStudent || null
        });
        
      } catch (error) {
        console.error('학생 데이터 로드 오류:', error);
        setError('학생 데이터를 불러오는 중 오류가 발생했습니다.');
        
        // 오류 발생 시 빈 배열로 설정
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
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
    <div className="pt-8 px-6 max-w-7xl mx-auto">
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

      {/* 로딩 상태 */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">학생 데이터를 불러오는 중...</p>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <div className="flex items-center">
            <div className="text-red-500 mr-3">❌</div>
            <div>
              <h3 className="text-red-800 font-medium">오류 발생</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 데이터가 로드된 경우에만 나머지 UI 표시 */}
      {!loading && !error && (
        <>
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
          <div className="grid md:grid-cols-3 gap-6 mb-8">
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
              <div className="text-2xl font-bold text-yellow-600 mb-2">
                {stats.topStudent ? stats.topStudent.name : '없음'}
              </div>
              <div className="text-sm text-gray-600 mb-1">
                {stats.topStudent ? `${stats.topStudent.averageScore}점` : ''}
              </div>
              <div className="text-gray-700">🏆 명예의 전당</div>
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
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">평균 점수</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">완료한 퀴즈</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">합격한 퀴즈</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">마지막 활동</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">가입일</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-gray-500">
                        {searchTerm ? '검색 결과가 없습니다.' : '등록된 학생이 없습니다.'}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-800">{student.name}</div>
                          <div className="text-xs text-gray-500">ID: {student.id}</div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {student.email}
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
                          <span className="text-green-600 font-medium">{student.passedQuizzes}</span>
                          <span className="text-gray-400">/{student.completedQuizzes}</span>
                        </td>
                        <td className="py-4 px-4 text-gray-600 text-sm">
                          {new Date(student.lastActivity).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-gray-600 text-sm">
                          {new Date(student.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
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
        </>
      )}
    </div>
  );
} 