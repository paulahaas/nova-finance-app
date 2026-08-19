// Local/demo data provider — localStorage-backed. Used when Firebase isn't
// configured (see services/firebase.js). Mirrors the interface exposed by
// firestoreDataProvider.js.
//
// Which starting dataset a user sees (empty vs. the full demo dataset) is
// decided at auth time by contexts/authProviders/localAuthProvider.js
// (seedEmptyAccount on signup, seedDemoAccount on a fresh demo login) —
// see services/seedService.js. ensureSeeded() below is only a safety net
// for the rare case this provider mounts before either has run.

import { useMemo, useState } from 'react';
import { readCollection, writeCollection } from '../../services/storageService';
import { ensureSeeded } from '../../services/seedService';
import {
  availableMoney,
  dailyBudget,
  daysUntilNextSalary,
  monthExpenses,
  monthIncome,
} from '../../services/financeService';

export function useLocalDataProvider(user) {
  ensureSeeded();

  const [banks, setBanks] = useState(() => readCollection('banks'));
  const [accounts, setAccounts] = useState(() => readCollection('accounts'));
  const [cards, setCards] = useState(() => readCollection('cards'));
  const [categories, setCategories] = useState(() => readCollection('categories'));
  const [transactions, setTransactions] = useState(() => readCollection('transactions'));
  const [goals, setGoals] = useState(() => readCollection('goals'));
  const [subscriptions, setSubscriptions] = useState(() => readCollection('subscriptions'));
  const [alerts] = useState(() => readCollection('alerts'));
  const [achievements] = useState(() => readCollection('achievements'));

  function persist(setter, collection) {
    return (updater) => {
      setter((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        writeCollection(collection, next);
        return next;
      });
    };
  }

  const setAndPersistBanks = persist(setBanks, 'banks');
  const setAndPersistAccounts = persist(setAccounts, 'accounts');
  const setAndPersistCards = persist(setCards, 'cards');
  const setAndPersistTransactions = persist(setTransactions, 'transactions');
  const setAndPersistGoals = persist(setGoals, 'goals');
  const setAndPersistSubscriptions = persist(setSubscriptions, 'subscriptions');

  function addBank(bank) {
    setAndPersistBanks((prev) => [...prev, { id: `bank-${Date.now()}`, createdAt: new Date().toISOString(), ...bank }]);
  }

  function addAccount(account) {
    setAndPersistAccounts((prev) => [...prev, { id: `acc-${Date.now()}`, ...account }]);
  }

  function addCard(card) {
    setAndPersistCards((prev) => [...prev, { id: `card-${Date.now()}`, used: 0, currentInvoice: 0, nextInvoice: 0, ...card }]);
  }

  function addTransaction(tx) {
    setAndPersistTransactions((prev) => [{ id: `t-${Date.now()}`, date: new Date().toISOString(), ...tx }, ...prev]);
  }

  function addGoal(goal) {
    setAndPersistGoals((prev) => [...prev, { id: `goal-${Date.now()}`, saved: 0, createdAt: new Date().toISOString(), ...goal }]);
  }

  function contributeToGoal(goalId, amount) {
    setAndPersistGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, saved: g.saved + amount } : g)));
  }

  function addSubscription(sub) {
    setAndPersistSubscriptions((prev) => [...prev, { id: `sub-${Date.now()}`, ...sub }]);
  }

  const computed = useMemo(() => {
    const available = availableMoney({ accounts, cards, subscriptions, goals });
    const income = user?.income ?? monthIncome(transactions);
    const payDay = user?.payDay ?? 5;
    return {
      available,
      daily: dailyBudget(available, payDay),
      daysToSalary: daysUntilNextSalary(payDay),
      monthExpenses: monthExpenses(transactions),
      monthIncome: monthIncome(transactions) || income,
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
    setCategories,
  };
}
