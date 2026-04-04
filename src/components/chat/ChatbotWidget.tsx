'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import X from 'lucide-react/dist/esm/icons/x';
import Send from 'lucide-react/dist/esm/icons/send';
import { cn } from '@/lib/utils/utils';
import { trackEvent, logChatQuery } from '@/services/analytics';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ExpertEngine, ExpertEngineMessage } from '@/lib/chat/expert-engine';
import { Block } from '@/types/blocks';

interface ChatbotWidgetProps {
  pageSlug: string;
  blocks: Block[];
  seo: { title: string; description: string };
}

export function ChatbotWidget({ pageSlug, blocks, seo }: ChatbotWidgetProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ExpertEngineMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize the deterministic engine
  const engine = useMemo(() => new ExpertEngine(blocks || [], seo), [blocks, seo]);
  
  const suggestions = useMemo(() => engine.getSuggestions(), [engine]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = async (text: string = input) => {
    const cleanText = text.trim();
    if (!cleanText || isTyping) return;

    // Add user message
    const userMsg: ExpertEngineMessage = { role: 'user', content: cleanText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Local DKE processing
      const { message: responseMessage, hasMatch, score } = engine.getResponse(cleanText);
      
      // Artificial delay for "Natural" feeling
      await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1000));

      const botMessage: ExpertEngineMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseMessage.content,
        source: responseMessage.source
      };

      setMessages((prev) => [...prev, botMessage]);
      
      // Log for Expert Insights (Phase 26)
      logChatQuery(pageSlug, cleanText, hasMatch, { score, source: responseMessage.source });
      
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button - Liquid Glass */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full shadow-2xl bg-primary/90 hover:bg-primary backdrop-blur-md border border-white/20 transition-all hover:scale-110 active:scale-95"
              size="icon"
            >
              <MessageCircle className="h-6 w-6 text-primary-foreground" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window - Liquid Glass Aesthetic */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[400px] sm:h-[600px] z-50 flex flex-col sm:rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 bg-background/60 backdrop-blur-3xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">{t('chat.title', 'Ассистент эксперта')}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Online</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-9 w-9 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-6">
                  <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center animate-bounce">
                    <MessageCircle className="h-8 w-8 text-primary/40" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground/80">Привет!</p>
                    <p className="text-xs text-muted-foreground mt-1">Я ваш персональный ассистент на этой странице. Задайте любой вопрос об услугах или эксперте!</p>
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: message.role === 'user' ? 20 : -20, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  className={cn(
                    'flex w-full',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-2.5 max-w-[85%] text-sm shadow-sm transition-all',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-white/10 text-foreground border border-white/10 rounded-tl-none backdrop-blur-md'
                    )}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 items-center">
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/5 bg-black/10 backdrop-blur-lg">
              {/* Suggestions */}
              {messages.length === 0 && suggestions.length > 0 && !isTyping && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {suggestions.map((suggestion, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSend(suggestion)}
                      className="text-[11px] h-8 rounded-full bg-white/5 hover:bg-primary/20 hover:text-foreground border-white/10 transition-all font-medium py-0"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}

              <div className="relative group">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={t('chat.placeholder', 'Задайте вопрос...')}
                  disabled={isTyping}
                  className="bg-white/5 border-white/10 focus-visible:ring-primary/50 rounded-2xl h-11 pr-12 text-sm transition-all"
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  size="icon"
                  className="absolute right-1.5 top-1.5 h-8 w-8 rounded-xl bg-primary shadow-lg hover:scale-105 active:scale-95 transition-transform"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[9px] text-center mt-3 text-muted-foreground/50 uppercase tracking-[0.2em] font-bold">
                Powered by InkMAX DKE
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
