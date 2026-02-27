import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetConversation, useSendMessage } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import LoadingGame from '../components/LoadingGame';
import type { Message } from '../backend';

function formatTime(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ConversationThread() {
  const { principal } = useParams({ from: '/messages/$principal' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toString();

  const { data: messages, isLoading } = useGetConversation(principal);
  const sendMessage = useSendMessage();

  const [text, setText] = useState('');
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const shortId = principal.slice(0, 8) + '...';

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, optimisticMessages]);

  const allMessages = [...(messages ?? []), ...optimisticMessages].sort(
    (a, b) => Number(a.timestamp) - Number(b.timestamp)
  );

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !identity) return;

    // Optimistic update
    const optimistic: Message = {
      sender: identity.getPrincipal(),
      recipient: { toString: () => principal } as any,
      text: trimmed,
      timestamp: BigInt(Date.now()) * BigInt(1_000_000),
    };
    setOptimisticMessages((prev) => [...prev, optimistic]);
    setText('');

    try {
      await sendMessage.mutateAsync({
        recipientPrincipal: principal,
        text: trimmed,
      });
      // Clear optimistic after real message arrives
      setOptimisticMessages([]);
    } catch (err) {
      console.error('Failed to send message:', err);
      setOptimisticMessages((prev) => prev.filter((m) => m !== optimistic));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!identity) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 text-center">
        <p className="text-muted-foreground">Please sign in to view messages.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col h-[calc(100vh-3.5rem-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
        <button
          onClick={() => navigate({ to: '/messages' })}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
          {shortId.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{shortId}</p>
          <p className="text-xs text-muted-foreground">Player</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {isLoading ? (
          <LoadingGame message="Loading conversation..." />
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 py-12">
            <p className="text-muted-foreground text-sm">No messages yet.</p>
            <p className="text-muted-foreground/60 text-xs">Say hello! 👋</p>
          </div>
        ) : (
          allMessages.map((msg, idx) => {
            const isMine = msg.sender.toString() === myPrincipal;
            return (
              <div
                key={idx}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                    isMine
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p
                    className={`text-[10px] mt-0.5 ${
                      isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-background">
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={sendMessage.isPending}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            size="icon"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
