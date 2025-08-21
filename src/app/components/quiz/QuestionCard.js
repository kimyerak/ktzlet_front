'use client';

import { useState } from 'react';
import Card from '../../ui/Card';

export default function QuestionCard({ 
  question, 
  questionNumber, 
  onAnswerChange, 
  userAnswer, 
  isReadOnly = false,
  showCorrectAnswer = false 
}) {
  const [selectedOption, setSelectedOption] = useState(userAnswer || '');

  const handleOptionSelect = (optionIndex) => {
    if (isReadOnly) return;
    
    setSelectedOption(optionIndex);
    onAnswerChange(question.id, optionIndex);
  };

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'DICTATION':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-lg font-medium text-blue-800">
                {question.stem || '이 단어를 듣고 스펠링을 쓰시오:'}
              </p>
            </div>
            {!isReadOnly ? (
              <input
                type="text"
                value={userAnswer || ''}
                onChange={(e) => onAnswerChange(question.id, e.target.value)}
                placeholder="정답을 입력하세요..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isReadOnly}
              />
            ) : (
              <div className="p-3 bg-gray-100 rounded-lg">
                <p className="font-medium">내 답안: {userAnswer || '(답안 없음)'}</p>
                {showCorrectAnswer && (
                  <p className="text-green-600 mt-2">정답: {question.correctAnswer}</p>
                )}
              </div>
            )}
          </div>
        );

      case 'MULTIPLE':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-lg font-medium text-green-800">
                {question.stem || '정답을 선택하세요'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {question.options && question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(index)}
                  disabled={isReadOnly}
                  className={`p-3 text-left rounded-lg border-2 transition-all ${
                    selectedOption === index
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span className="font-medium mr-2">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </button>
              ))}
            </div>
            {showCorrectAnswer && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-green-600 font-medium">
                  정답: {String.fromCharCode(65 + question.correctAnswer)}. {question.options[question.correctAnswer]}
                </p>
              </div>
            )}
          </div>
        );

      case 'OX':
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-lg font-medium text-purple-800 mb-2">
                단어와 뜻이 올바르게 매치되었나요?
              </p>
              <p className="text-lg font-bold text-purple-900">
                {question.stem || '단어 : 뜻'}
              </p>
            </div>
            <div className="flex gap-4">
              {['X', 'O'].map((option, index) => (
                <button
                  key={option}
                  onClick={() => handleOptionSelect(index)}
                  disabled={isReadOnly}
                  className={`flex-1 py-3 px-6 rounded-lg border-2 font-bold text-lg transition-all ${
                    selectedOption === index
                      ? 'border-purple-500 bg-purple-50 text-purple-800'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {option}
                </button>
              ))}
            </div>
            {showCorrectAnswer && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                <p className="text-purple-600 font-medium">
                  정답: {question.correctAnswer === 1 ? 'O (맞음)' : 'X (틀림)'}
                </p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600">지원하지 않는 문제 유형입니다.</p>
          </div>
        );
    }
  };

  return (
    <Card className="mb-6">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            문제 {questionNumber}번
          </h3>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {question.type === 'DICTATION' ? '받아쓰기' : 
               question.type === 'MULTIPLE' ? '4지선다' : 'OX'}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {question.points || 1}점
            </span>
          </div>
        </div>
        
        {renderQuestionContent()}
        
        {question.explanation && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-yellow-800 text-sm">
              💡 {question.explanation}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
} 