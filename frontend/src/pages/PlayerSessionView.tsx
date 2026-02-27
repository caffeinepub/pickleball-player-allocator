import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetSession } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CourtAssignmentCard from '../components/CourtAssignmentCard';
import WaitlistPanel from '../components/WaitlistPanel';
import AllRoundsSchedule from '../components/AllRoundsSchedule';
import { ChevronLeft, ChevronRight, Loader2, AlertTriangle, Play } from 'lucide-react';
import { generateRounds } from '../lib/scheduler';

type PlayerProfile = { name: string; mobileNumber: string };

export default function PlayerSessionView() {
  const { sessionId } = useParams({ from: '/session/$sessionId' });
  const navigate = useNavigate();
  const { actor } = useActor();

  const { data: session, isLoading } = useGetSession(sessionId);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [playerProfiles, setPlayerProfiles] = useState<Record<string, PlayerProfile>>({});
  const [profilesLoading, setProfilesLoading] = useState<Set<string>>(new Set());

  const fetchPlayerProfile = useCallback(
    async (principalId: string) => {
      if (!actor || playerProfiles[principalId] || profilesLoading.has(principalId)) return;
      setProfilesLoading((prev) => new Set(prev).add(principalId));
      try {
        const { Principal } = await import('@dfinity/principal');
        const profile = await actor.getUserProfile(Principal.fromText(principalId));
        if (profile) {
          setPlayerProfiles((prev) => ({
            ...prev,
            [principalId]: { name: profile.name, mobileNumber: profile.mobileNumber },
          }));
        }
      } catch {
        // ignore
      } finally {
        setProfilesLoading((prev) => {
          const next = new Set(prev);
          next.delete(principalId);
          return next;
        });
      }
    },
    [actor, playerProfiles, profilesLoading]
  );

  const playerNames = useMemo(() => {
    if (!session) return {} as Record<string, string>;
    const names: Record<string, string> = {};
    session.players.forEach((p) => {
      const pid = p.toString();
      if (playerProfiles[pid]) {
        names[pid] = playerProfiles[pid].name;
      } else {
        fetchPlayerProfile(pid);
        names[pid] = pid.slice(0, 8) + '...';
      }
    });
    session.guestPlayers.forEach((g) => {
      names[`guest-${g.guestId}`] = g.name;
    });
    return names;
  }, [session, playerProfiles, fetchPlayerProfile]);

  const playerUsernames = useMemo(() => {
    if (!session) return {} as Record<string, string>;
    const usernames: Record<string, string> = {};
    session.players.forEach((p) => {
      const pid = p.toString();
      if (playerProfiles[pid]?.mobileNumber) {
        usernames[pid] = playerProfiles[pid].mobileNumber;
      }
    });
    return usernames;
  }, [session, playerProfiles]);

  const guestPlayerIds = useMemo(() => {
    if (!session) return [] as string[];
    return session.guestPlayers.map((g) => `guest-${g.guestId}`);
  }, [session]);

  const allPlayerIds = useMemo(() => {
    if (!session) return [] as string[];
    const registered = session.players.map((p) => p.toString());
    const guests = session.guestPlayers.map((g) => `guest-${g.guestId}`);
    return [...registered, ...guests];
  }, [session]);

  const rounds = useMemo(() => {
    if (!session || allPlayerIds.length < 2) return [];
    const courts = Number(session.config.courts);
    const duration = session.config.duration ? Number(session.config.duration) : 60;
    const gameDuration = 15;
    const totalRounds = Math.max(1, Math.floor(duration / gameDuration));
    return generateRounds(allPlayerIds, courts, totalRounds, session.config.sessionType);
  }, [session, allPlayerIds]);

  const totalRounds = rounds.length;
  const currentRound = rounds[currentRoundIndex];
  const canGoNext = currentRoundIndex < totalRounds - 1;
  const canGoPrev = currentRoundIndex > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Session not found</h2>
        <Button onClick={() => navigate({ to: '/' })}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-foreground">
          {session.config.venue || 'Game Session'}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={session.config.isRanked ? 'default' : 'secondary'}>
            {session.config.isRanked ? 'Ranked' : 'Unranked'}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {String(session.config.sessionType).replace(/([A-Z])/g, ' $1').trim()}
          </Badge>
          {session.isCompleted && <Badge variant="destructive">Ended</Badge>}
        </div>
      </div>

      {/* Round Navigation */}
      {totalRounds > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentRoundIndex((i) => i - 1)}
              disabled={!canGoPrev}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Prev
            </Button>
            <div className="text-center">
              <p className="font-bold text-foreground">Round {currentRoundIndex + 1}</p>
              <p className="text-xs text-muted-foreground">of {totalRounds}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentRoundIndex((i) => i + 1)}
              disabled={!canGoNext}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="courts">
        <TabsList className="w-full">
          <TabsTrigger value="courts" className="flex-1">Courts</TabsTrigger>
          <TabsTrigger value="players" className="flex-1">
            Players ({allPlayerIds.length})
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex-1">Schedule</TabsTrigger>
        </TabsList>

        {/* Courts Tab */}
        <TabsContent value="courts" className="space-y-4 mt-4">
          {currentRound ? (
            <>
              {currentRound.assignments.map((assignment) => (
                <CourtAssignmentCard
                  key={assignment.court}
                  court={BigInt(assignment.court)}
                  teamA={assignment.teamA}
                  teamB={assignment.teamB}
                  guestPlayerIds={guestPlayerIds}
                  playerNames={playerNames}
                  playerUsernames={playerUsernames}
                  isHost={false}
                  round={currentRoundIndex + 1}
                />
              ))}
              {currentRound.waitlist.length > 0 && (
                <WaitlistPanel
                  waitlist={currentRound.waitlist}
                  playerNames={playerNames}
                  playerUsernames={playerUsernames}
                  guestPlayerIds={guestPlayerIds}
                />
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Play className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>Waiting for court assignments...</p>
            </div>
          )}
        </TabsContent>

        {/* Players Tab */}
        <TabsContent value="players" className="space-y-4 mt-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="divide-y divide-border/40">
              {session.players.map((p) => {
                const pid = p.toString();
                const profile = playerProfiles[pid];
                const isHostPlayer = pid === session.config.host.toString();
                return (
                  <div key={pid} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {(profile?.name || pid)[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground truncate">
                          {profile?.name || pid.slice(0, 12) + '...'}
                        </span>
                        {isHostPlayer && (
                          <Badge variant="default" className="text-xs py-0">
                            Host
                          </Badge>
                        )}
                      </div>
                      {profile?.mobileNumber && (
                        <span className="text-xs text-muted-foreground">
                          @{profile.mobileNumber}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {session.guestPlayers.map((g) => (
                <div key={g.guestId.toString()} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-amber-600">G</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-sm text-foreground">{g.name}</span>
                    <div className="mt-0.5">
                      <Badge
                        variant="outline"
                        className="text-xs py-0 text-amber-600 border-amber-500/40"
                      >
                        Guest
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="mt-4">
          <AllRoundsSchedule
            rounds={rounds}
            playerNames={playerNames}
            guestPlayerIds={guestPlayerIds}
            currentRound={currentRoundIndex}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
