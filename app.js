import { 
  initializeApp 
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { OAuthProvider } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";

import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  sendPasswordResetEmail, 
  sendEmailVerification,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser
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
  // Now 'auth' and 'db' are in scope for everything in here
  const auth = getAuth(app);
  const db = getFirestore(app);

  // All your existing code for signIn, signOut, etc.
  // (the code that references 'auth' for transactions)

  
  // --- Settings Modal Enhancements ---
  // Make sure to import everything you need at the top of your file, for example:
// import { sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from "firebase/auth";
// import { doc, getDoc, setDoc } from "firebase/firestore"; 
// ... plus any other imports you use (e.g., getAuth, etc.)

// --- Settings Modal Enhancements ---
// DOM elements for the Settings modal
const settingsButton = document.getElementById("settings-button");
const settingsModal = document.getElementById("settings-modal");
const closeSettingsButton = document.getElementById("close-settings");
const saveSettingsButton = document.getElementById("save-settings");

// Profile Picture and Display Name
const profilePicInput = document.getElementById("profile-pic-input");
const profilePicPreview = document.getElementById("profile-pic-preview");
const displayNameInput = document.getElementById("display-name-input");

// Theme toggle
const themeToggle = document.getElementById("theme-toggle");

// Notification Preferences
const emailNotificationsCheckbox = document.getElementById("email-notifications");
const pushNotificationsCheckbox = document.getElementById("push-notifications");

// Currency
const currencySelect = document.getElementById("currency-select");

// Reset Password button
const resetPasswordButton = document.getElementById("reset-password-button");

// Delete Account button and the "Confirm Deletion" popup
const deleteAccountButton = document.getElementById("delete-account-button");
const confirmDeletionPopup = document.getElementById("confirm-deletion-popup");
const closeDeletionPopup = document.getElementById("close-deletion-popup");
const deleteAccountPasswordInput = document.getElementById("delete-account-password");
const confirmDeleteButton = document.getElementById("confirm-delete-button");

// When the settings button is clicked, load existing settings from Firestore
settingsButton.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      // Profile Picture
      profilePicPreview.src = data.photoUrl ? data.photoUrl : "default-avatar.png";
      // Display Name
      displayNameInput.value = data.displayName ? data.displayName : "";
      // Load preferences if they exist
      if (data.preferences) {
        // Theme
        themeToggle.checked = data.preferences.theme === "dark";
        // Notifications
        emailNotificationsCheckbox.checked = data.preferences.emailNotifications || false;
        pushNotificationsCheckbox.checked = data.preferences.pushNotifications || false;
        // Currency
        if (data.preferences.currency) {
          currencySelect.value = data.preferences.currency;
        }
      }
    }
  }
  settingsModal.classList.add("show");
  settingsModal.classList.remove("hide");
});

// Close the settings modal (using the Cancel button)
closeSettingsButton.addEventListener("click", () => {
  settingsModal.classList.remove("show");
  settingsModal.classList.add("hide");
});

// Also, if you want an "X" icon on the settings modal, ensure its HTML contains an element with id "close-settings-icon"
// and wire it up like this:
const closeSettingsIcon = document.getElementById("close-settings-icon");
if (closeSettingsIcon) {
  closeSettingsIcon.addEventListener("click", () => {
    settingsModal.classList.remove("show");
    settingsModal.classList.add("hide");
  });
}

// Save settings (profile info + preferences)
saveSettingsButton.addEventListener("click", async () => {
  const displayName = displayNameInput.value;
  const newPhotoUrl = profilePicPreview.src;
  
  // Gather additional preferences
  const theme = themeToggle.checked ? "dark" : "light";
  const emailNotifications = emailNotificationsCheckbox.checked;
  const pushNotifications = pushNotificationsCheckbox.checked;
  const currency = currencySelect.value;
  
  try {
    const user = auth.currentUser;
    if (!user) {
      alert("No user is logged in.");
      return;
    }
    const userDocRef = doc(db, "users", user.uid);
    // Save profile and preference data
    await setDoc(userDocRef, {
      displayName,
      photoUrl: newPhotoUrl,
      preferences: {
        theme,
        emailNotifications,
        pushNotifications,
        currency,
      },
    }, { merge: true });
    alert("Settings saved successfully!");
    loadDashboard(user); // Refresh dashboard to reflect changes
  } catch (error) {
    console.error("Error saving settings:", error);
    alert("Failed to save settings. Check console for details.");
  }
  
  settingsModal.classList.remove("show");
  settingsModal.classList.add("hide");
});

