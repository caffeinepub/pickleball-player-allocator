import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetMailbox } from '../hooks/useQueries';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MessageSquare, ChevronRight } from 'lucide-react';
import LoadingGame from '../components/LoadingGame';
import type { Conversation } from '../backend';

function formatTime(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const date = new Date(ms);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

export default function MessagesInbox() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: conversations, isLoading, error } = useGetMailbox();

  if (!identity) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 text-center">
        <p className="text-muted-foreground">Please sign in to view messages.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <LoadingGame message="Loading messages..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 text-center">
        <p className="text-destructive text-sm">Failed to load messages.</p>
      </div>
    );
  }

  // Sort conversations by most recent message
  const sortedConversations = [...(conversations ?? [])].sort((a, b) => {
    const aLast = a.messages[a.messages.length - 1];
    const bLast = b.messages[b.messages.length - 1];
    if (!aLast) return 1;
    if (!bLast) return -1;
    return Number(bLast.timestamp) - Number(aLast.timestamp);
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate({ to: '/' })}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-foreground font-display">Messages</h1>
      </div>

      {sortedConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <MessageSquare size={40} className="text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No messages yet.</p>
          <p className="text-muted-foreground/60 text-xs">
            Visit a player's profile to start a conversation.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sortedConversations.map((conv) => (
            <ConversationRow
              key={conv.participant.toString()}
              conversation={conv}
              onOpen={() =>
                navigate({
                  to: '/messages/$principal',
                  params: { principal: conv.participant.toString() },
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ConversationRow({
  conversation,
  onOpen,
}: {
  conversation: Conversation;
  onOpen: () => void;
}) {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const participantStr = conversation.participant.toString();
  const shortId = participantStr.slice(0, 8) + '...';

  return (
    <Card
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onOpen}
    >
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
            {shortId.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground truncate">{shortId}</p>
              {lastMessage && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatTime(lastMessage.timestamp)}
                </span>
              )}
            </div>
            {lastMessage && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {lastMessage.text}
              </p>
            )}
          </div>
          <ChevronRight size={16} className="text-muted-foreground shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
