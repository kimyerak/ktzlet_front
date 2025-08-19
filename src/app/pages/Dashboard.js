'use client';

import { useAuth } from '../contexts/AuthContext';
import TeacherDashboard from './teacher/TeacherDashboard';
import StudentDashboard from './student/StudentDashboard';
import Header from '../ui/Header';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <Header user={user} />
      
      {/* 메인 컨텐츠 */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {user.type === 'teacher' ? <TeacherDashboard user={user} /> : <StudentDashboard user={user} />}
      </main>
    </div>
  );
} 