import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Hash, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useJoinSession, useGetCallerUserProfile } from '../hooks/useQueries';
import { saveCurrentSession, savePlayerNameForSession, getPlayerProfile } from '../lib/storage';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function JoinSession() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();

  const [gameCode, setGameCode] = useState('');
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');

  const joinMutation = useJoinSession();

  const isAuthenticated = !!identity;

  const handleJoin = async () => {
    setError('');
    const normalizedCode = gameCode.trim().toUpperCase();
    if (!normalizedCode) {
      setError('Please enter a game code.');
      return;
    }

    // Determine the name to use
    let nameToUse = guestName.trim();
    if (isAuthenticated && userProfile?.name) {
      nameToUse = userProfile.name;
    } else if (!nameToUse) {
      const localProfile = getPlayerProfile();
      if (localProfile?.name) {
        nameToUse = localProfile.name;
      }
    }

    try {
      // joinMutation now returns the unwrapped sessionId string
      const sessionId = await joinMutation.mutateAsync({
        gameCode: normalizedCode,
        guestName: nameToUse,
      });

      // Save session to local storage
      saveCurrentSession({
        sessionId,
        sessionCode: normalizedCode,
        role: 'player',
      });

      // Save the player's name for this session
      if (identity) {
        const principalId = identity.getPrincipal().toString();
        const displayName = userProfile?.name || nameToUse || 'Guest';
        savePlayerNameForSession(sessionId, principalId, displayName);
      } else if (nameToUse) {
        const localProfile = getPlayerProfile();
        const displayName = localProfile?.name || nameToUse;
        savePlayerNameForSession(sessionId, 'anonymous', displayName);
      }

      navigate({ to: '/session/$sessionId', params: { sessionId } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join session. Please check the code and try again.';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold font-display">Join Game</h1>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Hash className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="font-display text-2xl">Enter Game Code</CardTitle>
            <CardDescription>
              Ask the host for the session code to join the game
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gameCode">Game Code</Label>
              <Input
                id="gameCode"
                placeholder="e.g. ABC123"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                className="text-center text-xl font-mono tracking-widest uppercase"
                maxLength={10}
              />
            </div>

            {!isAuthenticated && (
              <div className="space-y-2">
                <Label htmlFor="guestName">
                  <User className="inline h-4 w-4 mr-1" />
                  Your Name
                </Label>
                <Input
                  id="guestName"
                  placeholder="Enter your name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
                <p className="text-xs text-muted-foreground">
                  This name will be shown to other players
                </p>
              </div>
            )}

            {isAuthenticated && userProfile?.name && (
              <div className="rounded-lg bg-muted/50 px-3 py-2 flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Joining as <span className="font-medium text-foreground">{userProfile.name}</span>
                </span>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button
              className="w-full"
              onClick={handleJoin}
              disabled={joinMutation.isPending || !gameCode.trim()}
            >
              {joinMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Game'
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
