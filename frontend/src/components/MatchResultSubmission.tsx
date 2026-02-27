import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ghost } from 'lucide-react';
import { Trophy } from 'lucide-react';
import { GameOutcome } from '../backend';

export type MatchFormat = 'casual' | 'standard' | 'tournament' | 'finals';

interface MatchResultSubmissionProps {
  court: bigint;
  teamA: string[];
  teamB: string[];
  onSubmit: (outcome: GameOutcome, format: MatchFormat) => void;
  isLoading?: boolean;
  guestPlayerIds?: string[];
}

const FORMAT_OPTIONS: { value: MatchFormat; label: string; multiplier: string }[] = [
  { value: 'casual', label: 'Casual', multiplier: '0.6×' },
  { value: 'standard', label: 'Standard', multiplier: '1.0×' },
  { value: 'tournament', label: 'Tournament', multiplier: '1.2×' },
  { value: 'finals', label: 'Finals', multiplier: '1.4×' },
];

function isGuestName(name: string, guestPlayerIds: string[]): boolean {
  return guestPlayerIds.includes(name);
}

export default function MatchResultSubmission({
  court,
  teamA,
  teamB,
  onSubmit,
  isLoading = false,
  guestPlayerIds = [],
}: MatchResultSubmissionProps) {
  const [selectedFormat, setSelectedFormat] = useState<MatchFormat>('standard');

  const handleSubmit = (outcome: GameOutcome) => {
    onSubmit(outcome, selectedFormat);
  };

  const renderTeamNames = (players: string[]) =>
    players.map((name, i) => {
      const isGuest = isGuestName(name, guestPlayerIds);
      return (
        <span key={i} className="inline-flex items-center gap-0.5">
          {isGuest && <Ghost className="w-3 h-3 text-amber-500 flex-shrink-0" />}
          <span className={isGuest ? 'text-amber-700 dark:text-amber-400' : ''}>
            {name}
          </span>
          {i < players.length - 1 && (
            <span className="text-muted-foreground">, </span>
          )}
        </span>
      );
    });

  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="w-4 h-4 text-primary" />
          Court {Number(court)} Result
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Match Format Selector */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Match Format
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {FORMAT_OPTIONS.map(fmt => (
              <button
                key={fmt.value}
                onClick={() => setSelectedFormat(fmt.value)}
                disabled={isLoading}
                className={`flex flex-col items-center py-2 px-1 rounded-lg border text-xs font-medium transition-all ${
                  selectedFormat === fmt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}
              >
                <span>{fmt.label}</span>
                <span className="text-[10px] opacity-70">{fmt.multiplier}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Team Win Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-auto py-3 flex-col gap-1 border-2 hover:border-primary hover:bg-primary/5"
            onClick={() => handleSubmit(GameOutcome.teamAWin)}
            disabled={isLoading}
          >
            <span className="text-xs font-semibold text-muted-foreground">
              Team A Wins
            </span>
            <span className="text-xs text-center leading-tight flex flex-wrap justify-center gap-0.5">
              {renderTeamNames(teamA)}
            </span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 flex-col gap-1 border-2 hover:border-primary hover:bg-primary/5"
            onClick={() => handleSubmit(GameOutcome.teamBWin)}
            disabled={isLoading}
          >
            <span className="text-xs font-semibold text-muted-foreground">
              Team B Wins
            </span>
            <span className="text-xs text-center leading-tight flex flex-wrap justify-center gap-0.5">
              {renderTeamNames(teamB)}
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
