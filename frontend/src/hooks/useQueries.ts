import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  UserProfile,
  SessionState,
  CompletedMatch,
  PlayerSearchResult,
  AddPlayerResult,
  SessionType,
  GuestPlayer,
} from '../backend';
import { Principal } from '@dfinity/principal';

// ─── User Profile ────────────────────────────────────────────────────────────

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

export function useGetUserProfile(userPrincipal?: string) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', userPrincipal],
    queryFn: async () => {
      if (!actor || !userPrincipal) return null;
      return actor.getUserProfile(Principal.fromText(userPrincipal));
    },
    enabled: !!actor && !isFetching && !!userPrincipal,
  });
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

export function useCreateGuestProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      mobileNumber: string;
      bio: string | null;
      profilePicture: string | null;
      workField: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createGuestProfile(
        params.name,
        params.mobileNumber,
        params.bio,
        params.profilePicture,
        params.workField,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Public Profile ──────────────────────────────────────────────────────────

export function useGetPublicProfile(principalId?: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['publicProfile', principalId],
    queryFn: async () => {
      if (!actor || !principalId) return null;
      return actor.getPublicProfile(Principal.fromText(principalId));
    },
    enabled: !!actor && !isFetching && !!principalId,
  });
}

// ─── Session ─────────────────────────────────────────────────────────────────

export function useGetSession(sessionId?: string) {
  const { actor, isFetching } = useActor();

  return useQuery<SessionState | null>({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!actor || !sessionId) return null;
      const result = await actor.getSession(sessionId);
      if (result.__kind__ === 'ok') {
        return result.ok;
      }
      return null;
    },
    enabled: !!actor && !isFetching && !!sessionId,
    refetchInterval: 5000,
  });
}

export function useCreateSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      courts: bigint;
      date: string | null;
      time: string | null;
      venue: string | null;
      duration: bigint | null;
      sessionCode: string;
      sessionType: SessionType;
      isRanked: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createSession(
        params.courts,
        params.date,
        params.time,
        params.venue,
        params.duration,
        params.sessionCode,
        params.sessionType,
        params.isRanked,
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session', data.sessionId] });
    },
  });
}

export function useEndSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.endSession(sessionId);
    },
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });
}

export function useJoinSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: { gameCode: string; guestName: string }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.joinSession(params.gameCode, params.guestName);
      if (result.__kind__ === 'ok') {
        return result.ok;
      }
      throw new Error(result.err);
    },
  });
}

// ─── Host Add Player ─────────────────────────────────────────────────────────

export type HostAddPlayerParams =
  | { sessionId: string; type: 'guest'; guestName: string }
  | { sessionId: string; type: 'registered'; playerId: string };

export type HostAddPlayerSuccess =
  | { kind: 'ok' }
  | { kind: 'guestAdded'; guest: GuestPlayer };

export type HostAddPlayerError =
  | { kind: 'notHost' }
  | { kind: 'sessionNotFound' }
  | { kind: 'playerAlreadyExists' }
  | { kind: 'invalidGuestName' }
  | { kind: 'invalidInput' }
  | { kind: 'unknownError' };

export function useHostAddPlayer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<HostAddPlayerSuccess, HostAddPlayerError, HostAddPlayerParams>({
    mutationFn: async (params: HostAddPlayerParams) => {
      if (!actor) throw new Error('Actor not available') as unknown as HostAddPlayerError;

      let playerId: Principal | null = null;
      let guestName: string | null = null;

      if (params.type === 'guest') {
        guestName = params.guestName.trim();
        if (!guestName) {
          throw { kind: 'invalidGuestName' } as HostAddPlayerError;
        }
      } else {
        playerId = Principal.fromText(params.playerId);
      }

      const result: AddPlayerResult = await actor.hostAddPlayer(
        params.sessionId,
        playerId,
        guestName,
      );

      switch (result.__kind__) {
        case 'ok':
          return { kind: 'ok' };
        case 'guestAdded':
          return { kind: 'guestAdded', guest: result.guestAdded };
        case 'notHost':
          throw { kind: 'notHost' } as HostAddPlayerError;
        case 'sessionNotFound':
          throw { kind: 'sessionNotFound' } as HostAddPlayerError;
        case 'playerAlreadyExists':
          throw { kind: 'playerAlreadyExists' } as HostAddPlayerError;
        case 'invalidGuestName':
          throw { kind: 'invalidGuestName' } as HostAddPlayerError;
        case 'invalidInput':
          throw { kind: 'invalidInput' } as HostAddPlayerError;
        case 'unknownError':
        default:
          throw { kind: 'unknownError' } as HostAddPlayerError;
      }
    },
    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({ queryKey: ['session', params.sessionId] });
    },
  });
}

// ─── Player Search ────────────────────────────────────────────────────────────

export function useSearchPlayers(searchTerm: string) {
  const { actor, isFetching } = useActor();

  return useQuery<PlayerSearchResult[]>({
    queryKey: ['searchPlayers', searchTerm],
    queryFn: async () => {
      if (!actor || !searchTerm.trim()) return [];
      return actor.searchPlayers(searchTerm.trim());
    },
    enabled: !!actor && !isFetching && searchTerm.trim().length > 0,
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

export function useGetMatchHistoryForPlayer(principalId?: string) {
  const { actor, isFetching } = useActor();

  return useQuery<CompletedMatch[]>({
    queryKey: ['matchHistoryForPlayer', principalId],
    queryFn: async () => {
      if (!actor || !principalId) return [];
      const result = await actor.getMatchHistoryForPlayer(Principal.fromText(principalId));
      return result.matches;
    },
    enabled: !!actor && !isFetching && !!principalId,
  });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export function useGetMailbox() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['mailbox'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMailbox();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetConversation(otherPrincipalId?: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['conversation', otherPrincipalId],
    queryFn: async () => {
      if (!actor || !otherPrincipalId) return [];
      return actor.getConversation(Principal.fromText(otherPrincipalId));
    },
    enabled: !!actor && !isFetching && !!otherPrincipalId,
    refetchInterval: 5000,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { recipientId: string; text: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendMessage(Principal.fromText(params.recipientId), params.text);
    },
    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', params.recipientId] });
      queryClient.invalidateQueries({ queryKey: ['mailbox'] });
    },
  });
}
