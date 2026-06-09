/**
 * ZoneInboxScreen - Team inbox with conversations and messages
 */
import { memo, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useZoneInbox } from '@/hooks/zones/useZoneInbox';
import { useZoneDeals } from '@/hooks/zones/useZoneDeals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils/utils';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import Send from 'lucide-react/dist/esm/icons/send';
import Plus from 'lucide-react/dist/esm/icons/plus';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import User from 'lucide-react/dist/esm/icons/user';
import Check from 'lucide-react/dist/esm/icons/check';
import Archive from 'lucide-react/dist/esm/icons/archive';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Props {
  zoneId: string;
}

export const ZoneInboxScreen = memo(function ZoneInboxScreen({ zoneId }: Props) {
  const { t } = useTranslation();
  const {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    messages,
    loading,
    messagesLoading,
    sendMessage,
    createConversation,
    updateConversation,
  } = useZoneInbox(zoneId);

  const { createDeal } = useZoneDeals(zoneId);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [creatingDeal, setCreatingDeal] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!messageInput.trim() || !activeConversationId) return;
    setSending(true);
    try {
      await sendMessage(activeConversationId, messageInput.trim());
      setMessageInput('');
    } catch (err) {
      console.error('Send message error:', err);
      toast.error(t('zones.inbox.sendError', 'Не удалось отправить сообщение'));
    } finally {
      setSending(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const conv = await createConversation(newTitle.trim());
      if (conv) setActiveConversationId(conv.id);
      setCreateOpen(false);
      setNewTitle('');
    } catch (err) {
      console.error('Create conversation error:', err);
      toast.error(t('zones.inbox.createError', 'Не удалось создать диалог'));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Mobile: show conversation list or messages
  const showMessages = !!activeConversationId;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          {showMessages && (
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setActiveConversationId(null)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <MessageSquare className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">
            {showMessages && activeConversation
              ? activeConversation.title || activeConversation.contact?.name || t('zones.inbox.conversation', 'Диалог')
              : t('zones.inbox.title', 'Входящие')}
          </h1>
          {activeConversation && (
            <Badge variant="outline" className="text-xs">
              {activeConversation.channel}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {activeConversation && activeConversation.status === 'open' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateConversation(activeConversation.id, { status: 'closed' } as any)}
            >
              <Check className="h-3 w-3 mr-1" />
              {t('zones.inbox.close', 'Закрыть')}
            </Button>
          )}
          {!showMessages && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              {t('zones.inbox.new', 'Новый')}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversation List */}
        <div className={cn(
          "w-full md:w-80 border-r border-border/30 flex-shrink-0",
          showMessages && "hidden md:block"
        )}>
          <ScrollArea className="h-full">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t('zones.inbox.empty', 'Нет диалогов')}</p>
                <Button size="sm" className="mt-3" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t('zones.inbox.startNew', 'Начать диалог')}
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={cn(
                      "w-full p-3 text-left hover:bg-muted/50 transition-colors",
                      conv.id === activeConversationId && "bg-primary/5 border-l-2 border-primary"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">
                            {conv.title || conv.contact?.name || t('zones.inbox.conversation', 'Диалог')}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {conv.last_message_at ? format(new Date(conv.last_message_at), 'HH:mm') : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs px-1 h-4">
                            {conv.channel}
                          </Badge>
                          {conv.status === 'closed' && (
                            <Badge variant="secondary" className="text-xs px-1 h-4">
                              <Archive className="h-2 w-2 mr-0.5" />
                              {t('zones.inbox.closed', 'Закрыт')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Messages Area */}
        <div className={cn(
          "flex-1 flex flex-col",
          !showMessages && "hidden md:flex"
        )}>
          {!activeConversationId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">{t('zones.inbox.selectConversation', 'Выберите диалог')}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={cn("h-10 rounded-lg animate-pulse bg-muted", i % 2 === 0 ? "w-2/3 ml-auto" : "w-2/3")} />
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <p className="text-sm">{t('zones.inbox.noMessages', 'Нет сообщений')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2.5",
                          msg.direction === 'outbound'
                            ? "ml-auto bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                        <p className={cn(
                          "text-xs mt-1",
                          msg.direction === 'outbound' ? "text-primary-foreground/60" : "text-muted-foreground"
                        )}>
                          {format(new Date(msg.created_at), 'HH:mm')}
                        </p>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t border-border/30">
                <div className="flex gap-2">
                  <Input
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('zones.inbox.typePlaceholder', 'Введите сообщение...')}
                    className="flex-1"
                    disabled={sending || activeConversation?.status === 'closed'}
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={sending || !messageInput.trim() || activeConversation?.status === 'closed'}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('zones.inbox.newConversation', 'Новый диалог')}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder={t('zones.inbox.titlePlaceholder', 'Тема диалога')}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t('common.cancel', 'Отмена')}
            </Button>
            <Button onClick={handleCreate} disabled={!newTitle.trim()}>
              {t('common.create', 'Создать')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
