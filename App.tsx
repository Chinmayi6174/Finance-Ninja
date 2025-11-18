import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, UserProfile } from './types';
import ChatMessage from './components/ChatMessage';
import ProfileSelector from './components/ProfileSelector';
import SendIcon from './components/icons/SendIcon';
import { getFinancialAdvice } from './services/geminiService';

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>('none');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleProfileSelect = (profile: UserProfile) => {
    setUserProfile(profile);
    const welcomeMessage: Message = {
      id: `welcome-${Date.now()}`,
      role: 'model',
      content: `Great! As a ${profile}, I'll tailor my advice for you. How can I help you with your finances today?`
    };
    setMessages([welcomeMessage]);
  };
  
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading || userProfile === 'none') return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Filter out the initial welcome message before sending to the API
      const apiHistory = updatedMessages.filter(m => !m.id.startsWith('welcome-'));
      const responseText = await getFinancialAdvice(apiHistory, userProfile);

      const modelMessage: Message = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: responseText,
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'model',
        content: "Sorry, something went wrong. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, userProfile, messages]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (userProfile === 'none') {
    return (
      <main className="h-screen w-screen bg-slate-900">
        <ProfileSelector onSelectProfile={handleProfileSelect} />
      </main>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-800">
      <aside className="w-64 bg-slate-900 p-6 hidden md:flex flex-col">
        <h1 className="text-2xl font-bold text-white mb-8">Finley AI</h1>
        <nav className="space-y-2">
            {['Budgeting', 'Investments', 'Taxes', 'Goals', 'Learn'].map(item => (
                <a key={item} href="#" onClick={(e) => { e.preventDefault(); setInput(`Tell me about ${item.toLowerCase()}`); }} className="block py-2 px-4 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                    {item}
                </a>
            ))}
        </nav>
        <div className="mt-auto text-xs text-slate-500">
          <p>Profile: <span className="font-semibold capitalize text-cyan-400">{userProfile}</span></p>
          <button onClick={() => { setUserProfile('none'); setMessages([]); }} className="text-slate-400 hover:text-white mt-2">Change Profile</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="bg-slate-900/70 backdrop-blur-sm p-4 border-b border-slate-700 text-center">
            <h2 className="text-xl font-semibold text-slate-200">Personal Finance Chat</h2>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex items-start gap-4 my-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                  <div className="w-6 h-6 animate-pulse">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
                <div className="max-w-xl p-4 rounded-xl shadow-md bg-slate-700 text-slate-200 rounded-tl-none">
                  <p className="italic">Finley is typing...</p>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        <div className="p-6 bg-slate-900/70 backdrop-blur-sm border-t border-slate-700">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about savings, investments, taxes..."
              className="flex-1 p-3 bg-slate-700 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="p-3 bg-blue-600 rounded-full text-white disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors"
            >
              <SendIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;