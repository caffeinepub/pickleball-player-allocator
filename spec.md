# Specification

## Summary
**Goal:** Fix the bug causing session creation to fail with the "Failed to create a session" error in the Pickleball Allocator app.

**Planned changes:**
- Trace and fix the session creation flow from the CreateSession page through the backend `createSession` call
- Ensure a valid session is created and persisted in the backend upon form submission
- Store session code and metadata in local storage after successful creation
- Navigate the host to the HostSessionDashboard upon success
- Handle both authenticated (Internet Identity) and guest (anonymous) user cases
- Properly catch and surface backend Motoko errors and frontend actor invocation errors with meaningful messages

**User-visible outcome:** Submitting the session creation form with a valid court count successfully creates a session, stores the session code, and navigates the host to the HostSessionDashboard without displaying an error.
