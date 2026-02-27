import React, { useState } from 'react';
import { Ghost, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ScoreInputForm, { ScoreSubmission } from './ScoreInputForm';

interface CourtAssignmentCardProps {
  court: bigint;
  teamA: string[];
  teamB: string[];
  guestPlayerIds?: string[];
  playerNames?: Record<string, string>;
  playerUsernames?: Record<string, string>;
  isHost?: boolean;
  round?: number;
  onScoreSubmit?: (score: ScoreSubmission) => Promise<void>;
  submittedScore?: { teamA: number; teamB: number };
  showScoreInput?: boolean;
}

function PlayerChip({
  playerId,
  displayName,
  username,
  isGuest,
}: {
  playerId: string;
  displayName: string;
  username?: string;
  isGuest: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm ${
        isGuest
          ? 'bg-amber-500/10 border border-amber-500/30'
          : 'bg-primary/10 border border-primary/20'
      }`}
    >
      {isGuest && <Ghost className="h-3 w-3 text-amber-500 shrink-0" />}
      <div className="min-w-0">
        <span
          className={`font-medium truncate block ${
            isGuest ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'
          }`}
        >
          {displayName}
        </span>
        {username && !isGuest && (
          <span className="text-xs text-muted-foreground truncate block">@{username}</span>
        )}
        {isGuest && (
          <span className="text-xs text-amber-600 dark:text-amber-500">Guest</span>
        )}
      </div>
    </div>
  );
}

export default function CourtAssignmentCard({
  court,
  teamA,
  teamB,
  guestPlayerIds = [],
  playerNames = {},
  playerUsernames = {},
  isHost = false,
  round,
  onScoreSubmit,
  submittedScore,
  showScoreInput = false,
}: CourtAssignmentCardProps) {
  const [scoreExpanded, setScoreExpanded] = useState(false);

  const getDisplayName = (id: string) => playerNames[id] || id.slice(0, 8) + '...';
  const getUsername = (id: string) => playerUsernames[id];
  const isGuest = (id: string) => guestPlayerIds.includes(id) || id.startsWith('guest-');

  const teamALabel = teamA.map(getDisplayName).join(' & ');
  const teamBLabel = teamB.map(getDisplayName).join(' & ');

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      {/* Court Header */}
      <div className="bg-primary/10 border-b border-border/60 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">
            Court {court.toString()}
          </span>
        </div>
        {submittedScore && (
          <Badge variant="secondary" className="text-xs">
            {submittedScore.teamA} – {submittedScore.teamB}
          </Badge>
        )}
      </div>

      {/* Teams */}
      <div className="p-4 space-y-3">
        {/* Team A */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Team A
          </p>
          <div className="flex flex-wrap gap-1.5">
            {teamA.map((id) => (
              <PlayerChip
                key={id}
                playerId={id}
                displayName={getDisplayName(id)}
                username={getUsername(id)}
                isGuest={isGuest(id)}
              />
            ))}
          </div>
        </div>

        {/* VS Divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-border/60" />
          <span className="text-xs font-bold text-muted-foreground">VS</span>
          <div className="flex-1 h-px bg-border/60" />
        </div>

        {/* Team B */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Team B
          </p>
          <div className="flex flex-wrap gap-1.5">
            {teamB.map((id) => (
              <PlayerChip
                key={id}
                playerId={id}
                displayName={getDisplayName(id)}
                username={getUsername(id)}
                isGuest={isGuest(id)}
              />
            ))}
          </div>
        </div>

        {/* Score Section */}
        {isHost && onScoreSubmit && showScoreInput && !submittedScore && (
          <div className="pt-2 border-t border-border/60">
            {!scoreExpanded ? (
              <button
                onClick={() => setScoreExpanded(true)}
                className="w-full text-xs text-primary hover:text-primary/80 flex items-center justify-center gap-1 py-1"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                Enter Score
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Enter Score</span>
                  <button
                    onClick={() => setScoreExpanded(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                </div>
                <ScoreInputForm
                  court={court}
                  round={round || 1}
                  teamA={teamA}
                  teamB={teamB}
                  teamALabel={teamALabel}
                  teamBLabel={teamBLabel}
                  onSubmit={onScoreSubmit}
                />
              </div>
            )}
          </div>
        )}

        {submittedScore && (
          <div className="pt-2 border-t border-border/60">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Final Score</span>
              <span className="font-bold text-foreground">
                {submittedScore.teamA} – {submittedScore.teamB}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
