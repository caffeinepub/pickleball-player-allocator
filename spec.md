# Specification

## Summary
**Goal:** Investigate and fix the session hosting flow so users can successfully create and host a pickleball session end-to-end.

**Planned changes:**
- Debug and fix the SessionConfigForm submission (court count selection) to correctly trigger the backend session creation call.
- Ensure the backend `createSession` (or equivalent) function is called properly and returns a session code.
- Display the session code via `SessionCodeDisplay` and navigate the user to `HostSessionDashboard` on success.
- Add error handling so any backend failures surface a descriptive toast or error message instead of silently failing.
- Eliminate unhandled promise rejections or console errors during the hosting flow.
- Ensure the fix works for both authenticated (Internet Identity) and guest users where applicable.

**User-visible outcome:** Users can open the Create Session page, select a court count, submit the form, and successfully land on the Host Session Dashboard with their session code — or see a clear error message if something goes wrong.
