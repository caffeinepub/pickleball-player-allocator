import Array "mo:core/Array";
import List "mo:core/List";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  type PlayerId = Principal;
  type SessionId = Text;
  type Court = Nat;
  type GameCode = Text;
  type MatchId = Nat;
  type MobileNumber = Text;

  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
    mobileNumber : Text;
    bio : ?Text;
    profilePicture : ?Text;
    workField : ?Text;
  };

  public type PlayerRating = {
    mu : Float;
    sigma : Float;
    rating : Float;
  };

  public type PlayerProfile = {
    id : Principal;
    name : Text;
    rating : PlayerRating;
    winLossRecord : ?(Nat, Nat);
    mobileNumber : Text;
    bio : ?Text;
    profilePicture : ?Text;
    workField : ?Text;
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
    date : ?Text;
    time : ?Text;
    venue : ?Text;
    duration : ?Nat;
    sessionCode : GameCode;
    sessionType : SessionType;
    isRanked : Bool;
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

  public type AllGamesRoundAssignments = {
    round : Nat;
    roundAssignments : [RoundAssignments];
  };

  public type SessionState = {
    config : SessionConfig;
    players : [PlayerId];
    currentRound : Nat;
    assignments : [CourtAssignment];
    waitlist : [PlayerId];
    matches : [MatchResult];
    allGamesAssignments : [AllGamesRoundAssignments];
    previousWaitlist : [PlayerId];
    isCompleted : Bool;
  };

  public type RatingUpdate = {
    player : Principal;
    oldRating : PlayerRating;
    newRating : PlayerRating;
  };

  public type MatchFormat = {
    #casual;
    #standard;
    #tournament;
    #finals;
  };

  public type GameScore = {
    teamA : Nat;
    teamB : Nat;
  };

  public type FullMatchInput = {
    teamA : [PlayerId];
    teamB : [PlayerId];
    games : [GameScore];
    format : MatchFormat;
  };

  public type ExtendedMatchResult = {
    id : MatchId;
    result : MatchResult;
  };

  public type SessionType = {
    #randomAllotment;
    #roundRobin;
    #ladderLeague;
    #kingQueenOfTheCourt;
  };

  public type SessionCreationResult = {
    sessionId : SessionId;
    config : SessionConfig;
    state : SessionState;
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

    let initialRating : PlayerRating = {
      mu = 1500.0;
      sigma = 350.0;
      rating = 1500.0 - 2.0 * 350.0;
    };

    let newProfile : PlayerProfile = {
      id = caller;
      name = profile.name;
      rating = initialRating;
      winLossRecord = null;
      mobileNumber = profile.mobileNumber;
      bio = profile.bio;
      profilePicture = profile.profilePicture;
      workField = profile.workField;
    };
    profiles.add(caller, newProfile);
  };

  public shared ({ caller }) func createPlayerProfile(name : Text) : async PlayerId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create player profiles");
    };

    if (profiles.containsKey(caller)) {
      Runtime.trap("Profile already exists");
    };

    let initialRating : PlayerRating = {
      mu = 1500.0;
      sigma = 350.0;
      rating = 1500.0 - 2.0 * 350.0;
    };

    let profile : PlayerProfile = {
      id = caller;
      name;
      rating = initialRating;
      winLossRecord = null;
      mobileNumber = "none";
      bio = null;
      profilePicture = null;
      workField = null;
    };
    profiles.add(caller, profile);
    caller;
  };

  public shared ({ caller }) func createSession(
    courts : Nat,
    date : ?Text,
    time : ?Text,
    venue : ?Text,
    duration : ?Nat,
    sessionCode : GameCode,
    sessionType : SessionType,
    isRanked : Bool,
  ) : async SessionCreationResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create sessions");
    };

    if (courts == 0) {
      Runtime.trap("Number of courts must be greater than 0");
    };

    let sessionId = Time.now().toText();
    let config : SessionConfig = {
      sessionId;
      host = caller;
      courts;
      creationTime = Time.now();
      date;
      time;
      venue;
      duration;
      sessionCode;
      sessionType;
      isRanked;
    };

    let initialState : SessionState = {
      config;
      players = [caller];
      currentRound = 1;
      assignments = [];
      waitlist = [];
      matches = [];
      allGamesAssignments = [];
      previousWaitlist = [];
      isCompleted = false;
    };

    sessions.add(sessionId, initialState);

    {
      sessionId;
      config;
      state = initialState;
    };
  };

  public query ({ caller }) func getSessionStateByCode(
    sessionCode : Text,
  ) : async SessionState {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view session state");
    };

    switch (findSessionByCode(sessionCode)) {
      case (null) { Runtime.trap("Session does not exist") };
      case (?state) { state };
    };
  };

  public shared ({ caller }) func joinSessionByCode(sessionCode : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join sessions");
    };

    let state = switch (findSessionByCode(sessionCode)) {
      case (null) { Runtime.trap("Session does not exist") };
      case (?s) { s };
    };

    let newPlayers = state.players.concat([caller]);
    let newState = {
      state with players = newPlayers;
    };
    sessions.add(state.config.sessionId, newState);
  };

  func findSessionByCode(sessionCode : Text) : ?SessionState {
    switch (sessions.values().toArray().find(func(s) { s.config.sessionCode == sessionCode })) {
      case (null) { null };
      case (?state) { ?state };
    };
  };

  public shared ({ caller }) func joinSession(sessionId : SessionId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join sessions");
    };

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

  public shared ({ caller }) func addPlayerToSession(
    sessionId : SessionId,
    playerName : Text,
    mobileNumber : Text,
    bio : ?Text,
    profilePicture : ?Text,
    workField : ?Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add players to sessions");
    };

    let session = switch (sessions.get(sessionId)) {
      case (null) { Runtime.trap("Session does not exist") };
      case (?s) { s };
    };

    if (caller != session.config.host) {
      Runtime.trap("Only the session host can add players");
    };

    let initialRating : PlayerRating = {
      mu = 1500.0;
      sigma = 350.0;
      rating = 1500.0 - 2.0 * 350.0;
    };

    let newProfile : PlayerProfile = {
      id = caller;
      name = playerName;
      rating = initialRating;
      winLossRecord = null;
      mobileNumber;
      bio;
      profilePicture;
      workField;
    };

    profiles.add(caller, newProfile);

    let updatedPlayers = session.players.concat([caller]);
    let updatedSession = {
      session with players = updatedPlayers;
    };
    sessions.add(sessionId, updatedSession);
  };

  public query ({ caller }) func getSessionState(sessionId : SessionId) : async SessionState {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view session state");
    };
    switch (sessions.get(sessionId)) {
      case (null) { Runtime.trap("Session does not exist") };
      case (?state) { state };
    };
  };

  public query ({ caller }) func getSessionGameInfo(sessionId : SessionId) : async (Text, ?Text, ?Text, ?Text, ?Nat) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view session game info");
    };
    switch (sessions.get(sessionId)) {
      case (null) { Runtime.trap("Session does not exist") };
      case (?state) {
        (
          state.config.sessionCode,
          state.config.date,
          state.config.time,
          state.config.venue,
          state.config.duration,
        );
      };
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

  func generateRoundAssignments(
    totalPlayers : [PlayerId],
    previousWaitlist : [PlayerId],
    courts : Nat,
    round : Nat,
  ) : RoundAssignments {
    if (totalPlayers.size() <= 1) {
      return {
        round;
        assignments = [];
        waitlist = [];
      };
    };

    let shuffledPlayers = shuffleArray(totalPlayers);

    let prioritizedPlayers = previousWaitlist.concat(
      shuffledPlayers.filter(
        func(p) {
          not previousWaitlist.any(func(w) { w == p });
        }
      )
    );

    let assignments = List.empty<CourtAssignment>();
    var waitlist = prioritizedPlayers;

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

  func generateAllGamesAssignmentsHelper(
    players : [PlayerId],
    courts : Nat,
    maxRounds : Nat,
    rotations : Nat,
  ) : [AllGamesRoundAssignments] {
    Array.tabulate(
      rotations,
      func(rotation) {
        let roundAssignments = Array.tabulate(
          maxRounds,
          func(round) {
            if (round == 0) {
              generateRoundAssignments(players, [], courts, round + 1);
            } else {
              generateRoundAssignments(players, [], courts, round + 1);
            };
          },
        );
        {
          round = rotation + 1;
          roundAssignments;
        };
      },
    );
  };

  public query ({ caller }) func getAllGames(
    sessionId : SessionId,
    rotations : Nat,
    roundsPerRotation : Nat,
  ) : async [AllGamesRoundAssignments] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view all games");
    };

    let state = switch (sessions.get(sessionId)) {
      case (null) { Runtime.trap("Session does not exist") };
      case (?s) { s };
    };

    if (rotations == 0 or roundsPerRotation == 0) {
      Runtime.trap("Rotations and rounds per rotation must be greater than 0");
    };

    generateAllGamesAssignmentsHelper(state.players, state.config.courts, roundsPerRotation, rotations);
  };

  public shared ({ caller }) func allocatePlayers(sessionId : SessionId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can allocate players");
    };

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
      state.previousWaitlist,
      state.config.courts,
      state.currentRound,
    );

    let newState = {
      state with
      assignments = roundAssignments.assignments;
      waitlist = roundAssignments.waitlist;
      currentRound = state.currentRound + 1;
      previousWaitlist = roundAssignments.waitlist;
    };

    sessions.add(sessionId, newState);
  };

  public shared ({ caller }) func submitMatchResult(
    sessionId : SessionId,
    court : Court,
    outcome : GameOutcome,
  ) : async MatchId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit match results");
    };

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

  public shared ({ caller }) func endRound(sessionId : SessionId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can end rounds");
    };

    let session = switch (sessions.get(sessionId)) {
      case (null) { Runtime.trap("Session does not exist") };
      case (?s) { s };
    };

    if (caller != session.config.host) {
      Runtime.trap("Only the session host can end the round");
    };

    let roundAssignments = generateRoundAssignments(
      session.players,
      session.previousWaitlist,
      session.config.courts,
      session.currentRound,
    );

    let newState = {
      session with
      assignments = [];
      waitlist = [];
      currentRound = session.currentRound + 1;
      previousWaitlist = roundAssignments.waitlist;
    };

    sessions.add(sessionId, newState);
  };

  public shared ({ caller }) func endGame(sessionId : SessionId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can end games");
    };

    let session = switch (sessions.get(sessionId)) {
      case (null) { Runtime.trap("Session does not exist") };
      case (?s) { s };
    };

    if (caller != session.config.host) {
      Runtime.trap("Only the session host can end the game");
    };

    let newState = {
      session with isCompleted = true;
    };

    sessions.add(sessionId, newState);
  };
};
