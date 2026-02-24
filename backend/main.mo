import Array "mo:core/Array";
import List "mo:core/List";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  type PlayerId = Principal;
  type SessionId = Text;
  type Court = Nat;
  type MatchId = Nat;

  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
    duprRating : ?Float;
  };

  public type PlayerProfile = {
    id : PlayerId;
    name : Text;
    duprRating : ?Float;
    winLossRecord : ?(Nat, Nat);
  };

  public type GameOutcome = {
    #teamAWin;
    #teamBWin;
  };

  public type MatchResult = {
    court : Court;
    players : [PlayerId];
    outcome : GameOutcome;
    timestamp : Time.Time;
  };

  public type SessionConfig = {
    sessionId : SessionId;
    host : PlayerId;
    courts : Nat;
    creationTime : Time.Time;
  };

  public type CourtAssignment = {
    court : Court;
    players : [PlayerId];
  };

  public type RoundAssignments = {
    round : Nat;
    assignments : [CourtAssignment];
    waitlist : [PlayerId];
  };

  public type SessionState = {
    config : SessionConfig;
    players : [PlayerId];
    currentRound : Nat;
    assignments : [CourtAssignment];
    waitlist : [PlayerId];
    matches : [MatchResult];
    allRounds : [RoundAssignments];
  };

  let sessions = Map.empty<SessionId, SessionState>();
  let profiles = Map.empty<PlayerId, PlayerProfile>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  func generateUniqueId(caller : Principal) : Text {
    let timestamp = Time.now().toText();
    timestamp # "_" # caller.toText();
  };

  // Deprecated function - do not use. Backwards compatible only.
  public shared ({ caller }) func createPlayerProfile(name : Text, duprRating : ?Float) : async PlayerId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create player profiles");
    };

    if (profiles.containsKey(caller)) {
      Runtime.trap("Profile already exists");
    };

    let profile : PlayerProfile = {
      id = caller;
      name;
      duprRating;
      winLossRecord = null;
    };
    profiles.add(caller, profile);
    caller;
  };

  public type SessionCreationResult = {
    sessionId : SessionId;
    config : SessionConfig;
    state : SessionState;
  };

  // Any caller including guests can create a session (anonymous host support)
  public shared ({ caller }) func createSession(courts : Nat) : async SessionCreationResult {
    if (courts == 0) {
      Runtime.trap("Number of courts must be greater than 0");
    };

    let sessionId = Time.now().toText();
    let config : SessionConfig = {
      sessionId;
      host = caller;
      courts;
      creationTime = Time.now();
    };

    let initialState : SessionState = {
      config;
      players = [caller];
      currentRound = 1;
      assignments = [];
      waitlist = [];
      matches = [];
      allRounds = [];
    };

    sessions.add(sessionId, initialState);

    {
      sessionId;
      config;
      state = initialState;
    };
  };

  // Any caller including guests can join a session
  public shared ({ caller }) func joinSession(sessionId : SessionId) : async () {
    let state = switch (sessions.get(sessionId)) {
      case (null) { Runtime.trap("Session does not exist") };
      case (?s) { s };
    };

    let newPlayers = state.players.concat([caller]);
    let newState = {
      state with players = newPlayers;
    };
    sessions.add(sessionId, newState);
  };

  // Only the session host can add players; host may be a guest principal
  public shared ({ caller }) func addPlayerToSession(
    sessionId : SessionId,
    playerName : Text,
    duprRating : ?Float,
  ) : async () {
    let session = switch (sessions.get(sessionId)) {
      case (null) { Runtime.trap("Session does not exist") };
      case (?s) { s };
    };

    if (caller != session.config.host) {
      Runtime.trap("Only the session host can add players");
    };

    let newProfile : PlayerProfile = {
      id = caller;
      name = playerName;
      duprRating;
      winLossRecord = null;
    };

    profiles.add(caller, newProfile);

    let updatedPlayers = session.players.concat([caller]);
    let updatedSession = {
      session with players = updatedPlayers;
    };
    sessions.add(sessionId, updatedSession);
  };

  // Any caller including guests can view session state
  public query ({ caller }) func getSessionState(sessionId : SessionId) : async SessionState {
    switch (sessions.get(sessionId)) {
      case (null) { Runtime.trap("Session does not exist") };
      case (?state) { state };
    };
  };

  func shuffleArray(array : [PlayerId]) : [PlayerId] {
    let arraySize = array.size();

    if (arraySize <= 1) {
      return array;
    };

    var mutableArray = array.toVarArray();
    var i = 0;
    if (arraySize > 0) {
      i := arraySize - 1;
    };

    while (i > 0) {
      let j = i : Nat;
      let temp = mutableArray[i];
      mutableArray[i] := mutableArray[j];
      mutableArray[j] := temp;
      i -= 1;
    };

    mutableArray.toArray();
  };

  func rotatePlayers(players : [PlayerId], round : Nat) : [PlayerId] {
    if (players.size() <= 1) { return players };
    let shift = round % players.size();
    let firstHalf = players.sliceToArray(shift, players.size());
    let secondHalf = players.sliceToArray(0, shift);
    firstHalf.concat(secondHalf);
  };

  func generateRoundAssignments(
    totalPlayers : [PlayerId],
    courts : Nat,
    round : Nat,
  ) : RoundAssignments {
    let rotatedPlayers = rotatePlayers(totalPlayers, round);
    let assignments = List.empty<CourtAssignment>();
    var waitlist = rotatedPlayers;

    for (court in Nat.range(1, courts + 1)) {
      if (waitlist.size() >= 4) {
        let courtPlayers = waitlist.sliceToArray(0, 4);
        let remaining = waitlist.sliceToArray(4, waitlist.size());
        assignments.add({
          court;
          players = courtPlayers;
        });
        waitlist := remaining;
      } else if (waitlist.size() > 0) {
        let courtPlayers = waitlist.sliceToArray(0, waitlist.size());
        assignments.add({
          court;
          players = courtPlayers;
        });
        waitlist := [];
      };
    };

    {
      round;
      assignments = assignments.toArray();
      waitlist;
    };
  };

  func generateAllMatchupsHelper(
    players : [PlayerId],
    courts : Nat,
    maxRounds : Nat,
  ) : [RoundAssignments] {
    Array.tabulate(
      maxRounds,
      func(round) {
        generateRoundAssignments(players, courts, round + 1);
      },
    );
  };

  // Any caller including guests can view matchups
  public query ({ caller }) func getAllMatchups(
    sessionId : SessionId,
    maxRounds : Nat,
  ) : async [RoundAssignments] {
    let state = switch (sessions.get(sessionId)) {
      case (null) { Runtime.trap("Session does not exist") };
      case (?s) { s };
    };

    if (maxRounds == 0) {
      Runtime.trap("Max rounds must be greater than 0");
    };

    generateAllMatchupsHelper(state.players, state.config.courts, maxRounds);
  };

  // Only the session host can allocate players; host may be a guest principal
  public shared ({ caller }) func allocatePlayers(sessionId : SessionId) : async () {
    let state = switch (sessions.get(sessionId)) {
      case (null) { Runtime.trap("Session does not exist") };
      case (?s) { s };
    };

    if (caller != state.config.host) {
      Runtime.trap("Only the session host can allocate players");
    };

    if (state.players.size() < 2) {
      Runtime.trap("Not enough players to allocate courts");
    };

    let roundAssignments = generateRoundAssignments(
      state.players,
      state.config.courts,
      state.currentRound,
    );

    let newAllRounds = state.allRounds.concat([roundAssignments]);
    let newState = {
      state with
      assignments = roundAssignments.assignments;
      waitlist = roundAssignments.waitlist;
      allRounds = newAllRounds;
      currentRound = state.currentRound + 1;
    };

    sessions.add(sessionId, newState);
  };

  // Only the session host can submit match results; host may be a guest principal
  public shared ({ caller }) func submitMatchResult(
    sessionId : SessionId,
    court : Court,
    outcome : GameOutcome,
  ) : async MatchId {
    let state = switch (sessions.get(sessionId)) {
      case (null) { Runtime.trap("Session does not exist") };
      case (?s) { s };
    };

    if (caller != state.config.host) {
      Runtime.trap("Only the session host can submit match results");
    };

    let courtPlayers = switch (state.assignments.find(func(a) { a.court == court })) {
      case (null) {
        Runtime.trap("Court does not have a valid assignment");
      };
      case (?assignment) { assignment.players };
    };

    let matchResult : MatchResult = {
      court;
      players = courtPlayers;
      outcome;
      timestamp = Time.now();
    };

    for (player in courtPlayers.values()) {
      switch (profiles.get(player)) {
        case (null) {};
        case (?profile) {
          let winLoss = switch (profile.winLossRecord) {
            case (null) { (0, 0) };
            case (?(wins, losses)) { (wins, losses) };
          };

          let (wins, losses) = switch (outcome) {
            case (#teamAWin) {
              switch (courtPlayers.indexOf(player)) {
                case (?index) {
                  if (index < 2) {
                    (winLoss.0 + 1, winLoss.1);
                  } else {
                    (winLoss.0, winLoss.1 + 1);
                  };
                };
                case (null) { winLoss };
              };
            };
            case (#teamBWin) {
              switch (courtPlayers.indexOf(player)) {
                case (?index) {
                  if (index >= 2) {
                    (winLoss.0 + 1, winLoss.1);
                  } else {
                    (winLoss.0, winLoss.1 + 1);
                  };
                };
                case (null) { winLoss };
              };
            };
          };

          profiles.add(
            player,
            { profile with winLossRecord = ?(wins, losses) },
          );
        };
      };
    };

    let newState = {
      state with matches = state.matches.concat([matchResult]);
    };
    sessions.add(sessionId, newState);
    state.matches.size();
  };
};
