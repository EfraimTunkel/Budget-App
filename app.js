
// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

// Fetch the API key securely from the Firebase Cloud Function
const fetchApiKey = async () => {
  try {
    const response = await fetch("https://us-central1-budgetapp-5d500.cloudfunctions.net/getApiKey");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.apiKey;
  } catch (error) {
    console.error("Error fetching API key:", error);
  }
};

// Initialize Firebase with dynamically fetched API key
const initializeAppWithApiKey = async () => {
  const apiKey = await fetchApiKey();
  if (apiKey) {
    const firebaseConfig = {
      apiKey,
      authDomain: "budgetapp-5d500.firebaseapp.com",
      projectId: "budgetapp-5d500",
      storageBucket: "budgetapp-5d500.appspot.com",
      messagingSenderId: "31114956560",
      appId: "1:31114956560:web:1cbf62fbeaa484114ddf95",
      measurementId: "G-X9P0P9FC43",
    };

    const app = initializeApp(firebaseConfig);
    initializeFirebaseFeatures(app);
  } else {
    console.error("Failed to fetch API key. Firebase initialization aborted.");
  }
};

// Initialize Firebase Auth and Firestore features
const initializeFirebaseFeatures = (app) => {
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Elements
  const authContainer = document.getElementById("auth-container");
  const dashboardContainer = document.getElementById("dashboard-container");
  const authForm = document.getElementById("auth-form");
  const authButton = document.getElementById("auth-button");
  const toggleLink = document.getElementById("toggle-link");
  const googleSignInButton = document.getElementById("google-signin-button");
  const logoutButton = document.getElementById("logout-button");
  const balanceDisplay = document.getElementById("balance");
  const addIncomeForm = document.getElementById("add-income-form");
  const addBudgetForm = document.getElementById("add-budget-form");
  const addExpenseForm = document.getElementById("add-expense-form");
  const budgetsList = document.getElementById("budgets-list");
  const expensesSummary = document.getElementById("expenses-summary");
  const expenseCategorySelect = document.getElementById("expense-category");
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

  // Handle Email/Password Authentication
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-email").value;
    const password = document.getElementById("auth-password").value;

    try {
      if (authButton.textContent === "Log In") {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Logged in successfully!");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userDocRef = doc(db, "users", userCredential.user.uid);
        await setDoc(userDocRef, { balance: 0, budgets: [], expenses: [] });
        alert("Account created successfully!");
      }
    } catch (error) {
      console.error("Authentication Error:", error.message);
    }
  });

  // Handle Google Sign-In
  const provider = new GoogleAuthProvider();

googleSignInButton.addEventListener("click", async () => {
    try {
      const provider = new GoogleAuthProvider(); // Create provider instance
      const result = await signInWithPopup(auth, provider); // Use signInWithPopup for web
      const user = result.user;
  
      // Create a Firestore document for new users
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
  
      if (!userDoc.exists()) {
        await setDoc(userDocRef, { balance: 0, budgets: [], expenses: [] });
      }
  
      alert(`Welcome ${user.displayName}!`);
      // Optionally redirect to dashboard or update UI
    } catch (error) {
      console.error("Google Sign-In Error:", error.message);
      alert("Error signing in with Google. Check console for details.");
    }
  });
  

  // Monitor Auth State
  onAuthStateChanged(auth, (user) => {
    if (user) {
      authContainer.style.display = "none";
      dashboardContainer.style.display = "block";
      loadDashboard(user);
    } else {
      authContainer.style.display = "block";
      dashboardContainer.style.display = "none";
    }
  });

  const loadDashboard = async (user) => {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      balanceDisplay.textContent = `$${data.balance.toFixed(2)}`;
      updateBudgetsList(data.budgets);
      updateExpensesSummary(data.expenses);
    } else {
      await setDoc(userDocRef, { balance: 0, budgets: [], expenses: [] });
      balanceDisplay.textContent = "$0.00";
      updateBudgetsList([]);
      updateExpensesSummary([]);
    }
  };

  // Add Income
  addIncomeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("income-amount").value);
    if (!isNaN(amount)) {
      const user = auth.currentUser;
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        const newBalance = data.balance + amount;
        await setDoc(userDocRef, { ...data, balance: newBalance });
        balanceDisplay.textContent = `$${newBalance.toFixed(2)}`;
        alert("Income added successfully!");
        addIncomeForm.reset();
      }
    }
  });

  // Add Budget
  addBudgetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const category = document.getElementById("budget-category").value;
    const amount = parseFloat(document.getElementById("budget-amount").value);
    if (category && !isNaN(amount)) {
      const user = auth.currentUser;
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        const budgets = [...data.budgets, { category, amount }];
        await setDoc(userDocRef, { ...data, budgets });
        updateBudgetsList(budgets);
        alert("Budget added successfully!");
        addBudgetForm.reset();
      }
    }
  });

  // Helper Functions
  const updateBudgetsList = (budgets) => {
    budgetsList.innerHTML = "";
    expenseCategorySelect.innerHTML = "<option value=\"\" disabled selected>Choose a category</option>";
    budgets.forEach((budget) => {
      const li = document.createElement("li");
      li.textContent = `${budget.category}: $${budget.amount.toFixed(2)}`;
      budgetsList.appendChild(li);

      const option = document.createElement("option");
      option.value = budget.category;
      option.textContent = budget.category;
      expenseCategorySelect.appendChild(option);
    });
  };

  const updateExpensesSummary = (expenses) => {
    expensesSummary.innerHTML = "";
    expenses.forEach((expense) => {
      const li = document.createElement("li");
      li.textContent = `${expense.category}: $${expense.amount.toFixed(2)}`;
      expensesSummary.appendChild(li);
    });
  };

  // Logout
  logoutButton.addEventListener("click", async () => {
    await signOut(auth);
    alert("Logged out successfully!");
    location.reload();
  });
};

