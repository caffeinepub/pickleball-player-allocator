import React, { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Users, Plus, Play, RotateCcw, Trophy, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/Layout';
import { SessionCodeDisplay } from '@/components/SessionCodeDisplay';
import CourtAssignmentCard from '@/components/CourtAssignmentCard';
import WaitlistPanel from '@/components/WaitlistPanel';
import AllRoundsSchedule from '@/components/AllRoundsSchedule';
import {
  useGetSessionState,
  useAddPlayerToSession,
  useAllocatePlayers,
  useGetAllMatchups,
} from '@/hooks/useQueries';
import { getSessionPlayerNames, setSessionPlayerName } from '@/lib/storage';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';

export default function HostSessionDashboard() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { sessionId?: string };
  const sessionId = params.sessionId ?? null;
  const { identity } = useInternetIdentity();

  const [playerName, setPlayerName] = useState('');
  const [playerDupr, setPlayerDupr] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: sessionState, isLoading } = useGetSessionState(sessionId);
  const addPlayer = useAddPlayerToSession();
  const allocate = useAllocatePlayers();

  const totalPlayers = sessionState?.players.length ?? 0;
  const courts = Number(sessionState?.config.courts ?? 1);
  const playersPerRound = courts * 4;
  const maxRounds = totalPlayers > 0 ? Math.max(Math.ceil(totalPlayers / 1) + 2, 6) : 6;

  const hasAllocated = sessionState && sessionState.allRounds.length > 0;

  const { data: allMatchups, refetch: refetchMatchups } = useGetAllMatchups(
    hasAllocated ? sessionId : null,
    maxRounds
  );

  // Build player names map: principalString -> name
  const storedNames = sessionId ? getSessionPlayerNames(sessionId) : {};
  const playerNames: Record<string, string> = {};
  if (sessionState) {
    const hostPrincipal = identity?.getPrincipal().toString();
    sessionState.players.forEach((pid, idx) => {
      const pidStr = pid.toString();
      if (pidStr === hostPrincipal) {
        const raw = localStorage.getItem('pickleball_player_profile');
        const profile = raw ? JSON.parse(raw) : null;
        playerNames[pidStr] = profile?.name ?? 'Host';
      } else if (storedNames[idx] !== undefined) {
        playerNames[pidStr] = storedNames[idx];
      } else {
        playerNames[pidStr] = `Player ${idx + 1}`;
      }
    });
  }

  const resolveNames = (playerIds: readonly { toString(): string }[]): string[] =>
    playerIds.map((pid, idx) => playerNames[pid.toString()] ?? `Player ${idx + 1}`);

  const handleAddPlayer = async () => {
    if (!sessionId || !playerName.trim()) return;
    const dupr = playerDupr ? parseFloat(playerDupr) : undefined;
    if (dupr !== undefined && (isNaN(dupr) || dupr < 2.0 || dupr > 8.0)) {
      toast.error('DUPR rating must be between 2.00 and 8.00');
      return;
    }
    try {
      const nextIndex = sessionState?.players.length ?? 0;
      setSessionPlayerName(sessionId, nextIndex, playerName.trim());
      await addPlayer.mutateAsync({
        sessionId,
        playerName: playerName.trim(),
        duprRating: dupr,
      });
      toast.success(`${playerName.trim()} added!`);
      setPlayerName('');
      setPlayerDupr('');
      setShowAddForm(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add player';
      toast.error(msg);
    }
  };

  const handleAllocate = async () => {
    if (!sessionId) return;
    try {
      await allocate.mutateAsync(sessionId);
      toast.success('Players allocated to courts!');
      refetchMatchups();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to allocate players';
      toast.error(msg);
    }
  };

  const handleRotate = async () => {
    if (!sessionId) return;
    try {
      await allocate.mutateAsync(sessionId);
      toast.success('Players rotated!');
      refetchMatchups();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to rotate players';
      toast.error(msg);
    }
  };

  if (!sessionId) {
    return (
      <Layout title="Host Dashboard" showBack backTo="/">
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <p className="text-muted-foreground mb-4">No active session found.</p>
          <Button onClick={() => navigate({ to: '/' })}>Go Home</Button>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout title="Host Dashboard" showBack backTo="/">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  const hasAssignments = sessionState && sessionState.assignments.length > 0;
  const hasWaitlist = sessionState && sessionState.waitlist.length > 0;
  const currentRound = sessionState ? Number(sessionState.currentRound) : 1;

  return (
    <Layout title="Host Dashboard" showBack backTo="/">
      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        {/* Session Code */}
        <SessionCodeDisplay sessionId={sessionId} />

        {/* Player count summary */}
        <div className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-3">
          <Users className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <span className="font-semibold text-foreground">{totalPlayers} players</span>
            <span className="text-muted-foreground text-sm ml-2">
              · {courts} court{courts !== 1 ? 's' : ''}
              · {Math.min(totalPlayers, playersPerRound)} playing
              {totalPlayers > playersPerRound && `, ${totalPlayers - playersPerRound} waiting`}
            </span>
          </div>
          {currentRound > 1 && (
            <Badge variant="outline" className="text-xs">
              Round {currentRound - 1}
            </Badge>
          )}
        </div>

        {/* Add Player */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">Add Player</span>
            </div>
            {showAddForm ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {showAddForm && (
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              <Input
                placeholder="Player name *"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
              />
              <Input
                placeholder="DUPR rating (optional, e.g. 3.50)"
                type="number"
                min="2"
                max="8"
                step="0.01"
                value={playerDupr}
                onChange={(e) => setPlayerDupr(e.target.value)}
              />
              <Button
                className="w-full"
                onClick={handleAddPlayer}
                disabled={!playerName.trim() || addPlayer.isPending}
              >
                {addPlayer.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    Adding...
                  </span>
                ) : (
                  'Add Player'
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Allocate / Rotate buttons */}
        <div className="flex gap-3">
          <Button
            className="flex-1"
            onClick={handleAllocate}
            disabled={allocate.isPending || totalPlayers < 2}
          >
            {allocate.isPending ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                Allocating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                {hasAssignments ? 'Re-Allocate' : 'Allocate Players'}
              </span>
            )}
          </Button>

          {hasAssignments && (
            <Button
              variant="outline"
              onClick={handleRotate}
              disabled={allocate.isPending}
              title="Advance to next rotation"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Tabs */}
        {hasAssignments && (
          <Tabs defaultValue="current">
            <TabsList className="w-full">
              <TabsTrigger value="current" className="flex-1">Current</TabsTrigger>
              <TabsTrigger value="players" className="flex-1">Players</TabsTrigger>
              <TabsTrigger value="schedule" className="flex-1">Schedule</TabsTrigger>
            </TabsList>

            {/* Current Round */}
            <TabsContent value="current" className="space-y-3 mt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sessionState!.assignments.map((assignment) => (
                  <CourtAssignmentCard
                    key={Number(assignment.court)}
                    courtNumber={assignment.court}
                    players={resolveNames(assignment.players)}
                  />
                ))}
              </div>

              {hasWaitlist && (
                <WaitlistPanel
                  waitlist={sessionState!.waitlist.map((pid) => ({
                    id: pid.toString(),
                    name: playerNames[pid.toString()] ?? 'Unknown',
                  }))}
                  currentPlayerId={null}
                />
              )}
            </TabsContent>

            {/* Players list */}
            <TabsContent value="players" className="mt-3">
              <div className="space-y-2">
                {sessionState!.players.map((pid, idx) => {
                  const name = playerNames[pid.toString()] ?? `Player ${idx + 1}`;
                  const isOnCourt = sessionState!.assignments.some((a) =>
                    a.players.some((p) => p.toString() === pid.toString())
                  );
                  const isWaiting = sessionState!.waitlist.some(
                    (p) => p.toString() === pid.toString()
                  );
                  return (
                    <div
                      key={pid.toString()}
                      className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2.5"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {name[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span className="flex-1 font-medium text-foreground">{name}</span>
                      {isOnCourt && (
                        <Badge className="text-xs bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
                          Playing
                        </Badge>
                      )}
                      {isWaiting && (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/40">
                          Waiting
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Full Schedule */}
            <TabsContent value="schedule" className="mt-3">
              {allMatchups && allMatchups.length > 0 ? (
                <AllRoundsSchedule
                  rounds={allMatchups}
                  playerNames={playerNames}
                  currentRound={currentRound - 1}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">
                    Allocate players to generate the full rotation schedule.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Empty states */}
        {!hasAssignments && totalPlayers >= 2 && (
          <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
            <Trophy className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">Ready to play!</p>
            <p className="text-xs mt-1">Press "Allocate Players" to assign courts.</p>
          </div>
        )}

        {!hasAssignments && totalPlayers < 2 && (
          <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">Add at least 2 players to get started.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
