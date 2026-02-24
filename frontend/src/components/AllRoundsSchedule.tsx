import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Users } from 'lucide-react';
import type { RoundAssignments } from '../backend';
import CourtAssignmentCard from './CourtAssignmentCard';

interface AllRoundsScheduleProps {
  rounds: RoundAssignments[];
  playerNames: Record<string, string>; // principalString -> name
  currentRound?: number;
}

export default function AllRoundsSchedule({
  rounds,
  playerNames,
  currentRound,
}: AllRoundsScheduleProps) {
  const [expandedRound, setExpandedRound] = useState<number | null>(
    currentRound ? currentRound - 1 : 0
  );

  if (rounds.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No rounds scheduled yet. Allocate players to see the full schedule.</p>
      </div>
    );
  }

  const resolveNames = (playerIds: readonly string[]): string[] =>
    playerIds.map((id, idx) => playerNames[id] ?? `Player ${idx + 1}`);

  return (
    <div className="space-y-3">
      {rounds.map((round, roundIdx) => {
        const roundNum = Number(round.round);
        const isExpanded = expandedRound === roundIdx;
        const isCurrent = currentRound !== undefined && roundNum === currentRound;

        return (
          <div
            key={roundNum}
            className={`border rounded-xl overflow-hidden transition-all ${
              isCurrent
                ? 'border-primary shadow-md'
                : 'border-border'
            }`}
          >
            {/* Round header */}
            <button
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                isCurrent
                  ? 'bg-primary/10 hover:bg-primary/15'
                  : 'bg-muted/50 hover:bg-muted'
              }`}
              onClick={() => setExpandedRound(isExpanded ? null : roundIdx)}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted-foreground/20 text-muted-foreground'
                  }`}
                >
                  {roundNum}
                </div>
                <span className="font-semibold text-foreground">
                  Round {roundNum}
                  {isCurrent && (
                    <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {round.assignments.length} court{round.assignments.length !== 1 ? 's' : ''}
                  {round.waitlist.length > 0 && ` · ${round.waitlist.length} waiting`}
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {/* Round content */}
            {isExpanded && (
              <div className="p-3 space-y-3 bg-background">
                {round.assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No court assignments for this round.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {round.assignments.map((assignment) => (
                      <CourtAssignmentCard
                        key={Number(assignment.court)}
                        courtNumber={assignment.court}
                        players={resolveNames(assignment.players.map(p => p.toString()))}
                        compact
                      />
                    ))}
                  </div>
                )}

                {round.waitlist.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                        Waiting ({round.waitlist.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {round.waitlist.map((pid, i) => (
                        <span
                          key={i}
                          className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full"
                        >
                          {playerNames[pid.toString()] ?? `Player ${i + 1}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
