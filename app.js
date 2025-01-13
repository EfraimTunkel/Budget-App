import { 
  initializeApp 
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";

import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  sendPasswordResetEmail // Add this here
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";

import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

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
    document.getElementById("forgot-password-button").addEventListener("click", async () => {
      const email = document.getElementById("auth-email").value;
    
      if (!email) {
        alert("Please enter your email address.");
        return;
      }
    
      const auth = getAuth();
    
      try {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset email sent! Please check your inbox.");
      } catch (error) {
        console.error("Error resetting password:", error.message);
        alert("Failed to send password reset email. Please try again.");
      }
    });
    
    initializeFirebaseFeatures(app);
  } else {
    console.error("Failed to fetch API key. Firebase initialization aborted.");
  }
};

const initializeFirebaseFeatures = (app) => {
  const auth = getAuth(app);
  const db = getFirestore(app);

  // DOM Elements
  const addBudgetForm = document.getElementById("add-budget-form");
  const transactionForm = document.getElementById("transaction-form");
  const authContainer = document.getElementById("auth-container");
  const dashboardContainer = document.getElementById("dashboard-container");
  const authForm = document.getElementById("auth-form");
  const authButton = document.getElementById("auth-button");
  const toggleLink = document.getElementById("toggle-link");
  const googleSignInButton = document.getElementById("google-signin-button");
  const logoutButton = document.getElementById("logout-button");
  const balanceDisplay = document.getElementById("balance");
  const addTransactionButton = document.getElementById("add-transaction-button");
  const transactionPopup = document.getElementById("transaction-popup");
  const closePopupButton = document.getElementById("close-popup");
  
const incomeTab = document.getElementById("income-tab");
const expenseTab = document.getElementById("expense-tab");
const incomeFields = document.getElementById("income-fields");
const expenseFields = document.getElementById("expense-fields");

  // Toggle Login/Sign-Up
  toggleLink.addEventListener("click", () => {
    const isLogin = authButton.textContent === "Log In";
    document.getElementById("form-title").textContent = isLogin
      ? "Sign Up to Budget App"
      : "Welcome Back!";
    authButton.textContent = isLogin ? "Sign Up" : "Log In";
    toggleLink.textContent = isLogin
      ? "Log in"
      : "Sign up";
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
  
   // Monitor Authentication State
onAuthStateChanged(auth, (user) => {
  if (user) {
    authContainer.style.display = "none"; // Hide the login/signup container
    dashboardContainer.style.display = "block"; // Show the dashboard
    loadDashboard(user); // Load the user's dashboard
  } else {
    authContainer.style.display = "block"; // Show the login/signup container
    dashboardContainer.style.display = "none"; // Hide the dashboard
  }
});
// Load Dashboard
const loadDashboard = async (user) => {
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  // Extract the username from the user's email
  const email = user.email;
  const username = email.substring(0, email.indexOf("@")).replace(".", " ").replace("_", " ");

  // Determine the greeting based on the time of day
  const hours = new Date().getHours();
  const greeting =
    hours >= 5 && hours < 12
      ? "Good Morning"
      : hours >= 12 && hours < 18
      ? "Good Afternoon"
      : "Good Evening";

  // Update the greeting message
  const usernameDisplay = document.getElementById("username-display");
  usernameDisplay.textContent = `${greeting}, ${username}`;

  // Update the balance and load data from Firestore
  if (userDoc.exists()) {
    const data = userDoc.data();
    balanceDisplay.textContent = `$${data.balance.toFixed(2)}`;
 // Prepare data for charts
 const incomeData = data.incomes ? data.incomes.map((item) => item.amount || 0) : [];
 const expenseData = data.expenses ? data.expenses.map((item) => item.amount || 0) : [];
 const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

 // Load charts
 const chartData = prepareChartData(data.expenses);
 loadSpendingChart(chartData.categories, chartData.amounts);
 loadLineChart(labels, incomeData, expenseData);
} else {
 // If no user data exists, initialize default values in Firestore
 await setDoc(userDocRef, { balance: 0, incomes: [], expenses: [] });
 balanceDisplay.textContent = "$0.00";
   // Load empty charts
   loadSpendingChart([], []);
   loadLineChart(["Jan", "Feb", "Mar"], [0, 0, 0], [0, 0, 0]);
 }


};

// Prepare Data for Chart
const prepareChartData = (expenses) => {
  const categories = [];
  const amounts = [];

  expenses.forEach((expense) => {
    const { category, amount } = expense;
    const index = categories.indexOf(category);

    if (index !== -1) {
      amounts[index] += amount;
    } else {
      categories.push(category);
      amounts.push(amount);
    }
  });

  return { categories, amounts };
};

// Load Spending Chart
const loadSpendingChart = (categories, amounts) => {
  const ctx = document.getElementById("spending-chart").getContext("2d");

  // Destroy any existing chart instance
  if (window.spendingChart) {
    window.spendingChart.destroy();
  }

  // Create a new Chart.js instance
  window.spendingChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: categories,
      datasets: [
        {
          label: "Spending Overview",
          data: amounts,
          backgroundColor: ["#4caf50", "#ff9800", "#2196f3", "#f44336", "#9c27b0"],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => `${tooltipItem.label}: $${tooltipItem.raw}`,
          },
        },
      },
    },
  });
};
// Load Line Chart
const loadLineChart = (labels, incomeData, expenseData) => {
  const ctx = document.getElementById("line-chart").getContext("2d");

  // Destroy any existing chart instance
  if (window.lineChart) {
    window.lineChart.destroy();
  }

  // Create a new Chart.js instance
  window.lineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Income",
          data: incomeData,
          borderColor: "#4caf50",
          backgroundColor: "rgba(76, 175, 80, 0.2)",
          tension: 0.4,
          fill: true,
        },
        {
          label: "Expenses",
          data: expenseData,
          borderColor: "#f44336",
          backgroundColor: "rgba(244, 67, 54, 0.2)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => `$${tooltipItem.raw}`,
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Time",
          },
        },
        y: {
          title: {
            display: true,
            text: "Amount ($)",
          },
        },
      },
    },
  });
};

