# Specification

## Summary
**Goal:** Fix the manual add player feature on the Host Session Dashboard so hosts can successfully add both guest players (name only) and registered players to an active session.

**Planned changes:**
- Fix the guest player (name-only) manual add flow on the Host Session Dashboard so it submits without errors and immediately displays the added player with Ghost icon and amber styling.
- Fix the registered player search-and-add flow on the Host Session Dashboard so it correctly associates the player's principal with the session and shows them in the player list immediately.
- Ensure no error toasts or console errors appear during either add operation.

**User-visible outcome:** Hosts can successfully add both guest and registered players from the Host Session Dashboard without errors, with added players appearing in the session list immediately.
