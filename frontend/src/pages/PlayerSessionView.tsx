import React, { useState, useMemo } from 'react';
import { useParams } from '@tanstack/react-router';
import { Users, Loader2, CalendarDays, Calendar, Clock, MapPin, Timer, CheckCircle, Shuffle, RotateCcw, Layers, Crown } from 'lucide-react';
import { Layout } from '../components/Layout';
import CourtAssignmentCard from '../components/CourtAssignmentCard';
import WaitlistPanel from '../components/WaitlistPanel';
import { MatchResultSubmission } from '../components/MatchResultSubmission';
import type { MatchFormat } from '../components/MatchResultSubmission';
import AllRoundsSchedule from '../components/AllRoundsSchedule';
import { useGetSessionState, useSubmitMatchResult } from '../hooks/useQueries';
import { getSessionPlayerNames } from '../lib/storage';
import { generateFairSchedule } from '../lib/scheduler';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { GameOutcome, SessionType } from '../backend';
import type { PlayerId } from '../backend';
import type { ScheduledRound } from '../lib/scheduler';

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

export default function PlayerSessionView() {
  const { sessionId } = useParams({ from: '/session/$sessionId/player' });
  const [activeTab, setActiveTab] = useState('current');
  const [resultSubmitted, setResultSubmitted] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const { data: sessionState, isLoading } = useGetSessionState(sessionId);
  const submitResult = useSubmitMatchResult();

  const storedNames = getSessionPlayerNames(sessionId);

  const totalPlayers = sessionState?.players.length ?? 0;
  const courts = Number(sessionState?.config.courts ?? 1);
  const totalRounds = totalPlayers > 1 ? Math.max(totalPlayers, courts * 2) : 0;

  const fairSchedule: ScheduledRound[] = useMemo(() => {
    if (totalPlayers < 2) return [];
    return generateFairSchedule(totalPlayers, courts, totalRounds);
  }, [totalPlayers, courts, totalRounds]);

  const handleSubmitResult = async (outcome: GameOutcome, _format: MatchFormat) => {
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

  const handleShowAllGames = () => {
    setShowSchedule(true);
    setActiveTab('schedule');
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
          <p className="text-muted-foreground">Game not found</p>
        </div>
      </Layout>
    );
  }

  const currentAssignments = sessionState.assignments;
  const currentWaitlist = sessionState.waitlist;
  const config = sessionState.config;
  const isRanked = config.isRanked;
  const sessionType = config.sessionType;

  const playerNamesList: string[] = Array.from({ length: totalPlayers }, (_, i) => {
    return storedNames[i] || (i === 0 ? 'Host' : `Player ${i + 1}`);
  });

  const resolvePlayersByPosition = (playerIds: PlayerId[]): string[] => {
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

  const resolvedAssignments = currentAssignments.map((assignment) => ({
    court: Number(assignment.court),
    players: resolvePlayersByPosition(assignment.players),
  }));

  const resolveWaitlistWithContext = (): { id: string; name: string }[] => {
    const seenCount: Record<string, number> = {};
    currentAssignments.forEach((assignment) => {
      assignment.players.forEach((pid) => {
        const pidStr = pid.toString();
        seenCount[pidStr] = (seenCount[pidStr] ?? 0) + 1;
      });
    });
    return currentWaitlist.map((pid, wIdx) => {
      const pidStr = pid.toString();
      const occurrence = seenCount[pidStr] ?? 0;
      seenCount[pidStr] = occurrence + 1;

      let found = 0;
      for (let i = 0; i < sessionState.players.length; i++) {
        if (sessionState.players[i].toString() === pidStr) {
          if (found === occurrence) {
            const name = playerNamesList[i] || (i === 0 ? 'Host' : `Player ${i + 1}`);
            return { id: String(wIdx), name };
          }
          found++;
        }
      }
      return { id: String(wIdx), name: 'Unknown' };
    });
  };

  const resolvedWaitlist = resolveWaitlistWithContext();

  const hasGameInfo = config.date || config.time || config.venue || config.duration;

  return (
    <Layout>
      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Game</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalPlayers} player{totalPlayers !== 1 ? 's' : ''} •{' '}
              {courts} court{courts !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Badge variant="outline" className="text-xs">
              Round {Number(sessionState.currentRound)}
            </Badge>
            <Badge
              variant={isRanked ? 'default' : 'secondary'}
              className="text-xs"
            >
              {isRanked ? '🏆 Ranked' : 'Unranked'}
            </Badge>
          </div>
        </div>

        {/* Game Type & Mode Banner */}
        <Card className="border border-primary/20 bg-primary/5">
          <CardContent className="pt-3 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  {SESSION_TYPE_ICONS[sessionType]}
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Game Type</p>
                  <p className="text-sm font-semibold text-foreground">{SESSION_TYPE_LABELS[sessionType]}</p>
                </div>
              </div>
              <Badge
                variant={isRanked ? 'default' : 'secondary'}
                className="text-xs"
              >
                {isRanked ? '🏆 Ranked' : '🎮 Unranked'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Game Info Banner */}
        {hasGameInfo && (
          <Card className="border border-primary/20 bg-primary/5">
            <CardContent className="pt-3 pb-3 px-4">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Game Info</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {config.date && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>{config.date}</span>
                  </div>
                )}
                {config.time && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>{config.time}</span>
                  </div>
                )}
                {config.venue && (
                  <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{config.venue}</span>
                  </div>
                )}
                {config.duration != null && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Timer className="h-3.5 w-3.5 shrink-0" />
                    <span>{Number(config.duration)}h</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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
                <p className="text-sm mt-1">Court assignments will appear here</p>
              </div>
            ) : (
              <>
                {resolvedAssignments.map((a) => (
                  <CourtAssignmentCard
                    key={a.court}
                    courtNumber={a.court}
                    players={a.players}
                    // Players see submitted scores for ranked games (no score entry)
                  />
                ))}
                {resolvedWaitlist.length > 0 && (
                  <WaitlistPanel
                    waitlist={resolvedWaitlist}
                    currentPlayerId={null}
                  />
                )}
                {/* Only show match result submission for unranked games */}
                {!isRanked && (
                  <>
                    {resultSubmitted ? (
                      <Card className="border border-border bg-green-500/5">
                        <CardContent className="pt-4 pb-4 px-4 flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                          <div>
                            <p className="font-semibold text-sm text-foreground">Result Recorded!</p>
                            <p className="text-xs text-muted-foreground">Your match result has been saved.</p>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      (() => {
                        const firstAssignment = currentAssignments[0];
                        if (!firstAssignment) return null;
                        const allPlayers = resolvePlayersByPosition(firstAssignment.players);
                        const teamA = allPlayers.slice(0, 2);
                        const teamB = allPlayers.slice(2, 4);
                        return (
                          <MatchResultSubmission
                            court={Number(firstAssignment.court)}
                            teamA={teamA}
                            teamB={teamB}
                            onSubmit={handleSubmitResult}
                            isLoading={submitResult.isPending}
                            onSkip={() => setResultSubmitted(true)}
                          />
                        );
                      })()
                    )}
                  </>
                )}

                {/* Ranked game info for players */}
                {isRanked && (
                  <Card className="border border-primary/20 bg-primary/5">
                    <CardContent className="pt-3 pb-3 px-4 flex items-center gap-2">
                      <span className="text-lg">🏆</span>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Ranked Game</p>
                        <p className="text-xs text-muted-foreground">
                          The host will submit scores at the end of each round. Your rating will be updated.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="mt-4">
            {showSchedule && fairSchedule.length > 0 ? (
              <AllRoundsSchedule
                scheduledRounds={fairSchedule}
                playerNamesList={playerNamesList}
                currentRound={Number(sessionState.currentRound)}
              />
            ) : (
              <div className="text-center py-6 text-muted-foreground space-y-3">
                <CalendarDays className="w-10 h-10 mx-auto opacity-30" />
                <p className="font-medium">Full schedule</p>
                <Button variant="outline" size="sm" onClick={handleShowAllGames}>
                  Show All Games
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
