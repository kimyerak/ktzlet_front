export default function UserTypeSelector({ selectedType, onTypeChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        👩‍🏫👨‍🎓 당신은 누구인가요?
      </label>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onTypeChange('teacher')}
          className={`p-4 rounded-2xl border-2 transition-all ${
            selectedType === 'teacher'
              ? 'border-pink-500 bg-pink-50 text-pink-700'
              : 'border-gray-200 hover:border-pink-300'
          }`}
        >
          <div className="text-2xl mb-2">👩‍🏫</div>
          <div className="font-medium">교사</div>
        </button>
        <button
          type="button"
          onClick={() => onTypeChange('student')}
          className={`p-4 rounded-2xl border-2 transition-all ${
            selectedType === 'student'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="text-2xl mb-2">👨‍🎓</div>
          <div className="font-medium">학생</div>
        </button>
      </div>
    </div>
  );
} 