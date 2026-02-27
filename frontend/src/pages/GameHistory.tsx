import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetMatchHistory } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Loader2 } from 'lucide-react';
import { GameOutcome } from '../backend';

export default function GameHistory() {
  const navigate = useNavigate();
  const { data: matches, isLoading } = useGetMatchHistory();

  // matches is CompletedMatch[] from the hook (already unwrapped)
  const sorted = [...(matches ?? [])].sort(
    (a, b) => Number(b.date) - Number(a.date)
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold font-display">Game History</h1>
      </header>

      <main className="flex-1 p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground font-medium">No games yet</p>
            <p className="text-sm text-muted-foreground">
              Play some games to see your history here.
            </p>
          </div>
        ) : (
          sorted.map((match, idx) => {
            const isWin = match.outcome === GameOutcome.teamAWin;
            const scoreA = Number(match.teamScores[0]);
            const scoreB = Number(match.teamScores[1]);
            const date = new Date(Number(match.date) / 1_000_000);

            return (
              <Card key={idx}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={isWin ? 'default' : 'secondary'}
                          className={`text-xs ${isWin ? 'bg-primary' : ''}`}
                        >
                          {isWin ? 'Win' : 'Loss'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Court {Number(match.court)}
                        </span>
                      </div>
                      {match.opponentNames.length > 0 && (
                        <p className="text-sm text-muted-foreground truncate">
                          vs {match.opponentNames.join(', ')}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {date.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold font-display">
                        {scoreA} – {scoreB}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </main>
    </div>
  );
}
