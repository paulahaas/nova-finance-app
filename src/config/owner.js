// NOVA is a single-user app. This is the Firebase Auth UID of its only
// user — the server rejects any other user's token (server/middleware/auth.js)
// and firestore.rules hardcodes the same value. Not a secret: knowing a UID
// grants nothing without that account's password.
export const OWNER_UID = 'cBGW1AYLG8X1eGD1mBAdWILUnnI2';
