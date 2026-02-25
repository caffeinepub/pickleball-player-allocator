import React, { useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { useJoinSession } from '@/hooks/useQueries';
import { setCurrentSession } from '@/lib/storage';
import { formatErrorMessage, isCanisterStoppedError } from '@/lib/errorHandling';
import { toast } from 'sonner';

export function JoinSession() {
  const router = useRouter();
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState('');
  const joinSession = useJoinSession();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = sessionCode.trim();
    if (!code) {
      setError('Please enter a session code');
      return;
    }
    setError('');

    try {
      // useJoinSession now accepts a plain string sessionId
      await joinSession.mutateAsync(code);
      setCurrentSession({ sessionId: code, isHost: false });
      toast.success('Joined session!');
      router.navigate({ to: `/session/${code}/player` });
    } catch (err) {
      if (isCanisterStoppedError(err)) {
        const msg = formatErrorMessage(err);
        toast.error(msg);
        setError(msg);
      } else {
        const rawMsg = err instanceof Error ? err.message : '';
        if (rawMsg.includes('does not exist')) {
          setError('Session not found. Check the code and try again.');
        } else {
          setError(formatErrorMessage(err));
        }
      }
    }
  };

  return (
    <Layout title="Join a Session" showBack backTo="/">
      <div className="space-y-5 animate-slide-up">
        <div className="text-center py-4">
          <div className="text-5xl mb-3">🏓</div>
          <p className="text-sm text-muted-foreground">
            Enter the session code shared by your host
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <Card className="border border-border shadow-card">
            <CardContent className="pt-4 pb-4 px-4">
              <Label htmlFor="sessionCode" className="text-sm font-semibold text-foreground mb-2 block">
                Session Code
              </Label>
              <Input
                id="sessionCode"
                type="text"
                placeholder="Enter session code"
                value={sessionCode}
                onChange={(e) => {
                  setSessionCode(e.target.value);
                  setError('');
                }}
                className="text-center text-lg font-display font-bold tracking-wider h-14"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              {error && (
                <div className="flex items-center gap-2 mt-2 text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full btn-touch gradient-primary text-primary-foreground font-display font-bold text-base shadow-card"
            disabled={joinSession.isPending || !sessionCode.trim()}
          >
            {joinSession.isPending ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Joining...</>
            ) : (
              <><LogIn className="h-5 w-5 mr-2" /> Join Session</>
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Don't have a code?{' '}
            <button
              type="button"
              className="text-primary font-medium underline"
              onClick={() => router.navigate({ to: '/session/create' })}
            >
              Host your own session
            </button>
          </p>
        </div>
      </div>
    </Layout>
  );
}