// Handle Add Transaction Button Click (Show Popup)
addTransactionButton.addEventListener("click", () => {
  transactionPopup.classList.remove("hidden");
  setActiveTab(incomeTab, incomeFields); // Default to showing Income tab
});

// Handle Close Popup Button Click (Hide Popup)
closePopupButton.addEventListener("click", () => {
  transactionPopup.classList.add("hidden");
});

// Handle Income Form Submission
document.getElementById("income-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) {
    alert("Please log in first!");
    return;
  }

  const amount = parseFloat(document.getElementById("popup-income-amount").value);
  const source = document.getElementById("popup-income-source").value;

  if (!amount || !source) {
    alert("Please provide valid income details.");
    return;
  }

  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);
  const userData = userDoc.exists() ? userDoc.data() : { balance: 0, incomes: [], expenses: [] };

  // Add the new income and update the balance
  userData.incomes = [...(userData.incomes || []), { amount, source }];
  userData.balance += amount;

  await setDoc(userDocRef, userData, { merge: true });

  // Update the balance display
  balanceDisplay.textContent = `$${userData.balance.toFixed(2)}`;

  // Reset the form and close the popup
  document.getElementById("income-form").reset();
  transactionPopup.classList.add("hidden");

  // Success notification
  alert("Income added successfully!");
});


