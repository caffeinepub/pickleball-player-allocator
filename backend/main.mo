import Array "mo:core/Array";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  type PlayerId = Principal;
  type GuestId = Nat;
  type MatchId = Nat;
  type SessionId = Text;
  type GameCode = Text;
  type Court = Nat;

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

  public type GuestPlayer = {
    guestId : GuestId;
    name : Text;
    isGuest : Bool;
  };

  public type PublicProfile = {
    id : Principal;
    name : Text;
    bio : ?Text;
    profilePicture : ?Text;
    workField : ?Text;
    winLossRecord : ?(Nat, Nat);
    winRate : ?Float;
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
    guestPlayers : [GuestPlayer];
    lastGuestId : GuestId;
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

  public type CompletedMatch = {
    sessionId : SessionId;
    opponentNames : [Text];
    court : Court;
    teamScores : (Nat, Nat);
    outcome : GameOutcome;
    date : Time.Time;
  };

  public type Message = {
    sender : Principal;
    recipient : Principal;
    text : Text;
    timestamp : Time.Time;
  };

  public type Conversation = {
    participant : Principal;
    messages : [Message];
  };

  public type MatchHistory = {
    matches : [CompletedMatch];
  };

  public type MatchHistoryStorage = {
    completedMatches : [CompletedMatch];
  };

  public type SessionNotFound = {
    message : Text;
    reason : ?Text;
  };

  // New type to include mobile number in search results
  public type PlayerSearchResult = {
    id : Principal;
    name : Text;
    mobileNumber : Text;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let sessions = Map.empty<SessionId, SessionState>();
  let profiles = Map.empty<PlayerId, PlayerProfile>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let directMessages = Map.empty<Principal, List.List<Message>>();
  let matchHistories = Map.empty<Principal, MatchHistoryStorage>();

  // Returns the calling user's own full profile (including mobile number).
  // Requires #user role.
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  // Returns the full profile (including mobile number) for a given user.
  // Only the owner (self) may call this.
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Returns the full profile (including mobile number) for a given user.
  // Admin-only: called by admins to fetch other users' profiles.
  public query ({ caller }) func getUserProfileAdmin(_user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(_user);
  };

  // Saves the calling user's profile. Requires #user role.
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

  // Guest profile creation — callable by anyone (anonymous principals).
  // No auth guard needed.
  public shared ({ caller }) func createGuestProfile(
    name : Text,
    mobileNumber : Text,
    bio : ?Text,
    profilePicture : ?Text,
    workField : ?Text,
  ) : async PublicProfile {
    let initialRating : PlayerRating = {
      mu = 1500.0;
      sigma = 350.0;
      rating = 1500.0 - 2.0 * 350.0;
    };

    let newProfile : PlayerProfile = {
      id = caller;
      name;
      rating = initialRating;
      winLossRecord = null;
      mobileNumber;
      bio;
      profilePicture;
      workField;
    };

    profiles.add(caller, newProfile);

    // Also persist to userProfiles so the profile is available via getCallerUserProfile
    // after the guest upgrades to a full user.
    let up : UserProfile = {
      name;
      mobileNumber;
      bio;
      profilePicture;
      workField;
    };
    userProfiles.add(caller, up);

    {
      id = caller;
      name;
      bio;
      profilePicture;
      workField;
      winLossRecord = null;
      winRate = null;
    };
  };

  // Returns the public profile of any player.
  // Mobile number and numerical rating are intentionally excluded.
  // Requires #user role — only logged-in players may view other players' public profiles.
  public query ({ caller }) func getPublicProfile(requested : Principal) : async ?PublicProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only logged-in users can view player profiles");
    };
    switch (profiles.get(requested)) {
      case (null) { null };
      case (?profile) {
        let winLoss = profile.winLossRecord;
        let winRate = switch (winLoss) {
          case (null) { null };
          case (?(wins, losses)) {
            let total = wins + losses;
            if (total == 0) { null } else {
              ?(wins.toInt().toFloat() / total.toInt().toFloat() * 100.0);
            };
          };
        };

        ?{
          id = profile.id;
          name = profile.name;
          bio = profile.bio;
          profilePicture = profile.profilePicture;
          workField = profile.workField;
          winLossRecord = profile.winLossRecord;
          winRate;
        };
      };
    };
  };

  // Returns the match history for the calling user only.
  // Requires #user role.
  public query ({ caller }) func getMatchHistory() : async MatchHistory {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view match history");
    };
    switch (matchHistories.get(caller)) {
      case (null) { { matches = [] } };
      case (?history) { { matches = history.completedMatches } };
    };
  };

  // Retrieve match history for any player.
  public query ({ caller }) func getMatchHistoryForPlayer(_requested : Principal) : async MatchHistory {
    switch (matchHistories.get(_requested)) {
      case (null) { { matches = [] } };
      case (?history) { { matches = history.completedMatches } };
    };
  };

  // Send a direct message to another user. Requires #user role.
  public shared ({ caller }) func sendMessage(recipient : Principal, text : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    let message : Message = {
      sender = caller;
      recipient;
      text;
      timestamp = Time.now();
    };

    // Store under recipient's inbox
    let recipientMessages = switch (directMessages.get(recipient)) {
      case (null) { List.empty<Message>() };
      case (?msgs) { msgs };
    };
    recipientMessages.add(message);
    directMessages.add(recipient, recipientMessages);

    // Also store under sender's outbox so getConversation works symmetrically
    let senderMessages = switch (directMessages.get(caller)) {
      case (null) { List.empty<Message>() };
      case (?msgs) { msgs };
    };
    senderMessages.add(message);
    directMessages.add(caller, senderMessages);
  };

  // Retrieve the conversation thread between the caller and another user.
  // Requires #user role. Only the caller can read their own conversations.
  public query ({ caller }) func getConversation(otherPrincipal : Principal) : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can read conversations");
    };

    // Collect all messages stored under the caller that involve the other participant
    let callerMessages = switch (directMessages.get(caller)) {
      case (null) { [] };
      case (?msgs) {
        msgs.toArray().filter(
          func(m : Message) : Bool {
            (m.sender == caller and m.recipient == otherPrincipal) or
            (m.sender == otherPrincipal and m.sender == caller)
          }
        );
      };
    };

    callerMessages;
  };

  // Returns all conversations for the calling user.
  // Requires #user role.
  public query ({ caller }) func getMailbox() : async [Conversation] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access their mailbox");
    };

    // Gather all messages that belong to the caller
    let allCallerMessages = switch (directMessages.get(caller)) {
      case (null) { [] };
      case (?msgs) { msgs.toArray() };
    };

    // Group by the other participant
    let participantMap = Map.empty<Principal, List.List<Message>>();

    for (msg in allCallerMessages.vals()) {
      let other = if (msg.sender == caller) { msg.recipient } else { msg.sender };
      let existing = switch (participantMap.get(other)) {
        case (null) { List.empty<Message>() };
        case (?lst) { lst };
      };
      existing.add(msg);
      participantMap.add(other, existing);
    };

    let conversations = List.empty<Conversation>();
    for ((participant, msgs) in participantMap.entries()) {
      conversations.add({
        participant;
        messages = msgs.toArray();
      });
    };

    conversations.toArray();
  };

  // ============================= Game session logic =============================

  // Anyone (authenticated or anonymous) can create/host a session — no auth guard needed.
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
      guestPlayers = [];
      lastGuestId = 0;
    };

    sessions.add(sessionId, initialState);

    {
      sessionId;
      config;
      state = initialState;
    };
  };

  func findSessionByCode(sessionCode : Text) : ?SessionState {
    switch (sessions.values().toArray().find(func(s : SessionState) : Bool { s.config.sessionCode == sessionCode })) {
      case (null) { null };
      case (?state) { ?state };
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

    // Prioritize previous waitlist at the front
    let prioritizedPlayers = previousWaitlist.concat(
      shuffledPlayers.filter(
        func(p : PlayerId) : Bool {
          not previousWaitlist.any(func(w : PlayerId) : Bool { w == p });
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
      func(rotation : Nat) : AllGamesRoundAssignments {
        let roundAssignments = Array.tabulate(
          maxRounds,
          func(round : Nat) : RoundAssignments {
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

  // Main function to retrieve the session state by ID
  public query func getSession(sessionId : SessionId) : async {
    #ok : SessionState;
    #err : SessionNotFound;
  } {
    switch (sessions.get(sessionId)) {
      case (?sessionState) {
        #ok(sessionState);
      };
      case (null) {
        #err({
          message = "Session not found";
          reason = ?"No session exists for the given session id";
        });
      };
    };
  };

  public shared ({ caller }) func joinSession(gameCode : GameCode, guestName : Text) : async {
    #ok : SessionId;
    #err : Text;
  } {
    let trimmedCode = gameCode.trim(#char ' ');

    switch (findSessionByCode(trimmedCode)) {
      case (?sessionState) {
        let usedName = if (guestName.isEmpty()) {
          "Guest " # Time.now().toText();
        } else { guestName };

        let newGuest = {
          guestId = sessionState.guestPlayers.size() + 1;
          name = usedName;
          isGuest = true;
        };

        let updatedState = {
          sessionState with guestPlayers = sessionState.guestPlayers.concat([newGuest]);
        };

        sessions.add(sessionState.config.sessionId, updatedState);
        return #ok(sessionState.config.sessionId);
      };
      case (null) {
        return #err("Session with code {" # trimmedCode # "} does not exist");
      };
    };
  };

  // Allows the host of a session to manually add a registered player (by principal ID)
  // to the session's player list, bypassing the normal join-via-code flow.
  // Requires #user role (the host must be a registered user) and host ownership check.
  public shared ({ caller }) func addPlayerToSession(sessionId : SessionId, playerId : Principal) : async {
    #ok : SessionState;
    #err : Text;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can add players to a session");
    };
    switch (sessions.get(sessionId)) {
      case (?currentState) {
        if (currentState.config.host != caller) {
          #err("Only the session host can add players");
        } else {
          if (currentState.players.any(func(p) { p == playerId })) {
            #ok(currentState);
          } else {
            let updatedPlayers = if (currentState.players.size() == 0) {
              [playerId];
            } else {
              currentState.players.concat([playerId]);
            };
            let updatedState = { currentState with players = updatedPlayers };
            sessions.add(sessionId, updatedState);
            #ok(updatedState);
          };
        };
      };
      case (null) { #err("Session does not exist") };
    };
  };

  // Allows the host to add a guest (non-registered) player to a session by name.
  // Requires #user role (the host must be a registered user) and host ownership check.
  public shared ({ caller }) func addGuestPlayer(sessionId : Text, name : Text) : async {
    #ok : GuestPlayer;
    #err : Text;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can add guest players to a session");
    };
    switch (sessions.get(sessionId)) {
      case (?currentState) {
        if (currentState.config.host != caller) {
          #err("Only the session host can add guest players");
        } else {
          let newGuestId = currentState.guestPlayers.size() + 1;
          let guestPlayer : GuestPlayer = {
            guestId = newGuestId;
            name;
            isGuest = true;
          };
          let updatedGuestList = currentState.guestPlayers.concat([guestPlayer]);
          let updatedState = { currentState with guestPlayers = updatedGuestList };
          sessions.add(sessionId, updatedState);
          #ok(guestPlayer);
        };
      };
      case (null) { #err("Session does not exist") };
    };
  };

  // Search for registered players by name or partial name.
  // Returns a list of matching player profiles including mobile number.
  // Requires #user role — only registered users (e.g. session hosts) may search for players.
  public query ({ caller }) func searchPlayersByName(searchTerm : Text) : async [PlayerSearchResult] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform name searches");
    };
    let lowerSearch = searchTerm.toLower();
    profiles.values().toArray().filter(
      func(p : PlayerProfile) : Bool {
        p.name.toLower().contains(#text lowerSearch);
      }
    ).map(
      func(p : PlayerProfile) : PlayerSearchResult {
        {
          id = p.id;
          name = p.name;
          mobileNumber = p.mobileNumber;
        };
      }
    );
  };
};
