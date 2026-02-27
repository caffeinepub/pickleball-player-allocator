import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, Ghost } from 'lucide-react';

interface CourtAssignmentCardProps {
  court: bigint;
  teamA: string[];
  teamB: string[];
  currentPlayer?: string;
  // Score entry (for ranked sessions, host only)
  showScoreEntry?: boolean;
  onScoreSubmit?: (teamAScore: number, teamBScore: number) => Promise<void> | void;
  isScoreSubmitting?: boolean;
  // Display submitted scores (for all users after host submits)
  submittedTeamAScore?: number;
  submittedTeamBScore?: number;
  // Guest player names (to show Guest badge)
  guestPlayerIds?: string[];
}

export default function CourtAssignmentCard({
  court,
  teamA,
  teamB,
  currentPlayer,
  showScoreEntry = false,
  onScoreSubmit,
  isScoreSubmitting = false,
  submittedTeamAScore,
  submittedTeamBScore,
  guestPlayerIds = [],
}: CourtAssignmentCardProps) {
  const [teamAScore, setTeamAScore] = useState('');
  const [teamBScore, setTeamBScore] = useState('');
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const courtNumber = Number(court);

  const hasSubmittedScores =
    submittedTeamAScore !== undefined && submittedTeamBScore !== undefined;

  const isScoreValid =
    teamAScore !== '' &&
    teamBScore !== '' &&
    !isNaN(parseInt(teamAScore, 10)) &&
    !isNaN(parseInt(teamBScore, 10)) &&
    parseInt(teamAScore, 10) >= 0 &&
    parseInt(teamBScore, 10) >= 0;

  const handleScoreSubmit = async () => {
    if (!isScoreValid || !onScoreSubmit) return;
    const a = parseInt(teamAScore, 10);
    const b = parseInt(teamBScore, 10);
    await onScoreSubmit(a, b);
    setScoreSubmitted(true);
  };

  const isGuestPlayer = (name: string) => guestPlayerIds.includes(name);

  const renderPlayerSlot = (name: string | undefined, index: number) => {
    const isCurrentPlayer = name && currentPlayer && name === currentPlayer;
    const isGuest = name ? isGuestPlayer(name) : false;
    return (
      <div
        key={index}
        className={`flex items-center gap-2 p-2 rounded-lg ${
          isCurrentPlayer
            ? 'bg-primary/15 ring-1 ring-primary/40'
            : isGuest
            ? 'bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-300 dark:ring-amber-700'
            : 'bg-muted/40'
        }`}
      >
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
            isCurrentPlayer
              ? 'bg-primary text-primary-foreground'
              : isGuest
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
              : 'bg-muted-foreground/20 text-muted-foreground'
          }`}
        >
          {isGuest ? (
            <Ghost className="w-3.5 h-3.5" />
          ) : name ? (
            name.charAt(0).toUpperCase()
          ) : (
            '?'
          )}
        </div>
        <span
          className={`text-sm font-medium truncate ${
            isCurrentPlayer
              ? 'text-primary'
              : isGuest
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-foreground'
          }`}
        >
          {name || <span className="text-muted-foreground italic">Empty slot</span>}
        </span>
        {isCurrentPlayer && (
          <Badge
            variant="outline"
            className="ml-auto text-[10px] px-1.5 py-0 h-4 text-primary border-primary/40"
          >
            You
          </Badge>
        )}
        {isGuest && !isCurrentPlayer && (
          <Badge
            variant="outline"
            className="ml-auto text-[10px] px-1.5 py-0 h-4 text-amber-600 dark:text-amber-400 border-amber-400"
          >
            Guest
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Card className="border-border shadow-sm">
      <CardContent className="pt-3 pb-3 px-4">
        {/* Court Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{courtNumber}</span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              Court {courtNumber}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {[...teamA, ...teamB].filter(Boolean).length}/4
          </Badge>
        </div>

        {/* Teams */}
        <div className="space-y-2">
          {/* Team A */}
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Team A
            </p>
            {[teamA[0], teamA[1]].map((name, i) => renderPlayerSlot(name, i))}
          </div>

          {/* VS divider */}
          <div className="flex items-center gap-2 py-0.5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-bold text-muted-foreground">VS</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Team B */}
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Team B
            </p>
            {[teamB[0], teamB[1]].map((name, i) => renderPlayerSlot(name, i + 2))}
          </div>
        </div>

        {/* Submitted Scores Display */}
        {hasSubmittedScores && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Team A
                </p>
                <p className="text-xl font-bold text-foreground">{submittedTeamAScore}</p>
              </div>
              <div className="text-muted-foreground font-bold text-sm">—</div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Team B
                </p>
                <p className="text-xl font-bold text-foreground">{submittedTeamBScore}</p>
              </div>
            </div>
            {submittedTeamAScore !== submittedTeamBScore && (
              <p className="text-xs text-center text-muted-foreground mt-1.5">
                {submittedTeamAScore! > submittedTeamBScore!
                  ? '🏆 Team A wins'
                  : '🏆 Team B wins'}
              </p>
            )}
          </div>
        )}

        {/* Score Entry (host, ranked, not yet submitted) */}
        {showScoreEntry && !scoreSubmitted && !hasSubmittedScores && (
          <div className="mt-3 pt-3 border-t border-border space-y-3">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              Enter Round Score
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label
                  htmlFor={`score-a-${courtNumber}`}
                  className="text-xs text-muted-foreground"
                >
                  Team A Score
                </Label>
                <Input
                  id={`score-a-${courtNumber}`}
                  type="number"
                  min={0}
                  placeholder="0"
                  value={teamAScore}
                  onChange={e => setTeamAScore(e.target.value)}
                  disabled={isScoreSubmitting}
                  className="h-9 text-center text-base font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor={`score-b-${courtNumber}`}
                  className="text-xs text-muted-foreground"
                >
                  Team B Score
                </Label>
                <Input
                  id={`score-b-${courtNumber}`}
                  type="number"
                  min={0}
                  placeholder="0"
                  value={teamBScore}
                  onChange={e => setTeamBScore(e.target.value)}
                  disabled={isScoreSubmitting}
                  className="h-9 text-center text-base font-bold"
                />
              </div>
            </div>
            <Button
              size="sm"
              className="w-full h-8 text-xs"
              onClick={handleScoreSubmit}
              disabled={!isScoreValid || isScoreSubmitting}
            >
              {isScoreSubmitting ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : null}
              Submit Score
            </Button>
          </div>
        )}

        {/* Score submitted confirmation */}
        {showScoreEntry && scoreSubmitted && !hasSubmittedScores && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">Score submitted for this court</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
