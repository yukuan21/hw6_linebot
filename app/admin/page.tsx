'use client';

import { useState, useEffect, useCallback } from 'react';

// 類型定義
interface Conversation {
  _id: string;
  userId: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  _id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

interface ConversationsResponse {
  conversations?: Conversation[];
  messages?: Message[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isSearch?: boolean;
}

interface MessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminPage() {
  // 狀態管理
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchMessages, setSearchMessages] = useState<Message[]>([]); // 搜尋結果的訊息列表
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(false);
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false); // 是否為搜尋模式

  // 分頁狀態
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // 篩選狀態
  const [filters, setFilters] = useState({
    userId: '',
    startDate: '',
    endDate: '',
    search: '',
  });

  // 載入對話列表
  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (filters.userId) {
        params.append('userId', filters.userId);
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }

      const response = await fetch(`/api/admin/conversations?${params}`);
      if (!response.ok) {
        throw new Error('載入對話列表失敗');
      }

      const data: ConversationsResponse = await response.json();
      
      // 判斷是搜尋模式還是對話列表模式
      if (data.isSearch && data.messages) {
        // 搜尋模式：顯示訊息列表
        setIsSearchMode(true);
        setSearchMessages(data.messages);
        setConversations([]);
      } else if (data.conversations) {
        // 對話列表模式：顯示對話列表
        setIsSearchMode(false);
        setConversations(data.conversations);
        setSearchMessages([]);
      }
      
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('載入對話列表時發生錯誤:', error);
      alert('載入對話列表時發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  // 載入訊息列表
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const params = new URLSearchParams({
        conversationId,
        page: '1',
        limit: '100', // 一次載入較多訊息
      });

      const response = await fetch(`/api/admin/messages?${params}`);
      if (!response.ok) {
        throw new Error('載入訊息列表失敗');
      }

      const data: MessagesResponse = await response.json();
      setMessages((prev) => ({
        ...prev,
        [conversationId]: data.messages,
      }));
    } catch (error) {
      console.error('載入訊息列表時發生錯誤:', error);
      alert('載入訊息列表時發生錯誤，請稍後再試');
    }
  }, []);

  // 切換對話展開狀態
  const toggleConversation = (conversationId: string) => {
    if (expandedConversation === conversationId) {
      setExpandedConversation(null);
    } else {
      setExpandedConversation(conversationId);
      // 如果還沒有載入過訊息，則載入
      if (!messages[conversationId]) {
        loadMessages(conversationId);
      }
    }
  };

  // 重置篩選條件
  const resetFilters = () => {
    setFilters({
      userId: '',
      startDate: '',
      endDate: '',
      search: '',
    });
    setPage(1);
    setIsSearchMode(false);
    setSearchMessages([]);
  };

  // 應用篩選條件
  const applyFilters = () => {
    setPage(1);
    loadConversations();
  };

  // 初始載入和自動刷新
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 自動刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadConversations();
    }, 5000); // 每 5 秒刷新一次

    return () => clearInterval(interval);
  }, [autoRefresh, loadConversations]);

  // 格式化日期時間
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 格式化日期（用於日期輸入）
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 標題 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            LINE Bot 管理後台
          </h1>
          <p className="text-gray-600">檢視對話紀錄和訊息</p>
        </div>

        {/* 篩選面板 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">篩選條件</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 使用者 ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                使用者 ID
              </label>
              <input
                type="text"
                value={filters.userId}
                onChange={(e) =>
                  setFilters({ ...filters, userId: e.target.value })
                }
                placeholder="輸入使用者 ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 開始日期 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                開始日期
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 結束日期 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                結束日期
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 搜尋 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                搜尋對話
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                placeholder="搜尋標題或內容"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 按鈕 */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              套用篩選
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              重置
            </button>
          </div>
        </div>

        {/* 控制面板 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                自動更新（每 5 秒）
              </span>
            </label>
            {lastUpdate && (
              <span className="text-sm text-gray-500">
                最後更新：{formatDateTime(lastUpdate.toISOString())}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600">
            {isSearchMode
              ? `共 ${total} 筆符合的訊息，第 ${page} / ${totalPages} 頁`
              : `共 ${total} 筆對話，第 ${page} / ${totalPages} 頁`}
          </div>
        </div>

        {/* 搜尋結果：訊息列表 */}
        {isSearchMode ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">載入中...</div>
            ) : searchMessages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                沒有找到符合的訊息
              </div>
            ) : (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  搜尋結果：找到 {total} 筆符合的訊息
                </h2>
                <div className="space-y-3">
                  {searchMessages.map((message) => (
                    <div
                      key={message._id}
                      className={`p-4 rounded-lg border-l-4 ${
                        message.role === 'user'
                          ? 'bg-blue-50 border-blue-500'
                          : message.role === 'assistant'
                          ? 'bg-green-50 border-green-500'
                          : 'bg-gray-50 border-gray-500'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded ${
                              message.role === 'user'
                                ? 'bg-blue-100 text-blue-700'
                                : message.role === 'assistant'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {message.role === 'user'
                              ? '使用者'
                              : message.role === 'assistant'
                              ? '助理'
                              : '系統'}
                          </span>
                          <span className="text-xs text-gray-500">
                            使用者 ID: {message.userId}
                          </span>
                          <span className="text-xs text-gray-500">
                            對話 ID: {message.conversationId.substring(0, 8)}...
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 分頁控制 */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  上一頁
                </button>
                <span className="text-sm text-gray-700">
                  第 {page} / {totalPages} 頁
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  下一頁
                </button>
              </div>
            )}
          </div>
        ) : (
          /* 對話列表 */
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">載入中...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                沒有找到對話紀錄
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        使用者 ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        標題
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        訊息數
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        建立時間
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        最後更新
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {conversations.map((conversation) => (
                      <>
                        <tr
                          key={conversation._id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => toggleConversation(conversation._id)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {conversation.userId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {conversation.title || '(無標題)'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {conversation.messageCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(conversation.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(conversation.updatedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleConversation(conversation._id);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {expandedConversation === conversation._id
                                ? '收起'
                                : '展開'}
                            </button>
                          </td>
                        </tr>
                        {expandedConversation === conversation._id && (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 bg-gray-50">
                              <div className="space-y-3">
                                <h3 className="font-semibold text-gray-900 mb-3">
                                  訊息列表
                                </h3>
                                {messages[conversation._id] ? (
                                  messages[conversation._id].length === 0 ? (
                                    <p className="text-gray-500 text-sm">
                                      此對話沒有訊息
                                    </p>
                                  ) : (
                                    <div className="space-y-2">
                                      {messages[conversation._id].map(
                                        (message) => (
                                          <div
                                            key={message._id}
                                            className={`p-3 rounded-lg ${
                                              message.role === 'user'
                                                ? 'bg-blue-50 border-l-4 border-blue-500'
                                                : message.role === 'assistant'
                                                ? 'bg-green-50 border-l-4 border-green-500'
                                                : 'bg-gray-50 border-l-4 border-gray-500'
                                            }`}
                                          >
                                            <div className="flex items-start justify-between mb-1">
                                              <span
                                                className={`text-xs font-medium ${
                                                  message.role === 'user'
                                                    ? 'text-blue-700'
                                                    : message.role === 'assistant'
                                                    ? 'text-green-700'
                                                    : 'text-gray-700'
                                                }`}
                                              >
                                                {message.role === 'user'
                                                  ? '使用者'
                                                  : message.role === 'assistant'
                                                  ? '助理'
                                                  : '系統'}
                                              </span>
                                              <span className="text-xs text-gray-500">
                                                {formatDateTime(message.timestamp)}
                                              </span>
                                            </div>
                                            <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                              {message.content}
                                            </p>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )
                                ) : (
                                  <p className="text-gray-500 text-sm">
                                    載入訊息中...
                                  </p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 分頁控制 */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  上一頁
                </button>
                <span className="text-sm text-gray-700">
                  第 {page} / {totalPages} 頁
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  下一頁
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