// Update profile picture preview immediately when a new file is selected
profilePicInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      profilePicPreview.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Reset Password: Send a password reset link to the user's email
resetPasswordButton.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("No user is logged in.");
    return;
  }
  try {
    await sendPasswordResetEmail(auth, user.email);
    alert("A password reset link has been sent to your email.");
  } catch (error) {
    console.error("Error sending reset email:", error);
    alert("Failed to send reset email. Check console for details.");
  }
});

// Delete Account: show the Confirm Deletion popup (make sure this popup is not nested inside the settings modal)
deleteAccountButton.addEventListener("click", () => {
  confirmDeletionPopup.classList.remove("hidden");
});

// Close the Confirm Deletion popup
closeDeletionPopup.addEventListener("click", () => {
  confirmDeletionPopup.classList.add("hidden");
  deleteAccountPasswordInput.value = ""; // clear password
});

// Confirm Delete: re-authenticate with current password, then delete user
confirmDeleteButton.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("No user is logged in.");
    return;
  }
  const currentPassword = deleteAccountPasswordInput.value.trim();
  if (!currentPassword) {
    alert("Please enter your current password.");
    return;
  }
  try {
    // Re-authenticate the user
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // If successful, delete the user
    await deleteUser(user);
    alert("Account deleted successfully.");
    // Optionally redirect or reload
    window.location.reload();
  } catch (error) {
    console.error("Error deleting account:", error);
    alert("Failed to delete account: " + error.message);
  } finally {
    confirmDeletionPopup.classList.add("hidden");
    deleteAccountPasswordInput.value = "";
  }
});

// Theme toggle: applying or removing "dark-mode" class on body
themeToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark-mode", themeToggle.checked);
});




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
// Grab the forgot-password-button element once at the top:
const forgotPasswordBtn = document.getElementById("forgot-password-button");
const transactionsButton = document.getElementById("transactions-button");
const transactionsPopup = document.getElementById("transactions-popup");
const closeTransactionsPopup = document.getElementById("close-transactions-popup");
const allTab = document.getElementById("all-tab");
const incomeTabList = document.getElementById("income-tab-list");
const expenseTabList = document.getElementById("expense-tab-list");
const transactionsListContent = document.getElementById("transactions-list-content");

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

      const isNowLogin = (authButton.textContent === "Log In");
      forgotPasswordBtn.style.display = isNowLogin ? "block" : "none";
  });
// On page load, if the auth button says "Log In" or "Sign Up", set forgot password accordingly:
document.addEventListener("DOMContentLoaded", () => {
  const authBtnText = authButton.textContent; // e.g. "Continue" or "Sign Up" or "Log In"
  const isLogin = (authBtnText === "Log In");
  forgotPasswordBtn.style.display = isLogin ? "block" : "none";
});

  // Handle Email/Password Authentication
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-email").value;
    const password = document.getElementById("auth-password").value;
  
    try {
      if (authButton.textContent === "Log In") {
        // Existing login flow (we’ll adjust the login function separately)
        await signInWithEmailAndPassword(auth, email, password);
        alert("Logged in successfully!");
      } else {
        // Sign-Up flow:
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Send the verification email
        await sendEmailVerification(user);
        
        await user.reload();
        if (!user.emailVerified) {
            alert("Please verify your email before logging in.");
            await signOut(auth); // Log them out
            return;
        }
        
        alert("A verification email has been sent. Please check your inbox and verify your email before logging in.");
      }
    } catch (error) {
      console.error("Authentication Error:", error.message);
      alert(error.message);
    }
  });
  
  
  const signInWithEmail = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // ✅ Check if email is verified
      await user.reload(); // Refresh user data
  
      if (!user.emailVerified) {
        alert("Please verify your email before logging in.");
        await signOut(auth); // Log them out
        return;
      }
  
      alert("Login successful!");
    } catch (error) {
      console.error("Login Error:", error.message);
      alert(error.message);
    }
  };
  
  // Handle Google Sign-In
  const provider = new GoogleAuthProvider();

  googleSignInButton.addEventListener("click", async () => {
    try {
        const provider = new GoogleAuthProvider(); 
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Firestore logic to create user document
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            await setDoc(userDocRef, { balance: 0, budgets: [], expenses: [] });
        }

        alert(`Welcome ${user.displayName}!`);
    } catch (error) {
        console.error("Google Sign-In Error:", error.message);
        alert("Error signing in with Google.");
    }
});

