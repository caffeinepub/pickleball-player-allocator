import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetSession } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, UserX, Trophy, Clock } from 'lucide-react';
import CourtAssignmentCard from '../components/CourtAssignmentCard';
import WaitlistPanel from '../components/WaitlistPanel';
import AllRoundsSchedule from '../components/AllRoundsSchedule';
import SessionCodeDisplay from '../components/SessionCodeDisplay';
import type { GuestPlayer } from '../backend';
import { generateFairSchedule } from '../lib/scheduler';

interface PlayerName {
  id: string;
  name: string;
  isGuest?: boolean;
}

function guestPlayerToId(guest: GuestPlayer): string {
  return `guest-${Number(guest.guestId)}`;
}

function resolvePlayerNameFromList(
  playerId: string,
  playerNames: PlayerName[],
  guestPlayers: GuestPlayer[]
): string {
  if (playerId.startsWith('guest-')) {
    const guestId = parseInt(playerId.replace('guest-', ''), 10);
    const guest = guestPlayers.find(g => Number(g.guestId) === guestId);
    return guest ? guest.name : 'Guest Player';
  }
  const found = playerNames.find(p => p.id === playerId);
  return found ? found.name : playerId.slice(0, 8) + '...';
}

export default function PlayerSessionView() {
  const { sessionId } = useParams({ from: '/session/$sessionId' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const currentUserPrincipal = identity?.getPrincipal().toString();

  const { data: session, isLoading, error } = useGetSession(sessionId);
  const [activeTab, setActiveTab] = useState('courts');

  // Build combined player list: registered + guests
  const allPlayerIds: string[] = useMemo(() => {
    if (!session) return [];
    const registered = session.players.map(p => p.toString());
    const guests = session.guestPlayers.map(g => guestPlayerToId(g));
    return [...registered, ...guests];
  }, [session]);

  const playerNames: PlayerName[] = useMemo(() => {
    if (!session) return [];
    const names: PlayerName[] = session.players.map(p => ({
      id: p.toString(),
      name: p.toString().slice(0, 8) + '...',
      isGuest: false,
    }));
    session.guestPlayers.forEach(guest => {
      names.push({
        id: guestPlayerToId(guest),
        name: guest.name,
        isGuest: true,
      });
    });
    return names;
  }, [session]);

  const totalPlayers = allPlayerIds.length;
  const courts = Number(session?.config.courts ?? 1);
  const totalRounds = totalPlayers > 1 ? Math.max(totalPlayers, courts * 2) : 0;

  const fairSchedule = useMemo(() => {
    if (totalPlayers < 2) return [];
    return generateFairSchedule(totalPlayers, courts, totalRounds);
  }, [totalPlayers, courts, totalRounds]);

  // Player names as string array for AllRoundsSchedule (index-based)
  const playerNamesStringList: string[] = useMemo(() => {
    return allPlayerIds.map(id =>
      resolvePlayerNameFromList(id, playerNames, session?.guestPlayers ?? [])
    );
  }, [allPlayerIds, playerNames, session]);

  // Current round assignments (first round of fair schedule)
  const resolvedAssignments = useMemo(() => {
    if (!session || fairSchedule.length === 0) return [];
    const firstRound = fairSchedule[0];
    return firstRound.assignments.map(({ court, playerIndices }) => {
      const playerIdList = playerIndices.map(i => allPlayerIds[i] ?? '');
      const names = playerIdList.map(id =>
        resolvePlayerNameFromList(id, playerNames, session.guestPlayers)
      );
      const mid = Math.floor(names.length / 2);
      const teamA = names.slice(0, mid);
      const teamB = names.slice(mid);
      const guestNames = playerIdList
        .filter(id => id.startsWith('guest-'))
        .map(id => resolvePlayerNameFromList(id, playerNames, session.guestPlayers));
      return {
        courtBigInt: BigInt(court),
        court,
        teamA,
        teamB,
        guestNames,
      };
    });
  }, [session, fairSchedule, allPlayerIds, playerNames]);

  // Waitlist for current round
  const currentWaitlist = useMemo(() => {
    if (!session || fairSchedule.length === 0) return [];
    const firstRound = fairSchedule[0];
    return firstRound.waitlistIndices.map(i => {
      const id = allPlayerIds[i] ?? '';
      const isGuest = id.startsWith('guest-');
      return {
        id,
        name: resolvePlayerNameFromList(id, playerNames, session.guestPlayers),
        isGuest,
      };
    });
  }, [session, fairSchedule, allPlayerIds, playerNames]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <UserX className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Session Not Found</h2>
          <p className="text-muted-foreground">
            This session doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate({ to: '/' })}>Go Home</Button>
        </div>
      </div>
    );
  }

  const totalPlayersCount = session.players.length + session.guestPlayers.length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">Session View</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {session.config.venue || 'Session'} · {session.config.date || 'Today'}
        </p>
      </div>

      {/* Session Code */}
      <SessionCodeDisplay
        sessionCode={session.config.sessionCode}
        sessionId={sessionId}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center p-3">
          <div className="text-2xl font-bold text-primary">{totalPlayersCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Players</div>
        </Card>
        <Card className="text-center p-3">
          <div className="text-2xl font-bold text-primary">
            {Number(session.config.courts)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Courts</div>
        </Card>
        <Card className="text-center p-3">
          <div className="text-2xl font-bold text-primary">
            {session.guestPlayers.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Guests</div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="courts">Courts</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Courts Tab */}
        <TabsContent value="courts" className="space-y-4 mt-4">
          {resolvedAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {totalPlayersCount < 4
                    ? `Need at least 4 players to assign courts (${totalPlayersCount} currently)`
                    : 'No court assignments yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            resolvedAssignments.map(assignment => (
              <CourtAssignmentCard
                key={assignment.courtBigInt.toString()}
                court={assignment.courtBigInt}
                teamA={assignment.teamA}
                teamB={assignment.teamB}
                currentPlayer={currentUserPrincipal}
                guestPlayerIds={assignment.guestNames}
              />
            ))
          )}
        </TabsContent>

        {/* Waitlist Tab */}
        <TabsContent value="waitlist" className="mt-4">
          <WaitlistPanel
            waitlist={currentWaitlist}
            currentPlayerId={currentUserPrincipal}
          />
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4 mt-4">
          {fairSchedule.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {totalPlayersCount < 2
                    ? 'Need at least 2 players to generate a schedule'
                    : 'No schedule generated yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <AllRoundsSchedule
              scheduledRounds={fairSchedule}
              playerNamesList={playerNamesStringList}
              currentRound={Number(session.currentRound)}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
