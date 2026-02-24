import React, { useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Loader2, Minus, Plus, MapPin, CheckCircle } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { SessionCodeDisplay } from '@/components/SessionCodeDisplay';
import { useCreateSession } from '@/hooks/useQueries';
import { setCurrentSession } from '@/lib/storage';
import { toast } from 'sonner';

export default function CreateSession() {
  const router = useRouter();
  const [courts, setCourts] = useState(2);
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);
  const createSession = useCreateSession();

  const handleCreate = async () => {
    try {
      const result = await createSession.mutateAsync(courts);
      const sessionId = result.sessionId;
      if (!sessionId) {
        throw new Error('No session ID returned from backend');
      }
      setCreatedSessionId(sessionId);
      setCurrentSession({ sessionId, isHost: true });
      toast.success('Session created!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Session creation failed:', message);
      toast.error(`Failed to create session: ${message}`);
    }
  };

  if (createdSessionId) {
    return (
      <Layout title="Session Created!" showBack backTo="/">
        <div className="space-y-4 animate-slide-up">
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">Share this code with players to join</p>
          </div>

          <SessionCodeDisplay sessionId={createdSessionId} />

          <Card className="border border-border">
            <CardContent className="pt-3 pb-3 px-4">
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">Courts</p>
                <p className="font-semibold text-foreground">{courts}</p>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <p className="text-muted-foreground">Allocation</p>
                <p className="font-semibold text-foreground">Random</p>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full btn-touch gradient-primary text-primary-foreground font-display font-bold text-base shadow-card"
            onClick={() => router.navigate({ to: `/session/${createdSessionId}/host` })}
          >
            Open Host Dashboard
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Host a Session" showBack backTo="/">
      <div className="space-y-5 animate-slide-up">
        <div className="pt-1">
          <p className="text-sm text-muted-foreground">
            Configure your pickleball session. Players will be randomly allocated to courts.
          </p>
        </div>

        <Card className="border border-border shadow-card">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Number of Courts
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="btn-touch rounded-full border-primary/30"
                onClick={() => setCourts(Math.max(1, courts - 1))}
                disabled={courts <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="flex-1 text-center">
                <span className="font-display font-black text-4xl text-primary">{courts}</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {courts === 1 ? 'court' : 'courts'} · up to {courts * 4} players active
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="btn-touch rounded-full border-primary/30"
                onClick={() => setCourts(Math.min(10, courts + 1))}
                disabled={courts >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              4 players per court. Extra players wait and rotate in each round.
            </p>
          </CardContent>
        </Card>

        <Button
          className="w-full btn-touch gradient-primary text-primary-foreground font-display font-bold text-base shadow-card"
          onClick={handleCreate}
          disabled={createSession.isPending}
        >
          {createSession.isPending ? (
            <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Creating Session...</>
          ) : (
            <>Create Session <ChevronRight className="h-5 w-5 ml-2" /></>
          )}
        </Button>
      </div>
    </Layout>
  );
}
