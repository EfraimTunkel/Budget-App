// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDuDrJSgnGvkDHCdIBq98m2zRGLvwRgbYs",
  authDomain: "budgetapp-5d500.firebaseapp.com",
  projectId: "budgetapp-5d500",
  storageBucket: "budgetapp-5d500.firebasestorage.app",
  messagingSenderId: "31114956560",
  appId: "1:31114956560:web:1cbf62fbeaa484114ddf95",
  measurementId: "G-X9P0P9FC43",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elements
const authContainer = document.getElementById("auth-container");
const dashboardContainer = document.getElementById("dashboard-container");
const authForm = document.getElementById("auth-form");
const authButton = document.getElementById("auth-button");
const toggleLink = document.getElementById("toggle-link");
const balanceDisplay = document.getElementById("balance");
const addIncomeSection = document.getElementById("add-income-section");
const manageBudgetsSection = document.getElementById("manage-budgets-section");
const trackExpensesSection = document.getElementById("track-expenses-section");
const addIncomeForm = document.getElementById("add-income-form");
const addBudgetForm = document.getElementById("add-budget-form");
const addExpenseForm = document.getElementById("add-expense-form");
const budgetsList = document.getElementById("budgets-list");
const expensesSummary = document.getElementById("expenses-summary");
const expenseCategorySelect = document.getElementById("expense-category");
const chartContainer = document.getElementById("chart-container");
const ctx = document.getElementById("spending-chart").getContext("2d");

// Sidebar Navigation
document.getElementById("add-income-link").addEventListener("click", () => {
  showSection(addIncomeSection);
});
document.getElementById("manage-budgets-link").addEventListener("click", () => {
  showSection(manageBudgetsSection);
});
document.getElementById("track-expenses-link").addEventListener("click", () => {
  showSection(trackExpensesSection);
});

// Show Specific Section
const showSection = (section) => {
  addIncomeSection.classList.add("hidden");
  manageBudgetsSection.classList.add("hidden");
  trackExpensesSection.classList.add("hidden");
  section.classList.remove("hidden");
};

// Initialize Chart
let spendingChart;

const initializeChart = (budgets, expenses) => {
  const categories = budgets.map((budget) => budget.category);
  const expenseData = categories.map((category) => {
    const totalExpense = expenses
      .filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0);
    return totalExpense;
  });

  if (spendingChart) {
    spendingChart.destroy();
  }

  spendingChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: categories,
      datasets: [
        {
          label: "Spending Categories",
          data: expenseData,
          backgroundColor: ["#4caf50", "#ff9800", "#f44336", "#2196f3", "#9c27b0"],
          borderColor: "#ffffff",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true, position: "bottom" },
        tooltip: {
          callbacks: {
            label: (tooltipItem) =>
              `${tooltipItem.label}: $${tooltipItem.raw.toFixed(2)}`,
          },
        },
      },
    },
  });
};

// Toggle Login/Sign-Up
toggleLink.addEventListener("click", () => {
  const isLogin = authButton.textContent === "Log In";
  document.getElementById("form-title").textContent = isLogin
    ? "Sign Up to Budget App"
    : "Welcome Back!";
  authButton.textContent = isLogin ? "Sign Up" : "Log In";
  toggleLink.textContent = isLogin
    ? "Already have an account? Log in here."
    : "Don't have an account? Sign up here.";
});

// Handle Authentication
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;

  try {
    if (authButton.textContent === "Log In") {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      alert(`Welcome back, ${userCredential.user.email}!`);
    } else if (authButton.textContent === "Sign Up") {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userDocRef = doc(db, "users", userCredential.user.uid);
      await setDoc(userDocRef, { balance: 0, budgets: [], expenses: [] });
      alert(`Account created successfully! Welcome, ${userCredential.user.email}.`);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
});

// Handle User State
onAuthStateChanged(auth, async (user) => {
  if (user) {
    authContainer.style.display = "none";
    dashboardContainer.style.display = "flex";
    chartContainer.style.display = "block";
    loadDashboard(user);
  } else {
    authContainer.style.display = "flex";
    dashboardContainer.style.display = "none";
    chartContainer.style.display = "none";
  }
});

