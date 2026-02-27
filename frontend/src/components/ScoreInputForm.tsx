import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Loader2 } from 'lucide-react';

export interface ScoreSubmission {
  court: bigint;
  round: number;
  teamAScore: number;
  teamBScore: number;
  teamA: string[];
  teamB: string[];
}

interface ScoreInputFormProps {
  court: bigint;
  round: number;
  teamA: string[];
  teamB: string[];
  teamALabel?: string;
  teamBLabel?: string;
  onSubmit: (score: ScoreSubmission) => Promise<void>;
  existingScore?: { teamA: number; teamB: number };
  disabled?: boolean;
}

export default function ScoreInputForm({
  court,
  round,
  teamA,
  teamB,
  teamALabel = 'Team A',
  teamBLabel = 'Team B',
  onSubmit,
  existingScore,
  disabled = false,
}: ScoreInputFormProps) {
  const [teamAScore, setTeamAScore] = useState<string>(
    existingScore ? String(existingScore.teamA) : ''
  );
  const [teamBScore, setTeamBScore] = useState<string>(
    existingScore ? String(existingScore.teamB) : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingScore);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const aScore = parseInt(teamAScore, 10);
    const bScore = parseInt(teamBScore, 10);

    if (isNaN(aScore) || isNaN(bScore) || aScore < 0 || bScore < 0) {
      setError('Please enter valid non-negative scores');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        court,
        round,
        teamAScore: aScore,
        teamBScore: bScore,
        teamA,
        teamB,
      });
      setSubmitted(true);
    } catch {
      setError('Failed to submit score. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted && existingScore) {
    return (
      <div className="flex items-center gap-2 text-sm bg-muted/40 rounded-lg px-3 py-2">
        <CheckCircle className="h-4 w-4 text-primary shrink-0" />
        <span className="font-medium">
          Score: {teamALabel} {existingScore.teamA} – {existingScore.teamB} {teamBLabel}
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{teamALabel}</Label>
          <Input
            type="number"
            min="0"
            value={teamAScore}
            onChange={(e) => setTeamAScore(e.target.value)}
            placeholder="0"
            className="h-9 text-center text-lg font-bold"
            disabled={disabled || isSubmitting}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{teamBLabel}</Label>
          <Input
            type="number"
            min="0"
            value={teamBScore}
            onChange={(e) => setTeamBScore(e.target.value)}
            placeholder="0"
            className="h-9 text-center text-lg font-bold"
            disabled={disabled || isSubmitting}
          />
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button
        type="submit"
        size="sm"
        className="w-full"
        disabled={disabled || isSubmitting || !teamAScore || !teamBScore}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            Saving...
          </>
        ) : (
          'Submit Score'
        )}
      </Button>
    </form>
  );
}
