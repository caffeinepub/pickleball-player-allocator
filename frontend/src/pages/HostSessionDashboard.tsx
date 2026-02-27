import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
  Users,
  Trophy,
  Clock,
  Plus,
  Ghost,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  MapPin,
  Calendar,
  BarChart2,
  List,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useGetSession,
  useEndSession,
  useHostAddPlayer,
  useSearchPlayers,
} from '../hooks/useQueries';
import type { HostAddPlayerError } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { formatAddPlayerErrorKind } from '../lib/errorHandling';
import type { GuestPlayer, PlayerSearchResult } from '../backend';
import { generateRounds, calculateRankings, type Round, type MatchScore } from '../lib/scheduler';

// ─── Player Chip ──────────────────────────────────────────────────────────────

function PlayerChip({
  principalStr,
  guestPlayers,
  profileCache,
}: {
  principalStr: string;
  guestPlayers: GuestPlayer[];
  profileCache: Record<string, string>;
}) {
  const isGuest = principalStr.startsWith('guest-');
  const guest = guestPlayers.find((g) => `guest-${g.guestId}` === principalStr);
  const name = guest
    ? guest.name
    : profileCache[principalStr] ?? principalStr.slice(0, 8) + '…';

  if (isGuest) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium dark:bg-amber-900/30 dark:text-amber-300">
        <Ghost className="w-3 h-3" />
        {name}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
      {name}
    </span>
  );
}

// ─── Add Player Dialog ────────────────────────────────────────────────────────

interface AddPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
}

