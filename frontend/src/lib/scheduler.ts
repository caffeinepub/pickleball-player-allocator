import { SessionType } from '../backend';

export interface RoundAssignment {
  court: number;
  teamA: string[];
  teamB: string[];
}

export interface Round {
  round: number;
  assignments: RoundAssignment[];
  waitlist: string[];
}

export interface MatchScore {
  court: number;
  teamAScore: number;
  teamBScore: number;
  teamA: string[];
  teamB: string[];
}

/**
 * Generate all rounds for a session.
 * For ladder league and king/queen, scores from previous rounds influence next round matchups.
 */
export function generateRounds(
  players: string[],
  courts: number,
  totalRounds: number,
  sessionType: SessionType,
  completedScores: MatchScore[][] = []
): Round[] {
  if (players.length < 2) return [];

  const rounds: Round[] = [];
  let currentPlayers = [...players];

  for (let r = 0; r < totalRounds; r++) {
    const previousScores = completedScores[r - 1] || [];

    if (r > 0 && previousScores.length > 0) {
      if (sessionType === SessionType.ladderLeague) {
        currentPlayers = reorderForLadderLeague(currentPlayers, previousScores);
      } else if (sessionType === SessionType.kingQueenOfTheCourt) {
        currentPlayers = reorderForKingQueen(currentPlayers, previousScores, courts);
      }
    }

    const previousWaitlist = r > 0 ? rounds[r - 1].waitlist : [];
    const round = generateSingleRound(currentPlayers, courts, r + 1, previousWaitlist);
    rounds.push(round);
  }

  return rounds;
}

function generateSingleRound(
  players: string[],
  courts: number,
  roundNumber: number,
  previousWaitlist: string[]
): Round {
  // Prioritize players who were on the waitlist last round
  const prioritized = [
    ...previousWaitlist,
    ...players.filter((p) => !previousWaitlist.includes(p)),
  ];

  const assignments: RoundAssignment[] = [];
  let remaining = [...prioritized];

  for (let c = 1; c <= courts; c++) {
    if (remaining.length >= 4) {
      const courtPlayers = remaining.splice(0, 4);
      assignments.push({
        court: c,
        teamA: [courtPlayers[0], courtPlayers[1]],
        teamB: [courtPlayers[2], courtPlayers[3]],
      });
    } else if (remaining.length >= 2) {
      const courtPlayers = remaining.splice(0, remaining.length);
      const mid = Math.floor(courtPlayers.length / 2);
      assignments.push({
        court: c,
        teamA: courtPlayers.slice(0, mid),
        teamB: courtPlayers.slice(mid),
      });
    } else {
      break;
    }
  }

  return {
    round: roundNumber,
    assignments,
    waitlist: remaining,
  };
}

/**
 * Ladder League: winners move up, losers move down.
 * Sort players by wins (descending) so top players face each other.
 */
function reorderForLadderLeague(players: string[], scores: MatchScore[]): string[] {
  const wins: Record<string, number> = {};
  players.forEach((p) => (wins[p] = 0));

  scores.forEach((score) => {
    const winners = score.teamAScore > score.teamBScore ? score.teamA : score.teamB;
    winners.forEach((p) => {
      wins[p] = (wins[p] || 0) + 1;
    });
  });

  return [...players].sort((a, b) => (wins[b] || 0) - (wins[a] || 0));
}

/**
 * King/Queen of the Court: winners advance to higher courts, losers rotate down.
 */
function reorderForKingQueen(
  players: string[],
  scores: MatchScore[],
  courts: number
): string[] {
  // Build court order: court 1 is the "king" court (highest)
  const courtOrder: string[][] = Array.from({ length: courts }, () => []);

  scores.forEach((score) => {
    const courtIdx = score.court - 1;
    if (courtIdx >= 0 && courtIdx < courts) {
      const winners = score.teamAScore > score.teamBScore ? score.teamA : score.teamB;
      const losers = score.teamAScore > score.teamBScore ? score.teamB : score.teamA;

      // Winners stay or move up (lower court index = higher court)
      const winnerCourt = Math.max(0, courtIdx - 1);
      // Losers move down
      const loserCourt = Math.min(courts - 1, courtIdx + 1);

      courtOrder[winnerCourt].push(...winners);
      courtOrder[loserCourt].push(...losers);
    }
  });

  // Players not in any court assignment stay in their current position
  const assignedPlayers = new Set(courtOrder.flat());
  const unassigned = players.filter((p) => !assignedPlayers.has(p));

  return [...courtOrder.flat(), ...unassigned];
}

/**
 * Calculate player rankings based on match scores.
 * Returns players sorted by win rate (descending).
 */
export function calculateRankings(
  players: string[],
  allScores: MatchScore[][]
): { playerId: string; wins: number; losses: number; winRate: number }[] {
  const stats: Record<string, { wins: number; losses: number }> = {};
  players.forEach((p) => (stats[p] = { wins: 0, losses: 0 }));

  allScores.forEach((roundScores) => {
    roundScores.forEach((score) => {
      const winners = score.teamAScore > score.teamBScore ? score.teamA : score.teamB;
      const losers = score.teamAScore > score.teamBScore ? score.teamB : score.teamA;
      winners.forEach((p) => {
        if (stats[p]) stats[p].wins++;
      });
      losers.forEach((p) => {
        if (stats[p]) stats[p].losses++;
      });
    });
  });

  return players
    .map((p) => {
      const { wins, losses } = stats[p] || { wins: 0, losses: 0 };
      const total = wins + losses;
      return { playerId: p, wins, losses, winRate: total > 0 ? wins / total : 0 };
    })
    .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);
}