// Handle Expense Form Submission
document.getElementById("expense-form").addEventListener("submit", async (e) => {
e.preventDefault();

const user = auth.currentUser;
if (!user) {
  alert("Please log in first!");
  return;
}

  const amount = parseFloat(document.getElementById("popup-expense-amount").value);
  const category = document.getElementById("popup-expense-category").value;

  if (!amount || !category) {
    alert("Please provide valid expense details.");
    return;
  }

  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);
  const userData = userDoc.exists() ? userDoc.data() : { balance: 0, incomes: [], expenses: [] };

  userData.expenses = [...(userData.expenses || []), { amount, category }];
  userData.balance -= amount;

  await setDoc(userDocRef, userData, { merge: true });
  balanceDisplay.textContent = `$${userData.balance.toFixed(2)}`;
  document.getElementById("expense-form").reset();
  transactionPopup.classList.add("hidden");
  alert("Expense added successfully!");
});

  incomeTab.addEventListener("click", () => {
    incomeTab.classList.add("active");
    expenseTab.classList.remove("active");
    document.getElementById("income-form").classList.add("active");
    document.getElementById("income-form").classList.remove("hidden");
    document.getElementById("expense-form").classList.add("hidden");
    document.getElementById("expense-form").classList.remove("active");
  });
  
  expenseTab.addEventListener("click", () => {
    expenseTab.classList.add("active");
    incomeTab.classList.remove("active");
    document.getElementById("expense-form").classList.add("active");
    document.getElementById("expense-form").classList.remove("hidden");
    document.getElementById("income-form").classList.add("hidden");
    document.getElementById("income-form").classList.remove("active");
  });
  
// Updated Event Listeners
incomeTab.addEventListener("click", () => setActiveTab(incomeTab, incomeFields));
expenseTab.addEventListener("click", () => setActiveTab(expenseTab, expenseFields));
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
 
   // Logout
   logoutButton.addEventListener("click", async () => {
    await signOut(auth);
    alert("Logged out successfully!");
    location.reload();
  });
};
document.addEventListener("DOMContentLoaded", () => {
  const logoutButton = document.getElementById("logout-button");

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      try {
        const auth = getAuth();
        await signOut(auth);
        alert("Logged out successfully!");
        location.reload();
      } catch (error) {
        console.error("Logout Error:", error);
        alert("An error occurred during logout.");
      }
    });
  } else {
    console.error("Logout button not found in the DOM.");
  }
});


















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



const setActiveTab = (activeTab, activeFields) => {
  document.querySelectorAll(".toggle-button").forEach((button) => {
    button.classList.remove("active");
  });
  document.querySelectorAll(".transaction-fields").forEach((field) => {
    field.classList.add("hidden");
  });
  activeTab.classList.add("active");
  activeFields.classList.remove("hidden");
};



 

  // Destroy the previous chart instance to prevent duplication
  if (window.spendingChart) {
    window.spendingChart.destroy();
  }
// Function to Load and Render the Line Chart
const loadLineChart = (labels, incomeData, expenseData) => {
  const ctx = document.getElementById("line-chart").getContext("2d");

  // Destroy the previous chart instance to prevent duplication
  if (window.lineChart) {
    window.lineChart.destroy();
  }

  const loadLineChart = (labels, incomeData, expenseData) => {
    const ctx = document.getElementById("line-chart").getContext("2d");
  
    // Destroy any existing chart instance
    if (window.lineChart) {
      window.lineChart.destroy();
    }
  
    // Create a new Chart.js instance
    window.lineChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Income",
            data: incomeData,
            borderColor: "#4caf50",
            backgroundColor: "rgba(76, 175, 80, 0.2)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Expenses",
            data: expenseData,
            borderColor: "#f44336",
            backgroundColor: "rgba(244, 67, 54, 0.2)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
          tooltip: {
            callbacks: {
              label: (tooltipItem) => `$${tooltipItem.raw}`,
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Time",
            },
          },
          y: {
            title: {
              display: true,
              text: "Amount ($)",
            },
          },
        },
      },
    });
  };
  
  // Create a new Chart instance
  window.spendingChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: categories,
      datasets: [
        {
          label: "Spending Overview",
          data: amounts,
          backgroundColor: ["#4caf50", "#ff9800", "#2196f3", "#f44336", "#9c27b0", "#fcba03", "#0377fc", "#fc03d7"],
          borderWidth: 1,
        },
      ],
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
