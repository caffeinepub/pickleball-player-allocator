import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { SessionState, UserProfile, PlayerId } from '../backend';
import { GameOutcome, SessionType } from '../backend';

export { GameOutcome, SessionType };

// ─── Session Code Generation ──────────────────────────────────────────────────

/** Generate a random 8-character alphanumeric code (avoids confusable chars) */
export function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateSessionParams {
  courts: number;
  date?: string;
  time?: string;
  venue?: string;
  duration?: number;
  sessionCode: string;
  sessionType: SessionType;
  isRanked: boolean;
}

export interface AddPlayerParams {
  sessionId: string;
  playerName: string;
  mobileNumber?: string;
  bio?: string;
  profilePicture?: string;
  workField?: string;
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserProfile();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('Unauthorized') || msg.includes('unauthorized')) {
          return null;
        }
        throw err;
      }
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

export function useGetUserProfile(user: PlayerId | null) {
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

export function useCreatePlayerProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createPlayerProfile(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Session ──────────────────────────────────────────────────────────────────

export function useCreateSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateSessionParams) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createSession(
        BigInt(params.courts),
        params.date ?? null,
        params.time ?? null,
        params.venue ?? null,
        params.duration != null ? BigInt(params.duration) : null,
        params.sessionCode,
        params.sessionType,
        params.isRanked,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useGetSessionState(sessionId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<SessionState>({
    queryKey: ['sessionState', sessionId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getSessionState(sessionId);
    },
    enabled: !!actor && !isFetching && !!sessionId,
    refetchInterval: 5000,
    retry: 1,
  });
}

export function useGetSessionStateByCode(sessionCode: string) {
  const { actor, isFetching } = useActor();

  return useQuery<SessionState>({
    queryKey: ['sessionStateByCode', sessionCode],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getSessionStateByCode(sessionCode);
    },
    enabled: !!actor && !isFetching && !!sessionCode,
    refetchInterval: 5000,
    retry: 1,
  });
}

export function useJoinSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionCode }: { sessionCode: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.joinSessionByCode(sessionCode);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessionStateByCode', variables.sessionCode] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useAddPlayerToSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AddPlayerParams) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addPlayerToSession(
        params.sessionId,
        params.playerName,
        params.mobileNumber ?? '',
        params.bio ?? null,
        params.profilePicture ?? null,
        params.workField ?? null,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessionState', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessionStateByCode'] });
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
      queryClient.invalidateQueries({ queryKey: ['sessionStateByCode'] });
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
      queryClient.invalidateQueries({ queryKey: ['sessionStateByCode'] });
    },
  });
}

export function useEndRound() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.endRound(sessionId);
    },
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['sessionState', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessionStateByCode'] });
    },
  });
}

export function useEndGame() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.endGame(sessionId);
    },
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['sessionState', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessionStateByCode'] });
    },
  });
}
