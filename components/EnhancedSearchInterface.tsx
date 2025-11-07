/**
 * Enhanced Search Interface with Conversation Support
 * Features: Conversation history, follow-up questions, analytics tracking
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Search, 
  Send, 
  Loader2, 
  FileText, 
  Sparkles, 
  MessageSquare,
  TrendingUp,
  Zap,
  Plus,
  X,
  Upload,
  CheckCircle,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Home
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    id: string;
    text: string;
    score: number;
  }>;
  metadata?: {
    searchResultsCount?: number;
    responseTime?: number;
    enhancedQuery?: string;
    hasConversationContext?: boolean;
  };
}

interface SearchInterfaceProps {
  showAnalytics?: boolean;
}

export default function EnhancedSearchInterface({ showAnalytics = false }: SearchInterfaceProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(`conv_${Date.now()}`);
  const [showSources, setShowSources] = useState<string | null>(null);
  const [showAddPaper, setShowAddPaper] = useState(false);
  const [isAddingPaper, setIsAddingPaper] = useState(false);
  const [addPaperSuccess, setAddPaperSuccess] = useState<string | null>(null);
  const [addedPapers, setAddedPapers] = useState<Array<{ title: string; added: boolean }>>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    id: string;
    title: string;
    timestamp: string;
    messageCount: number;
  }>>([]);
  const [suggestedQueries] = useState([
    'Compare CNN vs LSTM for time series forecasting',
    'What are the latest advances in transformer architectures?',
    'Explain spacecraft anomaly detection using LSTM',
    'Who is Professor Danilo Vasconcellos Vargas?',
    'Summarize key papers on RAG systems and vector databases',
    'How do diffusion models work in generative AI?',
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load all conversation history from localStorage
  useEffect(() => {
    const loadHistory = () => {
      const historyKey = 'conversation_history';
      const savedHistory = localStorage.getItem(historyKey);
      if (savedHistory) {
        setConversationHistory(JSON.parse(savedHistory));
      }
    };
    loadHistory();
  }, []);

  // Load conversation history from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(`conversation_${conversationId}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, [conversationId]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`conversation_${conversationId}`, JSON.stringify(messages));
      
      // Update conversation history
      const historyKey = 'conversation_history';
      const savedHistory = localStorage.getItem(historyKey);
      const history = savedHistory ? JSON.parse(savedHistory) : [];
      
      // Get first user message as title
      const firstUserMessage = messages.find(m => m.role === 'user');
      const title = firstUserMessage ? firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '') : 'New Conversation';
      
      // Check if conversation already exists in history
      const existingIndex = history.findIndex((h: { id: string }) => h.id === conversationId);
      const conversationEntry = {
        id: conversationId,
        title,
        timestamp: new Date().toISOString(),
        messageCount: messages.length,
      };
      
      if (existingIndex >= 0) {
        history[existingIndex] = conversationEntry;
      } else {
        history.unshift(conversationEntry);
      }
      
      // Keep only last 20 conversations
      const trimmedHistory = history.slice(0, 20);
      localStorage.setItem(historyKey, JSON.stringify(trimmedHistory));
      setConversationHistory(trimmedHistory);
    }
  }, [messages, conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Start new conversation
  const handleNewChat = () => {
    const newConvId = `conv_${Date.now()}`;
    setConversationId(newConvId);
    setMessages([]);
    setInput('');
    setShowSources(null);
    setShowSidebar(false);
  };

  // Load a conversation from history
  const loadConversation = (convId: string) => {
    const savedMessages = localStorage.getItem(`conversation_${convId}`);
    if (savedMessages) {
      setConversationId(convId);
      setMessages(JSON.parse(savedMessages));
      setShowSidebar(false);
      setShowSources(null);
    }
  };

  // Delete a conversation from history
  const deleteConversation = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Remove from localStorage
    localStorage.removeItem(`conversation_${convId}`);
    
    // Update history
    const historyKey = 'conversation_history';
    const savedHistory = localStorage.getItem(historyKey);
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      const updatedHistory = history.filter((h: { id: string }) => h.id !== convId);
      localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
      setConversationHistory(updatedHistory);
    }
    
    // If deleting current conversation, start a new one
    if (convId === conversationId) {
      handleNewChat();
    }
  };

  // Add papers by topic or paper name
  const handleAddPaper = async (paperData: {
    query: string;
    authors?: string;
  }) => {
    setIsAddingPaper(true);
    setAddPaperSuccess(null);
    setAddedPapers([]);
    
    try {
      const response = await fetch('/api/fetch-papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: paperData.query,
          authors: paperData.authors?.split(',').map(a => a.trim()).filter(Boolean),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const count = result.papersAdded || 0;
        const papers = result.papers || [];
        
        // Show papers being added one by one with animation
        for (let i = 0; i < papers.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 300));
          setAddedPapers(prev => [...prev, { title: papers[i], added: true }]);
        }
        
        // Wait a bit before showing success
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsAddingPaper(false);
        
        setAddPaperSuccess(`✅ Successfully found and added ${count} paper${count !== 1 ? 's' : ''}`);
        
        // Auto-close after showing success and start conversation
        setTimeout(() => {
          setShowAddPaper(false);
          setAddPaperSuccess(null);
          setAddedPapers([]);
          
          // Auto-start conversation about added papers
          if (count > 0) {
            const autoQuery = `Summarize the key findings and main contributions from the papers about "${paperData.query}"`;
            setInput(autoQuery);
            // Optionally auto-submit
            // handleSearch(autoQuery);
          }
        }, 3000);
      } else {
        throw new Error(result.error || 'Failed to fetch papers');
      }
    } catch (error) {
      console.error('Error fetching papers:', error);
      setAddPaperSuccess(`❌ ${error instanceof Error ? error.message : 'Error fetching papers. Please try again.'}`);
      setIsAddingPaper(false);
      setAddedPapers([]);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          conversationId,
          useConversationContext: true,
          maxResults: 5,
          conversationHistory: messages.slice(-4).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        metadata: data.metadata,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(input);
  };

  const handleSuggestedQuery = (query: string) => {
    setInput(query);
    handleSearch(query);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Professional Sidebar - Chat History */}
      {showSidebar && (
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col shadow-lg">
          {/* Sidebar Header */}
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Conversations</h2>
            </div>
            <div className="space-y-2">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Conversation
              </button>
              <button
                onClick={() => setShowAddPaper(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Upload className="w-4 h-4" />
                Add Paper
              </button>
            </div>
          </div>
          
          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {conversationHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">No conversations yet</p>
                <p className="text-xs text-gray-500">Start a new conversation to begin</p>
              </div>
            ) : (
              <div className="p-3 space-y-1">
                {conversationHistory.map((conv) => (
                  <div
                    key={conv.id}
                    className={`w-full text-left p-3 rounded-lg transition-all group relative ${
                      conv.id === conversationId 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                        conv.id === conversationId ? 'bg-blue-600' : 'bg-gray-300'
                      }`} />
                      <button
                        onClick={() => loadConversation(conv.id)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <p className={`text-sm font-medium line-clamp-2 mb-1.5 ${
                          conv.id === conversationId ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {conv.title}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(conv.timestamp).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {conv.messageCount} msgs
                          </span>
                        </div>
                      </button>
                      <button
                        onClick={(e) => deleteConversation(conv.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition-all shrink-0"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Sidebar Footer */}
          {conversationHistory.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{conversationHistory.length} conversation{conversationHistory.length !== 1 ? 's' : ''}</span>
                <span className="text-gray-400">Auto-saved</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Clean and Professional */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={showSidebar ? "Collapse sidebar" : "Expand sidebar"}
              >
                {showSidebar ? (
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                )}
              </button>
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  KnowSphere
                </h1>
                <p className="text-xs text-gray-500">
                  2000+ AI/ML Research Papers
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Back to Home"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>
              {messages.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MessageSquare className="w-4 h-4" />
                  <span className="font-medium">{messages.length}</span>
                  <span className="text-gray-400">queries</span>
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-700">Active</span>
              </div>
            </div>
          </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="max-w-4xl mx-auto">
                {/* Hero Section */}
                <div className="text-center py-16 px-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-900">AI Research Assistant</span>
                  </div>
                  
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Ask anything about AI research
                  </h2>
                  <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
                    Search through 2000+ research papers using advanced hybrid search. 
                    Get AI-powered summaries, comparisons, and insights.
                  </p>

                  {/* How it Works - Visual Diagram */}
                  <div className="grid grid-cols-3 gap-6 mb-16 max-w-3xl mx-auto">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Search className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">1. You Ask</h3>
                      <p className="text-sm text-gray-600">Type your research question or topic</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Zap className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">2. AI Searches</h3>
                      <p className="text-sm text-gray-600">Hybrid search finds relevant papers</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Sparkles className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">3. Get Insights</h3>
                      <p className="text-sm text-gray-600">Receive synthesized answers with citations</p>
                    </div>
                  </div>
                </div>

                {/* Suggested Queries */}
                <div className="mb-12">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 text-center">
                    Try These Questions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestedQueries.map((query, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestedQuery(query)}
                      className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 text-gray-400 group-hover:text-blue-600 mt-0.5 shrink-0">
                          <Search className="w-5 h-5" />
                        </div>
                        <span className="text-gray-700 group-hover:text-gray-900 transition-colors text-sm">
                          {query}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                </div>

                {/* Feature Pills */}
                <div className="flex flex-wrap items-center justify-center gap-3 py-8 border-t border-gray-100">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Hybrid Search</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Conversational AI</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">2000+ Papers</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                    <Sparkles className="w-4 h-4 text-pink-600" />
                    <span className="text-sm font-medium text-gray-700">Gemini AI</span>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="space-y-6">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex gap-4 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-3xl ${message.role === 'user' ? 'order-first' : ''}`}>
                    <div
                      className={`rounded-lg px-5 py-4 ${
                        message.role === 'user'
                          ? 'bg-gray-100 text-gray-900'
                          : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-h2:text-lg prose-h2:mt-4 prose-h2:mb-2 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-p:my-2 prose-ul:my-2 prose-li:my-1 prose-strong:text-gray-900 prose-strong:font-semibold prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-table:border-collapse prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:px-3 prose-th:py-2 prose-th:font-semibold prose-td:border prose-td:border-gray-200 prose-td:px-3 prose-td:py-2">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed">
                          {message.content}
                        </p>
                      )}
                      
                      {/* Metadata */}
                      {message.metadata && message.role === 'assistant' && (
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                          {message.metadata.searchResultsCount !== undefined && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              <span className="font-medium">{message.metadata.searchResultsCount}</span> sources
                            </span>
                          )}
                          {message.metadata.responseTime !== undefined && (
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              {(message.metadata.responseTime / 1000).toFixed(2)}s
                            </span>
                          )}
                          {message.metadata.hasConversationContext && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              Context
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={() => setShowSources(showSources === `${idx}` ? null : `${idx}`)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5"
                        >
                          <FileText className="w-4 h-4" />
                          {showSources === `${idx}` ? 'Hide' : 'View'} {message.sources.length} cited sources
                        </button>
                        
                        {showSources === `${idx}` && (
                          <div className="mt-3 space-y-2">
                            {message.sources.map((source, sourceIdx) => (
                              <div
                                key={sourceIdx}
                                className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-gray-700">
                                    Source {sourceIdx + 1}
                                  </span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                    Score: {source.score.toFixed(2)}
                                  </span>
                                </div>
                                <p className="text-gray-700 line-clamp-3 leading-relaxed">
                                  {source.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm font-medium">
                      U
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="max-w-3xl">
                    <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Analyzing research papers...</p>
                          <p className="text-xs text-gray-500 mt-0.5">Searching through 2000+ papers</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white shadow-lg">
          <div className="max-w-4xl mx-auto px-6 py-5">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about research papers, compare studies, or explore AI concepts..."
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-8 py-3.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Ask</span>
                  </>
                )}
              </button>
            </form>
            
            {messages.length > 0 && (
              <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-500">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Context-aware: I remember our conversation for follow-up questions</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Paper Modal */}
      {showAddPaper && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Add Research Papers</h2>
                <p className="text-sm text-gray-500">Search and add papers by topic or title</p>
              </div>
              <button
                onClick={() => {
                  setShowAddPaper(false);
                  setAddPaperSuccess(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close dialog"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Papers being added list */}
              {isAddingPaper && addedPapers.length > 0 && (
                <div className="mb-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    Adding Papers...
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {addedPapers.map((paper, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-sm bg-white p-2 rounded border border-gray-200 animate-fadeIn"
                      >
                        {paper.added ? (
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        ) : (
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin mt-0.5 shrink-0" />
                        )}
                        <span className="text-gray-700 flex-1">{paper.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Success/Error message */}
              {addPaperSuccess ? (
                <div className={`p-4 rounded-lg mb-4 ${addPaperSuccess.startsWith('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  <div className="flex items-center gap-2">
                    {addPaperSuccess.startsWith('✅') ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <X className="w-5 h-5" />
                    )}
                    <div>
                      <p className="font-medium">{addPaperSuccess}</p>
                      {addPaperSuccess.startsWith('✅') && (
                        <p className="text-sm mt-1">Starting conversation about these papers...</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (isAddingPaper) return;
                  const formData = new FormData(e.currentTarget);
                  handleAddPaper({
                    query: formData.get('query') as string,
                    authors: formData.get('authors') as string,
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic, Paper Title, or Keywords *
                  </label>
                  <input
                    type="text"
                    name="query"
                    required
                    disabled={isAddingPaper}
                    placeholder="e.g., transformer architecture, LSTM anomaly detection, GANs for image generation"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Enter a research topic, paper title, or keywords. We&apos;ll automatically find and add relevant papers.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Author Name(s) <span className="text-gray-400 font-normal">(optional, comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    name="authors"
                    disabled={isAddingPaper}
                    placeholder="e.g., Yoshua Bengio, Geoffrey Hinton"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Optionally filter by specific author(s) to narrow down results.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">How it works:</p>
                      <ul className="space-y-1 text-blue-800">
                        <li>• We search academic databases (arXiv, Semantic Scholar, etc.)</li>
                        <li>• Relevant papers are automatically downloaded and indexed</li>
                        <li>• Papers become immediately searchable in KnowSphere</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddPaper(false);
                      setAddPaperSuccess(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingPaper}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isAddingPaper ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Searching & Adding Papers...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Find & Add Papers
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
