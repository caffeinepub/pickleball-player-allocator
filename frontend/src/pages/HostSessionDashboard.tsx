import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  useGetSession,
  useAddGuestPlayer,
  useSearchPlayers,
  useHostAddPlayer,
} from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Users,
  Trophy,
  Clock,
  Calendar,
  UserPlus,
  Loader2,
  UserX,
  Ghost,
  CheckCircle,
  Play,
  Search,
  Phone,
} from 'lucide-react';
import CourtAssignmentCard from '../components/CourtAssignmentCard';
import WaitlistPanel from '../components/WaitlistPanel';
import AllRoundsSchedule from '../components/AllRoundsSchedule';
import MatchResultSubmission from '../components/MatchResultSubmission';
import type { MatchFormat } from '../components/MatchResultSubmission';
import SessionCodeDisplay from '../components/SessionCodeDisplay';
import { GameOutcome } from '../backend';
import type { GuestPlayer, PlayerSearchResult } from '../backend';
import { generateFairSchedule } from '../lib/scheduler';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlayerName {
  id: string;
  name: string;
  isGuest?: boolean;
}

interface ResolvedAssignment {
  courtBigInt: bigint;
  court: number;
  teamA: string[];
  teamB: string[];
  allPlayers: string[];
  guestNames: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Add Guest Player Dialog ──────────────────────────────────────────────────

interface AddGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
}

