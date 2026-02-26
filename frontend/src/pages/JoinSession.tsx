import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Hash, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useJoinSession } from '../hooks/useQueries';
import { saveCurrentSession } from '../lib/storage';

export default function JoinSession() {
  const navigate = useNavigate();
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState('');

  const joinSessionMutation = useJoinSession();

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow alphanumeric codes of any reasonable length (up to 20 chars)
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    setSessionCode(value.slice(0, 20));
    setError('');
  };

  const handleJoin = async () => {
    if (!sessionCode.trim()) {
      setError('Please enter a game code');
      return;
    }

    if (sessionCode.length < 4) {
      setError('Game code must be at least 4 characters');
      return;
    }

    try {
      await joinSessionMutation.mutateAsync({ sessionCode });
      saveCurrentSession({
        sessionId: '',
        sessionCode,
        role: 'player',
      });
      navigate({ to: '/session/$sessionId/player', params: { sessionId: sessionCode } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('Session does not exist') || message.includes('does not exist')) {
        setError('Game not found. Please check the code and try again.');
      } else if (message.includes('Unauthorized')) {
        setError('You need to be logged in to join a game.');
      } else {
        setError('Failed to join game. Please try again.');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/' })}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold font-display text-foreground">Join a Game</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Hero */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Hash className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold font-display text-foreground">Enter Game Code</h2>
            <p className="text-muted-foreground text-sm">
              Ask your host for the game code to join the session
            </p>
          </div>

          {/* Code Input Card */}
          <Card className="border-border shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Game Code</CardTitle>
              <CardDescription>Enter the code shared by your host</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sessionCode">Code</Label>
                <Input
                  id="sessionCode"
                  value={sessionCode}
                  onChange={handleCodeChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter game code"
                  className="text-center text-2xl font-mono font-bold tracking-widest h-14"
                  autoComplete="off"
                  autoCapitalize="characters"
                  maxLength={20}
                />
                {error && (
                  <p className="text-destructive text-sm text-center">{error}</p>
                )}
              </div>

              <Button
                onClick={handleJoin}
                disabled={joinSessionMutation.isPending || !sessionCode.trim()}
                className="w-full h-12 text-base font-semibold"
              >
                {joinSessionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Game'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Help text */}
          <p className="text-center text-xs text-muted-foreground">
            Don't have a code? Ask your session host to share it with you.
          </p>
        </div>
      </main>
    </div>
  );
}
