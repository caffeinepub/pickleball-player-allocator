import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetMailbox } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MessageSquare, User, Loader2, ChevronRight } from 'lucide-react';

export default function MessagesInbox() {
  const navigate = useNavigate();
  const { data: conversations = [], isLoading } = useGetMailbox();

  // Sort conversations by most recent message
  const sorted = [...conversations].sort((a, b) => {
    const aLast = a.messages[a.messages.length - 1];
    const bLast = b.messages[b.messages.length - 1];
    if (!aLast) return 1;
    if (!bLast) return -1;
    return Number(bLast.timestamp) - Number(aLast.timestamp);
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold font-display">Messages</h1>
      </header>

      <main className="flex-1 p-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground font-medium">No messages yet</p>
            <p className="text-sm text-muted-foreground">
              Start a conversation by visiting a player's profile.
            </p>
          </div>
        ) : (
          sorted.map((conv) => {
            const participantId = conv.participant.toString();
            const lastMsg = conv.messages[conv.messages.length - 1];
            const shortId = participantId.slice(0, 8) + '...';

            return (
              <Card
                key={participantId}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() =>
                  navigate({
                    to: '/messages/$principalId',
                    params: { principalId: participantId },
                  })
                }
              >
                <CardContent className="flex items-center gap-3 py-3 px-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{shortId}</p>
                    {lastMsg && (
                      <p className="text-xs text-muted-foreground truncate">{lastMsg.text}</p>
                    )}
                  </div>
                  {lastMsg && (
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {new Date(Number(lastMsg.timestamp) / 1_000_000).toLocaleDateString()}
                      </p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </main>
    </div>
  );
}