// Start the app by initializing with the API key
initializeAppWithApiKey();
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  client_id: "31114956560-rmea0jtoq86qie75n0v3e1v06e8tk1e3.apps.googleusercontent.com", // Update with your actual Web Client ID
});

// Toggle More Options
const moreLink = document.getElementById("more-link");
const moreOptions = document.getElementById("more-options");

moreLink.addEventListener("click", () => {
  moreOptions.classList.toggle("hidden");
});

document.querySelectorAll('.nav-more').forEach((more) => {
    more.addEventListener('click', (e) => {
      e.preventDefault();
      const dropdown = document.createElement('ul');
      dropdown.classList.add('dropdown-menu');
      dropdown.innerHTML = `
        <li><a href="#">Profile</a></li>
        <li><a href="#">About</a></li>
        <li><a href="#">Logout</a></li>
      `;
      more.appendChild(dropdown);
    });
  });
  
  const showToast = (message) => {
    const toast = document.getElementById("toast-container");
    toast.textContent = message;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3000);
  };
  
  // Example usage
  showToast("Income added successfully!");
 



  // Enhanced Error Handling
const showError = (message) => {
  const errorToast = document.getElementById("toast-container");
  errorToast.textContent = message;
  errorToast.style.backgroundColor = "#f44336";
  errorToast.classList.remove("hidden");
  setTimeout(() => errorToast.classList.add("hidden"), 3000);
};


// Add Income with Validation
addIncomeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById("income-amount").value);
  if (isNaN(amount) || amount <= 0) {
    showError("Please enter a valid income amount!");
    return;
  }

  const user = auth.currentUser;
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const data = userDoc.data();
    const newBalance = data.balance + amount;
    await setDoc(userDocRef, { ...data, balance: newBalance });
    balanceDisplay.textContent = `$${newBalance.toFixed(2)}`;
    showToast("Income added successfully!");
    addIncomeForm.reset();
  }
});

// Load Charts for Spending Overview
const loadSpendingChart = (data) => {
  const ctx = document.getElementById("spending-chart").getContext("2d");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: data.categories,
      datasets: [{
        label: "Spending Overview",
        data: data.amounts,
        backgroundColor: ["#4caf50", "#ff9800", "#2196f3", "#f44336", "#9c27b0"],
        borderWidth: 1,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => {
              return `${tooltipItem.label}: $${tooltipItem.raw}`;
            },
          },
        },
      },
    },
  });
};

// Dark Mode Toggle
const toggleDarkMode = () => {
  document.body.classList.toggle("dark-mode");
  const isDarkMode = document.body.classList.contains("dark-mode");
  localStorage.setItem("darkMode", isDarkMode);
};

// Load User Preferences
const loadUserPreferences = () => {
  const isDarkMode = localStorage.getItem("darkMode") === "true";
  if (isDarkMode) document.body.classList.add("dark-mode");
};

// Initialize Dark Mode Button
document.getElementById("dark-mode-toggle").addEventListener("click", toggleDarkMode);

// Sort Budgets
const sortBudgets = (budgets, criteria) => {
  if (criteria === "category") {
    return budgets.sort((a, b) => a.category.localeCompare(b.category));
  }
  if (criteria === "amount") {
    return budgets.sort((a, b) => b.amount - a.amount);
  }
};

// Delete Budget or Expense
const deleteItem = async (id, type) => {
  const user = auth.currentUser;
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const data = userDoc.data();
    if (type === "budget") {
      data.budgets = data.budgets.filter((budget) => budget.id !== id);
    } else if (type === "expense") {
      data.expenses = data.expenses.filter((expense) => expense.id !== id);
    }
    await setDoc(userDocRef, data);
    loadDashboard(user);
    showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
  }
};

// Example: Adding delete button for budgets
budgetsList.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-budget")) {
    const budgetId = e.target.dataset.id;
    deleteItem(budgetId, "budget");
  }
});

// Add User Preferences Loading
document.addEventListener("DOMContentLoaded", () => {
  loadUserPreferences();
});

// Load Spending Overview Data
const spendingData = {
  categories: ["Food", "Transportation", "Entertainment", "Bills", "Other"],
  amounts: [150, 100, 75, 200, 50],
};
loadSpendingChart(spendingData);


