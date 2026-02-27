import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trophy, Users, Calendar } from 'lucide-react';
import { Ghost } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import CourtAssignmentCard from './CourtAssignmentCard';
import type { ScheduledRound } from '../lib/scheduler';
import { resolvePlayerNames } from '../lib/scheduler';

interface AllRoundsScheduleProps {
  /** Client-side generated fair schedule */
  scheduledRounds?: ScheduledRound[];
  /** String array of player names indexed by player position */
  playerNamesList: string[];
  currentRound: number;
  currentPlayerIndex?: number;
}

export default function AllRoundsSchedule({
  scheduledRounds,
  playerNamesList,
  currentRound,
  currentPlayerIndex,
}: AllRoundsScheduleProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>('round-0');

  const currentPlayerName =
    currentPlayerIndex !== undefined
      ? playerNamesList[currentPlayerIndex]
      : undefined;

  const renderRoundContent = (round: ScheduledRound) => {
    return (
      <div className="p-4 space-y-3 bg-background">
        {round.assignments.map(({ court, playerIndices }) => {
          const names = resolvePlayerNames(playerIndices, playerNamesList);
          const mid = Math.floor(names.length / 2);
          const teamA = names.slice(0, mid);
          const teamB = names.slice(mid);
          return (
            <CourtAssignmentCard
              key={court}
              court={BigInt(court)}
              teamA={teamA}
              teamB={teamB}
              currentPlayer={currentPlayerName}
            />
          );
        })}
        {round.waitlistIndices.length > 0 && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Waitlist ({round.waitlistIndices.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {resolvePlayerNames(round.waitlistIndices, playerNamesList).map(
                (name, wIdx) => {
                  const isCurrentPlayer =
                    currentPlayerName !== undefined && name === currentPlayerName;
                  return (
                    <span
                      key={wIdx}
                      className={`text-xs px-2 py-1 rounded-full ${
                        isCurrentPlayer
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {name}
                    </span>
                  );
                }
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const rounds = scheduledRounds ?? [];

  if (rounds.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No rounds scheduled yet</p>
        <p className="text-sm mt-1">Allocate players to generate the schedule</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Calendar className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          Full Schedule — {rounds.length} rounds
        </span>
      </div>
      {rounds.map((round, idx) => {
        const roundNum = round.round;
        const isCurrentRound = roundNum === currentRound - 1;
        const key = `round-${idx}`;
        const isExpanded = expandedKey === key;

        return (
          <div
            key={key}
            className={`border rounded-xl overflow-hidden ${
              isCurrentRound ? 'border-primary shadow-card' : 'border-border'
            }`}
          >
            <button
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                isCurrentRound ? 'bg-primary/10' : 'bg-card hover:bg-muted/50'
              }`}
              onClick={() => setExpandedKey(isExpanded ? null : key)}
            >
              <div className="flex items-center gap-2">
                <Trophy
                  className={`w-4 h-4 ${
                    isCurrentRound ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                <span
                  className={`font-semibold ${isCurrentRound ? 'text-primary' : ''}`}
                >
                  Round {roundNum}
                </span>
                {isCurrentRound && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {isExpanded && renderRoundContent(round)}
          </div>
        );
      })}
    </div>
  );
}
