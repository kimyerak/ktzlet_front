'use client';

import { useState, useEffect } from 'react';
import { vocabService } from '../../services/apiService';
import Header from '../../ui/Header';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import ErrorMessage from '../../ui/ErrorMessage';

export default function VocabSelection({ testConfig, onBack, onNext, user }) {
  const [vocabs, setVocabs] = useState([]);
  const [selectedVocabs, setSelectedVocabs] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVocab, setNewVocab] = useState({ word: '', definition: '' });

  // vocab 목록 로드
  const loadVocabs = async () => {
    try {
      setLoading(true);
      const vocabList = await vocabService.getVocabs();
      setVocabs(vocabList);
      setError('');
    } catch (error) {
      console.error('Vocab 로드 오류:', error);
      setError('단어 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVocabs();
  }, []);

  // 검색
  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      loadVocabs();
      return;
    }

    try {
      setLoading(true);
      const [wordResults, definitionResults] = await Promise.all([
        vocabService.searchVocabByWord(searchKeyword),
        vocabService.searchVocabByDefinition(searchKeyword)
      ]);
      
      // 중복 제거하여 결합
      const combinedResults = [...wordResults];
      definitionResults.forEach(defResult => {
        if (!combinedResults.find(wordResult => wordResult.id === defResult.id)) {
          combinedResults.push(defResult);
        }
      });
      
      setVocabs(combinedResults);
    } catch (error) {
      console.error('검색 오류:', error);
      setError('검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 새 단어 추가
  const handleAddVocab = async (e) => {
    e.preventDefault();
    if (!newVocab.word.trim() || !newVocab.definition.trim()) {
      setError('영단어와 뜻을 모두 입력해주세요.');
      return;
    }

    try {
      const addedVocab = await vocabService.createVocab(newVocab);
      setVocabs(prev => [addedVocab, ...prev]);
      setNewVocab({ word: '', definition: '' });
      setShowAddForm(false);
      setError('');
      alert('새 단어가 추가되었습니다!');
    } catch (error) {
      console.error('단어 추가 오류:', error);
      setError('단어 추가 중 오류가 발생했습니다.');
    }
  };

  // vocab 선택/해제
  const toggleVocabSelection = (vocabId) => {
    setSelectedVocabs(prev => 
      prev.includes(vocabId) 
        ? prev.filter(id => id !== vocabId)
        : [...prev, vocabId]
    );
  };

  // 다음 단계로
  const handleNext = () => {
    if (selectedVocabs.length === 0) {
      setError('최소 1개 이상의 단어를 선택해주세요.');
      return;
    }

    if (selectedVocabs.length < testConfig.numofquestion) {
      setError(`${testConfig.numofquestion}개의 문제를 만들려면 최소 ${testConfig.numofquestion}개의 단어가 필요합니다.`);
      return;
    }

    // 선택된 vocab 정보와 함께 다음 단계로
    const selectedVocabData = vocabs.filter(v => selectedVocabs.includes(v.id));
    onNext({ ...testConfig, selectedVocabs: selectedVocabData });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-purple-100">
      <Header user={user} />
      
      <div className="max-w-6xl mx-auto p-4 pt-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📚 단어 선택</h1>
          <p className="text-xl text-gray-600">
            테스트에 사용할 영단어를 선택하세요
          </p>
          <div className="text-sm text-gray-500 mt-2">
            테스트: {testConfig?.title} | 문제 수: {testConfig?.numofquestion}개 필요
          </div>
        </div>

        {/* 검색 및 추가 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-blue-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
            <div className="flex-1 flex gap-2">
              <Input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="영단어 또는 한국어 뜻으로 검색..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} variant="secondary">
                🔍 검색
              </Button>
              <Button onClick={() => { setSearchKeyword(''); loadVocabs(); }} variant="outline">
                전체
              </Button>
            </div>
            <Button 
              onClick={() => setShowAddForm(!showAddForm)} 
              variant="primary"
            >
              {showAddForm ? '❌ 취소' : '➕ 새 단어 추가'}
            </Button>
          </div>

          {/* 새 단어 추가 폼 */}
          {showAddForm && (
            <form onSubmit={handleAddVocab} className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl">
              <Input
                label="영단어"
                value={newVocab.word}
                onChange={(e) => setNewVocab(prev => ({ ...prev, word: e.target.value }))}
                placeholder="예: apple"
                required
              />
              <Input
                label="한국어 뜻"
                value={newVocab.definition}
                onChange={(e) => setNewVocab(prev => ({ ...prev, definition: e.target.value }))}
                placeholder="예: 사과"
                required
              />
              <div className="md:col-span-2">
                <Button type="submit" variant="primary" size="sm">
                  ✅ 추가하기
                </Button>
              </div>
            </form>
          )}
        </div>

        <ErrorMessage message={error} />

        {/* 선택 상태 표시 */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium text-blue-800">
                선택된 단어: {selectedVocabs.length}개
              </span>
              <span className="text-blue-600 ml-2">
                (필요: {testConfig?.numofquestion}개)
              </span>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setSelectedVocabs([])} 
                variant="outline" 
                size="sm"
                disabled={selectedVocabs.length === 0}
              >
                전체 해제
              </Button>
              <Button 
                onClick={() => setSelectedVocabs(vocabs.slice(0, testConfig?.numofquestion).map(v => v.id))} 
                variant="outline" 
                size="sm"
                disabled={vocabs.length === 0}
              >
                자동 선택
              </Button>
            </div>
          </div>
        </div>

        {/* 단어 목록 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-blue-200 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            단어 목록 ({vocabs.length}개)
          </h3>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">단어 목록을 불러오는 중...</p>
            </div>
          ) : vocabs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📖</div>
              <p className="text-xl text-gray-600 mb-2">등록된 단어가 없습니다</p>
              <p className="text-gray-500">새 단어를 추가해보세요!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {vocabs.map((vocab) => (
                <div
                  key={vocab.id}
                  onClick={() => toggleVocabSelection(vocab.id)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedVocabs.includes(vocab.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-lg">{vocab.word}</div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedVocabs.includes(vocab.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedVocabs.includes(vocab.id) && (
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm">{vocab.definition}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between">
          <Button onClick={onBack} variant="outline" size="lg">
            ← 이전 단계
          </Button>
          <Button 
            onClick={handleNext} 
            variant="primary" 
            size="lg"
            disabled={selectedVocabs.length < (testConfig?.numofquestion || 1)}
          >
            다음 단계: 문제 작성 →
          </Button>
        </div>
      </div>
    </div>
  );
} 