const microsoftButton = document.getElementById("microsoft-signin-button");

microsoftButton.addEventListener("click", async () => {
  const provider = new OAuthProvider('microsoft.com');

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    console.log(`Welcome ${user.displayName}`);
    alert(`Signed in as ${user.email}`);
  } catch (error) {
    console.error("Microsoft Sign-In Error:", error);
    alert(`Failed to sign in with Microsoft. ${error.message}`);
  }
});


   // Monitor Authentication State
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
  // Open the transactions list popup when the Transactions nav item is clicked
transactionsButton.addEventListener("click", () => {
  setActiveTransactionTab("all"); // default to 'All' tab
  transactionsPopup.classList.remove("hidden");
});

// Close the popup when clicking the close button
closeTransactionsPopup.addEventListener("click", () => {
  transactionsPopup.classList.add("hidden");
});

// Listen for tab clicks and switch the view accordingly
allTab.addEventListener("click", () => setActiveTransactionTab("all"));
incomeTabList.addEventListener("click", () => setActiveTransactionTab("income"));
expenseTabList.addEventListener("click", () => setActiveTransactionTab("expense"));

async function setActiveTransactionTab(filter) {
  // Remove the 'active' class from all tabs
  allTab.classList.remove("active");
  incomeTabList.classList.remove("active");
  expenseTabList.classList.remove("active");

  // Add the active class to the selected tab
  if (filter === "all") {
    allTab.classList.add("active");
  } else if (filter === "income") {
    incomeTabList.classList.add("active");
  } else if (filter === "expense") {
    expenseTabList.classList.add("active");
  }

  await loadTransactions(filter);
}

