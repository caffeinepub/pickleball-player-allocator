import React, { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Trophy, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/Layout';
import CourtAssignmentCard from '@/components/CourtAssignmentCard';
import WaitlistPanel from '@/components/WaitlistPanel';
import { MatchResultSubmission } from '@/components/MatchResultSubmission';
import { useGetSessionState, useSubmitMatchResult } from '@/hooks/useQueries';
import { getPlayerProfile, getSessionPlayerNames } from '@/lib/storage';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import type { GameOutcome } from '@/backend';

export default function PlayerSessionView() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { sessionId?: string };
  const sessionId = params.sessionId ?? null;
  const { identity } = useInternetIdentity();
  const playerProfile = getPlayerProfile();
  const myName = playerProfile?.name ?? 'You';

  const { data: sessionState, isLoading } = useGetSessionState(sessionId);
  const submitResult = useSubmitMatchResult();
  const [resultSubmitted, setResultSubmitted] = useState(false);

  const myPrincipal = identity?.getPrincipal().toString();

  // Build player names map
  const storedNames = sessionId ? getSessionPlayerNames(sessionId) : {};
  const playerNames: Record<string, string> = {};
  if (sessionState) {
    sessionState.players.forEach((pid, idx) => {
      const pidStr = pid.toString();
      if (pidStr === myPrincipal) {
        playerNames[pidStr] = myName;
      } else if (storedNames[idx] !== undefined) {
        playerNames[pidStr] = storedNames[idx];
      } else {
        playerNames[pidStr] = `Player ${idx + 1}`;
      }
    });
  }

  const resolveNames = (playerIds: readonly { toString(): string }[]): string[] =>
    playerIds.map((pid) => playerNames[pid.toString()] ?? 'Unknown');

  const myAssignment = sessionState?.assignments.find((a) =>
    a.players.some((p) => p.toString() === myPrincipal)
  );

  const myWaitlistIndex = sessionState?.waitlist.findIndex(
    (p) => p.toString() === myPrincipal
  );
  const isOnWaitlist = myWaitlistIndex !== undefined && myWaitlistIndex >= 0;

  const handleSubmitResult = async (outcome: GameOutcome) => {
    if (!sessionId || !myAssignment) return;
    await submitResult.mutateAsync({
      sessionId,
      court: myAssignment.court,
      outcome,
    });
    setResultSubmitted(true);
    toast.success('Match result submitted!');
  };

  if (!sessionId) {
    return (
      <Layout title="Session" showBack backTo="/">
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <p className="text-muted-foreground mb-4">No active session found.</p>
          <Button onClick={() => navigate({ to: '/' })}>Go Home</Button>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout title="Session" showBack backTo="/">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  const totalPlayers = sessionState?.players.length ?? 0;
  const courts = Number(sessionState?.config.courts ?? 1);

  return (
    <Layout title="Your Session" showBack backTo="/">
      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        {/* Status banner */}
        <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
            {myName[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{myName}</p>
            <p className="text-xs text-muted-foreground">
              {totalPlayers} players · {courts} court{courts !== 1 ? 's' : ''}
            </p>
          </div>
          {myAssignment ? (
            <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
              Court {Number(myAssignment.court)}
            </Badge>
          ) : isOnWaitlist ? (
            <Badge variant="outline" className="text-amber-600 border-amber-500/40">
              Waiting #{(myWaitlistIndex ?? 0) + 1}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Not assigned
            </Badge>
          )}
        </div>

        {/* My court assignment */}
        {myAssignment && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
              Your Court
            </h3>
            <CourtAssignmentCard
              courtNumber={myAssignment.court}
              players={resolveNames(myAssignment.players)}
              currentPlayerName={myName}
            />
          </div>
        )}

        {/* Waitlist */}
        {isOnWaitlist && sessionState && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
              Waitlist
            </h3>
            <WaitlistPanel
              waitlist={sessionState.waitlist.map((pid) => ({
                id: pid.toString(),
                name: playerNames[pid.toString()] ?? 'Unknown',
              }))}
              currentPlayerId={myPrincipal ?? null}
            />
          </div>
        )}

        {/* Match result submission */}
        {myAssignment && !resultSubmitted && (
          <MatchResultSubmission
            onSubmit={handleSubmitResult}
            isLoading={submitResult.isPending}
            onSkip={() => setResultSubmitted(true)}
          />
        )}

        {resultSubmitted && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="font-semibold text-green-700 dark:text-green-400">Result submitted!</p>
            <p className="text-xs text-muted-foreground mt-1">Waiting for next round...</p>
          </div>
        )}

        {/* All courts overview */}
        {sessionState && sessionState.assignments.length > 0 && (
          <Tabs defaultValue="courts">
            <TabsList className="w-full">
              <TabsTrigger value="courts" className="flex-1">All Courts</TabsTrigger>
              <TabsTrigger value="players" className="flex-1">All Players</TabsTrigger>
            </TabsList>

            <TabsContent value="courts" className="mt-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sessionState.assignments.map((assignment) => (
                  <CourtAssignmentCard
                    key={Number(assignment.court)}
                    courtNumber={assignment.court}
                    players={resolveNames(assignment.players)}
                    currentPlayerName={myName}
                    compact
                  />
                ))}
              </div>

              {sessionState.waitlist.length > 0 && (
                <WaitlistPanel
                  waitlist={sessionState.waitlist.map((pid) => ({
                    id: pid.toString(),
                    name: playerNames[pid.toString()] ?? 'Unknown',
                  }))}
                  currentPlayerId={myPrincipal ?? null}
                />
              )}
            </TabsContent>

            <TabsContent value="players" className="mt-3">
              <div className="space-y-2">
                {sessionState.players.map((pid, idx) => {
                  const name = playerNames[pid.toString()] ?? `Player ${idx + 1}`;
                  const onCourt = sessionState.assignments.some((a) =>
                    a.players.some((p) => p.toString() === pid.toString())
                  );
                  const waiting = sessionState.waitlist.some(
                    (p) => p.toString() === pid.toString()
                  );
                  const isMe = pid.toString() === myPrincipal;
                  return (
                    <div
                      key={pid.toString()}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border ${
                        isMe
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-card border-border'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isMe ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'
                      }`}>
                        {name[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span className="flex-1 font-medium text-foreground">{name}</span>
                      {isMe && <span className="text-xs text-primary font-medium">You</span>}
                      {onCourt && (
                        <Badge className="text-xs bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
                          Playing
                        </Badge>
                      )}
                      {waiting && (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/40">
                          Waiting
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* No assignments yet */}
        {(!sessionState || sessionState.assignments.length === 0) && (
          <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">Waiting for host to allocate courts...</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
