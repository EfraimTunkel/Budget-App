
  
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
      const response = await fetch("https://getapikey-ahmnn5lmka-uc.a.run.app/");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.apiKey;
    } catch (error) {
      console.error("Error fetching API key:", error);
    }
  };
  // Make them global
  let auth;
  let db;
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
      auth = getAuth(app);
      db = getFirestore(app);
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
  
  ///////////////////////////////////////////////////
  // BEGIN: New Category Selection Code (with Firestore)
  // Supports separate Expense & Income categories in the overlay
  ///////////////////////////////////////////////////
  
  // Global arrays for the user's categories by type
  let expenseCategories = [];
  let incomeCategories = [];
  
  // The list of all available icon filenames
  const ICON_FILES = [
    "barber-shop.png",
    "bills.png",
    "coffee-cup.png",
    "computer.png",
    "contactless.png",
    "cryptocurrency.png",
    "dining.png",
    "entertainment.png",
    "gifts.png",
    "groceries.png",
    "netflix.png",
    "shopping.png",
    "smartphone.png",
    "television.png",
    "transit.png",
    "wifi.png"
  ];
  
  // Default category type is "expense"
  let currentCategoryType = "expense";
  
  // ------------------------------
  // DOM REFERENCES
  // ------------------------------
  
  // Transaction popup elements (for when a category is selected)
  const crSelectIncomeCategoryBtn = document.getElementById("cr-select-income-category-btn");
  const crSelectExpenseCategoryBtn = document.getElementById("cr-select-expense-category-btn");
  const crChosenIncomeCategory = document.getElementById("cr-chosen-income-category");
  const crChosenIncomeCategoryText = document.getElementById("cr-chosen-income-category-text");
  const crChosenExpenseCategory = document.getElementById("cr-chosen-expense-category");
  const crChosenExpenseCategoryText = document.getElementById("cr-chosen-expense-category-text");
  
  // Category overlay (popup) elements
  const crCategoryOverlay = document.getElementById("cr-category-overlay");
  const crCloseCategoryPopup = document.getElementById("cr-close-category-popup");
  const crCategoryList = document.getElementById("cr-category-list");
  const crShowAddCatForm = document.getElementById("cr-show-add-cat-form"); // The HTML plus button
  const crAddCatForm = document.getElementById("cr-add-cat-form");
  const crNewCatName = document.getElementById("cr-new-cat-name");
  const crIconsGrid = document.getElementById("cr-icons-grid");
  const crSaveNewCatBtn = document.getElementById("cr-save-new-cat-btn");
  
  // Category overlay tabs (for switching between Expense and Income)
  // These IDs are unique for the overlay and do not conflict with the transaction popup toggles.
  const crCatExpenseTab = document.getElementById("cr-cat-expense-tab");
  const crCatIncomeTab = document.getElementById("cr-cat-income-tab");
  
  // Keep track of the icon chosen in the add-new form
  let selectedIcon = "";
  
  /**
   * Load categories from Firestore into our local arrays.
   */
  async function loadCategoriesFromFirestore(user) {
    if (!user) return;
    console.log("Loading categories from Firestore for user:", user.uid);
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      expenseCategories = Array.isArray(data.expenseCategories) ? data.expenseCategories : [];
      incomeCategories = Array.isArray(data.incomeCategories) ? data.incomeCategories : [];
    } else {
      console.log("No user doc; creating with empty category arrays...");
      await setDoc(userDocRef, { expenseCategories: [], incomeCategories: [] }, { merge: true });
      expenseCategories = [];
      incomeCategories = [];
    }
    console.log("Loaded expense categories:", expenseCategories);
    console.log("Loaded income categories:", incomeCategories);
    renderCategoryList();
  }
  
  /**
   * Save the current type's categories to Firestore, then reload.
   */
  async function saveCategoriesToFirestore() {
    const user = auth.currentUser;
    if (!user) {
      alert("No user is logged in.");
      return;
    }
    const userDocRef = doc(db, "users", user.uid);
    if (currentCategoryType === "expense") {
      console.log("Saving expense categories:", expenseCategories);
      await setDoc(userDocRef, { expenseCategories }, { merge: true });
    } else {
      console.log("Saving income categories:", incomeCategories);
      await setDoc(userDocRef, { incomeCategories }, { merge: true });
    }
    await loadCategoriesFromFirestore(user);
  }
  
  /**
   * Render the category list in the overlay popup based on currentCategoryType.
   */
  function renderCategoryList() {
    console.log("Rendering categories for type:", currentCategoryType);
    crCategoryList.innerHTML = "";
    const list = currentCategoryType === "expense" ? expenseCategories : incomeCategories;
    list.forEach(cat => {
      const card = document.createElement("div");
      card.className = "category-card";
      card.innerHTML = `
        <img src="./icons/${cat.icon}" alt="${cat.name}" />
        <div>${cat.name}</div>
      `;
      card.addEventListener("click", () => {
        // Remove 'selected' class from all category cards (except the plus button, which we'll assume doesn't have this class)
        crCategoryList.querySelectorAll(".category-card").forEach(c => c.classList.remove("selected"));
        
        // Mark this card as selected
        card.classList.add("selected");
        
        // Set the hidden input values based on the category type
        if (currentCategoryType === "income") {
          crChosenIncomeCategory.value = cat.name;
          crChosenIncomeCategoryText.textContent = cat.name;
        } else {
          crChosenExpenseCategory.value = cat.name;
          crChosenExpenseCategoryText.textContent = cat.name;
        }
        console.log(`Selected ${currentCategoryType} category: "${cat.name}"`);
      });
      crCategoryList.appendChild(card);
    });
    
    // The plus card is added separately from HTML (if needed) but in your current setup it’s defined in HTML,
    // so we do not add an extra plus card via JS here.
  }
  
  /**
   * Render the icons grid in the add-new category form.
   */
  function renderIconsGrid() {
    console.log("Rendering icons grid...");
    crIconsGrid.innerHTML = "";
    ICON_FILES.forEach(iconFile => {
      const btn = document.createElement("button");
      btn.innerHTML = `<img src="./icons/${iconFile}" alt="${iconFile}" />`;
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        crIconsGrid.querySelectorAll("button").forEach(b => b.classList.remove("selected-icon"));
        btn.classList.add("selected-icon");
        selectedIcon = iconFile;
        console.log("Icon selected:", iconFile);
      });
      crIconsGrid.appendChild(btn);
    });
  }
  
  
  /***************************************************
    EVENT LISTENERS
  ****************************************************/
  
  // Opening the category overlay from the transaction popup:
  crSelectIncomeCategoryBtn.addEventListener("click", () => {
    currentCategoryType = "income";
    crCategoryOverlay.classList.remove("hidden");
    crAddCatForm.classList.add("hidden");
    // Set the overlay tabs' active styling
    crCatIncomeTab.classList.add("active");
    crCatExpenseTab.classList.remove("active");
    renderCategoryList();
  });
  
  crSelectExpenseCategoryBtn.addEventListener("click", () => {
    currentCategoryType = "expense";
    crCategoryOverlay.classList.remove("hidden");
    crAddCatForm.classList.add("hidden");
    crCatExpenseTab.classList.add("active");
    crCatIncomeTab.classList.remove("active");
    renderCategoryList();
  });
  
  // Tab switching within the category overlay:
  crCatExpenseTab.addEventListener("click", () => {
    currentCategoryType = "expense";
    crCatExpenseTab.classList.add("active");
    crCatIncomeTab.classList.remove("active");
    renderCategoryList();
  });
  
  crCatIncomeTab.addEventListener("click", () => {
    currentCategoryType = "income";
    crCatIncomeTab.classList.add("active");
    crCatExpenseTab.classList.remove("active");
    renderCategoryList();
  });
  
  // Close the category overlay:
  crCloseCategoryPopup.addEventListener("click", () => {
    crCategoryOverlay.classList.add("hidden");
  });
  
  // Use the single HTML plus button to toggle the add-new form:
  crShowAddCatForm.addEventListener("click", () => {
    const isHidden = crAddCatForm.classList.toggle("hidden");
    if (!isHidden) {
      crNewCatName.value = "";
      selectedIcon = "";
      renderIconsGrid();
    }
  });
  
  // Save a new category from the add-new form:
  crSaveNewCatBtn.addEventListener("click", async () => {
    console.log("Save Category button clicked!");
    const newName = crNewCatName.value.trim();
    if (!newName) {
      alert("Please enter a category name!");
      return;
    }
    if (!selectedIcon) {
      alert("Please choose an icon!");
      return;
    }
    // Check for duplicates in the current type's list:
    const list = currentCategoryType === "expense" ? expenseCategories : incomeCategories;
    if (list.some(c => c.name.toLowerCase() === newName.toLowerCase())) {
      alert("Category name already exists!");
      return;
    }
    // Add the new category to the correct list:
    if (currentCategoryType === "expense") {
      expenseCategories.push({ name: newName, icon: selectedIcon });
    } else {
      incomeCategories.push({ name: newName, icon: selectedIcon });
    }
    // Save to Firestore and reload:
    await saveCategoriesToFirestore();
    crNewCatName.value = "";
    selectedIcon = "";
    crIconsGrid.innerHTML = "";
    renderIconsGrid();
    renderCategoryList();
    crAddCatForm.classList.add("hidden");
    alert("Category saved!");
  });
  
  ///////////////////////////////////////////////////
  // END: New Category Selection Code (with Firestore)
  ///////////////////////////////////////////////////
  
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
    const transactionPopup = document.getElementById("cr-transaction-popup");
    const closePopupButton = document.getElementById("cr-close-transaction-popup");
    
  const incomeTab = document.getElementById("cr-income-tab");
  const expenseTab = document.getElementById("cr-expense-tab");
  const incomeFields = document.getElementById("income-fields");
  const expenseFields = document.getElementById("expense-fields");
  // Grab the forgot-password-button element once at the top:
  const forgotPasswordBtn = document.getElementById("forgot-password-button");
  const transactionsButton = document.getElementById("transactions-button");
  
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
          
      -    // Check if email is verified
      -    await user.reload();
      if (!user.emailVerified) {
        alert("Please verify your email before logging in.");
        await signOut(auth);
        return;
      }
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
          // Make sure to include categories: [] if you want new docs to have them
          await setDoc(userDocRef, {
            balance: 0,
            budgets: [],
            expenses: [],
            categories: []
          }, { merge: true });
        }
    
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
        // Load categories so the user can pick them
        loadCategoriesFromFirestore(user); 
      } else {
        authContainer.style.display = "block";
        dashboardContainer.style.display = "none";
      }
    });
    
  // BEGGING OF THE TRANSACTION LISTING CODE
  /***************************************************
    TRANSACTIONS PANEL – FULL SCREEN, CARD STYLE, WITH BACK BUTTON
  ****************************************************/
  
  // Helper: Looks up the category icon URL from the stored categories
  function getCategoryIcon(tx) {
    // For income transactions, use the incomeCategories array; for expense, expenseCategories.
    let categoryName = tx.type === "Income" ? tx.source : tx.category;
    let categoryList = tx.type === "Income" ? incomeCategories : expenseCategories;
    if (!categoryName || !categoryList) return null;
    const found = categoryList.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    return found ? `./icons/${found.icon}` : null;
  }
  
  // Helper: Render a single transaction as a card
  function renderTransactionCard(tx) {
    const card = document.createElement("div");
    card.classList.add("transaction-card");
  
    // Icon area: if a category icon exists, use it; otherwise use a default icon.
    const icon = document.createElement("div");
    icon.classList.add("transaction-icon");
    const categoryIconUrl = getCategoryIcon(tx);
    if (categoryIconUrl) {
      icon.innerHTML = `<img src="${categoryIconUrl}" alt="${tx.type === "Income" ? tx.source : tx.category}" />`;
    } else {
      // Default icon (Font Awesome money icon)
      icon.innerHTML = `<i class="fa fa-money-bill-wave"></i>`;
    }
  
    // Details container
    const details = document.createElement("div");
    details.classList.add("transaction-details");
    
    const nameEl = document.createElement("div");
    nameEl.classList.add("transaction-name");
    nameEl.textContent = tx.type === "Income" ? tx.source : tx.category;
    
    const timeEl = document.createElement("div");
    timeEl.classList.add("transaction-time");
    const date = tx.timestamp ? new Date(tx.timestamp) : new Date();
    timeEl.textContent = date.toLocaleString();
    
    details.appendChild(nameEl);
    details.appendChild(timeEl);
    
    // Amount element
    const amountEl = document.createElement("div");
    amountEl.classList.add("transaction-amount");
    const amt = parseFloat(tx.amount).toFixed(2);
    amountEl.textContent = (tx.type === "Income" ? "+$" : "-$") + amt;
    if (tx.type === "Income") {
      amountEl.classList.add("positive");
    } else {
      amountEl.classList.add("negative");
    }
    
    // Assemble card
    card.appendChild(icon);
    card.appendChild(details);
    card.appendChild(amountEl);
    return card;
  }
  
  // Function to set active tab and load transactions accordingly
  async function setActiveTransactionTab(filter) {
    // Remove 'active' class from all tab buttons
    allTab.classList.remove("active");
    incomeTabList.classList.remove("active");
    expenseTabList.classList.remove("active");
  
    // Add 'active' to the selected tab
    if (filter === "all") {
      allTab.classList.add("active");
    } else if (filter === "income") {
      incomeTabList.classList.add("active");
    } else if (filter === "expense") {
      expenseTabList.classList.add("active");
    }
    
    await loadTransactions(filter);
  }
  
  // Function to load transactions from Firestore and render them as cards
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
      window.transactionsData = [];
      return;
    }
    const userData = userDoc.data();
    let incomes = userData.incomes || [];
    let expenses = userData.expenses || [];
  
    // Annotate each with a type property
    incomes = incomes.map(tx => ({ ...tx, type: "Income" }));
    expenses = expenses.map(tx => ({ ...tx, type: "Expense" }));
  
    // Combine all transactions and sort by timestamp descending
    let allTransactions = [...incomes, ...expenses];
    allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
    let transactionsToShow = [];
    if (filter === "all") {
      transactionsToShow = allTransactions;
    } else if (filter === "income") {
      transactionsToShow = incomes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (filter === "expense") {
      transactionsToShow = expenses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    window.transactionsData = transactionsToShow;
  
    // Render transaction cards
    transactionsListContent.innerHTML = "";
    if (transactionsToShow.length === 0) {
      transactionsListContent.innerHTML = "<p>No transactions found.</p>";
      return;
    }
    transactionsToShow.forEach(tx => {
      const card = renderTransactionCard(tx);
      transactionsListContent.appendChild(card);
    });
  }
  
  // Attach event listeners for the transaction tabs
  allTab.addEventListener("click", () => setActiveTransactionTab("all"));
  incomeTabList.addEventListener("click", () => setActiveTransactionTab("income"));
  expenseTabList.addEventListener("click", () => setActiveTransactionTab("expense"));
  
  // Event listener for opening the full-screen transactions panel
  transactionsButton.addEventListener("click", () => {
    setActiveTransactionTab("all"); // Default to All
    transactionsPage.classList.remove("hidden");
    transactionsPage.classList.add("show");
  });
  
  // Get references for the full-screen transactions panel and its back button
  const transactionsPage = document.getElementById("transactions-page");
  const closeTransactionsPage = document.getElementById("close-transactions-page");
  
  // When the back button is clicked, remove the 'show' class (which brings it on-screen),
  // then after the transition delay, add the 'hidden' class so it’s completely off-screen.
  closeTransactionsPage.addEventListener("click", () => {
    transactionsPage.classList.remove("show");
    setTimeout(() => {
      transactionsPage.classList.add("hidden");
    }, 300); // 300ms should match your CSS transition duration
  });
  
  
  // CSV download remains unchanged
  document.getElementById("download-transactions").addEventListener("click", () => {
    const transactions = window.transactionsData || [];
    if (transactions.length === 0) {
      alert("No transactions to download.");
      return;
    }
    let csv = "Type,Category/Source,Amount,Time\n";
    transactions.forEach(tx => {
      const type = tx.type;
      const categorySource = tx.type === "Income" ? tx.source : tx.category;
      const amount = parseFloat(tx.amount).toFixed(2);
      const time = tx.timestamp ? new Date(tx.timestamp).toLocaleString() : "";
      csv += `"${type}","${categorySource}",${amount},"${time}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  });
  
  
  // END OF THE TRANSACTION LISTING CODE
  
  
  
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
     
      // Update mobile profile images
      const mobileProfileIcon = document.getElementById("mobile-profile-icon");
      const mobileProfilePagePhoto = document.getElementById("profile-page-photo");
      mobileProfileIcon.src = data.photoUrl ? data.photoUrl : "default-avatar.png";
      mobileProfilePagePhoto.src = data.photoUrl ? data.photoUrl : "default-avatar.png";
    
      // Get the mobile modal elements
      const profilePageModal = document.getElementById("profile-page");
      const profilePageClose = document.getElementById("profile-page-close");
      const profilePageSettings = document.getElementById("profile-page-settings");
      const profilePageLogout = document.getElementById("profile-page-logout");
    
     // When the mobile profile icon is clicked, show the profile modal smoothly
     mobileProfileIcon.addEventListener("click", () => {
      profilePageModal.classList.add("show");
    });
    
    profilePageClose.addEventListener("click", () => {
      profilePageModal.classList.remove("show");
    });
    
    
      // When the mobile Settings button is clicked,
      // load the user’s profile name and icon into the settings modal
      // then open the settings modal.
      profilePageSettings.addEventListener("click", async () => {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            // Update settings modal elements with user data
            const profilePicPreview = document.getElementById("profile-pic-preview");
            const displayNameInput = document.getElementById("display-name-input");
            profilePicPreview.src = data.photoUrl ? data.photoUrl : "default-avatar.png";
            displayNameInput.value = data.displayName ? data.displayName : "";
          }
        }
        // Open settings modal and close mobile profile modal
        settingsModal.classList.remove("hide");
        settingsModal.classList.add("show");
        profilePageModal.classList.remove("show");
        profilePageModal.classList.add("hide");
      });
    
      // When the mobile Log Out button is clicked,
      // sign out the user and reload the page.
      profilePageLogout.addEventListener("click", async () => {
        try {
          await signOut(auth);
          
          location.reload();
        } catch (error) {
          console.error("Mobile logout error:", error);
          alert("An error occurred during logout.");
        }
      });
  
  
  
  
  
  
  
  // Then in the actual expense submit:
  document.getElementById("cr-expense-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("cr-popup-expense-amount").value);
    // Get the selected expense category from the hidden input
    const category = document.getElementById("cr-chosen-expense-category").value;
  
    if (!amount || !category) {
      alert("Please provide valid expense details.");
      return;
    }
    
    const user = auth.currentUser;
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.exists() ? userDoc.data() : { balance: 0, incomes: [], expenses: [] };
  
    const now = new Date();
    userData.expenses.push({
      amount,
      category,
      timestamp: now.toISOString()
    });
    userData.balance -= amount;
  
    await setDoc(userDocRef, userData, { merge: true });
    balanceDisplay.textContent = `$${userData.balance.toFixed(2)}`;
  
    document.getElementById("cr-expense-form").reset();
    // Close the transaction popup (using the new ID)
    document.getElementById("cr-transaction-popup").classList.add("hidden");
  });
  
  
  
  
  // Income form similarly
  document.getElementById("cr-income-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("cr-popup-income-amount").value);
    // Get the selected income source from the hidden input
    const source = document.getElementById("cr-chosen-income-category").value;
  
    if (!amount || !source) {
      alert("Please provide valid income details.");
      return;
    }
    
    const user = auth.currentUser;
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.exists() ? userDoc.data() : { balance: 0, incomes: [], expenses: [] };
  
    const now = new Date();
    userData.incomes.push({
      amount,
      source,
      timestamp: now.toISOString()
    });
    userData.balance += amount;
  
    await setDoc(userDocRef, userData, { merge: true });
    balanceDisplay.textContent = `$${userData.balance.toFixed(2)}`;
  
    document.getElementById("cr-income-form").reset();
    document.getElementById("cr-transaction-popup").classList.add("hidden");
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
// Prepare data for charts


const labels = ["Feb 6", "Feb 11", "Feb 15", "Feb 20", "Feb 25", "Mar 1", "Mar 6"];
const balanceData = [0, 300, 700, 1200, 1500, 1500, 1800]; // example data
(function renderBalanceChart() {
  // The single series for your balance
  const options = {
    chart: {
      type: 'area',
      height: 350,
      toolbar: { show: false },
      dropShadow: {
        enabled: true,
        top: 5,
        left: 0,
        blur: 5,
        opacity: 0.2,
        color: '#000'
      }
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    series: [
      {
        name: "Balance",
        data: balanceData // e.g. [0, 300, 700, 1200, 1500, 1500, 1800]
      }
    ],
    colors: ['#4285F4'], // pick your line color
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.4,
        opacityTo: 0.0,
        stops: [0, 90, 100]
      }
    },
    xaxis: {
      categories: labels, // e.g. ["Feb 6", "Feb 11", ...]
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { fontSize: '14px' }
      }
    },
    yaxis: {
      labels: {
        style: { fontSize: '14px' }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    grid: {
      borderColor: "rgba(0,0,0,0.1)",
      strokeDashArray: 4 // dotted lines
    },
    legend: { show: false }, // hide legend since there's only one series
    title: {
      text: "Balance Over Time",
      align: "center",
      style: { fontSize: '18px', fontWeight: 'bold' }
    }
  };

  const chart = new ApexCharts(
    document.querySelector("#balance-chart"),
    options
  );
  chart.render();
})();


      // Call your ApexCharts donut
      (function renderSpendingChart() {
        // Build category totals
        const catMap = {};
        (data.expenses || []).forEach(exp => {
          if (!catMap[exp.category]) catMap[exp.category] = 0;
          catMap[exp.category] += exp.amount;
        });
      
        const spendingCategories = Object.keys(catMap);
        const spendingAmounts = Object.values(catMap);
      
        // If no expenses, show a single slice
        if (spendingCategories.length === 0) {
          spendingCategories.push("No Expenses");
          spendingAmounts.push(0);
        }
      
        // Fancy donut options
        const donutOptions = {
          chart: {
            type: 'donut',
            height: 350,
            dropShadow: {
              enabled: true,
              top: 2,
              left: 2,
              blur: 4,
              color: '#000',
              opacity: 0.1
            },
            toolbar: { show: false }
          },
          plotOptions: {
            pie: {
              donut: {
                size: '60%',
                labels: {
                  show: true,
                  name: {
                    fontSize: '14px'
                  },
                  value: {
                    fontSize: '18px',
                    formatter: val => val
                  },
                  total: {
                    show: true,
                    label: 'Total',
                    fontSize: '16px',
                    color: '#333',
                    formatter: function (w) {
                      // Sum all slices
                      return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                    }
                  }
                }
              }
            }
          },
          dataLabels: { enabled: false },
          series: spendingAmounts,
          labels: spendingCategories,
          // pick any color palette you like
          colors: ['#66bb6a','#ffa726','#ef5350','#26c6da','#ab47bc','#ffee58'],
          fill: {
            type: 'gradient'
          },
          stroke: {
            show: true,
            width: 2,
            colors: ['#fff'] // white stroke separating slices
          },
          title: {
            text: "Spending Overview",
            align: "center",
            style: { fontSize: '18px', fontWeight: 'bold' }
          },
          legend: {
            position: 'bottom',
            fontSize: '14px'
          },
          responsive: [{
            breakpoint: 768,
            options: {
              chart: {
                height: 300
              },
              legend: {
                fontSize: '12px'
              },
              title: {
                style: { fontSize: '16px' }
              }
            }
          }]
        };
      
        const spendingChart = new ApexCharts(
          document.querySelector("#spending-chart"),
          donutOptions
        );
        spendingChart.render();
      })();
      
      
    // --- Recent Transactions Section ---

// Combine incomes and expenses (add a 'type' property to each)
let incomes = data.incomes ? data.incomes.map(tx => ({ ...tx, type: "Income" })) : [];
let expenses = data.expenses ? data.expenses.map(tx => ({ ...tx, type: "Expense" })) : [];

// Combine and sort all transactions (most recent first)
let allTransactions = [...incomes, ...expenses];
allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

// Function to render the recent transactions list (only last 6 for the chosen filter)
function renderRecentTransactions(filter) {
  let filteredTransactions;
  if (filter === "income") {
    filteredTransactions = incomes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } else if (filter === "expense") {
    filteredTransactions = expenses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } else {
    filteredTransactions = allTransactions;
  }
  
  const recent = filteredTransactions.slice(0, 6);
  const container = document.getElementById("recent-transactions-list");
  container.innerHTML = ""; // Clear any previous content

  if (!recent.length) {
    container.innerHTML = "<p>No recent transactions.</p>";
    return;
  }
  
  recent.forEach(tx => {
    // Create a card/row for each transaction
    const card = document.createElement("div");
    card.classList.add("recent-tx-item");

    const txLabel = tx.type === "Income" ? tx.source : tx.category;
    const date = tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : "N/A";
    const sign = tx.type === "Income" ? "+" : "-";
    const amount = parseFloat(tx.amount).toFixed(2);

    card.innerHTML = `
      <span class="tx-label">${txLabel}</span>
      <span class="tx-date">${date}</span>
      <span class="tx-amount ${tx.type === "Income" ? "positive" : "negative"}">
        ${sign}$${amount}
      </span>
    `;
    container.appendChild(card);
  });
}

// Helper to update active recent tab styling
function setActiveRecentTab(filter) {
  const tabs = document.querySelectorAll(".recent-tab");
  tabs.forEach(btn => btn.classList.remove("active"));
  document.getElementById(`recent-${filter}-tab`).classList.add("active");
}

// Attach event listeners for recent transactions tabs
document.getElementById("recent-all-tab").addEventListener("click", () => {
  setActiveRecentTab("all");
  renderRecentTransactions("all");
});
document.getElementById("recent-income-tab").addEventListener("click", () => {
  setActiveRecentTab("income");
  renderRecentTransactions("income");
});
document.getElementById("recent-expense-tab").addEventListener("click", () => {
  setActiveRecentTab("expense");
  renderRecentTransactions("expense");
});

// Initially render the "all" filter
renderRecentTransactions("all");

// Event listener for the "View All Transactions" button
document.getElementById("view-all-transactions").addEventListener("click", () => {
  // Assuming 'transactionsPage' is the full-screen panel
  setActiveTransactionTab("all"); // Use your existing full-panel tab function
  transactionsPage.classList.remove("hidden");
  transactionsPage.classList.add("show");
});

      
  
    } else {
      // If no user data exists, initialize defaults
      await setDoc(userDocRef, {
        balance: 0,
        incomes: [],
        expenses: [],
        categories: []
      }, { merge: true });
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
  document.getElementById("cr-income-form").addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const user = auth.currentUser;
    if (!user) {
      alert("Please log in first!");
      return;
    }
  
    const amount = parseFloat(document.getElementById("cr-popup-income-amount").value);
    const source = document.getElementById("cr-popup-income-source").value;
  
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
    document.getElementById("cr-income-form").reset();
    transactionPopup.classList.add("hidden");
  
    // Success notification
    
  });
  
  
  // Handle Expense Form Submission
  document.getElementById("cr-expense-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const user = auth.currentUser;
  if (!user) {
    alert("Please log in first!");
    return;
  }
  
    const amount = parseFloat(document.getElementById("cr-popup-expense-amount").value);
    const category = document.getElementById("cr-popup-expense-category").value;
  
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
    document.getElementById("cr-expense-form").reset();
    transactionPopup.classList.add("hidden");
   
  });
  
    incomeTab.addEventListener("click", () => {
      incomeTab.classList.add("active");
      expenseTab.classList.remove("active");
      document.getElementById("cr-income-form").classList.add("active");
      document.getElementById("cr-income-form").classList.remove("hidden");
      document.getElementById("cr-expense-form").classList.add("hidden");
      document.getElementById("cr-expense-form").classList.remove("active");
    });
    
    expenseTab.addEventListener("click", () => {
      expenseTab.classList.add("active");
      incomeTab.classList.remove("active");
      document.getElementById("cr-expense-form").classList.add("active");
      document.getElementById("cr-expense-form").classList.remove("hidden");
      document.getElementById("cr-income-form").classList.add("hidden");
      document.getElementById("cr-income-form").classList.remove("active");
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
  
  
  
  










