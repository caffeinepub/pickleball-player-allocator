import React, { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Users, Plus, Play, RotateCcw, Trophy, Loader2 } from 'lucide-react';
import { Layout } from '../components/Layout';
import { SessionCodeDisplay } from '../components/SessionCodeDisplay';
import CourtAssignmentCard from '../components/CourtAssignmentCard';
import WaitlistPanel from '../components/WaitlistPanel';
import AllRoundsSchedule from '../components/AllRoundsSchedule';
import { useGetSessionState, useAddPlayerToSession, useAllocatePlayers } from '../hooks/useQueries';
import { getSessionPlayerNames, setSessionPlayerName } from '../lib/storage';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export default function HostSessionDashboard() {
  const { sessionId } = useParams({ from: '/session/$sessionId/host' });
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [duprRating, setDuprRating] = useState('');
  const [activeTab, setActiveTab] = useState('current');

  const { data: sessionState, isLoading } = useGetSessionState(sessionId);
  const addPlayer = useAddPlayerToSession();
  const allocate = useAllocatePlayers();

  // Build ordered player names list from localStorage (index = position in backend players array)
  // Index 0 = host, index 1+ = added players
  const storedNames = getSessionPlayerNames(sessionId);

  /**
   * Build playerNamesList aligned with sessionState.players indices.
   * The host is at index 0 in the backend players array.
   * Added players are at indices 1, 2, 3, ...
   * We store names by their backend index in localStorage.
   */
  const buildPlayerNamesList = (totalPlayers: number): string[] => {
    return Array.from({ length: totalPlayers }, (_, i) => {
      return storedNames[i] || (i === 0 ? 'Host' : `Player ${i + 1}`);
    });
  };

  const handleAddPlayer = async () => {
    if (!playerName.trim() || !sessionState) return;
    const rating = duprRating ? parseFloat(duprRating) : undefined;
    try {
      // The new player will be appended at index = current players.length in the backend
      const nextIndex = sessionState.players.length;
      setSessionPlayerName(sessionId, nextIndex, playerName.trim());
      await addPlayer.mutateAsync({
        sessionId,
        playerName: playerName.trim(),
        duprRating: rating,
      });
      setPlayerName('');
      setDuprRating('');
    } catch (err) {
      console.error('Failed to add player:', err);
    }
  };

  const handleAllocate = async () => {
    try {
      await allocate.mutateAsync(sessionId);
    } catch (err) {
      console.error('Failed to allocate:', err);
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
  const playerNamesList = buildPlayerNamesList(totalPlayers);

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

  // Build ordered player list for Players tab
  const playerList = playerNamesList.map((name, i) => ({ index: i, name }));

  return (
    <Layout>
      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Host Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalPlayers} player{totalPlayers !== 1 ? 's' : ''} •{' '}
              {Number(sessionState.config.courts)} court{Number(sessionState.config.courts) !== 1 ? 's' : ''}
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            Round {Number(sessionState.currentRound)}
          </Badge>
        </div>

        {/* Session Code */}
        <SessionCodeDisplay sessionId={sessionId} />

        {/* Add Player Form */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Add Player
            </h2>
            <Input
              placeholder="Player name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
            />
            <Input
              placeholder="DUPR rating (optional)"
              type="number"
              step="0.01"
              min="2.0"
              max="8.0"
              value={duprRating}
              onChange={(e) => setDuprRating(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={handleAddPlayer}
              disabled={!playerName.trim() || addPlayer.isPending}
            >
              {addPlayer.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Add Player
            </Button>
          </CardContent>
        </Card>

        {/* Allocate Button */}
        {totalPlayers >= 2 && (
          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={handleAllocate}
              disabled={allocate.isPending}
              variant={currentAssignments.length === 0 ? 'default' : 'outline'}
            >
              {allocate.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : currentAssignments.length === 0 ? (
                <Play className="w-4 h-4 mr-2" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              {currentAssignments.length === 0 ? 'Start Session' : 'Next Round'}
            </Button>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="current" className="flex-1">Current</TabsTrigger>
            <TabsTrigger value="players" className="flex-1">Players</TabsTrigger>
            <TabsTrigger value="schedule" className="flex-1">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-4 space-y-4">
            {currentAssignments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No assignments yet</p>
                <p className="text-sm mt-1">Add players and start the session</p>
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
                {resolvedWaitlist.length > 0 && (
                  <WaitlistPanel
                    waitlist={resolvedWaitlist}
                    currentPlayerId={null}
                  />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="players" className="mt-4">
            {playerList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No players added yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {playerList.map((player) => (
                  <div
                    key={player.index}
                    className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{player.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">#{player.index + 1}</span>
                  </div>
                ))}
              </div>
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
