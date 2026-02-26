import { useState, useMemo } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  Users,
  Play,
  Trophy,
  ArrowLeft,
  Plus,
  Loader2,
  RefreshCw,
  StopCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Flag,
  Shuffle,
  RotateCcw,
  Layers,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useGetSessionState,
  useAllocatePlayers,
  useAddPlayerToSession,
  useSubmitMatchResult,
  useEndRound,
  useEndGame,
} from '../hooks/useQueries';
import { getCurrentSession, getSessionPlayerNames, setSessionPlayerName } from '../lib/storage';
import CourtAssignmentCard from '../components/CourtAssignmentCard';
import WaitlistPanel from '../components/WaitlistPanel';
import SessionCodeDisplay from '../components/SessionCodeDisplay';
import { MatchResultSubmission } from '../components/MatchResultSubmission';
import { generateFairSchedule } from '../lib/scheduler';
import AllRoundsSchedule from '../components/AllRoundsSchedule';
import { GameOutcome, SessionType } from '../backend';
import type { MatchFormat } from '../components/MatchResultSubmission';
import type { PlayerId } from '../backend';

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  [SessionType.randomAllotment]: 'Random Allotment',
  [SessionType.roundRobin]: 'Round Robin',
  [SessionType.ladderLeague]: 'Ladder League',
  [SessionType.kingQueenOfTheCourt]: 'King/Queen of the Court',
};

const SESSION_TYPE_ICONS: Record<SessionType, React.ReactNode> = {
  [SessionType.randomAllotment]: <Shuffle className="h-3.5 w-3.5" />,
  [SessionType.roundRobin]: <RotateCcw className="h-3.5 w-3.5" />,
  [SessionType.ladderLeague]: <Layers className="h-3.5 w-3.5" />,
  [SessionType.kingQueenOfTheCourt]: <Crown className="h-3.5 w-3.5" />,
};

// Track submitted scores per court (client-side, for the current round)
interface CourtScore {
  teamAScore: number;
  teamBScore: number;
}

