import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { SessionState, RoundAssignments, UserProfile } from '../backend';
import { GameOutcome } from '../backend';
import type { Principal } from '@dfinity/principal';

export { GameOutcome };

export function useGetSessionState(sessionId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<SessionState>({
    queryKey: ['sessionState', sessionId],
    queryFn: async () => {
      if (!actor || !sessionId) throw new Error('Actor or sessionId not available');
      return actor.getSessionState(sessionId);
    },
    enabled: !!actor && !isFetching && !!sessionId,
    refetchInterval: 5000,
  });
}

export function useCreateSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courts: number) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createSession(BigInt(courts));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionState'] });
    },
  });
}

export function useJoinSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.joinSession(sessionId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessionState', variables.sessionId] });
    },
  });
}

export function useAddPlayerToSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      playerName,
      duprRating,
    }: {
      sessionId: string;
      playerName: string;
      duprRating?: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addPlayerToSession(sessionId, playerName, duprRating ?? null);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessionState', variables.sessionId] });
    },
  });
}

export function useAllocatePlayers() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.allocatePlayers(sessionId);
    },
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['sessionState', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['allMatchups', sessionId] });
    },
  });
}

export function useSubmitMatchResult() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      court,
      outcome,
    }: {
      sessionId: string;
      court: bigint;
      outcome: GameOutcome;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitMatchResult(sessionId, court, outcome);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessionState', variables.sessionId] });
    },
  });
}

export function useCreatePlayerProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, duprRating }: { name: string; duprRating?: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createPlayerProfile(name, duprRating ?? null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetUserProfile(user: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return null;
      return actor.getUserProfile(user);
    },
    enabled: !!actor && !isFetching && !!user,
    staleTime: 60000,
  });
}

export function useGetAllMatchups(sessionId: string | null, maxRounds: number) {
  const { actor, isFetching } = useActor();

  return useQuery<RoundAssignments[]>({
    queryKey: ['allMatchups', sessionId, maxRounds],
    queryFn: async () => {
      if (!actor || !sessionId) return [];
      return actor.getAllMatchups(sessionId, BigInt(maxRounds));
    },
    enabled: !!actor && !isFetching && !!sessionId && maxRounds > 0,
    staleTime: 10000,
  });
}
