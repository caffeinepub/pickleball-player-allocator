import React, { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { Users, Loader2 } from 'lucide-react';
import { Layout } from '../components/Layout';
import CourtAssignmentCard from '../components/CourtAssignmentCard';
import WaitlistPanel from '../components/WaitlistPanel';
import { MatchResultSubmission } from '../components/MatchResultSubmission';
import AllRoundsSchedule from '../components/AllRoundsSchedule';
import { useGetSessionState, useSubmitMatchResult } from '../hooks/useQueries';
import { getSessionPlayerNames } from '../lib/storage';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { GameOutcome } from '../backend';

export default function PlayerSessionView() {
  const { sessionId } = useParams({ from: '/session/$sessionId/player' });
  const [activeTab, setActiveTab] = useState('current');
  const [resultSubmitted, setResultSubmitted] = useState(false);

  const { data: sessionState, isLoading } = useGetSessionState(sessionId);
  const submitResult = useSubmitMatchResult();

  // Build ordered player names list from localStorage (index = position in backend players array)
  const storedNames = getSessionPlayerNames(sessionId);

  const handleSubmitResult = async (outcome: GameOutcome) => {
    if (!sessionState) return;
    const firstAssignment = sessionState.assignments[0];
    if (!firstAssignment) return;
    try {
      await submitResult.mutateAsync({
        sessionId,
        court: firstAssignment.court,
        outcome,
      });
      setResultSubmitted(true);
    } catch (err) {
      console.error('Failed to submit result:', err);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!sessionState) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Session not found</p>
        </div>
      </Layout>
    );
  }

  const currentAssignments = sessionState.assignments;
  const currentWaitlist = sessionState.waitlist;
  const totalPlayers = sessionState.players.length;

  // Build names list aligned with backend players array indices
  // Index 0 = host, index 1+ = added players
  const playerNamesList: string[] = Array.from({ length: totalPlayers }, (_, i) => {
    return storedNames[i] || (i === 0 ? 'Host' : `Player ${i + 1}`);
  });

  /**
   * Resolve a player name by their Principal ID.
   * Find the player's index in sessionState.players, then look up the name.
   */
  const resolvePlayerName = (playerId: { toString(): string }): string => {
    const playerIdStr = playerId.toString();
    const index = sessionState.players.findIndex(
      (p) => p.toString() === playerIdStr
    );
    if (index === -1) return 'Unknown';
    return playerNamesList[index] || `Player ${index + 1}`;
  };

  // Resolve current round assignments using actual player IDs
  const resolvedAssignments = currentAssignments.map((assignment) => ({
    court: Number(assignment.court),
    players: assignment.players.map((pid) => resolvePlayerName(pid)),
  }));

  // Resolve waitlist using actual player IDs
  const resolvedWaitlist = currentWaitlist.map((pid, wIdx) => ({
    id: String(wIdx),
    name: resolvePlayerName(pid),
  }));

  // Validate count integrity
  const courtPlayerCount = resolvedAssignments.reduce((sum, a) => sum + a.players.length, 0);
  const waitlistCount = resolvedWaitlist.length;
  const displayedTotal = courtPlayerCount + waitlistCount;
  if (currentAssignments.length > 0 && displayedTotal !== totalPlayers) {
    console.warn(
      `Player count mismatch: courts(${courtPlayerCount}) + waitlist(${waitlistCount}) = ${displayedTotal}, expected ${totalPlayers}`
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Session View</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalPlayers} player{totalPlayers !== 1 ? 's' : ''} •{' '}
              {Number(sessionState.config.courts)} court{Number(sessionState.config.courts) !== 1 ? 's' : ''}
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            Round {Number(sessionState.currentRound)}
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="current" className="flex-1">Current</TabsTrigger>
            <TabsTrigger value="schedule" className="flex-1">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-4 space-y-4">
            {currentAssignments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Waiting for host to start</p>
                <p className="text-sm mt-1">The host will allocate courts soon</p>
              </div>
            ) : (
              <>
                {resolvedAssignments.map((a) => (
                  <CourtAssignmentCard
                    key={a.court}
                    courtNumber={a.court}
                    players={a.players}
                  />
                ))}
                {!resultSubmitted && (
                  <MatchResultSubmission
                    onSubmit={handleSubmitResult}
                    isLoading={submitResult.isPending}
                    onSkip={() => setResultSubmitted(true)}
                  />
                )}
                {resolvedWaitlist.length > 0 && (
                  <WaitlistPanel
                    waitlist={resolvedWaitlist}
                    currentPlayerId={null}
                  />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="mt-4">
            <AllRoundsSchedule
              allRounds={sessionState.allRounds}
              playerNamesList={playerNamesList}
              sessionPlayers={sessionState.players}
              currentRound={Number(sessionState.currentRound)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
