import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetMatchHistory } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy } from 'lucide-react';
import LoadingGame from '../components/LoadingGame';
import type { CompletedMatch } from '../backend';
import { GameOutcome } from '../backend';

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const date = new Date(ms);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function GameHistory() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: matches, isLoading, error } = useGetMatchHistory();

  if (!identity) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 text-center">
        <p className="text-muted-foreground">
          Please sign in to view your game history.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <LoadingGame message="Loading your game history..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 text-center">
        <p className="text-destructive text-sm">Failed to load game history.</p>
      </div>
    );
  }

  // matches is now CompletedMatch[] (already unwrapped in useGetMatchHistory)
  const matchList: CompletedMatch[] = matches ?? [];

  const sortedMatches = [...matchList].sort(
    (a, b) => Number(b.date) - Number(a.date)
  );

  const wins = sortedMatches.filter(m => m.outcome === GameOutcome.teamAWin).length;
  const losses = sortedMatches.length - wins;
  const total = sortedMatches.length;
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-4">
      {/* Back */}
      <button
        onClick={() => navigate({ to: '/profile' })}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Back to Profile
      </button>

      <h1 className="text-2xl font-bold text-foreground font-display">
        Game History
      </h1>

      {/* Summary */}
      {total > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-xl font-bold text-foreground">{total}</p>
                <p className="text-xs text-muted-foreground">Games</p>
              </div>
              <div>
                <p className="text-xl font-bold text-primary">{wins}</p>
                <p className="text-xs text-muted-foreground">Wins</p>
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{losses}</p>
                <p className="text-xs text-muted-foreground">Losses</p>
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">
                  {winRate ?? '—'}%
                </p>
                <p className="text-xs text-muted-foreground">Win Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match list */}
      {sortedMatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Trophy size={40} className="text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No games played yet.</p>
          <p className="text-muted-foreground/60 text-xs">
            Join a session to start building your history!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedMatches.map((match, idx) => {
            const isWin = match.outcome === GameOutcome.teamAWin;
            const [scoreA, scoreB] = match.teamScores;
            return (
              <Card
                key={idx}
                className={`border ${
                  isWin ? 'border-primary/30 bg-primary/5' : 'border-border'
                }`}
              >
                <CardContent className="pt-3 pb-3 px-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={isWin ? 'default' : 'secondary'}
                          className="text-xs shrink-0"
                        >
                          {isWin ? 'Win' : 'Loss'}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">
                          {formatDate(match.date)}
                        </span>
                      </div>
                      {match.opponentNames.length > 0 && (
                        <p className="text-sm text-muted-foreground truncate">
                          vs {match.opponentNames.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-foreground">
                        {Number(scoreA)} – {Number(scoreB)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Court {Number(match.court)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
