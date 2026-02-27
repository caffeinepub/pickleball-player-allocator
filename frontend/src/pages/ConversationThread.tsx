import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetConversation, useSendMessage, useGetPublicProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Send, Loader2, User } from 'lucide-react';

export default function ConversationThread() {
  const { principalId } = useParams({ from: '/messages/$principalId' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();

  const myPrincipal = identity?.getPrincipal().toString();
  const shortId = principalId ? principalId.slice(0, 8) + '...' : '';

  const { data: messages = [], isLoading } = useGetConversation(principalId);
  const { data: otherProfile } = useGetPublicProfile(principalId ?? null);
  const sendMessageMutation = useSendMessage();

  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !principalId) return;
    const messageText = text.trim();
    setText('');
    try {
      await sendMessageMutation.mutateAsync({
        recipientId: principalId,
        text: messageText,
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      setText(messageText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherName = otherProfile?.name ?? shortId;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/messages' })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">{otherName}</p>
            <p className="text-xs text-muted-foreground">{shortId}</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender.toString() === myPrincipal;
            return (
              <div
                key={idx}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <Card
                  className={`max-w-[75%] px-3 py-2 ${
                    isMe
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted border-border'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {new Date(Number(msg.timestamp) / 1_000_000).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </Card>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </main>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t border-border p-3 flex gap-2">
        <Input
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!text.trim() || sendMessageMutation.isPending}
        >
          {sendMessageMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