async function loadTransactions(filter) {
  const user = auth.currentUser;
  if (!user) {
    alert("Please log in to view transactions.");
    return;
  }
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);
  if (!userDoc.exists()) {
    transactionsListContent.innerHTML = "<p>No transaction data found.</p>";
    return;
  }
  const userData = userDoc.data();
  let incomes = userData.incomes || [];
  let expenses = userData.expenses || [];

  // Annotate incomes and expenses with a type property
  incomes = incomes.map(tx => ({ ...tx, type: "Income" }));
  expenses = expenses.map(tx => ({ ...tx, type: "Expense" }));

  // Combine transactions for the "All" tab
  let allTransactions = incomes.concat(expenses);
  // Sort transactions by timestamp descending (most recent first)
  allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  let transactionsToShow = [];
  if (filter === "all") {
    transactionsToShow = allTransactions;
  } else if (filter === "income") {
    transactionsToShow = incomes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } else if (filter === "expense") {
    transactionsToShow = expenses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Render the transactions list
  transactionsListContent.innerHTML = "";
  if (transactionsToShow.length === 0) {
    transactionsListContent.innerHTML = "<p>No transactions found.</p>";
    return;
  }

  // Create a table to display transactions
  const table = document.createElement("table");
  table.classList.add("transactions-table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["Type", "Category/Source", "Amount", "Time"].forEach(headerText => {
    const th = document.createElement("th");
    th.textContent = headerText;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  transactionsToShow.forEach(tx => {
    const row = document.createElement("tr");
    
    // Type cell
    const typeCell = document.createElement("td");
    typeCell.textContent = tx.type;
    row.appendChild(typeCell);
    
    // Category/Source cell (for Income use 'source'; for Expense use 'category')
    const categoryCell = document.createElement("td");
    categoryCell.textContent = tx.type === "Income" ? tx.source : tx.category;
    row.appendChild(categoryCell);
    
    // Amount cell
    const amountCell = document.createElement("td");
    amountCell.textContent = `$${parseFloat(tx.amount).toFixed(2)}`;
    row.appendChild(amountCell);
    
 // Time cell (formatted)
const timeCell = document.createElement("td");
if (tx.timestamp) {
  const date = new Date(tx.timestamp);
  timeCell.textContent = date.toLocaleString();
} else {
  timeCell.textContent = "N/A";  // or you could use new Date().toLocaleString() if you prefer
}
row.appendChild(timeCell);


    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  transactionsListContent.appendChild(table);
}



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

  // Grab DOM elements once
  const usernameDisplay = document.getElementById("username-display");
  const userProfilePic = document.getElementById("user-profile-pic");
  const balanceDisplay = document.getElementById("balance");

  // If the user document exists in Firestore
  if (userDoc.exists()) {
    // Inside loadDashboard(user):
const data = userDoc.data();

// 1) Populate expense dropdown
const expenseSelect = document.getElementById("popup-expense-category");
expenseSelect.innerHTML = "";
if (data.categories && data.categories.expense) {
  data.categories.expense.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    expenseSelect.appendChild(option);
  });
} else {
  // fallback if no categories
  const option = document.createElement("option");
  option.value = "";
  option.textContent = "No expense categories yet";
  expenseSelect.appendChild(option);
}

// 2) Populate income dropdown
const incomeSelect = document.getElementById("popup-income-source");
incomeSelect.innerHTML = "";
if (data.categories && data.categories.income) {
  data.categories.income.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    incomeSelect.appendChild(option);
  });
} else {
  const option = document.createElement("option");
  option.value = "";
  option.textContent = "No income categories yet";
  incomeSelect.appendChild(option);
}

// Add event to add new expense category
document.getElementById("add-expense-category-btn").addEventListener("click", async () => {
  const newCat = prompt("Enter new expense category:");
  if (!newCat) return;

  if (!data.categories) {
    data.categories = { income: [], expense: [] };
  }
  if (!data.categories.expense.includes(newCat)) {
    data.categories.expense.push(newCat);
  }
  await setDoc(userDocRef, data, { merge: true });

  // Update the dropdown
  const option = document.createElement("option");
  option.value = newCat;
  option.textContent = newCat;
  expenseSelect.appendChild(option);
  expenseSelect.value = newCat;
});

// Similarly for the income category
document.getElementById("add-income-category-btn").addEventListener("click", async () => {
  const newCat = prompt("Enter new income source:");
  if (!newCat) return;

  if (!data.categories) {
    data.categories = { income: [], expense: [] };
  }
  if (!data.categories.income.includes(newCat)) {
    data.categories.income.push(newCat);
  }
  await setDoc(userDocRef, data, { merge: true });

  // Update the dropdown
  const option = document.createElement("option");
  option.value = newCat;
  option.textContent = newCat;
  incomeSelect.appendChild(option);
  incomeSelect.value = newCat;
});


const expenseCategorySelect = document.getElementById("popup-expense-category");
const editExpenseCategoryBtn = document.getElementById("edit-expense-category-btn");
const deleteExpenseCategoryBtn = document.getElementById("delete-expense-category-btn");

// Show both edit and delete buttons only when a valid category is selected
expenseCategorySelect.addEventListener("change", () => {
  if (expenseCategorySelect.value) {
    editExpenseCategoryBtn.classList.add("visible");
    deleteExpenseCategoryBtn.classList.add("visible");
  } else {
    editExpenseCategoryBtn.classList.remove("visible");
    deleteExpenseCategoryBtn.classList.remove("visible");
  }
});

