# Security Specification for Selling: Our Diary

## 1. Data Invariants
- A diary entry must have a valid author ('Chirag' or 'Sneha').
- A diary entry must have a non-empty text (max 5000 characters).
- `createdAt` must be a server timestamp and immutable once set.
- Only authenticated users with whitelisted emails can read or write entries.

## 2. The "Dirty Dozen" Payloads
1. **Invalid Author**: `{"author": "Unknown", "text": "Hello"}`
2. **Missing Text**: `{"author": "Chirag", "text": ""}`
3. **Giant Text**: `{"author": "Chirag", "text": "A".repeat(10001)}`
4. **Invalid Mood Type**: `{"author": "Chirag", "text": "Hi", "mood": 123}`
5. **Spoofed Timestamp**: `{"author": "Chirag", "text": "Hi", "createdAt": "2020-01-01T00:00:00Z"}`
6. **Giant Stickers Array**: `{"author": "Chirag", "text": "Hi", "stickers": ["s"] * 101}`
7. **Giant Image URLs Array**: `{"author": "Chirag", "text": "Hi", "imageUrls": ["url"] * 11}`
8. **Unauthorized User Write**: Write as a user whose email is not whitelisted.
9. **Unauthorized User Read**: Read from the collection as a user whose email is not whitelisted.
10. **Malicious ID**: Attempt to create a document with ID `../../secrets`.
11. **Update Immutable Field**: User attempts to change `createdAt` on an existing entry.
12. **Update Forbidden Field**: User attempts to change `author` on an existing entry.

## 3. The Test Runner
I will verify these in the rules themselves using a robust validation helper.
