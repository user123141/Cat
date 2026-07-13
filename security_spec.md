# Security Specifications & Data Invariants

## 1. Data Invariants
- **Owner-Exclusive Writes**: A user's profile can only be created or modified by the authenticated user whose `request.auth.uid` matches the `{userId}` document key.
- **Paws Integrity**: The user cannot change another user's balance.
- **Strict Keys**: No phantom fields or privilege-escalating fields like `isAdmin` can be written by a standard client.
- **Immortal Fields**: Fields like `createdAt` cannot be changed after creation.

## 2. The Dirty Dozen Payloads (Rejection Scenarios)
1. **Malicious Override**: Setting `{userId}` to an admin's uid while signed in as a basic user.
2. **Infinite Paws**: Updating the `paws` field with an arbitrary large positive value without doing a valid action.
3. **Immutability Breach**: Attempting to alter `createdAt` on update.
4. **Self-Admin Grant**: Injecting `isAdmin: true` into the user profile payload.
5. **ID Poisoning**: Submitting a document ID of 1000 characters.
6. **PiI Access Leak**: Attempting to read another user's profile when not signed in as that user or admin.
7. **Invalid Type Injection**: Sending `paws: "one million"` (a string instead of integer).
8. **Negative Consumables**: Setting `foodCount: -15` to trigger underflow issues.
9. **Status State-Skipping**: Directly setting cat's status to a disallowed value.
10. **Quests Completion Cheat**: Setting `quests[i].completed: true` directly without raising progress.
11. **Spoofed User Registration**: Logging in as anonymous but writing a fake email.
12. **Untrusted Server Timestamps**: Providing a client-side timestamp for `updatedAt`.

## 3. Test Assertion (Mathematical Rejection)
All above operations will result in `PERMISSION_DENIED` thanks to:
```javascript
allow create, update: if request.auth.uid == userId && isValidUser(incoming());
```
