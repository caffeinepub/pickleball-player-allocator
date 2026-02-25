import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type {
  SessionState,
  SessionCreationResult,
  RoundAssignments,
  UserProfile,
} from '../backend';
import { GameOutcome } from '../backend';
import type { Principal } from '@dfinity/principal';
import { retryWithBackoff } from '../lib/errorHandling';

export { GameOutcome };

// ─── User Profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!isAuthenticated) return null;
      try {
        return await actor.getCallerUserProfile();
      } catch (err: any) {
        // Guest/anonymous users get Unauthorized trap — treat as no profile
        if (
          err?.message?.includes('Unauthorized') ||
          err?.message?.includes('unauthorized')
        ) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: false,
  });

  // For guest users, return a resolved state with null data immediately
  if (!isAuthenticated) {
    return {
      data: null as UserProfile | null,
      isLoading: false,
      isFetched: true,
      isError: false,
      error: null,
    };
  }

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      // Only call the backend if the user is authenticated
      if (!identity) return;
      if (!actor) throw new Error('Actor not available');
      return retryWithBackoff(() => actor.saveCallerUserProfile(profile));
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

// ─── Session ──────────────────────────────────────────────────────────────────

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
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  return useMutation<SessionCreationResult, Error, number>({
    mutationFn: async (courts: number) => {
      if (actorFetching) {
        throw new Error('Still connecting to the network. Please try again in a moment.');
      }
      if (!actor) {
        throw new Error('Unable to connect to the backend. Please refresh and try again.');
      }
      if (courts < 1 || courts > 10) {
        throw new Error('Number of courts must be between 1 and 10.');
      }
      return retryWithBackoff(() => actor.createSession(BigInt(courts)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionState'] });
    },
  });
}

export function useJoinSession() {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (sessionId: string) => {
      if (actorFetching) {
        throw new Error('Still connecting to the network. Please try again in a moment.');
      }
      if (!actor) {
        throw new Error('Unable to connect to the backend. Please refresh and try again.');
      }
      await retryWithBackoff(() => actor.joinSession(sessionId));
    },
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['sessionState', sessionId] });
    },
  });
}

export function useAddPlayerToSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { sessionId: string; playerName: string; duprRating?: number }
  >({
    mutationFn: async ({ sessionId, playerName, duprRating }) => {
      if (!actor) throw new Error('Actor not available');
      return retryWithBackoff(() =>
        actor.addPlayerToSession(sessionId, playerName, duprRating ?? null)
      );
    },
    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['sessionState', sessionId] });
    },
  });
}

export function useAllocatePlayers() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (sessionId: string) => {
      if (!actor) throw new Error('Actor not available');
      return retryWithBackoff(() => actor.allocatePlayers(sessionId));
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

  return useMutation<
    bigint,
    Error,
    { sessionId: string; court: bigint; outcome: GameOutcome }
  >({
    mutationFn: async ({ sessionId, court, outcome }) => {
      if (!actor) throw new Error('Actor not available');
      return retryWithBackoff(() => actor.submitMatchResult(sessionId, court, outcome));
    },
    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['sessionState', sessionId] });
    },
  });
}

export function useCreatePlayerProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, duprRating }: { name: string; duprRating?: number }) => {
      if (!actor) throw new Error('Actor not available');
      return retryWithBackoff(() => actor.createPlayerProfile(name, duprRating ?? null));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
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
