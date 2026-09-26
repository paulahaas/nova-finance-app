// Every subcollection under users/{uid}. Used to wipe an account's data
// (the client SDK can't list subcollections) — add new collections here.
export const USER_COLLECTIONS = [
  'banks',
  'accounts',
  'cards',
  'transactions',
  'goals',
  'subscriptions',
  'userCategoryRules',
  'importBatches',
  'recurringPatterns',
];
