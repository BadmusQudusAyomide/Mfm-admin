import { useEffect, useRef, useState } from 'react'
import { Send, Image, Paperclip, RotateCcw, Settings, MessageSquare, Trash2 } from 'lucide-react'
import { api } from '../lib/api'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  image?: string
  timestamp: Date
}

type ChatSession = {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
}

export default function ModernAIChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: '1',
      title: 'Welcome Chat',
      messages: [
        {
          id: '1',
          role: 'assistant',
          content: "Hello! I'm your AI assistant. I can help you with questions, analyze images, write code, and much more. What would you like to explore today?",
          timestamp: new Date()
        }
      ],
      createdAt: new Date()
    }
  ])
  
  const [currentSessionId, setCurrentSessionId] = useState('1')
  const [input, setInput] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [model, setModel] = useState('gemini-1.5-flash')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  const messagesRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentSession = sessions.find(s => s.id === currentSessionId)
  const messages = currentSession?.messages || []

  useEffect(() => {
    messagesRef.current?.scrollTo({ 
      top: messagesRef.current.scrollHeight, 
      behavior: 'smooth' 
    })
  }, [messages, loading])

  // Auto-resize the textarea up to a max height
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const max = 160 // px
    el.style.height = Math.min(el.scrollHeight, max) + 'px'
  }, [input])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `Chat ${sessions.length + 1}`,
      messages: [{
        id: Date.now().toString(),
        role: 'assistant',
        content: "Hello! I'm ready to help you with anything you need.",
        timestamp: new Date()
      }],
      createdAt: new Date()
    }
    setSessions(prev => [newSession, ...prev])
    setCurrentSessionId(newSession.id)
  }

  const deleteSession = (sessionId: string) => {
    if (sessions.length > 1) {
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (currentSessionId === sessionId) {
        setCurrentSessionId(sessions.find(s => s.id !== sessionId)?.id || sessions[0].id)
      }
    }
  }

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed && !selectedImage) return
    
    setError(null)
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      image: selectedImage || undefined,
      timestamp: new Date()
    }

    // Update current session with user message
    setSessions(prev => prev.map(session => 
      session.id === currentSessionId 
        ? { ...session, messages: [...session.messages, userMessage] }
        : session
    ))

    setInput('')
    setSelectedImage(null)
    setLoading(true)

    try {
      const currentMessages = (sessions.find(s => s.id === currentSessionId)?.messages || []).concat(userMessage)
      const payload = {
        model,
        messages: currentMessages.map(m => ({
          role: m.role,
          content: m.content,
          imageUrl: m.image && /^https?:\/\//i.test(m.image) ? m.image : undefined,
        }))
      }
      const { data } = await api.post('/api/ai/chat', payload)
      if (data?.ok) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.text || '',
          timestamp: new Date()
        }
        setSessions(prev => prev.map(session => 
          session.id === currentSessionId 
            ? { ...session, messages: [...session.messages, aiMessage] }
            : session
        ))
      } else {
        setError(data?.error || 'Something went wrong')
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!loading) sendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex h-[100dvh] sm:h-[calc(100vh-64px)] overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Mobile Overlay for Sidebar */}
      {sidebarOpen && (
        <div
          className="sm:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <div
        className={
          `
          transition-transform duration-300 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col
          fixed inset-y-0 left-0 z-40 w-72 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          sm:static sm:translate-x-0 sm:w-80 sm:flex
          `
        }
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={createNewSession}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <MessageSquare size={18} />
            New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group flex items-center justify-between p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                currentSessionId === session.id 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => setCurrentSessionId(session.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {session.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {session.messages.length} messages
                </p>
              </div>
              {sessions.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteSession(session.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-all"
                >
                  <Trash2 size={14} className="text-red-600 dark:text-red-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <MessageSquare size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                {currentSession?.title || 'AI Chat'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Powered by {model}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Settings size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 p-3 sm:p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Model:</label>
              <select 
                value={model} 
                onChange={(e) => setModel(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
              </select>
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={messagesRef} className="flex-1 min-h-0 overflow-y-auto px-3 sm:p-6 space-y-4 sm:space-y-6 pb-[calc(168px+env(safe-area-inset-bottom))] sm:pb-[calc(112px+env(safe-area-inset-bottom))]">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[92%] sm:max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                }`}>
                  {message.image && (
                    <div className="mb-3">
                      <img 
                        src={message.image} 
                        alt="Uploaded content" 
                        className="max-h-60 rounded-lg shadow-sm"
                      />
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
                <div className={`text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex justify-center">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2 text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="sticky bottom-16 sm:bottom-2 z-20 bg-white/95 dark:bg-gray-800/80 backdrop-blur border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-[0_6px_24px_rgba(0,0,0,0.12)] rounded-xl sm:rounded-none sm:rounded-t-2xl" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
          {selectedImage && (
            <div className="mb-3 flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <img src={selectedImage} alt="Selected" className="w-12 h-12 rounded object-cover" />
              <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">Image ready to send</span>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}
          
          <div className="flex items-end gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type here"
                className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 pr-3 sm:pr-12 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-40 overflow-y-auto text-sm sm:text-base"
                rows={1}
                style={{ minHeight: '40px' }}
              />
            </div>
            
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 sm:p-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                title="Upload image"
              >
                <Image size={20} />
              </button>
              
              <button
                onClick={sendMessage}
                disabled={loading || (!input.trim() && !selectedImage)}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-xl transition-colors disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={18} />
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}