function AddGuestDialog({ open, onOpenChange, sessionId }: AddGuestDialogProps) {
  const [guestName, setGuestName] = useState('');
  const [nameError, setNameError] = useState('');
  const addGuestMutation = useAddGuestPlayer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = guestName.trim();
    if (!trimmed) {
      setNameError('Please enter a guest name');
      return;
    }
    if (trimmed.length > 50) {
      setNameError('Name must be 50 characters or less');
      return;
    }
    setNameError('');
    try {
      await addGuestMutation.mutateAsync({ sessionId, name: trimmed });
      toast.success(`Guest player "${trimmed}" added successfully!`);
      setGuestName('');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add guest player');
    }
  };

  const handleClose = () => {
    setGuestName('');
    setNameError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ghost className="w-5 h-5 text-primary" />
            Add Guest Player
          </DialogTitle>
          <DialogDescription>
            Add a guest player who hasn't signed up on the platform. They'll be identified by their display name.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Guest Display Name</label>
            <Input
              placeholder="Enter guest's name..."
              value={guestName}
              onChange={e => {
                setGuestName(e.target.value);
                if (nameError) setNameError('');
              }}
              maxLength={50}
              autoFocus
            />
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
            <p className="text-xs text-muted-foreground">{guestName.trim().length}/50 characters</p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={addGuestMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addGuestMutation.isPending || !guestName.trim()}
            >
              {addGuestMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Ghost className="w-4 h-4 mr-2" />
                  Add Guest
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Registered Player Dialog (Search by Name) ───────────────────────────

interface AddPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  existingPlayerIds: string[];
}

function AddPlayerDialog({ open, onOpenChange, sessionId, existingPlayerIds }: AddPlayerDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [addingPlayerId, setAddingPlayerId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hostAddMutation = useHostAddPlayer();

  const { data: searchResults, isLoading: isSearching } = useSearchPlayers(debouncedSearch);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  // Filter out players already in the session
  const filteredResults: PlayerSearchResult[] = React.useMemo(() => {
    if (!searchResults) return [];
    return searchResults.filter(
      r => !existingPlayerIds.includes(r.id.toString())
    );
  }, [searchResults, existingPlayerIds]);

  const handleAdd = async (player: PlayerSearchResult) => {
    const pid = player.id.toString();
    setAddingPlayerId(pid);
    try {
      await hostAddMutation.mutateAsync({
        sessionId,
        playerId: pid,
        playerName: player.name,
      });
      toast.success(`${player.name} added to the session!`);
    } catch (err: any) {
      toast.error(err.message || `Failed to add ${player.name}`);
    } finally {
      setAddingPlayerId(null);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setAddingPlayerId(null);
    onOpenChange(false);
  };

  const showResults = debouncedSearch.trim().length >= 1;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Add Registered Player
          </DialogTitle>
          <DialogDescription>
            Search for a registered player by name and add them to this session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by player name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Search Results */}
          {showResults && (
            <div className="border rounded-lg overflow-hidden">
              {isSearching ? (
                <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Searching...</span>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {searchResults && searchResults.length > 0
                    ? 'All matching players are already in this session.'
                    : 'No players found matching your search.'}
                </div>
              ) : (
                <ScrollArea className="max-h-56">
                  <div className="divide-y">
                    {filteredResults.map(player => {
                      const pid = player.id.toString();
                      const isAdding = addingPlayerId === pid;
                      return (
                        <div
                          key={pid}
                          className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                              {player.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{player.name}</p>
                              {player.mobileNumber && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {player.mobileNumber}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAdd(player)}
                            disabled={isAdding || hostAddMutation.isPending}
                            className="shrink-0 ml-2"
                          >
                            {isAdding ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <UserPlus className="w-3 h-3 mr-1" />
                                Add
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {!showResults && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Type a name to search for registered players.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Player List Item ─────────────────────────────────────────────────────────

interface PlayerListItemProps {
  name: string;
  isGuest?: boolean;
  isHost?: boolean;
  isCurrentUser?: boolean;
}

function PlayerListItem({ name, isGuest, isHost, isCurrentUser }: PlayerListItemProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            isGuest
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : isHost
              ? 'bg-primary/20 text-primary'
              : 'bg-secondary/20 text-secondary-foreground'
          }`}
        >
          {isGuest ? <Ghost className="w-4 h-4" /> : name.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium">{name}</span>
        {isCurrentUser && (
          <span className="text-xs text-muted-foreground">(you)</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {isGuest && (
          <Badge
            variant="outline"
            className="text-xs border-amber-400 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
          >
            Guest
          </Badge>
        )}
        {isHost && !isGuest && (
          <Badge variant="outline" className="text-xs border-primary text-primary">
            Host
          </Badge>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function HostSessionDashboard() {
  const { sessionId } = useParams({ from: '/host/$sessionId' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const currentUserPrincipal = identity?.getPrincipal().toString();

  const { data: session, isLoading, error } = useGetSession(sessionId);

  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false);
  const [showAddGuestDialog, setShowAddGuestDialog] = useState(false);
  const [submittedScores, setSubmittedScores] = useState<
    Record<string, { teamA: number; teamB: number }>
  >({});
  const [activeTab, setActiveTab] = useState('overview');

  // Build combined player list: registered players + guest players
  const allPlayerIds: string[] = React.useMemo(() => {
    if (!session) return [];
    const registered = session.players.map(p => p.toString());
    const guests = session.guestPlayers.map(g => guestPlayerToId(g));
    return [...registered, ...guests];
  }, [session]);

  // Registered player IDs only (for filtering search results)
  const registeredPlayerIds: string[] = React.useMemo(() => {
    if (!session) return [];
    return session.players.map(p => p.toString());
  }, [session]);

  const playerNames: PlayerName[] = React.useMemo(() => {
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

  // Generate fair schedule using player indices
  const totalPlayers = allPlayerIds.length;
  const courts = Number(session?.config.courts ?? 1);
  const totalRounds = totalPlayers > 1 ? Math.max(totalPlayers, courts * 2) : 0;

  const fairSchedule = React.useMemo(() => {
    if (totalPlayers < 2) return [];
    return generateFairSchedule(totalPlayers, courts, totalRounds);
  }, [totalPlayers, courts, totalRounds]);

  // Resolve current round assignments (first round of fair schedule)
  const resolvedAssignments: ResolvedAssignment[] = React.useMemo(() => {
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
        allPlayers: names,
        guestNames,
      };
    });
  }, [session, fairSchedule, allPlayerIds, playerNames]);

  // Waitlist for current round
  const currentWaitlist = React.useMemo(() => {
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

  // Player names as string array for AllRoundsSchedule (index-based)
  const playerNamesStringList: string[] = React.useMemo(() => {
    return allPlayerIds.map(id =>
      resolvePlayerNameFromList(id, playerNames, session?.guestPlayers ?? [])
    );
  }, [allPlayerIds, playerNames, session]);

  const handleMatchResult = useCallback(
    (courtBigInt: bigint, outcome: GameOutcome, _format: MatchFormat) => {
      const key = courtBigInt.toString();
      setSubmittedScores(prev => ({
        ...prev,
        [key]:
          outcome === GameOutcome.teamAWin
            ? { teamA: 1, teamB: 0 }
            : { teamA: 0, teamB: 1 },
      }));
      toast.success(`Match result recorded for Court ${Number(courtBigInt)}`);
    },
    []
  );

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

  const isHost = session.config.host.toString() === currentUserPrincipal;
  const totalPlayersCount = session.players.length + session.guestPlayers.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Host Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {session.config.venue || 'Session'} · {session.config.date || 'Today'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {session.isCompleted ? (
            <Badge className="bg-green-100 text-green-700 border-green-300">
              <CheckCircle className="w-3 h-3 mr-1" /> Completed
            </Badge>
          ) : (
            <Badge className="bg-primary/10 text-primary border-primary/30">
              <Play className="w-3 h-3 mr-1" /> Active
            </Badge>
          )}
        </div>
      </div>

      {/* Session Code */}
      <SessionCodeDisplay
        sessionCode={session.config.sessionCode}
        sessionId={sessionId}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center p-3">
          <div className="text-2xl font-bold text-primary">{totalPlayersCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Players</div>
        </Card>
        <Card className="text-center p-3">
          <div className="text-2xl font-bold text-primary">{courts}</div>
          <div className="text-xs text-muted-foreground mt-1">Courts</div>
        </Card>
        <Card className="text-center p-3">
          <div className="text-2xl font-bold text-primary">
            {session.guestPlayers.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Guests</div>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="courts">Courts</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Session Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {session.config.venue && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Venue</span>
                  <span className="font-medium">{session.config.venue}</span>
                </div>
              )}
              {session.config.date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{session.config.date}</span>
                </div>
              )}
              {session.config.time && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{session.config.time}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Game Type</span>
                <span className="font-medium capitalize">
                  {session.config.sessionType.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ranked</span>
                <span className="font-medium">{session.config.isRanked ? 'Yes' : 'No'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Add Players Section — visible for all game types */}
          {isHost && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-primary" />
                  Add Players Manually
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Add registered players by searching their name, or add unregistered guests directly.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 justify-start gap-2"
                    onClick={() => setShowAddPlayerDialog(true)}
                  >
                    <Search className="w-4 h-4 text-primary" />
                    Search &amp; Add Registered Player
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 justify-start gap-2"
                    onClick={() => setShowAddGuestDialog(true)}
                  >
                    <Ghost className="w-4 h-4 text-amber-500" />
                    Add Guest Player
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Players Tab */}
        <TabsContent value="players" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Players ({totalPlayersCount})
                </CardTitle>
                {isHost && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddPlayerDialog(true)}
                      className="gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Add Player</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddGuestDialog(true)}
                      className="gap-1"
                    >
                      <Ghost className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Add Guest</span>
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Registered Players */}
              {session.players.map(player => {
                const pid = player.toString();
                const isHostPlayer = pid === session.config.host.toString();
                const isCurrentUser = pid === currentUserPrincipal;
                return (
                  <PlayerListItem
                    key={pid}
                    name={pid.slice(0, 8) + '...'}
                    isHost={isHostPlayer}
                    isCurrentUser={isCurrentUser}
                  />
                );
              })}
              {/* Guest Players */}
              {session.guestPlayers.map(guest => (
                <PlayerListItem
                  key={`guest-${Number(guest.guestId)}`}
                  name={guest.name}
                  isGuest
                />
              ))}
              {totalPlayersCount === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No players yet. Share the session code to invite players.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courts Tab */}
        <TabsContent value="courts" className="space-y-4 mt-4">
          {resolvedAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  {totalPlayers < 2
                    ? 'Need at least 2 players to generate court assignments.'
                    : 'No court assignments yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {resolvedAssignments.map(assignment => {
                const scoreKey = assignment.courtBigInt.toString();
                const score = submittedScores[scoreKey];
                return (
                  <CourtAssignmentCard
                    key={assignment.court}
                    court={assignment.courtBigInt}
                    teamA={assignment.teamA}
                    teamB={assignment.teamB}
                    guestPlayerIds={assignment.guestNames}
                    submittedTeamAScore={score?.teamA}
                    submittedTeamBScore={score?.teamB}
                  />
                );
              })}
              {currentWaitlist.length > 0 && (
                <WaitlistPanel
                  waitlist={currentWaitlist.map(p => ({
                    id: p.id,
                    name: p.name,
                    isGuest: p.isGuest,
                  }))}
                />
              )}
              {resolvedAssignments.map(assignment => (
                <MatchResultSubmission
                  key={`result-${assignment.court}`}
                  court={assignment.courtBigInt}
                  teamA={assignment.teamA}
                  teamB={assignment.teamB}
                  guestPlayerIds={assignment.guestNames}
                  onSubmit={(outcome, format) =>
                    handleMatchResult(assignment.courtBigInt, outcome, format)
                  }
                />
              ))}
            </>
          )}
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4 mt-4">
          {fairSchedule.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  {totalPlayers < 2
                    ? 'Need at least 2 players to generate a schedule.'
                    : 'No schedule generated yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <AllRoundsSchedule
              scheduledRounds={fairSchedule}
              playerNamesList={playerNamesStringList}
              currentRound={1}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddGuestDialog
        open={showAddGuestDialog}
        onOpenChange={setShowAddGuestDialog}
        sessionId={sessionId}
      />
      <AddPlayerDialog
        open={showAddPlayerDialog}
        onOpenChange={setShowAddPlayerDialog}
        sessionId={sessionId}
        existingPlayerIds={registeredPlayerIds}
      />
    </div>
  );
}
