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
export type GameCode = string;
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
export interface AllGamesRoundAssignments {
    round: bigint;
    roundAssignments: Array<RoundAssignments>;
}
export type Court = bigint;
export interface SessionState {
    assignments: Array<CourtAssignment>;
    isCompleted: boolean;
    previousWaitlist: Array<PlayerId>;
    currentRound: bigint;
    waitlist: Array<PlayerId>;
    matches: Array<MatchResult>;
    players: Array<PlayerId>;
    allGamesAssignments: Array<AllGamesRoundAssignments>;
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
    addPlayerToSession(sessionId: SessionId, playerName: string, mobileNumber: string, bio: string | null, profilePicture: string | null, workField: string | null): Promise<void>;
    allocatePlayers(sessionId: SessionId): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createPlayerProfile(name: string): Promise<PlayerId>;
    createSession(courts: bigint, date: string | null, time: string | null, venue: string | null, duration: bigint | null, sessionCode: GameCode, sessionType: SessionType, isRanked: boolean): Promise<SessionCreationResult>;
    endGame(sessionId: SessionId): Promise<void>;
    endRound(sessionId: SessionId): Promise<void>;
    getAllGames(sessionId: SessionId, rotations: bigint, roundsPerRotation: bigint): Promise<Array<AllGamesRoundAssignments>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getSessionGameInfo(sessionId: SessionId): Promise<[string, string | null, string | null, string | null, bigint | null]>;
    getSessionState(sessionId: SessionId): Promise<SessionState>;
    getSessionStateByCode(sessionCode: string): Promise<SessionState>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    joinSession(sessionId: SessionId): Promise<void>;
    joinSessionByCode(sessionCode: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitMatchResult(sessionId: SessionId, court: Court, outcome: GameOutcome): Promise<MatchId>;
}