// Delete functionality
deleteExpenseCategoryBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete this category?")) {
    const selectedValue = expenseCategorySelect.value;
    const optionToDelete = expenseCategorySelect.querySelector(`option[value="${selectedValue}"]`);
    if (optionToDelete) {
      optionToDelete.remove();
    }
    // Reset the select value
    expenseCategorySelect.value = "";
    // Hide the buttons
    editExpenseCategoryBtn.classList.remove("visible");
    deleteExpenseCategoryBtn.classList.remove("visible");
  }
});

// Edit functionality
editExpenseCategoryBtn.addEventListener("click", () => {
  const selectedValue = expenseCategorySelect.value;
  if (!selectedValue) return;
  const newName = prompt("Edit category name:", selectedValue);
  if (newName && newName !== selectedValue) {
    // Update the option's value and text
    const optionToEdit = expenseCategorySelect.querySelector(`option[value="${selectedValue}"]`);
    if (optionToEdit) {
      optionToEdit.value = newName;
      optionToEdit.textContent = newName;
      expenseCategorySelect.value = newName;
    }
  }
});
// Income Category Controls
const incomeCategorySelect = document.getElementById("popup-income-source");
const editIncomeCategoryBtn = document.getElementById("edit-income-category-btn");
const deleteIncomeCategoryBtn = document.getElementById("delete-income-category-btn");

// Show edit and delete buttons only when a category is selected
incomeCategorySelect.addEventListener("change", () => {
  if (incomeCategorySelect.value) {
    editIncomeCategoryBtn.classList.add("visible");
    deleteIncomeCategoryBtn.classList.add("visible");
  } else {
    editIncomeCategoryBtn.classList.remove("visible");
    deleteIncomeCategoryBtn.classList.remove("visible");
  }
});

// Delete the selected income source when the delete button is clicked
deleteIncomeCategoryBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete this source?")) {
    const selectedValue = incomeCategorySelect.value;
    const optionToDelete = incomeCategorySelect.querySelector(`option[value="${selectedValue}"]`);
    if (optionToDelete) {
      optionToDelete.remove();
    }
    incomeCategorySelect.value = "";
    editIncomeCategoryBtn.classList.remove("visible");
    deleteIncomeCategoryBtn.classList.remove("visible");
  }
});

// Edit the selected income source when the edit button is clicked
editIncomeCategoryBtn.addEventListener("click", () => {
  const selectedValue = incomeCategorySelect.value;
  if (!selectedValue) return;
  const newName = prompt("Edit source name:", selectedValue);
  if (newName && newName !== selectedValue) {
    const optionToEdit = incomeCategorySelect.querySelector(`option[value="${selectedValue}"]`);
    if (optionToEdit) {
      optionToEdit.value = newName;
      optionToEdit.textContent = newName;
      incomeCategorySelect.value = newName;
    }
  }
});


// Then in the actual expense submit:
document.getElementById("expense-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById("popup-expense-amount").value);
  const category = document.getElementById("popup-expense-category").value;

  if (!amount || !category) {
    alert("Please provide valid expense details.");
    return;
  }

  const now = new Date();
  userData.expenses.push({
    amount,
    category,
    timestamp: now.toISOString()
  });
  userData.balance -= amount;

  await setDoc(userDocRef, userData, { merge: true });
  balanceDisplay.textContent = `$${userData.balance.toFixed(2)}`;

  // Reset & close
  document.getElementById("expense-form").reset();
  transactionPopup.classList.add("hidden");
  alert("Expense added successfully!");
});

