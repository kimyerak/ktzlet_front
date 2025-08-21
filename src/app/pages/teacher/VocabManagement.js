'use client';

import { useState, useEffect } from 'react';
import { vocabService } from '../../services/apiService';
import Header from '../../ui/Header';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import ErrorMessage from '../../ui/ErrorMessage';

export default function VocabManagement({ user }) {
  const [vocabs, setVocabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVocab, setEditingVocab] = useState(null);
  const [formData, setFormData] = useState({
    word: '',
    definition: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // vocab 목록 로드
  const loadVocabs = async () => {
    try {
      setLoading(true);
      const vocabList = await vocabService.getVocabs();
      setVocabs(vocabList);
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
      // 영단어와 한국어 뜻 둘 다 검색해서 결합
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

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.word.trim() || !formData.definition.trim()) {
      setError('영단어와 뜻을 모두 입력해주세요.');
      return;
    }

    try {
      if (editingVocab) {
        // 수정
        await vocabService.updateVocab(editingVocab.id, formData);
        setSuccess('단어가 성공적으로 수정되었습니다.');
      } else {
        // 등록
        await vocabService.createVocab(formData);
        setSuccess('단어가 성공적으로 등록되었습니다.');
      }
      
      // 폼 초기화
      setFormData({ word: '', definition: '' });
      setShowAddForm(false);
      setEditingVocab(null);
      
      // 목록 새로고침
      loadVocabs();
    } catch (error) {
      console.error('저장 오류:', error);
      setError('저장 중 오류가 발생했습니다.');
    }
  };

  // 삭제
  const handleDelete = async (vocabId) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await vocabService.deleteVocab(vocabId);
      setSuccess('단어가 성공적으로 삭제되었습니다.');
      loadVocabs();
    } catch (error) {
      console.error('삭제 오류:', error);
      setError('삭제 중 오류가 발생했습니다.');
    }
  };

  // 수정 시작
  const startEdit = (vocab) => {
    setEditingVocab(vocab);
    setFormData({
      word: vocab.word,
      definition: vocab.definition
    });
    setShowAddForm(true);
  };

  // 폼 취소
  const cancelForm = () => {
    setShowAddForm(false);
    setEditingVocab(null);
    setFormData({ word: '', definition: '' });
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-purple-100">
      <Header user={user} />
      
      <div className="max-w-6xl mx-auto p-4 pt-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📚 단어 관리</h1>
          <p className="text-xl text-gray-600">테스트에 사용할 영단어를 관리하세요</p>
        </div>

        {/* 검색 및 추가 버튼 */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
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
              onClick={() => setShowAddForm(true)} 
              variant="primary"
              disabled={showAddForm}
            >
              ➕ 단어 추가
            </Button>
          </div>
        </Card>

        {/* 성공/오류 메시지 */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
            ✅ {success}
          </div>
        )}
        <ErrorMessage message={error} />

        {/* 단어 추가/수정 폼 */}
        {showAddForm && (
          <Card className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingVocab ? '📝 단어 수정' : '➕ 새 단어 추가'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="영단어"
                  value={formData.word}
                  onChange={(e) => setFormData(prev => ({ ...prev, word: e.target.value }))}
                  placeholder="예: apple"
                  required
                />
                <Input
                  label="한국어 뜻"
                  value={formData.definition}
                  onChange={(e) => setFormData(prev => ({ ...prev, definition: e.target.value }))}
                  placeholder="예: 사과"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary">
                  {editingVocab ? '💾 수정' : '✅ 추가'}
                </Button>
                <Button type="button" onClick={cancelForm} variant="outline">
                  ❌ 취소
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* 단어 목록 */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">단어 목록</h3>
            <span className="text-gray-600">총 {vocabs.length}개</span>
          </div>

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
            <div className="grid gap-3">
              {vocabs.map((vocab) => (
                <div
                  key={vocab.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <div className="font-bold text-lg text-gray-800">{vocab.word}</div>
                    <div className="text-gray-600">{vocab.definition}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      등록일: {new Date(vocab.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => startEdit(vocab)}
                      variant="outline"
                      size="sm"
                    >
                      ✏️ 수정
                    </Button>
                    <Button
                      onClick={() => handleDelete(vocab.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      🗑️ 삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
} 