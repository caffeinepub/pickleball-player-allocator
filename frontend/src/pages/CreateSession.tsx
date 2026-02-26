import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, CheckCircle, Loader2, Shuffle, RotateCcw, Layers, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCreateSession, generateSessionCode } from '../hooks/useQueries';
import { saveCurrentSession } from '../lib/storage';
import SessionConfigForm from '../components/SessionConfigForm';
import SessionCodeDisplay from '../components/SessionCodeDisplay';
import type { SessionConfigFormFields } from '../components/SessionConfigForm';
import { SessionType } from '../backend';

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  [SessionType.randomAllotment]: 'Random Allotment',
  [SessionType.roundRobin]: 'Round Robin',
  [SessionType.ladderLeague]: 'Ladder League',
  [SessionType.kingQueenOfTheCourt]: 'King/Queen of the Court',
};

const SESSION_TYPE_ICONS: Record<SessionType, React.ReactNode> = {
  [SessionType.randomAllotment]: <Shuffle className="h-3.5 w-3.5" />,
  [SessionType.roundRobin]: <RotateCcw className="h-3.5 w-3.5" />,
  [SessionType.ladderLeague]: <Layers className="h-3.5 w-3.5" />,
  [SessionType.kingQueenOfTheCourt]: <Crown className="h-3.5 w-3.5" />,
};

export default function CreateSession() {
  const navigate = useNavigate();
  const createSessionMutation = useCreateSession();

  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);
  const [createdSessionCode, setCreatedSessionCode] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<{
    date?: string;
    time?: string;
    venue?: string;
    duration?: number;
    courts: number;
    sessionType: SessionType;
    isRanked: boolean;
  } | null>(null);

  const handleCreate = async (params: SessionConfigFormFields) => {
    try {
      const sessionCode = generateSessionCode();
      const result = await createSessionMutation.mutateAsync({
        ...params,
        sessionCode,
      });

      const sessionId = result.sessionId;
      setCreatedSessionId(sessionId);
      setCreatedSessionCode(sessionCode);
      setSessionDetails({
        date: params.date,
        time: params.time,
        venue: params.venue,
        duration: params.duration,
        courts: params.courts,
        sessionType: params.sessionType,
        isRanked: params.isRanked,
      });

      saveCurrentSession({
        sessionId,
        sessionCode,
        role: 'host',
      });
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleGoToDashboard = () => {
    if (createdSessionId) {
      navigate({ to: '/session/$sessionId/host', params: { sessionId: createdSessionId } });
    }
  };

  if (createdSessionId && createdSessionCode) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: '/' })}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold font-display text-foreground">Game Created!</h1>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-4">
            {/* Success indicator */}
            <div className="text-center space-y-2">
              <CheckCircle className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-xl font-bold font-display text-foreground">
                Your game is ready!
              </h2>
              <p className="text-sm text-muted-foreground">
                Share the code below with your players
              </p>
            </div>

            {/* Session Code */}
            <SessionCodeDisplay
              sessionId={createdSessionId}
              sessionCode={createdSessionCode}
            />

            {/* Game Details */}
            {sessionDetails && (
              <Card className="border-border">
                <CardContent className="pt-4 pb-3">
                  <div className="space-y-1.5 text-sm">
                    {/* Game Type & Ranked */}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Game Type</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">
                          {SESSION_TYPE_ICONS[sessionDetails.sessionType]}
                        </span>
                        <span className="font-medium">
                          {SESSION_TYPE_LABELS[sessionDetails.sessionType]}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Mode</span>
                      <Badge
                        variant={sessionDetails.isRanked ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {sessionDetails.isRanked ? 'Ranked' : 'Unranked'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Courts</span>
                      <span className="font-medium">{sessionDetails.courts}</span>
                    </div>
                    {sessionDetails.date && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-medium">{sessionDetails.date}</span>
                      </div>
                    )}
                    {sessionDetails.time && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time</span>
                        <span className="font-medium">{sessionDetails.time}</span>
                      </div>
                    )}
                    {sessionDetails.venue && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Venue</span>
                        <span className="font-medium">{sessionDetails.venue}</span>
                      </div>
                    )}
                    {sessionDetails.duration && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-medium">{sessionDetails.duration}h</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={handleGoToDashboard}
              className="w-full h-12 text-base font-semibold"
            >
              Open Host Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/' })}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold font-display text-foreground">Host a Game</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <SessionConfigForm
            onSubmit={handleCreate}
            isLoading={createSessionMutation.isPending}
            submitLabel="Create Game"
          />
          {createSessionMutation.isError && (
            <p className="text-destructive text-sm text-center mt-3">
              Failed to create game. Please try again.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
