import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, X, CheckCircle, Loader2 } from 'lucide-react';
import { GameOutcome } from '../backend';

interface MatchResultSubmissionProps {
  onSubmit: (outcome: GameOutcome) => Promise<void>;
  isLoading?: boolean;
  onSkip?: () => void;
}

export function MatchResultSubmission({ onSubmit, isLoading, onSkip }: MatchResultSubmissionProps) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (outcome: GameOutcome) => {
    await onSubmit(outcome);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="border border-border bg-green-500/5">
        <CardContent className="pt-4 pb-4 px-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-sm text-foreground">Result Recorded!</p>
            <p className="text-xs text-muted-foreground">Your match result has been saved.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-accent/30 bg-accent/5">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-display">
          <Trophy className="h-4 w-4 text-accent-foreground" />
          Record Match Result
          <span className="ml-auto text-xs text-muted-foreground font-normal">(Optional)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3 px-4">
        <p className="text-xs text-muted-foreground mb-3">
          Who won? Recording results helps track player performance.
        </p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Button
            className="btn-touch bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            onClick={() => handleSubmit(GameOutcome.teamAWin)}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '🏆 Team A Won'}
          </Button>
          <Button
            variant="outline"
            className="btn-touch border-primary/30 text-primary font-semibold"
            onClick={() => handleSubmit(GameOutcome.teamBWin)}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '🏆 Team B Won'}
          </Button>
        </div>
        {onSkip && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground text-xs"
            onClick={onSkip}
          >
            <X className="h-3 w-3 mr-1" /> Skip for now
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default MatchResultSubmission;