// Load Dashboard Data
const loadDashboard = async (user) => {
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const data = userDoc.data();
    balanceDisplay.textContent = `$${data.balance.toFixed(2)}`;
    updateBudgetsList(data.budgets);
    updateExpensesSummary(data.expenses);
    initializeChart(data.budgets, data.expenses);
  } else {
    await setDoc(userDocRef, { balance: 0, budgets: [], expenses: [] });
    balanceDisplay.textContent = `$0.00`;
    initializeChart([], []);
  }
};

// Update Budgets List
const updateBudgetsList = (budgets) => {
  budgetsList.innerHTML = "";
  expenseCategorySelect.innerHTML =
    '<option value="" disabled selected>Select category</option>';
  budgets.forEach((budget) => {
    budgetsList.innerHTML += `
      <li>${budget.category}: $${budget.amount.toFixed(2)}
        <button class="edit-btn" data-category="${budget.category}">Edit</button>
        <button class="delete-btn" data-category="${budget.category}">Delete</button>
      </li>`;
    expenseCategorySelect.innerHTML += `<option value="${budget.category}">${budget.category}</option>`;
  });
};

// Update Expenses Summary
const updateExpensesSummary = (expenses) => {
  expensesSummary.innerHTML = "";
  expenses.forEach((expense) => {
    expensesSummary.innerHTML += `<li>${expense.category}: $${expense.amount.toFixed(2)}</li>`;
  });
};

// Add Income
addIncomeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const income = parseFloat(document.getElementById("income-amount").value);
  const user = auth.currentUser;

  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);
  const data = userDoc.data();

  await updateDoc(userDocRef, { balance: data.balance + income });
  balanceDisplay.textContent = `$${(data.balance + income).toFixed(2)}`;
});

// Add Budget
addBudgetForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const category = document.getElementById("budget-category").value;
  const amount = parseFloat(document.getElementById("budget-amount").value);
  const user = auth.currentUser;

  const userDocRef = doc(db, "users", user.uid);
  await updateDoc(userDocRef, { budgets: arrayUnion({ category, amount }) });
  const userDoc = await getDoc(userDocRef);
  updateBudgetsList(userDoc.data().budgets);
});

// Add Expense
addExpenseForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const category = document.getElementById("expense-category").value;
  const amount = parseFloat(document.getElementById("expense-amount").value);
  const user = auth.currentUser;

  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);
  const data = userDoc.data();

  const updatedBalance = data.balance - amount;
  await updateDoc(userDocRef, {
    balance: updatedBalance,
    expenses: arrayUnion({ category, amount }),
  });
  balanceDisplay.textContent = `$${updatedBalance.toFixed(2)}`;
  updateExpensesSummary(data.expenses.concat({ category, amount }));
});

// Logout
document.getElementById("logout-button").addEventListener("click", async () => {
  await signOut(auth);
  location.reload();
});

// Sidebar Menu Toggle
const menuToggle = document.getElementById("menu-toggle");
const menu = document.getElementById("menu");

menuToggle.addEventListener("click", () => {
  menu.classList.toggle("visible");
});

document.addEventListener("click", (e) => {
  if (!menu.contains(e.target) && e.target !== menuToggle) {
    menu.classList.remove("visible");
  }
});

// Edit/Delete Budget
document.getElementById("budgets-list").addEventListener("click", async (e) => {
  const user = auth.currentUser;
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);
  const data = userDoc.data();

  if (e.target.classList.contains("edit-btn")) {
    const category = e.target.dataset.category;
    const newAmount = prompt(`Enter new amount for ${category}:`, "0");
    const updatedBudgets = data.budgets.map((budget) =>
      budget.category === category ? { ...budget, amount: parseFloat(newAmount) } : budget
    );
    await updateDoc(userDocRef, { budgets: updatedBudgets });
    updateBudgetsList(updatedBudgets);
  } else if (e.target.classList.contains("delete-btn")) {
    const category = e.target.dataset.category;
    const updatedBudgets = data.budgets.filter((budget) => budget.category !== category);
    await updateDoc(userDocRef, { budgets: updatedBudgets });
    updateBudgetsList(updatedBudgets);
  }
});
