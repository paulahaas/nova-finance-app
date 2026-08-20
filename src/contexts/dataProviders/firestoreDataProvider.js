// Real data provider, backed by Firestore subcollections under
// users/{uid}/... (banks, accounts, cards, transactions, goals,
// subscriptions) — see firestore.rules for the access-control rules that
// keep each user scoped to their own documents (section 40/42 of the
// product spec). Unlike the demo/local provider, a brand-new account
// starts empty — no seeded Nubank/Banco do Brasil placeholders — because
// this is the real, production data path.

import { useEffect, useMemo, useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { buildDemoCategories } from '../../data/demoData';
import {
  availableMoney,
  dailyBudget,
  daysUntilNextSalary,
  monthExpenses,
  monthIncome,
} from '../../services/financeService';

function useUserCollection(uid, name) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!uid || !db) {
      setItems([]);
      return undefined;
    }
    const ref = collection(db, 'users', uid, name);
    return onSnapshot(ref, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [uid, name]);

  function add(data) {
    if (!uid || !db) return Promise.resolve();
    return addDoc(collection(db, 'users', uid, name), { ...data, createdAt: serverTimestamp() });
  }

  function update(id, patch) {
    if (!uid || !db) return Promise.resolve();
    return updateDoc(doc(db, 'users', uid, name, id), patch);
  }

  function remove(id) {
    if (!uid || !db) return Promise.resolve();
    return deleteDoc(doc(db, 'users', uid, name, id));
  }

  return [items, add, update, remove];
}

export function useFirestoreDataProvider(uid, user) {
  const [banks, addBankDoc] = useUserCollection(uid, 'banks');
  const [accounts, addAccountDoc] = useUserCollection(uid, 'accounts');
  const [cards, addCardDoc] = useUserCollection(uid, 'cards');
  const [transactions, addTransactionDoc] = useUserCollection(uid, 'transactions');
  const [goals, addGoalDoc, updateGoalDoc] = useUserCollection(uid, 'goals');
  const [subscriptions, addSubscriptionDoc, , removeSubscriptionDoc] = useUserCollection(uid, 'subscriptions');
  const [userCategoryRules] = useUserCollection(uid, 'userCategoryRules');
  const [importBatches] = useUserCollection(uid, 'importBatches');
  const [recurringPatterns, , updateRecurringPatternDoc] = useUserCollection(uid, 'recurringPatterns');

  const categories = useMemo(() => buildDemoCategories(), []);
  const alerts = []; // real alert generation is a future backend job — see README roadmap
  const achievements = []; // same for gamification — no engine wired up yet

  function addBank(bank) {
    return addBankDoc(bank);
  }
  function addAccount(account) {
    return addAccountDoc(account);
  }
  function addCard(card) {
    return addCardDoc({ used: 0, currentInvoice: 0, nextInvoice: 0, ...card });
  }
  function addTransaction(tx) {
    return addTransactionDoc({ date: new Date().toISOString(), ...tx });
  }
  function addGoal(goal) {
    return addGoalDoc({ saved: 0, ...goal });
  }
  function contributeToGoal(goalId, amount) {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return Promise.resolve();
    return updateGoalDoc(goalId, { saved: goal.saved + amount });
  }
  function addSubscription(sub) {
    return addSubscriptionDoc(sub);
  }
  function removeSubscription(id) {
    return removeSubscriptionDoc(id);
  }

  // A detected recurring pattern only becomes a real subscription once the
  // user explicitly accepts it — mirrors the app's general "preview, never
  // auto-commit" rule for anything derived from statement import.
  function acceptRecurringPattern(patternId) {
    const pattern = recurringPatterns.find((p) => p.id === patternId);
    if (!pattern) return Promise.resolve();
    return addSubscriptionDoc({
      name: pattern.description,
      amount: pattern.avgAmount,
      cycle: pattern.frequency === 'yearly' ? 'yearly' : 'monthly',
      category: pattern.category,
    }).then(() => updateRecurringPatternDoc(patternId, { status: 'accepted' }));
  }
  function dismissRecurringPattern(patternId) {
    return updateRecurringPatternDoc(patternId, { status: 'dismissed' });
  }

  const computed = useMemo(() => {
    const available = availableMoney({ accounts, cards, subscriptions, goals });
    const payDay = user?.payDay ?? 5;
    return {
      available,
      daily: dailyBudget(available, payDay),
      daysToSalary: daysUntilNextSalary(payDay),
      monthExpenses: monthExpenses(transactions),
      monthIncome: monthIncome(transactions) || user?.income || 0,
      totalBalance: accounts.reduce((s, a) => s + a.balance, 0),
    };
  }, [accounts, cards, subscriptions, goals, transactions, user]);

  return {
    banks,
    accounts,
    cards,
    categories,
    transactions,
    goals,
    subscriptions,
    userCategoryRules,
    importBatches,
    recurringPatterns,
    alerts,
    achievements,
    computed,
    addBank,
    addAccount,
    addCard,
    addTransaction,
    addGoal,
    contributeToGoal,
    addSubscription,
    removeSubscription,
    acceptRecurringPattern,
    dismissRecurringPattern,
    setCategories: () => {}, // categories aren't user-editable yet (section 19: "futuramente")
  };
}
