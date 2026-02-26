/**
 * Client-side fair round-robin scheduler for pickleball sessions.
 *
 * Since the backend uses the host's principal for all added players (making
 * all principals identical), we work with player indices (0, 1, 2, ...) and
 * map them to names via playerNamesList. This ensures proper rotation.
 */

export interface ScheduledCourtAssignment {
  court: number;
  playerIndices: number[]; // indices into playerNamesList
}

export interface ScheduledRound {
  round: number;
  assignments: ScheduledCourtAssignment[];
  waitlistIndices: number[]; // indices into playerNamesList
}

/**
 * Generate a fair round-robin schedule for all players.
 *
 * Algorithm:
 * - Maintain a rotation queue of player indices
 * - Each round: take the first (courts * 4) players for courts, rest go to waitlist
 * - Next round: waitlist players go to the FRONT of the queue (priority),
 *   players who played go to the BACK
 * - This ensures every player gets equal playing time over multiple rounds
 *
 * @param totalPlayers - total number of players
 * @param courts - number of courts available
 * @param totalRounds - how many rounds to generate
 */
export function generateFairSchedule(
  totalPlayers: number,
  courts: number,
  totalRounds: number
): ScheduledRound[] {
  if (totalPlayers < 2 || courts < 1 || totalRounds < 1) return [];

  const playersPerCourt = 4;
  const maxPlayersOnCourt = courts * playersPerCourt;

  // Start with players in order 0..N-1
  // We'll rotate this queue each round
  let queue: number[] = Array.from({ length: totalPlayers }, (_, i) => i);

  const rounds: ScheduledRound[] = [];

  for (let roundIdx = 0; roundIdx < totalRounds; roundIdx++) {
    const assignments: ScheduledCourtAssignment[] = [];
    const playing: number[] = [];
    const waitlist: number[] = [];

    // Assign players to courts in groups of 4
    let remaining = [...queue];
    for (let c = 1; c <= courts; c++) {
      if (remaining.length >= playersPerCourt) {
        const courtPlayers = remaining.splice(0, playersPerCourt);
        assignments.push({ court: c, playerIndices: courtPlayers });
        playing.push(...courtPlayers);
      } else if (remaining.length > 0) {
        // Not enough for a full court — put them on waitlist
        waitlist.push(...remaining);
        remaining = [];
        break;
      }
    }
    // Any leftover players go to waitlist
    waitlist.push(...remaining);

    rounds.push({
      round: roundIdx + 1,
      assignments,
      waitlistIndices: waitlist,
    });

    // Build next round's queue:
    // Waitlist players get priority (front), then players who played (back)
    // Within each group, rotate by 1 to vary matchups
    const nextWaitlistGroup = [...waitlist];
    const nextPlayingGroup = [...playing];

    // Rotate the playing group by 1 position to vary court assignments
    if (nextPlayingGroup.length > 1) {
      const rotateBy = (roundIdx + 1) % nextPlayingGroup.length;
      queue = [
        ...nextWaitlistGroup,
        ...nextPlayingGroup.slice(rotateBy),
        ...nextPlayingGroup.slice(0, rotateBy),
      ];
    } else {
      queue = [...nextWaitlistGroup, ...nextPlayingGroup];
    }
  }

  return rounds;
}

/**
 * Resolve player indices to names using the playerNamesList.
 */
export function resolvePlayerNames(
  indices: number[],
  playerNamesList: string[]
): string[] {
  return indices.map(
    (i) => playerNamesList[i] || (i === 0 ? 'Host' : `Player ${i + 1}`)
  );
}
