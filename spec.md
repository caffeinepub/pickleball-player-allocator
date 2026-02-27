# Specification

## Summary
**Goal:** Allow hosts to manually add registered players to a session directly from the host dashboard, for all game types.

**Planned changes:**
- Add a `hostAddPlayer` backend function in `main.mo` that lets the session host add a registered player by principal ID, with validation (host-only, duplicate guard, all game types supported)
- Add a `searchPlayers` backend function in `main.mo` that searches registered players by partial, case-insensitive name and excludes players already in the session
- Add `useHostAddPlayer` mutation hook and `useSearchPlayers` query hook to `useQueries.ts` following existing patterns
- Add an "Add Player Manually" section in `HostSessionDashboard.tsx` with a name search input, list of matching results (name + rating + Add button), and inline success/error feedback, visible for all game types

**User-visible outcome:** Hosts can search for registered players by name from the host dashboard and add them directly to any session without requiring the player to use a join code.
