import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserProfile {
    bio?: string;
    name: string;
    mobileNumber: string;
    workField?: string;
    profilePicture?: string;
}
export interface MatchHistory {
    matches: Array<CompletedMatch>;
}
export type Time = bigint;
export interface CourtAssignment {
    court: Court;
    players: Array<PlayerId>;
}
export interface RoundAssignments {
    assignments: Array<CourtAssignment>;
    waitlist: Array<PlayerId>;
    round: bigint;
}
export type SessionId = string;
export interface PlayerSearchResult {
    id: Principal;
    name: string;
    mobileNumber: string;
}
export type GameCode = string;
export type PlayerId = Principal;
export interface SessionCreationResult {
    state: SessionState;
    sessionId: SessionId;
    config: SessionConfig;
}
export interface PublicProfile {
    id: Principal;
    bio?: string;
    name: string;
    workField?: string;
    profilePicture?: string;
    winRate?: number;
    winLossRecord?: [bigint, bigint];
}
export interface SessionConfig {
    isRanked: boolean;
    duration?: bigint;
    sessionCode: GameCode;
    sessionType: SessionType;
    venue?: string;
    date?: string;
    host: PlayerId;
    time?: string;
    creationTime: Time;
    sessionId: SessionId;
    courts: bigint;
}
export interface MatchResult {
    court: Court;
    players: Array<PlayerId>;
    timestamp: Time;
    outcome: GameOutcome;
}
export interface CompletedMatch {
    teamScores: [bigint, bigint];
    date: Time;
    court: Court;
    opponentNames: Array<string>;
    sessionId: SessionId;
    outcome: GameOutcome;
}
export interface GuestPlayer {
    isGuest: boolean;
    name: string;
    guestId: GuestId;
}
export interface Message {
    text: string;
    recipient: Principal;
    sender: Principal;
    timestamp: Time;
}
export interface SessionNotFound {
    message: string;
    reason?: string;
}
export type GuestId = bigint;
export type Court = bigint;
export interface AllGamesRoundAssignments {
    round: bigint;
    roundAssignments: Array<RoundAssignments>;
}
export interface Conversation {
    messages: Array<Message>;
    participant: Principal;
}
export interface SessionState {
    assignments: Array<CourtAssignment>;
    isCompleted: boolean;
    previousWaitlist: Array<PlayerId>;
    currentRound: bigint;
    guestPlayers: Array<GuestPlayer>;
    waitlist: Array<PlayerId>;
    matches: Array<MatchResult>;
    players: Array<PlayerId>;
    allGamesAssignments: Array<AllGamesRoundAssignments>;
    lastGuestId: GuestId;
    config: SessionConfig;
}
export enum GameOutcome {
    teamAWin = "teamAWin",
    teamBWin = "teamBWin"
}
export enum SessionType {
    randomAllotment = "randomAllotment",
    kingQueenOfTheCourt = "kingQueenOfTheCourt",
    roundRobin = "roundRobin",
    ladderLeague = "ladderLeague"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addGuestPlayer(sessionId: string, name: string): Promise<{
        __kind__: "ok";
        ok: GuestPlayer;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addPlayerToSession(sessionId: SessionId, playerId: Principal): Promise<{
        __kind__: "ok";
        ok: SessionState;
    } | {
        __kind__: "err";
        err: string;
    }>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createGuestProfile(name: string, mobileNumber: string, bio: string | null, profilePicture: string | null, workField: string | null): Promise<PublicProfile>;
    createSession(courts: bigint, date: string | null, time: string | null, venue: string | null, duration: bigint | null, sessionCode: GameCode, sessionType: SessionType, isRanked: boolean): Promise<SessionCreationResult>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getConversation(otherPrincipal: Principal): Promise<Array<Message>>;
    getMailbox(): Promise<Array<Conversation>>;
    getMatchHistory(): Promise<MatchHistory>;
    getMatchHistoryForPlayer(_requested: Principal): Promise<MatchHistory>;
    getPublicProfile(requested: Principal): Promise<PublicProfile | null>;
    getSession(sessionId: SessionId): Promise<{
        __kind__: "ok";
        ok: SessionState;
    } | {
        __kind__: "err";
        err: SessionNotFound;
    }>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserProfileAdmin(_user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    joinSession(gameCode: GameCode, guestName: string): Promise<{
        __kind__: "ok";
        ok: SessionId;
    } | {
        __kind__: "err";
        err: string;
    }>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchPlayersByName(searchTerm: string): Promise<Array<PlayerSearchResult>>;
    sendMessage(recipient: Principal, text: string): Promise<void>;
}