export default function HostSessionDashboard() {
  const { sessionId } = useParams({ from: '/session/$sessionId/host' });
  const navigate = useNavigate();

  const {
    data: sessionState,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetSessionState(sessionId);

  const allocateMutation = useAllocatePlayers();
  const addPlayerMutation = useAddPlayerToSession();
  const submitMatchMutation = useSubmitMatchResult();
  const endRoundMutation = useEndRound();
  const endGameMutation = useEndGame();

  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerMobile, setNewPlayerMobile] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  // Track submitted scores per court for the current round (keyed by court number)
  const [courtScores, setCourtScores] = useState<Record<number, CourtScore>>({});
  // Track which courts are currently submitting scores
  const [submittingScoreCourts, setSubmittingScoreCourts] = useState<Set<number>>(new Set());

  // Stored player names (index-based) from localStorage
  const storedNames = getSessionPlayerNames(sessionId);

  const buildPlayerNamesList = (count: number): string[] =>
    Array.from({ length: count }, (_, i) => storedNames[i] || (i === 0 ? 'Host' : `Player ${i + 1}`));

  const totalPlayers = sessionState?.players.length ?? 0;
  const courts = Number(sessionState?.config.courts ?? 1);
  const totalRounds = totalPlayers > 1 ? Math.max(totalPlayers, courts * 2) : 0;

  const fairSchedule = useMemo(() => {
    if (totalPlayers < 2) return [];
    return generateFairSchedule(totalPlayers, courts, totalRounds);
  }, [totalPlayers, courts, totalRounds]);

  const playerNamesList = buildPlayerNamesList(totalPlayers);

  const resolvePlayersByPosition = (playerIds: PlayerId[]): string[] => {
    if (!sessionState) return [];
    const seenCount: Record<string, number> = {};
    return playerIds.map((pid) => {
      const pidStr = pid.toString();
      const occurrence = seenCount[pidStr] ?? 0;
      seenCount[pidStr] = occurrence + 1;
      let found = 0;
      for (let i = 0; i < sessionState.players.length; i++) {
        if (sessionState.players[i].toString() === pidStr) {
          if (found === occurrence) {
            return playerNamesList[i] || (i === 0 ? 'Host' : `Player ${i + 1}`);
          }
          found++;
        }
      }
      return 'Unknown';
    });
  };

  const handleAllocate = async () => {
    try {
      // Reset court scores when starting a new round
      setCourtScores({});
      await allocateMutation.mutateAsync(sessionId);
    } catch (err) {
      console.error('Failed to allocate players:', err);
    }
  };

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim() || !sessionState) return;
    try {
      const nextIndex = sessionState.players.length;
      setSessionPlayerName(sessionId, nextIndex, newPlayerName.trim());
      await addPlayerMutation.mutateAsync({
        sessionId,
        playerName: newPlayerName.trim(),
        mobileNumber: newPlayerMobile.trim() || 'N/A',
      });
      setNewPlayerName('');
      setNewPlayerMobile('');
      setShowAddPlayer(false);
    } catch (err) {
      console.error('Failed to add player:', err);
    }
  };

  const handleSubmitResult = async (
    outcome: GameOutcome,
    _format: MatchFormat,
    court: bigint,
  ) => {
    try {
      await submitMatchMutation.mutateAsync({ sessionId, court, outcome });
    } catch (err) {
      console.error('Failed to submit result:', err);
    }
  };

  const handleScoreSubmit = async (courtNumber: number, teamAScore: number, teamBScore: number) => {
    setSubmittingScoreCourts((prev) => new Set(prev).add(courtNumber));
    try {
      // Determine outcome from scores and submit match result
      const outcome = teamAScore >= teamBScore ? GameOutcome.teamAWin : GameOutcome.teamBWin;
      const courtBigInt = BigInt(courtNumber);
      await submitMatchMutation.mutateAsync({ sessionId, court: courtBigInt, outcome });
      // Store the scores locally for display
      setCourtScores((prev) => ({
        ...prev,
        [courtNumber]: { teamAScore, teamBScore },
      }));
    } catch (err) {
      console.error('Failed to submit score:', err);
    } finally {
      setSubmittingScoreCourts((prev) => {
        const next = new Set(prev);
        next.delete(courtNumber);
        return next;
      });
    }
  };

  const handleEndRound = async () => {
    // For ranked sessions, check if all courts have submitted scores
    if (sessionState?.config.isRanked) {
      const assignments = sessionState.assignments;
      const allScoresSubmitted = assignments.every((a) => courtScores[Number(a.court)] !== undefined);
      if (!allScoresSubmitted) {
        alert('Please submit scores for all courts before ending the round.');
        return;
      }
    }
    try {
      setCourtScores({});
      await endRoundMutation.mutateAsync(sessionId);
    } catch (err) {
      console.error('Failed to end round:', err);
    }
  };

  const handleEndGame = async () => {
    try {
      await endGameMutation.mutateAsync(sessionId);
      navigate({ to: '/' });
    } catch (err) {
      console.error('Failed to end game:', err);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-medium">Loading game session…</p>
        </div>
      </div>
    );
  }

  // ── Error / not found state ────────────────────────────────────────────────
  if (isError || !sessionState) {
    const errMsg = error instanceof Error ? error.message : String(error ?? '');
    const isAuthError = errMsg.includes('Unauthorized') || errMsg.includes('Only users');
    const isNotFound = errMsg.includes('does not exist') || errMsg.includes('not found');

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive/30">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground">
                {isAuthError
                  ? 'Authentication Required'
                  : isNotFound
                  ? 'Game Not Found'
                  : 'Failed to Load Game'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isAuthError
                  ? 'You need to be logged in to view this game session.'
                  : isNotFound
                  ? 'This game session could not be found. It may have ended or the link is invalid.'
                  : 'There was a problem loading the game session. Please try again.'}
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => refetch()} size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: '/' })} size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const assignments = sessionState.assignments;
  const waitlist = sessionState.waitlist;
  const config = sessionState.config;
  const hasAssignments = assignments.length > 0;
  const sessionCode = config.sessionCode;
  const isRanked = config.isRanked;
  const sessionType = config.sessionType;

  // Check if all courts have submitted scores (for ranked sessions)
  const allCourtsScored = assignments.every((a) => courtScores[Number(a.court)] !== undefined);
  const rankedEndRoundBlocked = isRanked && hasAssignments && !allCourtsScored;

  const resolvedAssignments = assignments.map((a) => ({
    court: Number(a.court),
    courtBigInt: a.court,
    players: resolvePlayersByPosition(a.players),
  }));

  const resolvedWaitlist = (() => {
    const seenCount: Record<string, number> = {};
    assignments.forEach((a) =>
      a.players.forEach((pid) => {
        const s = pid.toString();
        seenCount[s] = (seenCount[s] ?? 0) + 1;
      })
    );
    return waitlist.map((pid, wIdx) => {
      const pidStr = pid.toString();
      const occurrence = seenCount[pidStr] ?? 0;
      seenCount[pidStr] = occurrence + 1;
      let found = 0;
      for (let i = 0; i < sessionState.players.length; i++) {
        if (sessionState.players[i].toString() === pidStr) {
          if (found === occurrence) {
            return { id: String(wIdx), name: playerNamesList[i] || `Player ${i + 1}` };
          }
          found++;
        }
      }
      return { id: String(wIdx), name: 'Unknown' };
    });
  })();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/' })}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-base font-bold font-display text-foreground leading-tight">
                Host Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">
                {courts} court{courts !== 1 ? 's' : ''} · {totalPlayers} player{totalPlayers !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Badge variant="secondary" className="text-xs">
              Round {Number(sessionState.currentRound)}
            </Badge>
            <Badge
              variant={isRanked ? 'default' : 'outline'}
              className="text-xs"
            >
              {isRanked ? '🏆 Ranked' : 'Unranked'}
            </Badge>
            {sessionState.isCompleted && (
              <Badge variant="destructive" className="text-xs">Ended</Badge>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full pb-8">
        {/* Session Code */}
        <SessionCodeDisplay sessionId={sessionId} sessionCode={sessionCode} />

        {/* Game Type & Mode Info */}
        <Card className="border-border">
          <CardContent className="pt-3 pb-3 px-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                  {SESSION_TYPE_ICONS[sessionType]}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Game Type</p>
                  <p className="text-sm font-semibold text-foreground">{SESSION_TYPE_LABELS[sessionType]}</p>
                </div>
              </div>
              <Badge
                variant={isRanked ? 'default' : 'secondary'}
                className="text-xs px-3 py-1"
              >
                {isRanked ? '🏆 Ranked' : '🎮 Unranked'}
              </Badge>
            </div>
            {isRanked && (
              <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">
                Scores required at end of each round · Player ratings will be updated
              </p>
            )}
          </CardContent>
        </Card>

        {/* Game Info */}
        {(config.date || config.venue || config.time || config.duration) && (
          <Card className="border-border">
            <CardContent className="pt-4 pb-3">
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {config.date && <span>📅 {config.date}</span>}
                {config.time && <span>🕐 {config.time}</span>}
                {config.venue && <span>📍 {config.venue}</span>}
                {config.duration && <span>⏱ {Number(config.duration)}h</span>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Players Panel */}
        <Card className="border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Players ({totalPlayers})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddPlayer(!showAddPlayer)}
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {showAddPlayer && (
              <div className="bg-muted/40 rounded-lg p-3 space-y-2 border border-border">
                <div className="space-y-1">
                  <Label className="text-xs">Player Name *</Label>
                  <Input
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Enter name"
                    className="h-8 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mobile (optional)</Label>
                  <Input
                    value={newPlayerMobile}
                    onChange={(e) => setNewPlayerMobile(e.target.value)}
                    placeholder="Phone number"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddPlayer}
                    disabled={addPlayerMutation.isPending || !newPlayerName.trim()}
                    className="h-7 text-xs flex-1"
                  >
                    {addPlayerMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      'Add Player'
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAddPlayer(false)}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {sessionState.players.map((player, i) => (
                <div
                  key={`${player.toString()}-${i}`}
                  className="flex items-center gap-1.5 bg-muted/50 rounded-full px-3 py-1 text-xs font-medium"
                >
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">
                    {i + 1}
                  </div>
                  <span>{playerNamesList[i] || `Player ${i + 1}`}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {!sessionState.isCompleted && (
          <div className="flex gap-3">
            <Button
              onClick={handleAllocate}
              disabled={allocateMutation.isPending || totalPlayers < 2}
              className="flex-1 h-11 font-semibold gap-2"
            >
              {allocateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {hasAssignments ? 'Re-shuffle' : 'Start Round'}
            </Button>

            {hasAssignments && (
              <Button
                variant="outline"
                onClick={handleEndRound}
                disabled={endRoundMutation.isPending || rankedEndRoundBlocked}
                className="h-11 gap-2"
                title={rankedEndRoundBlocked ? 'Submit scores for all courts first' : undefined}
              >
                {endRoundMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Flag className="h-4 w-4" />
                )}
                End Round
              </Button>
            )}

            <Button
              variant="destructive"
              onClick={handleEndGame}
              disabled={endGameMutation.isPending}
              className="h-11 gap-2"
            >
              {endGameMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <StopCircle className="h-4 w-4" />
              )}
              End
            </Button>
          </div>
        )}

        {/* Ranked score submission reminder */}
        {isRanked && hasAssignments && !allCourtsScored && !sessionState.isCompleted && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            <Trophy className="h-4 w-4 flex-shrink-0" />
            <span>
              Submit scores for all courts before ending the round.{' '}
              {Object.keys(courtScores).length}/{assignments.length} submitted.
            </span>
          </div>
        )}

        {/* Court Assignments */}
        {hasAssignments && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Court Assignments
            </h2>
            {resolvedAssignments.map((a) => {
              const score = courtScores[a.court];
              return (
                <div key={a.court} className="space-y-2">
                  <CourtAssignmentCard
                    courtNumber={a.court}
                    players={a.players}
                    showScoreEntry={isRanked && !sessionState.isCompleted}
                    onScoreSubmit={(teamAScore, teamBScore) =>
                      handleScoreSubmit(a.court, teamAScore, teamBScore)
                    }
                    isScoreSubmitting={submittingScoreCourts.has(a.court)}
                    submittedTeamAScore={score?.teamAScore}
                    submittedTeamBScore={score?.teamBScore}
                  />
                  {!sessionState.isCompleted && !isRanked && (
                    <MatchResultSubmission
                      court={a.court}
                      teamA={a.players.slice(0, 2)}
                      teamB={a.players.slice(2, 4)}
                      onSubmit={(outcome, format) =>
                        handleSubmitResult(outcome, format, a.courtBigInt)
                      }
                      isLoading={submitMatchMutation.isPending}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Waitlist */}
        {resolvedWaitlist.length > 0 && (
          <WaitlistPanel
            waitlist={resolvedWaitlist}
            currentPlayerId={null}
          />
        )}

        {/* Schedule */}
        {fairSchedule.length > 0 && (
          <Card className="border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <button
                className="flex items-center justify-between w-full text-left"
                onClick={() => setShowSchedule(!showSchedule)}
              >
                <CardTitle className="text-sm font-semibold">
                  Full Schedule Preview
                </CardTitle>
                {showSchedule ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </CardHeader>
            {showSchedule && (
              <CardContent className="px-4 pb-4">
                <AllRoundsSchedule
                  scheduledRounds={fairSchedule}
                  playerNamesList={playerNamesList}
                  currentRound={Number(sessionState.currentRound)}
                />
              </CardContent>
            )}
          </Card>
        )}

        {/* Match History */}
        {sessionState.matches.length > 0 && (
          <Card className="border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Match History ({sessionState.matches.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {sessionState.matches.map((match, i) => {
                const matchPlayers = resolvePlayersByPosition(match.players);
                const teamA = matchPlayers.slice(0, 2);
                const teamB = matchPlayers.slice(2, 4);
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs bg-muted/30 rounded-lg px-3 py-2"
                  >
                    <span className="text-muted-foreground">Court {Number(match.court)}</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={
                          match.outcome === GameOutcome.teamAWin
                            ? 'font-semibold text-primary'
                            : 'text-muted-foreground'
                        }
                      >
                        {teamA.join(' & ')}
                      </span>
                      <span className="text-muted-foreground">vs</span>
                      <span
                        className={
                          match.outcome === GameOutcome.teamBWin
                            ? 'font-semibold text-primary'
                            : 'text-muted-foreground'
                        }
                      >
                        {teamB.join(' & ')}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {match.outcome === GameOutcome.teamAWin ? 'A wins' : 'B wins'}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