function AddPlayerDialog({ open, onOpenChange, sessionId }: AddPlayerDialogProps) {
  const [tab, setTab] = useState<'guest' | 'registered'>('guest');
  const [guestName, setGuestName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [addingPlayerId, setAddingPlayerId] = useState<string | null>(null);

  const addPlayerMutation = useHostAddPlayer();
  const { data: searchResults = [], isFetching: isSearching } = useSearchPlayers(searchTerm);

  const handleClose = useCallback(() => {
    setGuestName('');
    setSearchTerm('');
    setAddingPlayerId(null);
    setTab('guest');
    onOpenChange(false);
  }, [onOpenChange]);

  const handleAddGuest = useCallback(async () => {
    const trimmed = guestName.trim();
    if (!trimmed) {
      toast.error('Please enter a guest name.');
      return;
    }
    try {
      await addPlayerMutation.mutateAsync({
        sessionId,
        type: 'guest',
        guestName: trimmed,
      });
      toast.success(`Guest "${trimmed}" added to the session!`);
      handleClose();
    } catch (err) {
      const error = err as HostAddPlayerError;
      toast.error(formatAddPlayerErrorKind(error.kind ?? 'unknownError'));
    }
  }, [guestName, sessionId, addPlayerMutation, handleClose]);

  const handleAddRegistered = useCallback(
    async (player: PlayerSearchResult) => {
      const pid = player.id.toString();
      setAddingPlayerId(pid);
      try {
        await addPlayerMutation.mutateAsync({
          sessionId,
          type: 'registered',
          playerId: pid,
        });
        toast.success(`${player.name} added to the session!`);
        handleClose();
      } catch (err) {
        const error = err as HostAddPlayerError;
        toast.error(formatAddPlayerErrorKind(error.kind ?? 'unknownError'));
      } finally {
        setAddingPlayerId(null);
      }
    },
    [sessionId, addPlayerMutation, handleClose],
  );

  const isPending = addPlayerMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Add Player
          </DialogTitle>
          <DialogDescription>
            Add a guest by name or search for a registered player.
          </DialogDescription>
        </DialogHeader>

        {/* Tab selector */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setTab('guest')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'guest'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <Ghost className="w-4 h-4 inline mr-1" />
            Guest
          </button>
          <button
            onClick={() => setTab('registered')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'registered'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <Users className="w-4 h-4 inline mr-1" />
            Registered
          </button>
        </div>

        {tab === 'guest' ? (
          <div className="space-y-3">
            <Input
              placeholder="Enter guest name…"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isPending) handleAddGuest();
              }}
              autoFocus
              disabled={isPending}
            />
            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleAddGuest} disabled={isPending || !guestName.trim()}>
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding…
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Guest
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                autoFocus
                disabled={isPending}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {searchResults.map((player) => {
                  const pid = player.id.toString();
                  const isAdding = addingPlayerId === pid;
                  return (
                    <button
                      key={pid}
                      onClick={() => handleAddRegistered(player)}
                      disabled={isPending}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {player.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{player.name}</p>
                        <p className="text-xs text-muted-foreground">{pid.slice(0, 16)}…</p>
                      </div>
                      {isAdding ? (
                        <Loader2 className="w-4 h-4 ml-auto animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 ml-auto text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {searchTerm.trim().length > 0 && !isSearching && searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No players found for &ldquo;{searchTerm}&rdquo;
              </p>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function HostSessionDashboard() {
  const { sessionId } = useParams({ from: '/host/$sessionId' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();

  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [endSessionOpen, setEndSessionOpen] = useState(false);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  // completedScores tracked locally for ranking/ladder calculations
  const [completedScores, setCompletedScores] = useState<MatchScore[][]>([]);

  const { data: session, isLoading, error } = useGetSession(sessionId);
  const endSessionMutation = useEndSession();

  // Build profile cache: guest names keyed by "guest-{id}"
  const profileCache: Record<string, string> = React.useMemo(() => {
    const cache: Record<string, string> = {};
    if (session) {
      session.guestPlayers.forEach((g) => {
        cache[`guest-${g.guestId}`] = g.name;
      });
    }
    return cache;
  }, [session]);

  // All player IDs as strings (registered principals + guest keys)
  const allPlayerIds: string[] = React.useMemo(() => {
    if (!session) return [];
    const registered = session.players.map((p) => p.toString());
    const guests = session.guestPlayers.map((g) => `guest-${g.guestId}`);
    return [...registered, ...guests];
  }, [session]);

  // Generate rounds using the scheduler (requires totalRounds + sessionType)
  const rounds: Round[] = React.useMemo(() => {
    if (!session || allPlayerIds.length < 2) return [];
    const courts = Number(session.config.courts);
    const duration = session.config.duration ? Number(session.config.duration) : 60;
    const gameDuration = 15;
    const totalRounds = Math.max(1, Math.floor(duration / gameDuration));
    return generateRounds(
      allPlayerIds,
      courts,
      totalRounds,
      session.config.sessionType,
      completedScores,
    );
  }, [session, allPlayerIds, completedScores]);

  const currentRound: Round | null = rounds[currentRoundIndex] ?? null;

  // Rankings based on locally tracked completed scores
  const rankings = React.useMemo(() => {
    return calculateRankings(allPlayerIds, completedScores);
  }, [allPlayerIds, completedScores]);

  const handleEndSession = async () => {
    try {
      const result = await endSessionMutation.mutateAsync(sessionId);
      if (result === 'ok') {
        toast.success('Session ended successfully!');
        navigate({ to: '/' });
      } else if (result === 'notHost') {
        toast.error('You are not the host of this session.');
      } else if (result === 'alreadyEnded') {
        toast.error('This session has already ended.');
      } else {
        toast.error('Failed to end session.');
      }
    } catch {
      toast.error('Failed to end session. Please try again.');
    }
    setEndSessionOpen(false);
  };

  // ─── Loading / Error states ──────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading session…</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Session not found</h2>
          <p className="text-muted-foreground">
            This session doesn&apos;t exist or you don&apos;t have access.
          </p>
          <Button onClick={() => navigate({ to: '/' })}>Go Home</Button>
        </div>
      </div>
    );
  }

  const isHost =
    !!identity && session.config.host.toString() === identity.getPrincipal().toString();

  const sessionCode = session.config.sessionCode;
  const venue = session.config.venue;
  const date = session.config.date;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header bar ── */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex flex-col min-w-0">
              <h1 className="font-bold text-lg leading-tight truncate">
                {venue ?? 'Session Dashboard'}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                {date && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {date}
                  </span>
                )}
                {venue && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {venue}
                  </span>
                )}
                <Badge variant="outline" className="text-xs font-mono">
                  {sessionCode}
                </Badge>
                {session.isCompleted && (
                  <Badge variant="secondary" className="text-xs">
                    Ended
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Host controls */}
          {isHost && !session.isCompleted && (
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" onClick={() => setAddPlayerOpen(true)} className="gap-1">
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Player</span>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setEndSessionOpen(true)}
              >
                End
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="players">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="players" className="flex-1">
              <Users className="w-4 h-4 mr-1" />
              Players ({allPlayerIds.length})
            </TabsTrigger>
            <TabsTrigger value="rounds" className="flex-1">
              <List className="w-4 h-4 mr-1" />
              Rounds
            </TabsTrigger>
            <TabsTrigger value="rankings" className="flex-1">
              <Trophy className="w-4 h-4 mr-1" />
              Rankings
            </TabsTrigger>
          </TabsList>

          {/* ── Players Tab ── */}
          <TabsContent value="players">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Players ({allPlayerIds.length})
                  </CardTitle>
                  {isHost && !session.isCompleted && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAddPlayerOpen(true)}
                      className="gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {allPlayerIds.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No players yet.</p>
                    {isHost && !session.isCompleted && (
                      <Button
                        size="sm"
                        className="mt-3"
                        onClick={() => setAddPlayerOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add First Player
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Registered players */}
                    {session.players.map((p) => {
                      const pStr = p.toString();
                      const isCurrentUser =
                        !!identity && identity.getPrincipal().toString() === pStr;
                      const isSessionHost = session.config.host.toString() === pStr;
                      return (
                        <div
                          key={pStr}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {pStr.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {profileCache[pStr] ?? pStr.slice(0, 12) + '…'}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {isSessionHost && (
                              <Badge variant="default" className="text-xs">
                                Host
                              </Badge>
                            )}
                            {isCurrentUser && (
                              <Badge variant="secondary" className="text-xs">
                                You
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Guest players */}
                    {session.guestPlayers.map((g) => (
                      <div
                        key={`guest-${g.guestId}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                      >
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 dark:bg-amber-900/30">
                          <Ghost className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{g.name}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs text-amber-700 border-amber-300 bg-amber-50 dark:text-amber-300 dark:border-amber-700 dark:bg-amber-900/20 shrink-0"
                        >
                          Guest
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Rounds Tab ── */}
          <TabsContent value="rounds">
            {rounds.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Add at least 4 players to generate rounds.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Round navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentRoundIndex((i) => Math.max(0, i - 1))}
                    disabled={currentRoundIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-semibold text-sm">
                    Round {currentRoundIndex + 1} / {rounds.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentRoundIndex((i) => Math.min(rounds.length - 1, i + 1))
                    }
                    disabled={currentRoundIndex === rounds.length - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {currentRound && (
                  <div className="space-y-3">
                    {currentRound.assignments.map((assignment) => (
                      <Card key={assignment.court}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">
                            Court {assignment.court}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-2">
                            {/* Team A */}
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Team A
                              </p>
                              {assignment.teamA.map((pId) => (
                                <PlayerChip
                                  key={pId}
                                  principalStr={pId}
                                  guestPlayers={session.guestPlayers}
                                  profileCache={profileCache}
                                />
                              ))}
                            </div>
                            {/* Team B */}
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Team B
                              </p>
                              {assignment.teamB.map((pId) => (
                                <PlayerChip
                                  key={pId}
                                  principalStr={pId}
                                  guestPlayers={session.guestPlayers}
                                  profileCache={profileCache}
                                />
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {currentRound.waitlist.length > 0 && (
                      <Card className="border-dashed">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-muted-foreground">
                            Waitlist
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {currentRound.waitlist.map((pId) => (
                              <PlayerChip
                                key={pId}
                                principalStr={pId}
                                guestPlayers={session.guestPlayers}
                                profileCache={profileCache}
                              />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── Rankings Tab ── */}
          <TabsContent value="rankings">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" />
                  Session Rankings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rankings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No match results yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rankings.map((entry, idx) => {
                      const isGuest = entry.playerId.startsWith('guest-');
                      const name = isGuest
                        ? (session.guestPlayers.find(
                            (g) => `guest-${g.guestId}` === entry.playerId,
                          )?.name ?? entry.playerId)
                        : profileCache[entry.playerId] ??
                          entry.playerId.slice(0, 12) + '…';

                      return (
                        <div
                          key={entry.playerId}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              idx === 0
                                ? 'bg-yellow-400 text-yellow-900'
                                : idx === 1
                                  ? 'bg-gray-300 text-gray-700'
                                  : idx === 2
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{name}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                            <span className="text-green-600 font-medium">{entry.wins}W</span>
                            <span>/</span>
                            <span className="text-red-500 font-medium">{entry.losses}L</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Add Player Dialog ── */}
      <AddPlayerDialog
        open={addPlayerOpen}
        onOpenChange={setAddPlayerOpen}
        sessionId={sessionId}
      />

      {/* ── End Session Confirmation ── */}
      <AlertDialog open={endSessionOpen} onOpenChange={setEndSessionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end the session for all players. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={endSessionMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndSession}
              disabled={endSessionMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {endSessionMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ending…
                </>
              ) : (
                'End Session'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
