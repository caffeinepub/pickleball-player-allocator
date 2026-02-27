import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { Principal } from '@dfinity/principal';
import type { SessionState, UserProfile, SessionType, GuestPlayer, CompletedMatch, Message, Conversation, PlayerSearchResult } from '../backend';

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

// ─── User Profile ─────────────────────────────────────────────────────────────

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
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useCreateGuestProfile() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      mobileNumber: string;
      bio?: string;
      profilePicture?: string;
      workField?: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createGuestProfile(
        params.name,
        params.mobileNumber,
        params.bio ?? null,
        params.profilePicture ?? null,
        params.workField ?? null
      );
    },
  });
}

// ─── Session ──────────────────────────────────────────────────────────────────

export function useGetSession(sessionId: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<SessionState | null>({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!actor || !sessionId) return null;
      const result = await actor.getSession(sessionId);
      if (result.__kind__ === 'ok') {
        return result.ok;
      } else {
        const err = result.err;
        const isNotFound =
          err.reason === 'No session exists for the given session id' ||
          err.message === 'Session not found';
        if (isNotFound) {
          const e = new Error('SessionNotFound:' + sessionId);
          (e as any).isSessionNotFound = true;
          throw e;
        }
        throw new Error(err.message);
      }
    },
    enabled: !!actor && !isFetching && !!sessionId,
    refetchInterval: (query) => {
      if ((query.state.error as any)?.isSessionNotFound) return false;
      return 5000;
    },
    retry: (failureCount, error) => {
      if ((error as any)?.isSessionNotFound) return false;
      return failureCount < 2;
    },
    staleTime: 2000,
  });
}

// Alias for backwards compatibility
export const useGetSessionState = useGetSession;

export function useCreateSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      courts: number;
      date?: string;
      time?: string;
      venue?: string;
      duration?: number;
      sessionCode: string;
      sessionType: SessionType;
      isRanked: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createSession(
        BigInt(params.courts),
        params.date ?? null,
        params.time ?? null,
        params.venue ?? null,
        params.duration ? BigInt(params.duration) : null,
        params.sessionCode,
        params.sessionType,
        params.isRanked
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  });
}

export interface AddPlayerParams {
  sessionId: string;
  /** Principal ID string of the player to add */
  playerId: string;
  /** Optional display name stored locally for UI purposes */
  displayName?: string;
}

export function useAddPlayerToSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AddPlayerParams) => {
      if (!actor) throw new Error('Actor not available');
      let principal: Principal;
      try {
        principal = Principal.fromText(params.playerId.trim());
      } catch {
        throw new Error('Invalid Principal ID format. Please check and try again.');
      }
      const result = await actor.addPlayerToSession(params.sessionId, principal);
      if (result.__kind__ === 'ok') {
        return result.ok;
      } else {
        throw new Error(result.err ?? 'Failed to add player');
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['session', variables.sessionId] });
    },
  });
}

export interface AddGuestPlayerParams {
  sessionId: string;
  name: string;
}

export function useAddGuestPlayer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AddGuestPlayerParams): Promise<GuestPlayer> => {
      if (!actor) throw new Error('Actor not available');
      const trimmedName = params.name.trim();
      if (!trimmedName) throw new Error('Guest name cannot be empty');
      if (trimmedName.length > 50) throw new Error('Guest name is too long (max 50 characters)');
      const result = await actor.addGuestPlayer(params.sessionId, trimmedName);
      if (result.__kind__ === 'err') {
        throw new Error(result.err);
      }
      return result.ok;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['session', variables.sessionId] });
    },
  });
}

// ─── Player Search ────────────────────────────────────────────────────────────

export function useSearchPlayers(searchTerm: string) {
  const { actor, isFetching } = useActor();

  return useQuery<PlayerSearchResult[]>({
    queryKey: ['playerSearch', searchTerm],
    queryFn: async () => {
      if (!actor) return [];
      if (!searchTerm.trim()) return [];
      return actor.searchPlayersByName(searchTerm.trim());
    },
    enabled: !!actor && !isFetching && searchTerm.trim().length >= 1,
    staleTime: 10000,
  });
}

// ─── Host Add Player (by principal from search result) ───────────────────────

export function useHostAddPlayer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { sessionId: string; playerId: string; playerName: string }) => {
      if (!actor) throw new Error('Actor not available');
      let principal: Principal;
      try {
        principal = Principal.fromText(params.playerId.trim());
      } catch {
        throw new Error('Invalid player ID');
      }
      const result = await actor.addPlayerToSession(params.sessionId, principal);
      if (result.__kind__ === 'ok') {
        return result.ok;
      } else {
        throw new Error(result.err ?? 'Failed to add player');
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['session', variables.sessionId] });
    },
  });
}

export function useAllocatePlayers() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - allocatePlayers may exist on the actor
      return actor.allocatePlayers(sessionId);
    },
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
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
      outcome: import('../backend').GameOutcome;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - submitMatchResult may exist on the actor
      return actor.submitMatchResult(sessionId, court, outcome);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['session', variables.sessionId] });
    },
  });
}

export function useEndRound() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - endRound may exist on the actor
      return actor.endRound(sessionId);
    },
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });
}

export function useEndGame() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - endGame may exist on the actor
      return actor.endGame(sessionId);
    },
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });
}

export function useJoinSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionCode, guestName }: { sessionCode: string; guestName?: string }) => {
      if (!actor) throw new Error('Actor not available');
      // Normalize: trim whitespace and uppercase to match backend storage
      const normalizedCode = sessionCode.trim().toUpperCase();
      const result = await actor.joinSession(normalizedCode, guestName ?? '');
      if (result.__kind__ === 'ok') {
        return result.ok; // returns SessionId (string)
      } else {
        throw new Error(result.err);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  });
}

// ─── Public Profile ───────────────────────────────────────────────────────────

export function useGetPublicProfile(principalStr: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['publicProfile', principalStr],
    queryFn: async () => {
      if (!actor || !principalStr) return null;
      const principal = Principal.fromText(principalStr);
      return actor.getPublicProfile(principal);
    },
    enabled: !!actor && !isFetching && !!principalStr,
    retry: false,
  });
}

// ─── Match History ────────────────────────────────────────────────────────────

export function useGetMatchHistory() {
  const { actor, isFetching } = useActor();

  return useQuery<CompletedMatch[]>({
    queryKey: ['matchHistory'],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getMatchHistory();
      return result.matches;
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Messaging ────────────────────────────────────────────────────────────────

export function useGetMailbox() {
  const { actor, isFetching } = useActor();

  return useQuery<Conversation[]>({
    queryKey: ['mailbox'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMailbox();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useGetConversation(otherPrincipalStr: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['conversation', otherPrincipalStr],
    queryFn: async () => {
      if (!actor || !otherPrincipalStr) return [];
      const principal = Principal.fromText(otherPrincipalStr);
      return actor.getConversation(principal);
    },
    enabled: !!actor && !isFetching && !!otherPrincipalStr,
    refetchInterval: 5000,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { recipientPrincipal: string; text: string }) => {
      if (!actor) throw new Error('Actor not available');
      const principal = Principal.fromText(params.recipientPrincipal);
      return actor.sendMessage(principal, params.text);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.recipientPrincipal] });
      queryClient.invalidateQueries({ queryKey: ['mailbox'] });
    },
  });
}
