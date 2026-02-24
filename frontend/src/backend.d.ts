import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
export type MatchId = bigint;
export type PlayerId = Principal;
export interface SessionCreationResult {
    state: SessionState;
    sessionId: SessionId;
    config: SessionConfig;
}
export interface MatchResult {
    court: Court;
    players: Array<PlayerId>;
    timestamp: Time;
    outcome: GameOutcome;
}
export interface SessionConfig {
    host: PlayerId;
    creationTime: Time;
    sessionId: SessionId;
    courts: bigint;
}
export type Court = bigint;
export interface UserProfile {
    duprRating?: number;
    name: string;
}
export interface SessionState {
    assignments: Array<CourtAssignment>;
    currentRound: bigint;
    waitlist: Array<PlayerId>;
    matches: Array<MatchResult>;
    players: Array<PlayerId>;
    allRounds: Array<RoundAssignments>;
    config: SessionConfig;
}
export enum GameOutcome {
    teamAWin = "teamAWin",
    teamBWin = "teamBWin"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addPlayerToSession(sessionId: SessionId, playerName: string, duprRating: number | null): Promise<void>;
    allocatePlayers(sessionId: SessionId): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createPlayerProfile(name: string, duprRating: number | null): Promise<PlayerId>;
    createSession(courts: bigint): Promise<SessionCreationResult>;
    getAllMatchups(sessionId: SessionId, maxRounds: bigint): Promise<Array<RoundAssignments>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getSessionState(sessionId: SessionId): Promise<SessionState>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    joinSession(sessionId: SessionId): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitMatchResult(sessionId: SessionId, court: Court, outcome: GameOutcome): Promise<MatchId>;
}