// Income form similarly
document.getElementById("income-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById("popup-income-amount").value);
  const source = document.getElementById("popup-income-source").value;

  if (!amount || !source) {
    alert("Please provide valid income details.");
    return;
  }

  const now = new Date();
  userData.incomes.push({
    amount,
    source,
    timestamp: now.toISOString()
  });
  userData.balance += amount;

  await setDoc(userDocRef, userData, { merge: true });
  balanceDisplay.textContent = `$${userData.balance.toFixed(2)}`;

  // Reset & close
  document.getElementById("income-form").reset();
  transactionPopup.classList.add("hidden");
  alert("Income added successfully!");
});

    // Display balance
    if (typeof data.balance === "number") {
      balanceDisplay.textContent = `$${data.balance.toFixed(2)}`;
    } else {
      balanceDisplay.textContent = "$0.00";
    }

    // Display name or fallback
    const finalName = data.displayName ? data.displayName : username;
    usernameDisplay.textContent = `${greeting}, ${finalName}`;

    // Profile pic if it exists
    if (data.photoUrl) {
      userProfilePic.src = data.photoUrl;
    }

    // Prepare data for charts
    const incomeData = data.incomes ? data.incomes.map((item) => item.amount || 0) : [];
    const expenseData = data.expenses ? data.expenses.map((item) => item.amount || 0) : [];
    const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

    // Call your ApexCharts donut
    (function renderSpendingChart() {
      // Build category totals
      const catMap = {};
      (data.expenses || []).forEach((exp) => {
        if (!catMap[exp.category]) catMap[exp.category] = 0;
        catMap[exp.category] += exp.amount;
      });

      const spendingCategories = Object.keys(catMap);
      const spendingAmounts = Object.values(catMap);

      if (spendingCategories.length === 0) {
        spendingCategories.push("No Expenses");
        spendingAmounts.push(0);
      }

      const donutOptions = {
        chart: {
          type: 'donut',
          height: 350
        },
        series: spendingAmounts,
        labels: spendingCategories,
        title: {
          text: "Spending Overview",
          align: "center",
          style: { fontSize: '20px' }
        },
        legend: { position: 'bottom' }
      };

      const spendingChart = new ApexCharts(
        document.querySelector("#spending-chart"),
        donutOptions
      );
      spendingChart.render();
    })();

    // Call your ApexCharts line
    (function renderLineChart() {
      const lineOptions = {
        chart: {
          type: 'line',
          height: 350
        },
        series: [
          { name: "Income", data: incomeData },
          { name: "Expenses", data: expenseData }
        ],
        xaxis: {
          categories: labels,
          title: { text: "Month" }
        },
        yaxis: {
          title: { text: "Amount ($)" }
        },
        title: {
          text: "Income vs Expenses",
          align: "center",
          style: { fontSize: '20px' }
        },
        legend: { position: 'top' }
      };

      const lineChart = new ApexCharts(
        document.querySelector("#line-chart"),
        lineOptions
      );
      lineChart.render();
    })();

  } else {
    // If no user data exists, initialize defaults
    await setDoc(userDocRef, { balance: 0, incomes: [], expenses: [] });
    balanceDisplay.textContent = "$0.00";
    usernameDisplay.textContent = `${greeting}, ${username}`;

    // Optionally, render empty ApexCharts here
    // e.g., a donut chart with no expenses, etc.
  }
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

  window.lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: 'green',
          fill: false
        },
        {
          label: 'Expenses',
          data: expenseData,
          borderColor: 'red',
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      title: {
        display: true,
        text: 'Income vs Expenses'
      },
      scales: {
        xAxes: [{
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Month'
          }
        }],
        yAxes: [{
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Amount ($)'
          }
        }]
      }
    }
  });
};










const expenseCategorySelect = document.getElementById("popup-expense-category");
const deleteExpenseCategoryBtn = document.getElementById("delete-expense-category-btn");

// Show delete button only when a category is selected (non-empty)
expenseCategorySelect.addEventListener("change", () => {
  if (expenseCategorySelect.value) {
    deleteExpenseCategoryBtn.classList.add("visible");
  } else {
    deleteExpenseCategoryBtn.classList.remove("visible");
  }
});

// Delete the selected category when the button is clicked
deleteExpenseCategoryBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete this category?")) {
    // Optionally, update Firestore here to remove the category from the user's data

    // Remove the option from the dropdown
    const selectedValue = expenseCategorySelect.value;
    const optionToDelete = expenseCategorySelect.querySelector(`option[value="${selectedValue}"]`);
    if (optionToDelete) {
      optionToDelete.remove();
    }
    // Reset the select value
    expenseCategorySelect.value = "";
    // Hide the delete button
    deleteExpenseCategoryBtn.classList.remove("visible");
  }
});






