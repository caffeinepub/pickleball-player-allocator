import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trophy, Users } from 'lucide-react';
import { RoundAssignments } from '../backend';
import type { PlayerId } from '../backend';
import CourtAssignmentCard from './CourtAssignmentCard';

interface AllRoundsScheduleProps {
  allRounds: RoundAssignments[];
  playerNamesList: string[];
  /** The ordered players array from sessionState.players — used for direct ID→name lookup */
  sessionPlayers: PlayerId[];
  currentRound: number;
  currentPlayerIndex?: number;
}

export default function AllRoundsSchedule({
  allRounds,
  playerNamesList,
  sessionPlayers,
  currentRound,
  currentPlayerIndex,
}: AllRoundsScheduleProps) {
  const [expandedRound, setExpandedRound] = useState<number | null>(currentRound - 1);

  /**
   * Resolve a player name by their Principal ID.
   * Find the player's index in sessionPlayers, then look up the name.
   * This is the authoritative approach — no rotation math needed.
   */
  const resolvePlayerName = (playerId: { toString(): string }): string => {
    const playerIdStr = playerId.toString();
    const index = sessionPlayers.findIndex((p) => p.toString() === playerIdStr);
    if (index === -1) return 'Unknown';
    return playerNamesList[index] || (index === 0 ? 'Host' : `Player ${index + 1}`);
  };

  const currentPlayerName =
    currentPlayerIndex !== undefined
      ? playerNamesList[currentPlayerIndex]
      : undefined;

  if (allRounds.length === 0) {
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
      {allRounds.map((round, roundIdx) => {
        const roundNum = Number(round.round);
        const isCurrentRound = roundNum === currentRound - 1;
        const isExpanded = expandedRound === roundIdx;

        // Validate count integrity for this round
        const totalCourtPlayers = round.assignments.reduce(
          (sum, a) => sum + a.players.length,
          0
        );
        const totalWaitlist = round.waitlist.length;
        const roundTotal = totalCourtPlayers + totalWaitlist;
        if (sessionPlayers.length > 0 && roundTotal !== sessionPlayers.length) {
          console.warn(
            `Round ${roundNum}: courts(${totalCourtPlayers}) + waitlist(${totalWaitlist}) = ${roundTotal}, expected ${sessionPlayers.length}`
          );
        }

        return (
          <div
            key={roundIdx}
            className={`border rounded-xl overflow-hidden ${
              isCurrentRound ? 'border-primary shadow-card' : 'border-border'
            }`}
          >
            <button
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                isCurrentRound ? 'bg-primary/10' : 'bg-card hover:bg-muted/50'
              }`}
              onClick={() => setExpandedRound(isExpanded ? null : roundIdx)}
            >
              <div className="flex items-center gap-2">
                <Trophy
                  className={`w-4 h-4 ${isCurrentRound ? 'text-primary' : 'text-muted-foreground'}`}
                />
                <span className={`font-semibold ${isCurrentRound ? 'text-primary' : ''}`}>
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

            {isExpanded && (
              <div className="p-4 space-y-3 bg-background">
                {round.assignments.map((assignment, idx) => {
                  // Resolve each player by their actual Principal ID
                  const players = assignment.players.map((pid) => resolvePlayerName(pid));

                  return (
                    <CourtAssignmentCard
                      key={idx}
                      courtNumber={Number(assignment.court)}
                      players={players}
                      currentPlayerName={currentPlayerName}
                    />
                  );
                })}

                {round.waitlist.length > 0 && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Waitlist ({round.waitlist.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {round.waitlist.map((pid, wIdx) => {
                        const name = resolvePlayerName(pid);
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
                      })}
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
