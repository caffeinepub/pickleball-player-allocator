import React from 'react';
import { Users } from 'lucide-react';

interface CourtAssignmentCardProps {
  courtNumber: number | bigint;
  players: string[]; // player names (already resolved)
  currentPlayerName?: string;
  compact?: boolean;
}

export default function CourtAssignmentCard({
  courtNumber,
  players,
  currentPlayerName,
  compact = false,
}: CourtAssignmentCardProps) {
  const teamA = players.slice(0, 2);
  const teamB = players.slice(2, 4);

  const isCurrentPlayer = (name: string) =>
    currentPlayerName ? name === currentPlayerName : false;

  const renderSlot = (name: string | undefined, index: number) => {
    const filled = !!name;
    const highlight = filled && isCurrentPlayer(name!);

    return (
      <div
        key={index}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          highlight
            ? 'bg-primary text-primary-foreground shadow-sm'
            : filled
            ? 'bg-muted text-foreground'
            : 'bg-muted/40 text-muted-foreground border border-dashed border-border'
        }`}
      >
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
            highlight
              ? 'bg-primary-foreground/20 text-primary-foreground'
              : filled
              ? 'bg-primary/20 text-primary'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {filled ? name![0].toUpperCase() : '?'}
        </div>
        <span className="truncate">{filled ? name : 'Empty slot'}</span>
        {highlight && (
          <span className="ml-auto text-xs bg-primary-foreground/20 px-1.5 py-0.5 rounded-full">
            You
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-card border border-border rounded-xl overflow-hidden shadow-sm ${compact ? 'text-sm' : ''}`}>
      {/* Header */}
      <div className="bg-primary/10 px-4 py-2.5 flex items-center gap-2 border-b border-border">
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
          <Users className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <span className="font-bold text-foreground">Court {courtNumber.toString()}</span>
        <span className="ml-auto text-xs text-muted-foreground">{players.length}/4 players</span>
      </div>

      <div className={`p-3 space-y-3 ${compact ? 'p-2 space-y-2' : ''}`}>
        {/* Team A */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1">
            Team A
          </div>
          <div className="space-y-1.5">
            {[0, 1].map((i) => renderSlot(teamA[i], i))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs font-bold text-muted-foreground">VS</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Team B */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1">
            Team B
          </div>
          <div className="space-y-1.5">
            {[0, 1].map((i) => renderSlot(teamB[i], i))}
          </div>
        </div>
      </div>
    </div>
  );
}
