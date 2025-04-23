// avoid colliding with the <canvas id="comparisonChart"> global
let insightsComparisonChart = null;
let budgetSummaryChart     = null;

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider, 
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  arrayUnion,         // keep this
  onSnapshot          // and keep this
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";
function deviceHashASCII(str) {
  // 1) remove all characters above ASCII 127
  const asciiOnly = str.replace(/[^\x00-\x7F]/g, "");
  // 2) btoa the sanitized string
  return btoa(asciiOnly);
}

async function addLog(type) {
  const user = auth.currentUser;
  if (!user) return;

  const ua = navigator.userAgent;
  const dev = navigator.platform + " - " + ua.split(") ")[0].split("(").pop();
  const hash = deviceHashASCII(dev);
  localStorage.setItem("deviceHash", hash);

  const log = {
    type,
    device: dev,
    timestamp: Date.now()
  };

  // Ensure array is initialized safely
  const userDocRef = doc(db, "users", user.uid);
  await setDoc(userDocRef, { logs: arrayUnion(log) }, { merge: true });
}




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
// Global variables
let auth;
let db;
let storage; // Declare storage here as a global variable

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
      try {
        await setPersistence(auth, browserLocalPersistence);
        console.log("Local persistence set.");
      } catch (error) {
        console.error("Error setting persistence:", error);
      }
      
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
  function buildDailyNetBalanceSeries(incomes = [], expenses = []) {
    // 1) Build a map: dayString -> totalChange
    //    Example dayString: "2023-03-09"
    const dayMap = {};
  
    // Helper to format a date to "YYYY-MM-DD"
    function formatDay(dateObj) {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  
    // Go through incomes (positive amounts)
    incomes.forEach(inc => {
      const dateObj = new Date(inc.timestamp);
      const dayStr = formatDay(dateObj);
      const amount = parseFloat(inc.amount);
      if (!dayMap[dayStr]) dayMap[dayStr] = 0;
      dayMap[dayStr] += amount;
    });
  
    // Go through expenses (negative amounts)
    expenses.forEach(exp => {
      const dateObj = new Date(exp.timestamp);
      const dayStr = formatDay(dateObj);
      const amount = -parseFloat(exp.amount);
      if (!dayMap[dayStr]) dayMap[dayStr] = 0;
      dayMap[dayStr] += amount;
    });
  
    // 2) Convert the dayMap into an array of { date: Date, totalChange: number }
    //    and sort by date ascending.
    let dayEntries = Object.keys(dayMap).map(dayStr => {
      // Rebuild a Date object from dayStr
      // (the time will be midnight for that day)
      const [yyyy, mm, dd] = dayStr.split("-");
      const dateObj = new Date(yyyy, mm - 1, dd);
      return {
        date: dateObj,
        totalChange: dayMap[dayStr]
      };
    });
    dayEntries.sort((a, b) => a.date - b.date);
  
    // 3) Build a running total so the chart can show net balance over time
    let runningTotal = 0;
    const series = dayEntries.map(entry => {
      runningTotal += entry.totalChange;
      return {
        x: entry.date,
        y: parseFloat(runningTotal.toFixed(2))  // This rounds the running total to two decimals
      };
    });
    
  
    return series;
  }


  
  ///////////////////////////////////////////////////
  // BEGIN: New Category Selection Code (with Firestore)
  // Supports separate Expense & Income categories in the overlay
  ///////////////////////////////////////////////////
  
  // Global arrays for the user's categories by type
  let expenseCategories = [];
  let incomeCategories = [];
  
  // The list of all available icon filenames
 // The list of all available icon filenames
const ICON_FILES = [
  "airplane.png",
  "bank.png",
  "barber-shop.png",
  "bill (1).png",
  "bills.png",
  "books.png",
  "car.png",
  "child.png",
  "coffee-cup.png",
  "computer.png",
  "computer1.png",
  "contactless.png",
  "cryptocurrency.png",
  "dining.png",
  "drinks.png",
  "education.png",
  "entertainment.png",
  "freelance.png",
  "gas-station.png",
  "gifts.png",
  "groceries.png",
  "gym.png",
  "insurance.png",
  "investments.png",
  "life-insurance.png",
  "love.png",
  "mortgage-loan.png",
  "netflix.png",
  "online-shopping.png",
  "pet.png",
  "prevention.png",
  "rent-income.png",
  "rewinding.png",
  "salary.png",
  "settings.png",
  "shopping.png",
  "smartphone.png",
  "smartphone1.png",
  "subscription.png",
  "taxes.png",
  "television.png",
  "track.png",
  "transit.png",
  "uber.png",
  "water.png",
  "wifi.png"
];

// Default expense categories (reference whichever icons make sense)
const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Groceries",       icon: "groceries.png"       },
  { name: "Rent",            icon: "bills.png"           },
  { name: "Dining",          icon: "dining.png"          },
  { name: "Shopping",        icon: "shopping.png"        },
  { name: "Online Shopping", icon: "online-shopping.png" },
  { name: "Transit",         icon: "transit.png"         },
  { name: "Entertainment",   icon: "entertainment.png"   },
  { name: "Coffee",          icon: "coffee-cup.png"      },
  { name: "Gas Station",     icon: "gas-station.png"     },
  { name: "Car",             icon: "car.png"             },
  { name: "Uber",            icon: "uber.png"            },
  { name: "Water",           icon: "water.png"           },
  { name: "Insurance",       icon: "insurance.png"       },
  { name: "Life Insurance",  icon: "life-insurance.png"  },
  { name: "Mortgage",        icon: "mortgage-loan.png"   },
  { name: "Taxes",           icon: "taxes.png"           },
  { name: "Pet",             icon: "pet.png"             },
  { name: "Child",           icon: "child.png"           },
  { name: "Gym",             icon: "gym.png"             },
  { name: "Drinks",          icon: "drinks.png"          }
];

// Default income categories
const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary",       icon: "salary.png"        },
  { name: "Freelance",    icon: "freelance.png"     },
  { name: "Investments",  icon: "investments.png"   },
  { name: "Gifts",        icon: "gifts.png"         },
  { name: "Rent Income",  icon: "rent-income.png"   },
  { name: "Bank",         icon: "bank.png"          }
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
  // near your other DOM references:
const crShowAddCatForm = document.getElementById("cr-show-add-cat-form");
const crAddCatForm = document.getElementById("cr-add-cat-form");

  // Category overlay (popup) elements
  const crCategoryOverlay = document.getElementById("cr-category-overlay");
  const crCloseCategoryPopup = document.getElementById("cr-close-category-popup");
  const crCategoryList = document.getElementById("cr-category-list");

  const crNewCatName = document.getElementById("cr-new-cat-name");
  const crIconBgColor = document.getElementById("cr-icon-bgcolor");

  const crIconsGrid = document.getElementById("cr-icons-grid");
  const crSaveNewCatBtn = document.getElementById("cr-save-new-cat-btn");
  
  // Category overlay tabs (for switching between Expense and Income)
  // These IDs are unique for the overlay and do not conflict with the transaction popup toggles.
  const crCatExpenseTab = document.getElementById("cr-cat-expense-tab");
  const crCatIncomeTab = document.getElementById("cr-cat-income-tab");
  
  // Keep track of the icon chosen in the add-new form
  let selectedBgColor = "#ffffff"; // or some default
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
  document.addEventListener("DOMContentLoaded", () => {
    const colorCircles = document.querySelectorAll('.color-circle');
    colorCircles.forEach(circle => {
      // each circle has a data-color attribute
      const colorVal = circle.dataset.color || '#fff';
      circle.style.backgroundColor = colorVal;
  
      circle.addEventListener("click", () => {
        // Clear existing borders (so only one circle is selected)
        colorCircles.forEach(c => c.style.borderColor = 'transparent');
        // Highlight the clicked circle
        circle.style.borderColor = '#4caf50';
  
        // Save the color in our global variable
        selectedBgColor = colorVal;
  
        // If you have a “preview icon” up top:
        const previewIconEl = document.querySelector('.preview-icon');
        if (previewIconEl) {
          previewIconEl.style.backgroundColor = colorVal;
        }
      });
    });
  });
  
  
  
  function renderCategoryList() {
    // 1) Which list to show?
    const list = (currentCategoryType === "expense") ? expenseCategories : incomeCategories;
  
    // 2) Grab a reference to the plus button before clearing
    const plusBtn = document.getElementById("cr-show-add-cat-form");
  
    // 3) Clear category-list but then re-inject the plus button
    const crCategoryList = document.getElementById("cr-category-list");
    crCategoryList.innerHTML = "";
    crCategoryList.appendChild(plusBtn);
  
    // 4) Render each category card
    list.forEach((cat) => {
      const card = document.createElement("div");
      card.classList.add("category-card");
  
      card.innerHTML = `
        <div class="icon-circle" style="background-color: ${cat.bgColor || '#eee'};">
          <img src="./icons/${cat.icon}" alt="${cat.name}" />
        </div>
        <div>${cat.name}</div>
      `;
  
      card.addEventListener("click", () => {
        // handle selecting this category, e.g.:
        if (currentCategoryType === "expense") {
          crChosenExpenseCategory.value = cat.name;
          crChosenExpenseCategoryText.textContent = cat.name;
        } else {
          crChosenIncomeCategory.value = cat.name;
          crChosenIncomeCategoryText.textContent = cat.name;
        }
        // close overlay, etc.
        document.getElementById("cr-category-overlay").classList.add("hidden");
      });
  
      crCategoryList.appendChild(card);
    });
  }
  
    
 // Show the full-screen form when user clicks "+"
crShowAddCatForm.addEventListener("click", () => {
  crAddCatForm.classList.remove("hidden");

  crNewCatName.value = "";
  selectedIcon = "";
  if (crIconBgColor) crIconBgColor.value = "#ffffff";
  crIconsGrid.innerHTML = "";
  renderIconsGrid();
});

// Close the full-screen form when user clicks the "X"
const crCloseAddCatForm = document.getElementById("cr-close-add-cat-form");
crCloseAddCatForm.addEventListener("click", () => {
  crAddCatForm.classList.add("hidden");
});


  
  /**
   * Render the icons grid in the add-new category form.
   */
  function renderIconsGrid() {
    crIconsGrid.innerHTML = "";
    ICON_FILES.forEach(iconFile => {
      const btn = document.createElement("button");
      btn.innerHTML = `<img src="./icons/${iconFile}" alt="${iconFile}" />`;
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        // remove highlight from others
        crIconsGrid.querySelectorAll("button").forEach(b => b.classList.remove("selected-icon"));
        btn.classList.add("selected-icon");
  
        selectedIcon = iconFile;
  
        // If you have a preview image element
        const previewImg = document.getElementById("cat-preview-img");
        if (previewImg) {
          previewImg.src = `./icons/${iconFile}`;
        }
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
  

  /***************************************************
  SAVE A NEW CATEGORY (with background color)
****************************************************/
crSaveNewCatBtn.addEventListener("click", async () => {
  // Validate
  const newName = crNewCatName.value.trim();
  if (!newName) {
    alert("Please enter a category name!");
    return;
  }
  if (!selectedIcon) {
    alert("Please choose an icon!");
    return;
  }

  // Construct the category object
  const newCategory = {
    name: newName,
    icon: selectedIcon,
    bgColor: selectedBgColor  // <--- store the color
  };

  // Push it into expenseCategories or incomeCategories
  if (currentCategoryType === "expense") {
    expenseCategories.push(newCategory);
  } else {
    incomeCategories.push(newCategory);
  }

  // Save to Firestore
  await saveCategoriesToFirestore();

  // Reset form fields & re-render
  crNewCatName.value = "";
  selectedIcon = "";
  selectedBgColor = "#ffffff";
  crIconsGrid.innerHTML = "";
  renderIconsGrid();
  renderCategoryList();

  // Hide the "Add New Category" popup and show the category overlay again if you like
  crAddCatForm.classList.add("hidden");
  crCategoryOverlay.classList.remove("hidden");


});


  
  ///////////////////////////////////////////////////
  // END: New Category Selection Code (with Firestore)
  ///////////////////////////////////////////////////
  // Show the full-screen overlay
// Function to show and hide sections properly
  // Function to switch between sections (assumes each section is a child of #main-content)
  /************************************************
  Show / Hide Sections
************************************************/
// Global utility to highlight the active sidebar nav item
// Modified showSection to handle active state on mobile
// Modified showSection to handle active state on mobile

function showSection(sectionId) {
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => {
    section.classList.add('hidden');
  });

  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.remove('hidden');
  } else {
    console.error(`Section with ID ${sectionId} not found`);
  }
}
function setMobileNavActiveState(sectionId) {
  const mobileNavItems = document.querySelectorAll('.bottom-nav .nav-item, .bottom-nav .profile-icon-container');
  mobileNavItems.forEach(item => {
    // Skip the "Add Transaction" button to prevent it from being marked as active
    if (item.id !== 'add-transaction-button') {
      item.classList.remove('active');
    }
  });

  const sectionToNavMap = {
    'dashboard-section': 'home-button',
    'budgets-page': 'budgets-button',
    'transactions-section': 'transactions-button',
    'profile-section': 'mobile-profile-container'
  };

  const activeNavId = sectionToNavMap[sectionId];
  if (activeNavId) {
    const activeNavItem = document.getElementById(activeNavId);
    if (activeNavItem) {
      // Add a slight delay to make the transition feel smoother
      setTimeout(() => {
        activeNavItem.classList.add('active');
      }, 50);
    }
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const profileSection = document.getElementById('profile-section');
  const walletsSection = document.getElementById('wallet-page-section');
  const addTransactionButton = document.getElementById('add-transaction-button');
  const addTransactionButtonDesktop = document.getElementById('add-transaction-button-desktop');

  // Function to toggle button visibility
  const toggleButtons = () => {
    const isProfileVisible = (profileSection && !profileSection.classList.contains('hidden')) ||
                            (walletsSection && !walletsSection.classList.contains('hidden'));
    if (isProfileVisible) {
      addTransactionButton.style.display = 'none';
      if (addTransactionButtonDesktop) addTransactionButtonDesktop.style.display = 'none';
    } else {
      addTransactionButton.style.display = ''; // Restore default display
      if (addTransactionButtonDesktop) addTransactionButtonDesktop.style.display = '';
    }
  };

  // Run on page load
  toggleButtons();

  // Observe changes to profile and wallets sections' classes
  [profileSection, walletsSection].forEach(section => {
    if (section) {
      const observer = new MutationObserver(toggleButtons);
      observer.observe(section, { attributes: true, attributeFilter: ['class'] });
    }
  });
});
document.addEventListener('DOMContentLoaded', () => {
  showSection('dashboard-section');
  setMobileNavActiveState('dashboard-section');

  // Mobile event listeners
  document.getElementById('home-button')?.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Home button clicked');
    showSection('dashboard-section');
    setMobileNavActiveState('dashboard-section');
  });

  document.getElementById('budgets-button')?.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Budgets button clicked');
    showSection('budgets-page');
    setMobileNavActiveState('budgets-page');
    listenToBudgets();
  });


  document.getElementById('transactions-button')?.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Transactions button clicked');
    showSection('transactions-section'); // Note: This line is correct in the updated code
    setMobileNavActiveState('transactions-section');
    setActiveTransactionTab('all');
  });
  document.getElementById('mobile-profile-icon')?.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Profile icon clicked');
    showSection('profile-section');
    setMobileNavActiveState('profile-section');
  });

  document.getElementById('add-transaction-button')?.addEventListener('click', openTransactionPopup);
  document.getElementById('add-transaction-button-desktop')?.addEventListener('click', openTransactionPopup);

  // Desktop event listeners
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isCollapsed = sidebar.classList.toggle('collapsed');
      document.body.classList.remove('nav-expanded', 'nav-collapsed');
      document.body.classList.add(isCollapsed ? 'nav-collapsed' : 'nav-expanded');
    });
  }

  if (sidebar) {
    const isCollapsed = sidebar.classList.contains('collapsed');
    document.body.classList.add(isCollapsed ? 'nav-collapsed' : 'nav-expanded');
  }

  document.getElementById('home-button-desktop')?.addEventListener('click', () => {
    showSection('dashboard-section');
    setActiveNavItem('home-button-desktop');
  });
  
  document.getElementById('budgets-button-desktop')?.addEventListener('click', () => {
    showSection('budgets-page');
    setActiveNavItem('budgets-button-desktop');
    listenToBudgets();
  });
  
  document.getElementById('transactions-button-desktop')?.addEventListener('click', () => {
    showSection('transactions-section');
    setActiveNavItem('transactions-button-desktop');
    setActiveTransactionTab('all');
  });
  
  document.getElementById('profile-button-desktop')?.addEventListener('click', () => {
    showSection('profile-section');
    setActiveNavItem('profile-button-desktop');
  });

  document.getElementById('logout-button-desktop')?.addEventListener('click', async () => {
    console.log("Desktop logout clicked.");
    if (!auth) {
      console.error("Auth is not defined or user not logged in.");
      return;
    }
    try {
      await signOut(auth);
      window.location.reload();
    } catch (err) {
      console.error("Logout error:", err);
      alert("Error logging out. Check console for details.");
    }
  });
});
// Shared logic to open the transaction popup
function openTransactionPopup() {
  const popup = document.getElementById('cr-transaction-popup');
  if (popup) popup.classList.remove('hidden');
}

// Mobile button
document.getElementById('add-transaction-button')?.addEventListener('click', openTransactionPopup);

// Desktop button
document.getElementById('add-transaction-button-desktop')?.addEventListener('click', openTransactionPopup);


function setActiveNavItem(navItemId) {
  // Remove 'active' class from all desktop nav items
  const desktopNavItems = document.querySelectorAll('.sidebar .nav-item');
  desktopNavItems.forEach(item => {
    item.classList.remove('active');
  });

  // Add 'active' class to the clicked nav item
  const activeNavItem = document.getElementById(navItemId);
  if (activeNavItem) {
    activeNavItem.classList.add('active');
  } else {
    console.error(`Nav item with ID ${navItemId} not found`);
  }
}
/************************************************************
 * ==========  BUDGETS PAGE & MODAL LOGIC  ===============
 ************************************************************/

// Show Budgets Page
document.getElementById('budgets-button')?.addEventListener('click', (e) => {
  e.preventDefault();
  showSection('budgets-page');

  // Instead of calling loadBudgets once,
  // start the real-time listener
  listenToBudgets();
});


// Open the "Add Budget" modal
document.getElementById('add-budget-button')?.addEventListener('click', () => {
  document.getElementById('add-budget-modal').classList.remove('hidden');
  loadUserCategoriesForBudget();
});

// Back button to close modal
const backButton = document.getElementById('back-button');
if (backButton) {
  backButton.addEventListener('click', () => {
    document.getElementById('add-budget-modal').classList.add('hidden');
  });
}
function renderBudgets(userDocData) {
  let { budgets = [], incomes = [], expenses = [] } = userDocData;

  incomes = incomes.map(tx => ({ ...tx, type: "Income" }));
  expenses = expenses.map(tx => ({ ...tx, type: "Expense" }));
  const allTransactions = [...incomes, ...expenses];

  const budgetsGrid = document.querySelector(".budgets-grid");
  budgetsGrid.innerHTML = "";

  // If no budgets exist, show a message
  if (budgets.length === 0) {
    const msg = document.createElement("p");
    msg.textContent = "No budgets available. Click 'New Budget' to create one.";
    msg.classList.add("no-budgets");
    budgetsGrid.appendChild(msg);
    return;
  }

  // Existing code to loop over and render each budget card:
  budgets.forEach((budget) => {
    let currentAmount = 0;
    const startDate = new Date(budget.start);
    const hasDeadline = budget.deadline && budget.deadline.trim() !== "";
    const endDate = hasDeadline ? new Date(budget.deadline) : null;
  
    allTransactions.forEach((tx) => {
      const txDate = new Date(tx.timestamp);
      const inRange = txDate >= startDate && (!endDate || txDate <= endDate);
      if (!inRange) return;
  
      if (budget.type === "expense") {
        if (tx.type === "Expense" && budget.categories.includes(tx.category)) {
          currentAmount += parseFloat(tx.amount);
        }
      } else if (budget.type === "savings") {
        if (tx.type === "Income" && budget.categories.includes(tx.source)) {
          currentAmount += parseFloat(tx.amount);
        }
      }
    });
  
    const progress = budget.goal > 0
      ? Math.min((currentAmount / budget.goal) * 100, 100)
      : 0;
  
    const card = document.createElement("div");
    card.className = "budget-card";
    card.style.borderLeft = `5px solid ${budget.color || "var(--primary-color)"}`;
  
    const labelText = (budget.type === "expense") ? "Spent" : "Saved";
  
    card.innerHTML = `
      <div class="budget-card-header">
        <i class="fa-solid fa-wallet"></i>
        <h3>${budget.name}</h3>
      </div>
      <p>Goal: $${budget.goal.toFixed(2)}</p>
      <p>${labelText}: $${currentAmount.toFixed(2)}</p>
      <div class="progress-bar-container">
        <div class="progress-bar" style="width: ${progress}%;"></div>
      </div>
      <p>${budget.description || ''}</p>
      <p class="deadline">
        ${ hasDeadline ? 'Deadline: ' + new Date(budget.deadline).toLocaleDateString() : '' }
      </p>
    `;
  
    card.addEventListener('click', () => {
      openBudgetDetailsPopup(budget, allTransactions);
    });
  
    budgetsGrid.appendChild(card);
  });
}


 
/***************************************************
  DOM REFERENCES FOR BUDGET DETAILS + DELETE POPUPS
****************************************************/
const budgetDetailsPopup = document.getElementById("budget-details-popup");
const bdpTitle = document.getElementById("bdp-title");
const bdpGoal = document.getElementById("bdp-goal");
const bdpProgressBar = document.getElementById("bdp-progress-bar");
const bdpProgressText = document.getElementById("bdp-progress-text");
const bdpChartEl = document.getElementById("bdp-chart");
const bdpTransactionsList = document.getElementById("bdp-transactions-list");

const bdpBackButton = document.getElementById("bdp-back-button");
const bdpDeleteButton = document.getElementById("bdp-delete-button");

const deleteBudgetPopup = document.getElementById("delete-budget-popup");
const deleteBudgetMessage = document.getElementById("delete-budget-message");
const cancelDeleteBudget = document.getElementById("cancel-delete-budget");
const confirmDeleteBudget = document.getElementById("confirm-delete-budget");

// Keep track of whichever budget is "open" in the popup
let currentOpenBudget = null;

// For the ApexCharts instance in the popup
let bdpChartInstance = null;
async function deleteBudget(budgetId) {
  // 1) Get current user
  const user = auth.currentUser;
  if (!user) return;
  
  // 2) Load user doc
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);
  if (!userDoc.exists()) return;
  
  // 3) Filter out the budget with matching ID
  const data = userDoc.data();
  const oldBudgets = data.budgets || [];
  const newBudgets = oldBudgets.filter((b) => b.id !== budgetId);
  
  // 4) Save updated budgets array
  await setDoc(userDocRef, { budgets: newBudgets }, { merge: true });
}

async function openBudgetDetailsPopup(budget, allTx) {
  // Store the currently open budget so we can delete it later if needed
  currentOpenBudget = budget;

  // Show the popup
  budgetDetailsPopup.classList.remove("hidden");

  // 1) Calculate how much is currently spent or saved
  //    (depending on budget.type === 'expense' or 'savings')
  let currentAmount = 0;

  const startDate = new Date(budget.start);
  const hasDeadline = budget.deadline && budget.deadline.trim() !== "";
  const endDate = hasDeadline ? new Date(budget.deadline) : null;

  // Filter transactions that fall within the date range and match categories
  const relevantTx = allTx.filter(tx => {
    const txDate = new Date(tx.timestamp);
    const inRange = txDate >= startDate && (!endDate || txDate <= endDate);

    if (!inRange) return false;

    if (budget.type === "expense") {
      // We only care about "Expense" transactions with matching category
      return (tx.type === "Expense") && budget.categories.includes(tx.category);
    } else {
      // We only care about "Income" transactions with matching category (like tx.source)
      return (tx.type === "Income") && budget.categories.includes(tx.source);
    }
  });

  // Sum up the amounts
  relevantTx.forEach(tx => {
    currentAmount += parseFloat(tx.amount);
  });

  // 2) Display the budget title & goal
  bdpTitle.textContent = budget.name || "Untitled Budget";
  bdpGoal.textContent = `Goal: $${(budget.goal || 0).toFixed(2)}`;

  // 3) Update the progress bar & text
  let spentOrSavedLabel = (budget.type === "expense") ? "Spent" : "Saved";
  let progress = 0;
  if (budget.goal && budget.goal > 0) {
    progress = Math.min((currentAmount / budget.goal) * 100, 100);
  }
  bdpProgressText.textContent = `${progress.toFixed(1)}% of goal ${spentOrSavedLabel}`;

  // If you added <div id="bdp-progress-fill">:
  const bdpProgressFill = document.getElementById("bdp-progress-fill");
  if (bdpProgressFill) {
    bdpProgressFill.style.width = progress.toFixed(1) + "%";
  }

  // 4) Render the chart (Spent vs. Remaining), using ApexCharts
  //    Destroy any previous chart instance if it exists (avoid duplicates).
  if (bdpChartInstance) {
    bdpChartInstance.destroy();
  }

  const spent = currentAmount;
  const remaining = Math.max(budget.goal - spent, 0);

  const chartOptions = {
    chart: {
      type: 'donut',
      height: 300,
      width: '100%',
      parentHeightOffset: 0
    },
    labels: [spentOrSavedLabel, 'Remaining'],
    series: [spent, remaining],
    colors: [(budget.type === 'expense') ? '#f44336' : '#4caf50', '#9e9e9e'], // Just an example
    legend: {
      position: 'bottom'
    }
  };

  bdpChartInstance = new ApexCharts(bdpChartEl, chartOptions);
  await bdpChartInstance.render();

  // 5) Build the transaction list
  bdpTransactionsList.innerHTML = ""; // clear old data

  relevantTx.forEach(tx => {
    // Create a container div
    const card = document.createElement("div");
    card.classList.add("bdp-transaction-card");

    // Icon circle
    const iconCircle = document.createElement("div");
    iconCircle.classList.add("bdp-icon-circle");
    // If your transaction objects have tx.icon, use that. 
    // Otherwise you might store category icons in a lookup.
    // 1) If this tx.type === "Expense", look in expenseCategories
//    if it's Income, look in incomeCategories
let matchedCat;
if (tx.type === "Expense") {
  matchedCat = expenseCategories.find(c => c.name === tx.category);
} else {
  matchedCat = incomeCategories.find(c => c.name === tx.source);
}

// 2) matchedCat will be undefined if not found, so fallback to 'default.png'
const iconFile = matchedCat?.icon || "default.png";

iconCircle.innerHTML = `<img src="./icons/${iconFile}" alt="${tx.category}">`;

    // Transaction details
    const detailsDiv = document.createElement("div");
    detailsDiv.classList.add("bdp-transaction-details");

    const titleEl = document.createElement("div");
    titleEl.classList.add("bdp-transaction-title");
    titleEl.textContent = tx.title || "Untitled";

    const catEl = document.createElement("div");
    catEl.classList.add("bdp-transaction-category");
    catEl.textContent = tx.category || tx.source || "No category";

    detailsDiv.appendChild(titleEl);
    detailsDiv.appendChild(catEl);

    // Amount
    const amountEl = document.createElement("div");
    amountEl.classList.add("bdp-transaction-amount");
    const amt = parseFloat(tx.amount) || 0;
    amountEl.textContent = `$${amt.toFixed(2)}`;
    if (tx.type === "Expense") {
      amountEl.classList.add("negative");
    } else {
      amountEl.classList.add("positive");
    }

    // Append all to card
    card.appendChild(iconCircle);
    card.appendChild(detailsDiv);
    card.appendChild(amountEl);

    // Finally, append card to the container list
    bdpTransactionsList.appendChild(card);
  });
}
/***************************************************
  BUDGET POPUP BUTTON HANDLERS
****************************************************/
bdpBackButton.addEventListener("click", () => {
  // Simply hide the budget details popup
  budgetDetailsPopup.classList.add("hidden");
});

bdpDeleteButton.addEventListener("click", () => {
  // Show the delete confirmation popup
  deleteBudgetPopup.classList.remove("hidden");
});

cancelDeleteBudget.addEventListener("click", () => {
  // Hide the delete confirmation
  deleteBudgetPopup.classList.add("hidden");
});

confirmDeleteBudget.addEventListener("click", async () => {
  if (!currentOpenBudget) {
    alert("No budget is currently open.");
    return;
  }

  try {
    // Actually delete the budget from Firestore or wherever you store it
    await deleteBudget(currentOpenBudget.id); 
    // ^ You need to implement this function or adapt it to your data structure
   
  } catch (error) {
    console.error("Error deleting budget:", error);
    alert("Something went wrong while deleting the budget.");
  }

  // Hide both popups
  deleteBudgetPopup.classList.add("hidden");
  budgetDetailsPopup.classList.add("hidden");
});
bdpDeleteButton.addEventListener('click', () => {
  deleteBudgetMessage.textContent = currentOpenBudget?.name || "";
  deleteBudgetPopup.classList.remove('hidden');
});

function listenToBudgets() {
  const user = auth.currentUser;
  if (!user) return; // or wait until onAuthStateChanged says we have a user

  const userDocRef = doc(db, "users", user.uid);

  // Attach real-time listener
  onSnapshot(userDocRef, (snapshot) => {
    if (!snapshot.exists()) {
      console.log("No user doc yet.");
      return;
    }

    const userDocData = snapshot.data();
    // Re-render the budgets in real time
    renderBudgets(userDocData);
  }, (error) => {
    console.error("Error with onSnapshot for budgets:", error);
  });
}

/************************************************************
 * ==========  TOGGLE DEADLINE CHECKBOX  ===================
 ************************************************************/
const enableDeadlineCheckbox = document.getElementById('enable-deadline');

enableDeadlineCheckbox?.addEventListener('change', () => {
  if (enableDeadlineCheckbox.checked) {
    calendarInputEnd.classList.remove('hidden');
  } else {
    calendarInputEnd.classList.add('hidden');
    // Clear existing end date if unchecking
    document.getElementById('budget-end').value = '';
  }
});

/************************************************************
 * ==========  LOAD USER CATEGORIES  =======================
 ************************************************************/
function loadUserCategoriesForBudget() {
  const container = document.getElementById('budget-categories');
  if (!container) return;
  container.innerHTML = '';

  // Expense header
  const expenseHeader = document.createElement('div');
  expenseHeader.classList.add('cat-section-header');
  expenseHeader.textContent = 'Expense Categories';
  container.appendChild(expenseHeader);

  // Expense chips
  expenseCategories.forEach((cat) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'cat-chip';
    chip.textContent = cat.name;
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
    });
    container.appendChild(chip);
  });

  // Income header
  const incomeHeader = document.createElement('div');
  incomeHeader.classList.add('cat-section-header');
  incomeHeader.textContent = 'Income Categories';
  container.appendChild(incomeHeader);

  // Income chips
  incomeCategories.forEach((cat) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'cat-chip';
    chip.textContent = cat.name;
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
    });
    container.appendChild(chip);
  });
}

/************************************************************
 * ==========  HANDLE ADD BUDGET FORM SUBMISSION  ==========
 ************************************************************/
document.getElementById('add-budget-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Gather form field values
  const name = document.getElementById('budget-name').value.trim();
  const isExpenseTabActive = document.getElementById('budget-expense-tab').classList.contains('active');
  const type = isExpenseTabActive ? 'expense' : 'savings';
  const goal = parseFloat(document.getElementById('budget-goal').value);
  const color = document.getElementById('budget-color').value;
  
  // Start date: if blank, default to today
  const startInputVal = document.getElementById('budget-start').value;
  const start = startInputVal ? new Date(startInputVal).toISOString() : new Date().toISOString();
  
  // Deadline, if "Set a Deadline?" is checked
  const budgetEndInput = document.getElementById('budget-end');
  let deadline = '';
  if (enableDeadlineCheckbox.checked && budgetEndInput.value) {
    deadline = new Date(budgetEndInput.value).toISOString();
  }
  
  const description = document.getElementById('budget-description').value.trim();
  
  // Gather selected category chips
  const selectedChips = document.querySelectorAll('#budget-categories .cat-chip.selected');
  const categories = Array.from(selectedChips).map((chip) => chip.textContent);
  
  // Create a unique ID for the new budget
  const newBudget = {
    id: `${Date.now()}`,
    name,
    type,
    goal,
    color,
    start,
    deadline,
    description,
    categories,
    spent: 0,
    createdAt: new Date().toISOString()
  };
  
  // Show the loading overlay
  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) {
    loadingOverlay.classList.remove("hidden");
  }
  
  // Save the new budget to Firestore
  const user = auth.currentUser;
  if (!user) return;
  
  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);
  let budgets = [];
  if (userDoc.exists()) {
    budgets = userDoc.data().budgets || [];
  }
  budgets.push(newBudget);
  
  await setDoc(userDocRef, { budgets }, { merge: true });
  
  // Hide the loading overlay after save completes
  if (loadingOverlay) {
    loadingOverlay.classList.add("hidden");
  }
  
  // (Optional) Reload budgets if you don't rely solely on real-time listeners:
  if (typeof loadBudgets === "function") {
    loadBudgets();
  }
  
  // Clear the form fields and selections
  document.getElementById('add-budget-form').reset();
  document.querySelectorAll('.color-swatch').forEach((s) => s.classList.remove('selected'));
  document.querySelector('.color-swatch[data-color="#4caf50"]')?.classList.add('selected');
  document.querySelectorAll('#budget-categories .cat-chip.selected')
    .forEach((chip) => chip.classList.remove('selected'));
  
  // Close the budget modal popup
  document.getElementById('add-budget-modal').classList.add('hidden');
});


/************************************************************
 * ==========  BUDGET TYPE TAB SWITCHING   =================
 ************************************************************/
document.getElementById('budget-expense-tab')?.addEventListener('click', () => {
  document.getElementById('budget-expense-tab').classList.add('active');
  document.getElementById('budget-savings-tab').classList.remove('active');
});

document.getElementById('budget-savings-tab')?.addEventListener('click', () => {
  document.getElementById('budget-savings-tab').classList.add('active');
  document.getElementById('budget-expense-tab').classList.remove('active');
});

/************************************************************
 * ==========  CUSTOM COLOR PICKER LOGIC  ===================
 ************************************************************/
const colorSwatches = document.querySelectorAll('.color-swatch');
colorSwatches.forEach((swatch) => {
  swatch.addEventListener('click', () => {
    colorSwatches.forEach((s) => s.classList.remove('selected'));
    swatch.classList.add('selected');
    document.getElementById('budget-color').value =
      swatch.getAttribute('data-color');
  });
});

/************************************************************
 * ==========  MATERIAL-STYLE DATE PICKER LOGIC  ============
 ************************************************************/
// Two triggers for Start/End date
const calendarInputStart = document.getElementById('calendar-input-start');
const calendarInputEnd   = document.getElementById('calendar-input-end');

// Track which input we're updating
let currentDate     = new Date();
let selectedDate    = new Date();
let datePickerTarget = null;  // "start" or "end"

// Overlay & date picker elements
const mdpOverlay      = document.getElementById('mdp-overlay');
const mdpHeaderTitle  = document.getElementById('mdp-header-title');
const mdpSubtitle     = document.getElementById('mdp-header-subtitle');
const mdpMonthYear    = document.getElementById('mdp-month-year');
const mdpCalendarGrid = document.querySelector('.mdp-calendar-grid');

const mdpPrevMonth = document.getElementById('mdp-prev-month');
const mdpNextMonth = document.getElementById('mdp-next-month');
const mdpCancel    = document.getElementById('mdp-cancel');
const mdpOk        = document.getElementById('mdp-ok');

/** Trigger: Start date */
calendarInputStart?.addEventListener('click', () => {
  datePickerTarget = 'start';
  mdpOverlay.classList.remove('hidden');
  currentDate = new Date(selectedDate.valueOf());
  renderCalendar();
  updateHeaderInfo();
});

/** Trigger: End date */
calendarInputEnd?.addEventListener('click', () => {
  // Only open if "Set a Deadline?" is checked
  if (!enableDeadlineCheckbox.checked) return;

  datePickerTarget = 'end';
  mdpOverlay.classList.remove('hidden');
  currentDate = new Date(selectedDate.valueOf());
  renderCalendar();
  updateHeaderInfo();
});

/** Cancel => hide overlay */
mdpCancel?.addEventListener('click', () => {
  mdpOverlay.classList.add('hidden');
});

/** OK => fill #budget-start or #budget-end */
mdpOk?.addEventListener('click', () => {
  const dateString = formatDate(selectedDate, 'MMM d, yyyy');

  if (datePickerTarget === 'start') {
    document.getElementById('budget-start').value = dateString;
  } else if (datePickerTarget === 'end') {
    document.getElementById('budget-end').value = dateString;
  }

  mdpOverlay.classList.add('hidden');
});

/** Next / Prev Month */
mdpPrevMonth?.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
  updateHeaderInfo();
});
mdpNextMonth?.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
  updateHeaderInfo();
});

/** Update date picker UI */
function updateHeaderInfo() {
  mdpHeaderTitle.textContent = 'Select Date';
  mdpSubtitle.textContent     = formatDate(selectedDate, 'EEE, MMM d');
  mdpMonthYear.textContent    = formatDate(currentDate, 'MMMM yyyy');
}

/** Render the calendar days */
function renderCalendar() {
  // Clear old day cells
  const oldCells = mdpCalendarGrid.querySelectorAll('.mdp-cell:not(.header)');
  oldCells.forEach((cell) => cell.remove());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Blank cells before day 1
  for (let i = 0; i < firstDay; i++) {
    const blankCell = document.createElement('div');
    blankCell.classList.add('mdp-cell', 'inactive');
    mdpCalendarGrid.appendChild(blankCell);
  }

  // Actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const cell = document.createElement('div');
    cell.classList.add('mdp-cell');
    cell.textContent = day;

    // Highlight if it's the currently selected date
    if (
      dateObj.getFullYear() === selectedDate.getFullYear() &&
      dateObj.getMonth() === selectedDate.getMonth() &&
      dateObj.getDate() === selectedDate.getDate()
    ) {
      cell.classList.add('selected');
    }

    cell.addEventListener('click', () => {
      selectedDate = new Date(dateObj);
      mdpCalendarGrid.querySelectorAll('.mdp-cell.selected')
        .forEach((c) => c.classList.remove('selected'));
      cell.classList.add('selected');
      mdpSubtitle.textContent = formatDate(selectedDate, 'EEE, MMM d');
    });

    mdpCalendarGrid.appendChild(cell);
  }
}

/** Utility: formatDate(date, pattern) */
function formatDate(date, pattern) {
  const shortDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const shortMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const longMonths = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  const yy = date.getFullYear();
  const mm = date.getMonth();
  const dd = date.getDate();
  const dayOfWeek = date.getDay();

  switch (pattern) {
    case 'EEE, MMM d':
      return `${shortDays[dayOfWeek]}, ${shortMonths[mm]} ${dd}`;
    case 'MMMM yyyy':
      return `${longMonths[mm]} ${yy}`;
    case 'MMM d, yyyy':
      return `${shortMonths[mm]} ${dd}, ${yy}`;
    default:
      // fallback => "3/21/2025"
      return `${mm + 1}/${dd}/${yy}`;
  }
}


/************************************************
  Profile Page Card Event Listeners
************************************************/
/* 
   Replace these placeholders with actual logic 
   (e.g., opening modals, navigating, etc.) 
*/
document.getElementById('profile-card-premium').addEventListener('click', (e) => {
  e.preventDefault();
  alert("Premium functionality coming soon!");
});

document.getElementById('profile-card-connect-bank').addEventListener('click', (e) => {
  e.preventDefault();
  alert("Connect Bank functionality coming soon!");
});





document.addEventListener('DOMContentLoaded', () => {
  // Utility Functions
  function showWalletAlert(message) {
    const alertOverlay = document.getElementById('wallet-alert-overlay');
    const alertMessage = document.getElementById('wallet-alert-message');
    alertMessage.textContent = message;
    alertOverlay.classList.remove('hidden');
    if ('vibrate' in navigator) navigator.vibrate(100);
  }

  document.getElementById('wallet-alert-ok-btn').addEventListener('click', () => {
    document.getElementById('wallet-alert-overlay').classList.add('hidden');
  });

  function showWalletSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
      section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
  }

  // Wallets Page
  document.getElementById('profile-card-wallets').addEventListener('click', (e) => {
    e.preventDefault();
    showWalletSection('wallet-page-section');
    loadWalletPage();
  });

  document.getElementById('wallet-back-btn').addEventListener('click', () => {
    showWalletSection('profile-section');
  });

  async function loadWalletPage() {
    const accountList = document.getElementById('wallet-account-list');
    accountList.innerHTML = '<p>Loading...</p>';
    const user = auth.currentUser;

    if (!user) {
      accountList.innerHTML = '<p class="no-accounts">No accounts found. Add one to get started.</p>';
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        let accounts = data.accounts || [];

        if (accounts.length === 0) {
          accountList.innerHTML = '<p class="no-accounts">No accounts found. Add one to get started.</p>';
        } else {
          accountList.innerHTML = '';
          accounts.forEach(account => renderWalletAccountCard(account));
          setupWalletGestureNavigation(accounts);
        }
        updateWalletSummary(accounts);
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
      showWalletAlert('Error loading wallets.');
    }

    // Search Functionality
    const searchInput = document.getElementById('wallet-search-input');
    document.getElementById('wallet-search-toggle-btn').addEventListener('click', () => {
      searchInput.classList.toggle('active');
      if (searchInput.classList.contains('active')) {
        searchInput.focus();
      }
    });

    searchInput.addEventListener('input', (e) => {
      filterWalletAccounts(e.target.value);
    });
  }

  function renderWalletAccountCard(account) {
    const accountList = document.getElementById('wallet-account-list');
    const accountCard = document.createElement('div');
    accountCard.classList.add('wallet-account-card', `account-${account.type}`);
    accountCard.dataset.accountId = account.id;

    let iconClass = 'fas fa-wallet';
    if (account.type === 'checking') iconClass = 'fas fa-university';
    else if (account.type === 'savings') iconClass = 'fas fa-piggy-bank';
    else if (account.type === 'cash') iconClass = 'fas fa-money-bill-wave';

    const progress = account.goal ? (account.balance / account.goal) * 100 : 0;
    const budgetWarning = account.budgetLimit && account.balance < (account.budgetLimit * 0.2)
      ? '<span class="wallet-budget-warning">Low Balance!</span>'
      : '';

    accountCard.innerHTML = `
      ${budgetWarning}
      <div class="wallet-account-header">
        <div class="wallet-account-icon"><i class="${iconClass}"></i></div>
        <div class="wallet-account-info">
          <h3>${account.name}</h3>
          <p>${account.number ? '****' + account.number : 'No account number'}</p>
          <p class="wallet-account-balance">Balance: $${parseFloat(account.balance).toFixed(2)}</p>
        </div>
      </div>
      <div class="wallet-balance-indicator" style="--progress: ${progress}%"></div>
    `;

    accountCard.addEventListener('click', () => openWalletAccountDetails(account));
    accountList.appendChild(accountCard);
  }

  // Add Account
  const addButtons = [
    document.getElementById('wallet-add-account-btn'),
    document.getElementById('wallet-add-account-btn-header')
  ];
  addButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const overlay = document.getElementById('wallet-add-account-overlay');
      overlay.querySelectorAll('input').forEach(input => input.value = '');
      document.getElementById('wallet-account-type-select').value = 'checking';
      overlay.classList.remove('hidden');
    });
  });

  document.getElementById('wallet-close-add-account-overlay').addEventListener('click', () => {
    document.getElementById('wallet-add-account-overlay').classList.add('hidden');
  });

  document.getElementById('wallet-add-account-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('wallet-save-account-btn');
    submitBtn.classList.add('processing');

    const name = document.getElementById('wallet-account-name-input').value.trim();
    const type = document.getElementById('wallet-account-type-select').value;
    const number = document.getElementById('wallet-account-number-input').value.trim();
    const balance = parseFloat(document.getElementById('wallet-initial-balance-input').value);
    const goal = parseFloat(document.getElementById('wallet-account-goal-input').value) || null;
    const budgetLimit = parseFloat(document.getElementById('wallet-budget-limit-input').value) || null;

    if (!name || isNaN(balance)) {
      showWalletAlert('Please fill in required fields correctly.');
      resetWalletButton(submitBtn, 'Save Account');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      showWalletAlert('You must be logged in.');
      resetWalletButton(submitBtn, 'Save Account');
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      let accounts = userDoc.exists() ? (userDoc.data().accounts || []) : [];

      const newAccount = { id: Date.now().toString(), name, type, number: number || null, balance, goal, budgetLimit, transfers: [] };
      accounts.push(newAccount);

      await setDoc(userDocRef, { accounts }, { merge: true });
      submitBtn.classList.remove('processing');
      submitBtn.classList.add('success');
      setTimeout(() => {
        document.getElementById('wallet-add-account-overlay').classList.add('hidden');
        resetWalletButton(submitBtn, 'Save Account');
        loadWalletPage();
        if ('vibrate' in navigator) navigator.vibrate(200);
      }, 1000);
    } catch (error) {
      console.error('Error adding account:', error);
      showWalletAlert('Failed to add account.');
      resetWalletButton(submitBtn, 'Save Account');
    }
  });

  function resetWalletButton(btn, text) {
    btn.classList.remove('processing', 'success');
    btn.innerHTML = `<span>${text}</span><div class="wallet-spinner"></div><i class="fas fa-check wallet-success-check"></i>`;
  }

  // Account Details
  async function openWalletAccountDetails(account) {
    const overlay = document.getElementById('wallet-account-details-overlay');
    document.getElementById('wallet-account-details-title').textContent = account.name;
    document.getElementById('wallet-account-details-overlay').dataset.accountId = account.id;

    const icon = overlay.querySelector('.wallet-account-icon i');
    icon.className = 'fas fa-wallet';
    if (account.type === 'checking') icon.className = 'fas fa-university';
    else if (account.type === 'savings') icon.className = 'fas fa-piggy-bank';
    else if (account.type === 'cash') icon.className = 'fas fa-money-bill-wave';

    overlay.querySelector('.wallet-account-balance').textContent = `Balance: $${parseFloat(account.balance).toFixed(2)}`;
    overlay.querySelector('.wallet-account-number').textContent = account.number ? '****' + account.number : 'No account number';

    const transactionsList = document.getElementById('wallet-transactions-list-items');
    transactionsList.innerHTML = '';
    const transfers = account.transfers || [];
    if (transfers.length === 0) {
      transactionsList.innerHTML = '<li>No transfers yet.</li>';
    } else {
      transfers.forEach(transfer => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${transfer.date}</span><span>Transfer - $${parseFloat(transfer.amount).toFixed(2)}</span>`;
        transactionsList.appendChild(li);
      });
    }

    overlay.classList.remove('hidden');
  }

  document.getElementById('wallet-close-account-details-overlay').addEventListener('click', () => {
    document.getElementById('wallet-account-details-overlay').classList.add('hidden');
  });

  // Edit Account
  document.getElementById('wallet-edit-account-btn').addEventListener('click', async () => {
    const accountId = document.getElementById('wallet-account-details-overlay').dataset.accountId;
    const user = auth.currentUser;
    if (!user) {
      showWalletAlert('You must be logged in.');
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const accounts = userDoc.exists() ? (userDoc.data().accounts || []) : [];
      const account = accounts.find(acc => acc.id === accountId);

      const overlay = document.getElementById('wallet-edit-account-overlay');
      document.getElementById('wallet-edit-account-name-input').value = account.name;
      document.getElementById('wallet-edit-account-type-select').value = account.type;
      document.getElementById('wallet-edit-account-number-input').value = account.number || '';
      document.getElementById('wallet-edit-initial-balance-input').value = account.balance;
      document.getElementById('wallet-edit-account-goal-input').value = account.goal || '';
      document.getElementById('wallet-edit-budget-limit-input').value = account.budgetLimit || '';
      overlay.classList.remove('hidden');
    } catch (error) {
      console.error('Error loading edit account overlay:', error);
      showWalletAlert('Failed to load edit account overlay.');
    }
  });

  document.getElementById('wallet-close-edit-account-overlay').addEventListener('click', () => {
    document.getElementById('wallet-edit-account-overlay').classList.add('hidden');
  });

  document.getElementById('wallet-edit-account-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('wallet-update-account-btn');
    submitBtn.classList.add('processing');

    const accountId = document.getElementById('wallet-account-details-overlay').dataset.accountId;
    const name = document.getElementById('wallet-edit-account-name-input').value.trim();
    const type = document.getElementById('wallet-edit-account-type-select').value;
    const number = document.getElementById('wallet-edit-account-number-input').value.trim();
    const balance = parseFloat(document.getElementById('wallet-edit-initial-balance-input').value);
    const goal = parseFloat(document.getElementById('wallet-edit-account-goal-input').value) || null;
    const budgetLimit = parseFloat(document.getElementById('wallet-edit-budget-limit-input').value) || null;

    if (!name || isNaN(balance)) {
      showWalletAlert('Please fill in required fields correctly.');
      resetWalletButton(submitBtn, 'Update Account');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      showWalletAlert('You must be logged in.');
      resetWalletButton(submitBtn, 'Update Account');
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      let accounts = userDoc.exists() ? (userDoc.data().accounts || []) : [];
      const accountIndex = accounts.findIndex(acc => acc.id === accountId);

      accounts[accountIndex] = {
        ...accounts[accountIndex],
        name,
        type,
        number: number || null,
        balance,
        goal,
        budgetLimit
      };

      await setDoc(userDocRef, { accounts }, { merge: true });
      submitBtn.classList.remove('processing');
      submitBtn.classList.add('success');
      setTimeout(() => {
        document.getElementById('wallet-edit-account-overlay').classList.add('hidden');
        resetWalletButton(submitBtn, 'Update Account');
        loadWalletPage();
        const accountDetailsOverlay = document.getElementById('wallet-account-details-overlay');
        if (!accountDetailsOverlay.classList.contains('hidden')) {
          openWalletAccountDetails(accounts[accountIndex]);
        }
        if ('vibrate' in navigator) navigator.vibrate(200);
      }, 1000);
    } catch (error) {
      console.error('Error updating account:', error);
      showWalletAlert('Failed to update account.');
      resetWalletButton(submitBtn, 'Update Account');
    }
  });

  // Delete Account
  document.getElementById('wallet-delete-account-btn').addEventListener('click', async () => {
    const accountId = document.getElementById('wallet-account-details-overlay').dataset.accountId;
    const user = auth.currentUser;
    if (!user) {
      showWalletAlert('You must be logged in.');
      return;
    }

    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      let accounts = userDoc.exists() ? (userDoc.data().accounts || []) : [];
      accounts = accounts.filter(acc => acc.id !== accountId);

      await setDoc(userDocRef, { accounts }, { merge: true });
      document.getElementById('wallet-account-details-overlay').classList.add('hidden');
      loadWalletPage();
      if ('vibrate' in navigator) navigator.vibrate(200);
    } catch (error) {
      console.error('Error deleting account:', error);
      showWalletAlert('Failed to delete account.');
    }
  });

  // Transfer Funds
  document.getElementById('wallet-transfer-from-account-btn').addEventListener('click', () => {
    const accountId = document.getElementById('wallet-account-details-overlay').dataset.accountId;
    openWalletTransferOverlay(accountId);
  });

  async function openWalletTransferOverlay(accountId) {
    const overlay = document.getElementById('wallet-transfer-overlay');
    const fromSelect = document.getElementById('wallet-transfer-from-select');
    const toSelect = document.getElementById('wallet-transfer-to-select');
    const transferDetails = document.getElementById('wallet-transfer-details');

    const user = auth.currentUser;
    if (!user) {
      showWalletAlert('You must be logged in.');
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const accounts = userDoc.exists() ? (userDoc.data().accounts || []) : [];

      if (accounts.length < 2) {
        showWalletAlert('You need at least two accounts to transfer funds.');
        return;
      }

      fromSelect.innerHTML = toSelect.innerHTML = '';
      accounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.id;
        option.textContent = `${account.name} ($${parseFloat(account.balance).toFixed(2)})`;
        fromSelect.appendChild(option.cloneNode(true));
        toSelect.appendChild(option);
      });

      fromSelect.value = accountId;
      const selectedAccount = accounts.find(acc => acc.id === accountId);
      transferDetails.innerHTML = `
        <p><strong>From:</strong> ${selectedAccount.name}</p>
        <p><strong>Available:</strong> $${parseFloat(selectedAccount.balance).toFixed(2)}</p>
      `;

      overlay.classList.remove('hidden');
    } catch (error) {
      console.error('Error loading transfer overlay:', error);
      showWalletAlert('Failed to load transfer overlay.');
    }
  }

  document.getElementById('wallet-close-transfer-overlay').addEventListener('click', () => {
    document.getElementById('wallet-transfer-overlay').classList.add('hidden');
  });

  document.getElementById('wallet-transfer-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('wallet-transfer-btn');
    submitBtn.classList.add('processing');

    const fromId = document.getElementById('wallet-transfer-from-select').value;
    const toId = document.getElementById('wallet-transfer-to-select').value;
    const amount = parseFloat(document.getElementById('wallet-transfer-amount-input').value);

    if (fromId === toId || isNaN(amount) || amount <= 0) {
      showWalletAlert(fromId === toId ? 'Cannot transfer to the same account.' : 'Please enter a valid amount.');
      resetWalletButton(submitBtn, 'Transfer');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      showWalletAlert('You must be logged in.');
      resetWalletButton(submitBtn, 'Transfer');
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      let accounts = userDoc.exists() ? (userDoc.data().accounts || []) : [];

      const fromAccount = accounts.find(acc => acc.id === fromId);
      const toAccount = accounts.find(acc => acc.id === toId);

      if (fromAccount.balance < amount) {
        showWalletAlert('Insufficient funds.');
        resetWalletButton(submitBtn, 'Transfer');
        return;
      }

      fromAccount.balance -= amount;
      toAccount.balance += amount;

      const transferDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
      fromAccount.transfers = fromAccount.transfers || [];
      toAccount.transfers = toAccount.transfers || [];
      fromAccount.transfers.unshift({ date: transferDate, amount: -amount });
      toAccount.transfers.unshift({ date: transferDate, amount });

      await setDoc(userDocRef, { accounts }, { merge: true });
      submitBtn.classList.remove('processing');
      submitBtn.classList.add('success');
      setTimeout(() => {
        document.getElementById('wallet-transfer-overlay').classList.add('hidden');
        resetWalletButton(submitBtn, 'Transfer');
        loadWalletPage();
        const accountDetailsOverlay = document.getElementById('wallet-account-details-overlay');
        if (!accountDetailsOverlay.classList.contains('hidden')) {
          const account = accounts.find(acc => acc.id === accountDetailsOverlay.dataset.accountId);
          openWalletAccountDetails(account);
        }
        if ('vibrate' in navigator) navigator.vibrate(200);
      }, 1000);
    } catch (error) {
      console.error('Error processing transfer:', error);
      showWalletAlert('Failed to process transfer.');
      resetWalletButton(submitBtn, 'Transfer');
    }
  });

  // Search
  async function filterWalletAccounts(query) {
    const user = auth.currentUser;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    let accounts = userDoc.exists() ? (userDoc.data().accounts || []) : [];
    accounts = accounts.filter(acc => acc.name.toLowerCase().includes(query.toLowerCase()));

    const accountList = document.getElementById('wallet-account-list');
    accountList.innerHTML = '';
    accounts.forEach(account => renderWalletAccountCard(account));
  }

  // Gesture Navigation
  function setupWalletGestureNavigation(accounts) {
    const cards = document.querySelectorAll('.wallet-account-card');
    cards.forEach(card => {
      let startX, startY;
      card.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      });

      card.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = endX - startX;
        const diffY = endY - startY;

        if (Math.abs(diffX) > 50 && Math.abs(diffY) < 50) {
          if (diffX > 0) {
            const account = accounts.find(acc => acc.id === card.dataset.accountId);
            openWalletTransferOverlay(account.id);
          }
        }
      });
    });
  }

  // Summary Update
  function updateWalletSummary(accounts) {
    const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
    document.getElementById('wallet-total-balance').textContent = `$${totalBalance.toFixed(2)}`;
    document.getElementById('wallet-account-count').textContent = accounts.length;
    document.getElementById('balance').textContent = `$${totalBalance.toFixed(2)}`;
  }
});




// Open Categories Full Page
document.getElementById('profile-card-categories').addEventListener('click', () => {
  document.getElementById('categories-full-page').classList.add('open');
  loadFullCategoriesPage();
});

// Back button to Profile Page
document.getElementById('back-from-categories').addEventListener('click', () => {
  document.getElementById('categories-full-page').classList.remove('open');
});

async function loadFullCategoriesPage() {
  const container = document.getElementById('categories-content');
  container.innerHTML = "<p>Loading...</p>";

  const user = auth.currentUser;
  if (!user) {
    container.innerHTML = "<p>Please log in to view categories.</p>";
    return;
  }

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const data = userDoc.exists() ? userDoc.data() : {};

    const incomeCategories = data.incomeCategories || [];
    const expenseCategories = data.expenseCategories || [];

    container.innerHTML = `
      <section class="category-section">
        <h3>Income Categories</h3>
        <div class="category-list">
          ${incomeCategories.map(cat => `
            <div class="category-item" style="background-color: ${cat.bgColor || '#4CAF50'};">
              <img src="./icons/${cat.icon}" alt="${cat.name}" class="category-icon">
              <span>${cat.name}</span>
            </div>`).join('')}
        </div>
      </section>

      <section class="category-section">
        <h3>Expense Categories</h3>
        <div class="category-list">
          ${expenseCategories.map(cat => `
            <div class="category-item" style="background-color: ${cat.bgColor || '#f44336'};">
              <img src="./icons/${cat.icon}" alt="${cat.name}" class="category-icon">
              <span>${cat.name}</span>
            </div>`).join('')}
        </div>
      </section>
    `;

  } catch (error) {
    container.innerHTML = `<p>Error loading categories: ${error.message}</p>`;
  }
}






document.getElementById('profile-card-export-data').addEventListener('click', (e) => {
  e.preventDefault();
  const page = document.getElementById('export-data-page');
  page.classList.remove('hidden');
  page.classList.add('open');
});

document.getElementById("back-from-export").addEventListener("click", () => {
  const page = document.getElementById('export-data-page');
  page.classList.remove('open');
  page.classList.add('hidden');

  showSection("profile-section"); // if needed
});

document.getElementById("download-all-data").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return alert("You must be logged in.");

  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    let data = userDoc.data();
    let incomes = (data.incomes || []).map(tx => ({ ...tx, type: "Income" }));
    let expenses = (data.expenses || []).map(tx => ({ ...tx, type: "Expense" }));
    let allTx = [...incomes, ...expenses].sort((a, b) => b.timestamp - a.timestamp);
    downloadTransactionsCSV(allTx);
  } else {
    alert("No data found.");
  }
});
function downloadTransactionsCSV(transactions) {
  if (!transactions || transactions.length === 0) {
    alert("No transactions to download.");
    return;
  }

  let csv = "Type,Category/Source,Amount,Time\n";
  transactions.forEach(tx => {
    const type = tx.type || "Unknown";
    const categorySource = type === "Income" ? (tx.source || "") : (tx.category || "");
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
}


document.getElementById('profile-card-passcode').addEventListener('click', (e) => {
  e.preventDefault();
  alert("Passcode functionality coming soon!");
});

// Logs Card
document.getElementById('profile-card-logs').addEventListener('click', (e) => {
  e.preventDefault();
  openLogsPopup();
});
// Logs Card Click Event
document.getElementById('profile-card-logs').addEventListener('click', async (e) => {
  e.preventDefault();
  await openLogsPopup();
});

// Open Logs Popup Function
async function openLogsPopup() {
  const logsPopup = document.getElementById("logs-popup");
  const logsContainer = document.getElementById("logs-container");
  
  logsContainer.innerHTML = "<p>Loading logs...</p>";

  const user = auth.currentUser;
  if (!user) {
    logsContainer.innerHTML = "<p>Please log in to view logs.</p>";
    showPopup(logsPopup);
    return;
  }

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      logsContainer.innerHTML = "<p>No logs available.</p>";
    } else {
      const logs = Array.isArray(userDoc.data().logs) ? userDoc.data().logs : [];

      if (logs.length === 0) {
        logsContainer.innerHTML = "<p>No logs available.</p>";
      } else {
        renderLogs(logs, logsContainer);
      }
    }
  } catch (error) {
    logsContainer.innerHTML = `<p>Error fetching logs: ${error.message}</p>`;
  }

  showPopup(logsPopup);
}

// Render logs function (separation of concerns)
function renderLogs(logs, container) {
  container.innerHTML = ""; // Clear previous logs
  logs.sort((a, b) => b.timestamp - a.timestamp);
  
  logs.forEach(log => {
    const logDiv = document.createElement("div");
    logDiv.classList.add("log-item");
    
    const timestampSpan = document.createElement("span");
    timestampSpan.classList.add("timestamp");
    timestampSpan.textContent = new Date(log.timestamp).toLocaleString();

    const messageSpan = document.createElement("span");
    messageSpan.classList.add("log-message");
    messageSpan.textContent = `[${log.type}] - ${log.device}`;

    logDiv.appendChild(timestampSpan);
    logDiv.appendChild(messageSpan);
    
    container.appendChild(logDiv);
  });
}

// Helper to show popup smoothly
function showPopup(popup) {
  popup.classList.remove("hidden");
  setTimeout(() => popup.classList.add("show"), 10);
}

// Close popup event
document.getElementById("close-logs-popup").addEventListener("click", () => {
  const logsPopup = document.getElementById("logs-popup");
  logsPopup.classList.remove("show");
  setTimeout(() => logsPopup.classList.add("hidden"), 300); // Allow smooth closing animation
});

// Instead, call openSettingsModal() so user info is fetched:
document.getElementById('profile-settings-button').addEventListener('click', (e) => {
  e.preventDefault();
  openSettingsModal();
});

document.getElementById('profile-logout-button').addEventListener('click', async () => {
  try {
    await signOut(auth);          // uses the same Firebase auth instance
    window.location.reload();
  } catch (err) {
    console.error('Logout error:', err);
    alert('Error logging out.');
  }
});


// The function that actually loads user data from Firestore and shows the modal
async function openSettingsModal() {
  const settingsModal = document.getElementById("settings-modal");
  const profilePicPreview = document.getElementById("profile-pic-preview");
  const displayNameInput = document.getElementById("display-name-input");
  const themeToggle = document.getElementById("theme-toggle");
  const emailNotificationsCheckbox = document.getElementById("email-notifications");
  const pushNotificationsCheckbox = document.getElementById("push-notifications");
  const currencySelect = document.getElementById("currency-select");

  const user = auth.currentUser;
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      // Fill the modal fields
      profilePicPreview.src = data.photoUrl ? data.photoUrl : "default-avatar.png";
      displayNameInput.value = data.displayName ? data.displayName : "";
      if (data.preferences) {
        
        emailNotificationsCheckbox.checked = data.preferences.emailNotifications || false;
        pushNotificationsCheckbox.checked = data.preferences.pushNotifications || false;
        if (data.preferences.currency) {
          currencySelect.value = data.preferences.currency;
        }
      }
    }
  }
  
  // Ensure we remove any leftover classes
  settingsModal.classList.remove("hidden", "hide");
  settingsModal.classList.add("show");
}

// Close the modal consistently (from a "close" button inside the modal)
document.getElementById('close-settings').addEventListener('click', function(e) {
  e.preventDefault();
  const settingsModal = document.getElementById('settings-modal');
  // Hide it properly so it can be opened again
  settingsModal.classList.remove('show');
  settingsModal.classList.add('hidden');
});
/************************************************
  Window Resize Logic
************************************************/
window.addEventListener("resize", function () {
  // If the screen is resized to desktop width
  // while the profile section is visible, show dashboard
  if (window.innerWidth >= 769) {
    if (!document.getElementById("profile-section").classList.contains("hidden")) {
      showSection("dashboard-section"); // Return to home page on desktop resize
    

    }
  }
});



  const initializeFirebaseFeatures = (app) => {
    auth = getAuth(app);
    db = getFirestore(app);
   
  
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
  const loadingOverlay = document.getElementById("loading-overlay");
  // Show the full-screen loading overlay and disable the save button
  loadingOverlay.classList.remove("hidden");
  saveSettingsButton.disabled = true;
  
  const displayName = displayNameInput.value;
  const newPhotoUrl = profilePicPreview.src;
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
    
    // Once saved, wait briefly, then close the modal and hide the overlay
    setTimeout(() => {
      settingsModal.classList.remove("show");
      settingsModal.classList.add("hidden");
      loadingOverlay.classList.add("hidden");  // Hide loader
      saveSettingsButton.disabled = false;  // Re-enable button
    }, 600);
  } catch (error) {
    console.error("Error saving settings:", error);
    alert("Failed to save settings.");
    loadingOverlay.classList.add("hidden");  // Hide loader
    saveSettingsButton.disabled = false;  // Re-enable button
  }
});

// Save the theme preference only when Save Settings is clicked
const saveSettingsBtn = document.getElementById("save-settings");
if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("No user is logged in.");
      return;
    }
    // Build the settings object
    const userSettings = {
      darkMode: themeToggle.checked
    };
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { settings: userSettings }, { merge: true });
      
    } catch (err) {
      console.error("Error saving settings:", err);
      alert("Failed to save settings. Please try again.");
    }
  });
}

  
  
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
  // Toggle the search bar when the search icon is clicked
document.getElementById('search-icon').addEventListener('click', () => {
  const searchBarContainer = document.getElementById('search-bar-container');
  searchBarContainer.classList.toggle('hidden');
});

// Clear the search bar input and hide the search bar container when clear button is clicked
document.getElementById('clear-search').addEventListener('click', () => {
  const searchBar = document.getElementById('search-bar');
  searchBar.value = "";
  renderFilteredTransactions(window.transactionsData); // Reset to all transactions
  document.getElementById('search-bar-container').classList.add('hidden');
});

// Toggle the filter popup when the filter icon is clicked
document.getElementById('filter-icon').addEventListener('click', () => {
  document.getElementById('filter-popup').classList.toggle('hidden');
  populateCategoryIcons();
});


// Close the filter popup and clear all filter fields when the "X" button is clicked
document.getElementById('close-filter-popup').addEventListener('click', () => {
  document.getElementById('filter-date-from').value = "";
  document.getElementById('filter-date-to').value = "";
  document.getElementById('filter-amount-min').value = "";
  document.getElementById('filter-amount-max').value = "";
  document.getElementById('filter-title').value = "";
  document.getElementById('filter-notes').value = "";
  document.querySelectorAll('.category-icon.active').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.type-chip.active').forEach(el => el.classList.remove('active'));
  document.getElementById('filter-popup').classList.add('hidden');
});

// Search functionality: filter transactions as the user types
document.getElementById('search-bar').addEventListener('keyup', (e) => {
  const query = e.target.value.toLowerCase();
  const filteredTransactions = window.transactionsData.filter(tx => {
    return (tx.title && tx.title.toLowerCase().includes(query)) ||
           (tx.notes && tx.notes.toLowerCase().includes(query)) ||
           (tx.type === "Income" ? (tx.source && tx.source.toLowerCase().includes(query))
                                 : (tx.category && tx.category.toLowerCase().includes(query)));
  });
  renderFilteredTransactions(filteredTransactions);
});

// Apply filter button

// Apply filter functionality

// Apply filter functionality when the "Apply" button is clicked
document.getElementById('apply-filter').addEventListener('click', () => {
  const dateFrom = document.getElementById('filter-date-from').value;
  const dateTo = document.getElementById('filter-date-to').value;
  const amountMin = parseFloat(document.getElementById('filter-amount-min').value);
  const amountMax = parseFloat(document.getElementById('filter-amount-max').value);
  const titleFilter = document.getElementById('filter-title').value.toLowerCase();
  const notesFilter = document.getElementById('filter-notes').value.toLowerCase();

  const selectedCategories = Array.from(document.querySelectorAll('.category-icon.active'))
                                  .map(el => el.dataset.category);
  const selectedTypes = Array.from(document.querySelectorAll('.type-chip.active'))
                             .map(el => el.dataset.type);

  const filteredTransactions = window.transactionsData.filter(tx => {
    let match = true;

    const txDate = new Date(tx.timestamp).toISOString().split('T')[0];
    if (dateFrom && txDate < dateFrom) match = false;
    if (dateTo && txDate > dateTo) match = false;

    const amt = parseFloat(tx.amount);
    if (!isNaN(amountMin) && amt < amountMin) match = false;
    if (!isNaN(amountMax) && amt > amountMax) match = false;

    if (titleFilter && !(tx.title && tx.title.toLowerCase().includes(titleFilter))) match = false;
    if (notesFilter && !(tx.notes && tx.notes.toLowerCase().includes(notesFilter))) match = false;

    const cat = tx.type === "Income" ? tx.source : tx.category;
    if (selectedCategories.length > 0 && (!cat || !selectedCategories.includes(cat.toLowerCase()))) {
      match = false;
    }

    if (selectedTypes.length > 0 && !selectedTypes.includes(tx.type)) {
      match = false;
    }

    return match;
  });

  renderFilteredTransactions(filteredTransactions);
  document.getElementById('filter-popup').classList.add('hidden');
});

function populateCategoryIcons() {
  const container = document.getElementById("filter-category-icons");
  container.innerHTML = "";

  const categories = new Set();
  window.transactionsData.forEach(tx => {
    const cat = tx.type === "Income" ? tx.source : tx.category;
    if (cat) categories.add(cat);
  });

  categories.forEach(cat => {
    const iconSrc = getCategoryIcon(cat); // <-- this function should map category to image URL
    const div = document.createElement("div");
    div.className = "category-icon";
    div.dataset.category = cat;
    div.innerHTML = `
      <img src="${iconSrc}" alt="${cat}" />
      <span>${cat}</span>
    `;
    div.addEventListener("click", () => {
      div.classList.toggle("active");
    });
    container.appendChild(div);
  });
}
document.querySelectorAll('.type-chip').forEach(chip => {
  chip.addEventListener("click", () => {
    chip.classList.toggle("active");
  });
});

// 🔧 Add this helper:
function getCategoryIcon(cat) {
  // Customize your category-icon mappings here
  const lower = cat.toLowerCase();
  if (lower.includes("food")) return "icons/food.png";
  if (lower.includes("car")) return "icons/car.png";
  if (lower.includes("rent")) return "icons/house.png";
  if (lower.includes("salary")) return "icons/salary.png";
  return "icons/default.png";
}


// ✅ Function to render filtered transactions
function renderFilteredTransactions(transactions) {
  const transactionsListContent = document.getElementById("transactions-list-content");
  transactionsListContent.innerHTML = "";

  if (!transactions.length) {
    transactionsListContent.innerHTML = "<p>No transactions found.</p>";
    return;
  }

  transactions.forEach((tx, index) => {
    const card = renderTransactionCard(tx, index);
    transactionsListContent.appendChild(card);
  });
}

// ✅ Initialize noUiSlider for amount filtering
const slider = document.getElementById('amount-slider');

noUiSlider.create(slider, {
  start: [50, 500], // Default range
  connect: true,
  step: 1,
  tooltips: [true, true], // Show tooltips on drag
  range: {
    min: 0,
    max: 1000
  },
  format: {
    to: value => `$${Math.round(value)}`,
    from: value => Number(value.replace('$', ''))
  }
});

const minLabel = document.getElementById("amount-min-label");
const maxLabel = document.getElementById("amount-max-label");

// ✅ Sync slider with hidden min/max inputs and visual labels
slider.noUiSlider.on('update', (values, handle) => {
  const rounded = values.map(v => Math.round(v));

  minLabel.textContent = `$${rounded[0]}`;
  maxLabel.textContent = `$${rounded[1]}`;

  document.getElementById("filter-amount-min").value = rounded[0];
  document.getElementById("filter-amount-max").value = rounded[1];
});

    // DOM Elements
    const addBudgetForm = document.getElementById("add-budget-form");
    const transactionForm = document.getElementById("transaction-form");
    const authContainer = document.getElementById("auth-container");
    const dashboardContainer = document.getElementById("dashboard-container");
    
    const googleSignInButton = document.getElementById("google-signin-button");
    const logoutButton = document.getElementById("logout-button");
    const balanceDisplay = document.getElementById("balance");
    const addTransactionButton = document.getElementById("add-transaction-button");
  
   // References
const transactionPopup = document.getElementById("cr-transaction-popup");
const closePopupButton = document.getElementById("cr-close-transaction-popup");

const discardPopup = document.getElementById("discard-popup");
const discardCancelBtn = document.getElementById("discard-cancel-btn");
const discardConfirmBtn = document.getElementById("discard-confirm-btn");
// Remove the duplicate event listener on the close button.
// Use only this one which handles unsaved data:
// Helper to clear the transaction popup fields
function clearTransactionPopup() {
  document.getElementById("cr-income-form").reset();
  document.getElementById("cr-expense-form").reset();
  document.getElementById("cr-chosen-income-category-text").textContent = "";
  document.getElementById("cr-chosen-expense-category-text").textContent = "";
}

// Function to close the transaction popup
function closeTransactionPopup(restoreTransactionsPage) {
  transactionPopup.classList.add("hidden");
  clearTransactionPopup();
  editingTransactionId = null;
  editingTransactionType = null;
  // If we need to restore the transactions page, do so:
  if (restoreTransactionsPage) {
    const transactionsPage = document.getElementById("transactions-section");
    if (transactionsPage) {
      transactionsPage.classList.remove("hidden");
      transactionsPage.classList.add("show");
    }
  }
}

// X button handler for the transaction popup
closePopupButton.addEventListener("click", () => {
  // If editing an existing transaction, cancel the edit and close the popup
  if (editingTransactionId !== null) {
    closeTransactionPopup(true);
    return;
  }
  
  // For a new transaction, check if any fields have content
  const fields = transactionPopup.querySelectorAll("input, textarea");
  let hasContent = false;
  fields.forEach(field => {
    if (field.value.trim() !== "") {
      hasContent = true;
    }
  });
  
  if (hasContent) {
    // Show the discard confirmation overlay
    discardPopup.classList.remove("hidden");
  } else {
    closeTransactionPopup(false);
  }
});

// Discard popup handlers
discardCancelBtn.addEventListener("click", () => {
  // Hide the discard overlay but leave the transaction popup open
  discardPopup.classList.add("hidden");
});

discardConfirmBtn.addEventListener("click", () => {
  // Clear the popup and close it
  clearTransactionPopup();
  discardPopup.classList.add("hidden");
  closeTransactionPopup(false);
});






    
  const incomeTab = document.getElementById("cr-income-tab");
  const expenseTab = document.getElementById("cr-expense-tab");
  const incomeFields = document.getElementById("income-fields");
  const expenseFields = document.getElementById("expense-fields");
  // Grab the forgot-password-button element once at the top:
 
  const transactionsButton = document.getElementById("transactions-button");
  
  const allTab = document.getElementById("all-tab");
  const incomeTabList = document.getElementById("income-tab-list");
  const expenseTabList = document.getElementById("expense-tab-list");
  const transactionsListContent = document.getElementById("transactions-list-content");






 /* =========================================================
   LOGIN ⇄ SIGN-UP LOGIC
   ========================================================= */

/* =========================================================
   1. DOM Handles
   ========================================================= */
const formTitle = document.getElementById("form-title");
const authButton = document.getElementById("auth-button");
const forgotPasswordBtn = document.getElementById("forgot-password-button");
const authForm = document.getElementById("auth-form");
const googleBtn = document.getElementById("google-signin-button");
const microsoftBtn = document.getElementById("microsoft-signin-button");
const signupBtn = document.getElementById("signup-button");
const loginBtn = document.getElementById("login-button");
const authModal = document.getElementById("auth-modal");
const closeModalBtn = document.getElementById("close-modal");
const pwdInput = document.getElementById("auth-password");
const togglePwd = document.getElementById("toggle-password-visibility");
const authWrapper = document.getElementById("auth-wrapper");

/* =========================================================
   2. UI State
   ========================================================= */
let loginMode = true; // true = Log In, false = Sign Up

/* =========================================================
   3. Modal Helpers
   ========================================================= */
function paintAuthView() {
  if (loginMode) {
    formTitle.textContent = "Sign In to Cash Rocket";
    authButton.textContent = "Sign In";
    forgotPasswordBtn.parentElement.style.display = "block";
  } else {
    formTitle.textContent = "Create Your Account";
    authButton.textContent = "Sign Up";
    forgotPasswordBtn.parentElement.style.display = "none";
  }
}

function showModal(isLogin) {
  loginMode = isLogin;
  paintAuthView();
  authModal.classList.remove("hidden");
  document.getElementById("auth-email").focus();
}

function hideModal() {
  authModal.classList.add("hidden");
}

/* =========================================================
   4. View Toggle Helpers
   ========================================================= */
function showDashboard() {
  authWrapper.style.display = "none";
  dashboardContainer.style.display = "block";
}

function showAuthScreen() {
  authWrapper.style.display = "flex";
  dashboardContainer.style.display = "none";
}

function showLoadingState() {
  authWrapper.classList.add("loading");
}

/* =========================================================
   5. Event Wiring
   ========================================================= */
signupBtn.addEventListener("click", () => showModal(false));
loginBtn.addEventListener("click", () => showModal(true));
closeModalBtn.addEventListener("click", hideModal);

// Password visibility toggle
togglePwd.addEventListener("click", () => {
  const isPwd = pwdInput.type === "password";
  pwdInput.type = isPwd ? "text" : "password";
  const icon = togglePwd.querySelector("i");
  if (isPwd) {
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
});

/* =========================================================
   6. Email / Password ⇄ Sign-up / Log-in
   ========================================================= */
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("auth-email").value.trim();
  const password = pwdInput.value.trim();

  try {
    if (loginMode) {
      showLoadingState(); // Show loading state before sign-in
      const { user } = await verifiedSignIn(email, password);
      hideModal();
      // showDashboard() will be handled by onAuthStateChanged
    } else {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(user);
      alert("Verification e-mail sent. Please verify, then sign in.");
      await signOut(auth);
      loginMode = true;
      paintAuthView();
      hideModal();
    }
  } catch (err) {
    console.error("Auth error:", err.code, err.message);
    alert(err.message);
    authWrapper.classList.remove("loading"); // Hide loading state on error
  }
});

/* Helper – only allow verified users */
async function verifiedSignIn(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  await user.reload();
  if (!user.emailVerified) {
    await signOut(auth);
    throw new Error("Please verify your e-mail before logging in.");
  }
  return { user };
}

/* Helper – ensure user document exists */
async function ensureUserDoc(user) {
  try {
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
      await setDoc(userDocRef, {
        expenseCategories: DEFAULT_EXPENSE_CATEGORIES || [],
        incomeCategories: DEFAULT_INCOME_CATEGORIES || [],
        balance: 0,
        incomes: [],
        expenses: [],
        logs: [],
      }, { merge: true });
    }
  } catch (err) {
    console.error("Error in ensureUserDoc:", err.code, err.message);
  }
}

/* =========================================================
   7. Social OAuth Providers
   ========================================================= */
const googleProvider = new GoogleAuthProvider();
const microsoftProvider = new OAuthProvider("microsoft.com");

/* Google */
googleBtn.addEventListener("click", async () => {
  try {
    showLoadingState(); // Show loading state before sign-in
    const { user } = await signInWithPopup(auth, googleProvider);
    await ensureUserDoc(user);
  } catch (err) {
    console.error("Google Sign-in error:", err.code, err.message);
    if (!auth.currentUser) {
      alert("Error signing in with Google: " + err.message);
      authWrapper.classList.remove("loading"); // Hide loading state on error
    } else {
      console.log("Sign-in succeeded despite error, proceeding.");
    }
  }
  // UI updates handled by onAuthStateChanged
});

/* Microsoft */
microsoftBtn.addEventListener("click", async () => {
  try {
    showLoadingState(); // Show loading state before sign-in
    const { user } = await signInWithPopup(auth, microsoftProvider);
    await ensureUserDoc(user);
  } catch (err) {
    console.error("Microsoft Sign-in error:", err.code, err.message);
    if (!auth.currentUser) {
      alert("Failed to sign in with Microsoft: " + err.message);
      authWrapper.classList.remove("loading"); // Hide loading state on error
    } else {
      console.log("Sign-in succeeded despite error, proceeding.");
    }
  }
  // UI updates handled by onAuthStateChanged
});

/* =========================================================
   8. Monitor Authentication State
   ========================================================= */
/* =========================================================
   8. Monitor Authentication State
   ========================================================= */
   onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Keep the loading state active while async operations complete
      showLoadingState();
  
      try {
        // Log login and device (asynchronously, but don't await to avoid blocking UI)
        const prevLogin = sessionStorage.getItem("loginLogged");
        if (!prevLogin) {
          try {
            await addLog("login");
            sessionStorage.setItem("loginLogged", "true");
          } catch (err) {
            console.error("Error logging login:", err);
          }
        }
  
        const ua = navigator.userAgent;
        const dev = `${navigator.platform} - ${ua.split(") ")[0].split("(").pop()}`;
        const hash = deviceHashASCII(dev);
  
        if (localStorage.getItem("deviceHash") !== hash) {
          try {
            await addLog("new_device");
            localStorage.setItem("deviceHash", hash);
          } catch (err) {
            console.error("Error logging new device:", err);
          }
        }
  
        // Ensure user document exists (using the existing helper)
        await ensureUserDoc(user);
  
        // Load theme settings
        const userDocRef = doc(db, "users", user.uid);
        const themeToggle = document.getElementById("theme-toggle");
        try {
          const userSnap = await getDoc(userDocRef);
          const userData = userSnap.data();
          const darkModeEnabled = userData.settings?.darkMode;
  
          if (darkModeEnabled) {
            document.body.classList.add("dark-mode");
            if (themeToggle) themeToggle.checked = true;
          } else {
            document.body.classList.remove("dark-mode");
            if (themeToggle) themeToggle.checked = false;
          }
        } catch (err) {
          console.error("Error loading theme settings:", err);
        }
  
        // Load dashboard data
        try {
          await loadCategoriesFromFirestore(user);
          await loadDashboard(user); // Ensure this is awaited if it’s async
        } catch (err) {
          console.error("Error loading dashboard data:", err);
        }
  
        // Initialize Weekly Summary Feature (this will handle showing the card)
        await initWeeklySummaryFeature(user);
  
        // Now that all async operations are complete, show the dashboard
        showDashboard();
        showSection("dashboard-section");
  
        // Remove the loading state after dashboard is fully loaded
        authWrapper.classList.remove("loading");
      } catch (err) {
        console.error("Error in onAuthStateChanged:", err);
        // If there's an error, remove loading state and show auth screen
        authWrapper.classList.remove("loading");
        showAuthScreen();
      }
    } else {
      sessionStorage.removeItem("loginLogged");
      showAuthScreen();
      authWrapper.classList.remove("loading");
    }
  });
/* =========================================================
   9. Typing Effect for #app-tagline
   ========================================================= */
const tagline = document.getElementById("app-tagline");
const phrases = [
  "Boost Your Budget",
  "Make a Budget",
  "Connect Your Account",
  "Track Your Finances",
];
let currentPhraseIndex = 0;
let currentCharIndex = 0;
let isTyping = true;

function type() {
  const currentPhrase = phrases[currentPhraseIndex];

  if (isTyping) {
    if (currentCharIndex <= currentPhrase.length) {
      tagline.innerHTML =
        currentPhrase.slice(0, currentCharIndex) + '<span class="blinking-cursor">|</span>';
      currentCharIndex++;
      setTimeout(type, Math.random() * 150 + 50);
    } else {
      isTyping = false;
      setTimeout(type, 1500);
    }
  } else {
    if (currentCharIndex >= 0) {
      tagline.innerHTML =
        currentPhrase.slice(0, currentCharIndex) + '<span class="blinking-cursor">|</span>';
      currentCharIndex--;
      setTimeout(type, 50);
    } else {
      currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
      currentCharIndex = 0;
      isTyping = true;
      setTimeout(type, 500);
    }
  }
}

type();
 
  /* =========================================================
     9. Theme Toggle
     ========================================================= */
  document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("change", () => {
        if (themeToggle.checked) {
          document.body.classList.add("dark-mode");
          localStorage.setItem("theme", "dark");
        } else {
          document.body.classList.remove("dark-mode");
          localStorage.setItem("theme", "light");
        }
      });
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
  function renderTransactionCard(tx, index) {
    const card = document.createElement("div");
    card.classList.add("transaction-card");
  
    // Icon area
    const icon = document.createElement("div");
    icon.classList.add("transaction-icon");
    const categoryIconUrl = getCategoryIcon(tx);
    if (categoryIconUrl) {
      icon.innerHTML = `<img src="${categoryIconUrl}" alt="${tx.type === "Income" ? tx.source : tx.category}" />`;
    } else {
      icon.innerHTML = `<i class="fa fa-money-bill-wave"></i>`;
    }
  
    // Transaction details
    const details = document.createElement("div");
    details.classList.add("transaction-details");
  
    // Category or Source
    const catOrSource = tx.type === "Income" ? tx.source : tx.category;
    const nameEl = document.createElement("div");
    nameEl.classList.add("transaction-name");
    nameEl.textContent = catOrSource;
  
    // Title in smaller text
    const titleEl = document.createElement("div");
    titleEl.classList.add("transaction-subtitle");
    titleEl.textContent = tx.title || "";
  
    // Timestamp
    const timeEl = document.createElement("div");
    timeEl.classList.add("transaction-time");
    const date = tx.timestamp ? new Date(tx.timestamp) : new Date();
    timeEl.textContent = date.toLocaleString();
  
    details.appendChild(nameEl);
    details.appendChild(titleEl);
    details.appendChild(timeEl);
  
    // Amount
    const amountEl = document.createElement("div");
    amountEl.classList.add("transaction-amount");
    const amt = parseFloat(tx.amount).toFixed(2);
    amountEl.textContent = (tx.type === "Income" ? "+$" : "-$") + amt;
    amountEl.classList.add(tx.type === "Income" ? "positive" : "negative");
  
    // Put it all together
    card.appendChild(icon);
    card.appendChild(details);
    card.appendChild(amountEl);
  
    // Make the card clickable to edit
    card.addEventListener("click", () => openEditTransactionPopup(tx, index));
  
    return card;
  }
  
  
  async function setActiveTransactionTab(filter) {
    const allTab = document.getElementById('all-tab');
    const incomeTabList = document.getElementById('income-tab-list');
    const expenseTabList = document.getElementById('expense-tab-list');
  
    if (!allTab || !incomeTabList || !expenseTabList) {
      console.error('One or more transaction tab elements not found:', { allTab, incomeTabList, expenseTabList });
      return;
    }
  
    allTab.classList.remove("active");
    incomeTabList.classList.remove("active");
    expenseTabList.classList.remove("active");
  
    if (filter === "all") {
      allTab.classList.add("active");
    } else if (filter === "income") {
      incomeTabList.classList.add("active");
    } else if (filter === "expense") {
      expenseTabList.classList.add("active");
    }
  
    await loadTransactions(filter);
  }
  document.querySelector('.income-box').addEventListener('click', async (e) => {
    e.preventDefault();
    showSection('transactions-section');
    setActiveNavItem("transactions-button-desktop"); // ✅ update green line
    await setActiveTransactionTab("income");
  });
  

  document.querySelector('.expense-box').addEventListener('click', async (e) => {
    e.preventDefault();
    showSection('transactions-section');
    setActiveNavItem("transactions-button-desktop"); // ✅ corrected
    await setActiveTransactionTab("expense");
  });
  
  

  
  
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
    transactionsToShow.forEach((tx, index) => {
      const card = renderTransactionCard(tx, index);
      transactionsListContent.appendChild(card);
    });
    
  }
  
  // Attach event listeners for the transaction tabs
  allTab.addEventListener("click", () => setActiveTransactionTab("all"));
  incomeTabList.addEventListener("click", () => setActiveTransactionTab("income"));
  expenseTabList.addEventListener("click", () => setActiveTransactionTab("expense"));
  
  // Event listener for opening the full-screen transactions panel
// Confirm this ID exists
  if (!transactionsButton) {
      console.error("Transactions button not found in DOM");
  } else {
      transactionsButton.addEventListener('click', (e) => {
          e.preventDefault();
          showSection('transactions-section');
          setActiveTransactionTab('all');
      });
  }
  // Get references for the full-screen transactions panel and its back button
  const transactionsPage = document.getElementById("transactions-section");
  
  // When the back button is clicked, remove the 'show' class (which brings it on-screen),
  // then after the transition delay, add the 'hidden' class so it’s completely off-screen.

  
  // CSV download remains unchanged
  document.getElementById("download-transactions").addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) return alert("You must be logged in to download transactions.");
  
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
  
    if (!userDoc.exists()) {
      return alert("No transaction data found.");
    }
  
    const userData = userDoc.data();
    const incomes = (userData.incomes || []).map(tx => ({ ...tx, type: "Income" }));
    const expenses = (userData.expenses || []).map(tx => ({ ...tx, type: "Expense" }));
  
    const allTransactions = [...incomes, ...expenses];
    allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
    if (allTransactions.length === 0) {
      alert("No transactions to download.");
      return;
    }
  
    let csv = "Type,Category/Source,Amount,Time\n";
    allTransactions.forEach(tx => {
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
let editingTransactionId = null;
let editingTransactionType = null; // "Income" or "Expense"

// Helper function for live updating the header amount
function updateHeaderAmount(e) {
  const value = parseFloat(e.target.value) || 0;
  document.getElementById("header-amount-text").textContent = `$${value.toFixed(2)}`;
}
function openEditTransactionPopup(tx, index) {
  // Grab common DOM elements
  const headerAmountText = document.getElementById("header-amount-text");
  const incomeInput = document.getElementById("cr-popup-income-amount");
  const expenseInput = document.getElementById("cr-popup-expense-amount");

  // Clear fields for both new and editing transactions
  headerAmountText.textContent = '$0';
  incomeInput.value = '';
  expenseInput.value = '';
  document.getElementById("cr-income-title").value = '';
  document.getElementById("cr-expense-title").value = '';
  if (document.getElementById("cr-income-notes")) {
    document.getElementById("cr-income-notes").value = '';
  }
  if (document.getElementById("cr-expense-notes")) {
    document.getElementById("cr-expense-notes").value = '';
  }
  document.getElementById("cr-chosen-income-category").value = '';
  document.getElementById("cr-chosen-income-category-text").textContent = '';
  document.getElementById("cr-chosen-expense-category").value = '';
  document.getElementById("cr-chosen-expense-category-text").textContent = '';

  // If tx is not provided or tx.id is falsy, this is a new transaction.
  if (!tx || !tx.id) {
    editingTransactionId = null;
    editingTransactionType = null;
    // Ensure the delete icon is hidden for new transactions
    document.getElementById("delete-transaction-btn").classList.add("hidden");
    // Reset header amount to $0 explicitly (redundant, but ensures clarity)
    headerAmountText.textContent = '$0';
  } else {
    // Otherwise, editing an existing transaction:
    editingTransactionId = tx.id;
    editingTransactionType = tx.type;
    document.getElementById("delete-transaction-btn").classList.remove("hidden");

    const storedAmount = parseFloat(tx.amount) || 0;
    headerAmountText.textContent = `$${storedAmount.toFixed(2)}`;

    // Remove previous event listeners to avoid duplicates
    incomeInput.removeEventListener("input", updateHeaderAmount);
    expenseInput.removeEventListener("input", updateHeaderAmount);

    if (tx.type === "Income") {
      incomeTab.classList.add("active");
      expenseTab.classList.remove("active");
      document.getElementById("cr-income-form").classList.add("active");
      document.getElementById("cr-income-form").classList.remove("hidden");
      document.getElementById("cr-expense-form").classList.add("hidden");
      document.getElementById("cr-expense-form").classList.remove("active");

      document.getElementById("cr-income-title").value = tx.title || "";
      document.getElementById("cr-income-notes").value = tx.notes || "";
      incomeInput.value = tx.amount;
      document.getElementById("cr-chosen-income-category").value = tx.source || "";
      document.getElementById("cr-chosen-income-category-text").textContent = tx.source || "";
      headerAmountText.style.color = "#2e7d32";

      incomeInput.addEventListener("input", updateHeaderAmount);
    } else {
      expenseTab.classList.add("active");
      incomeTab.classList.remove("active");
      document.getElementById("cr-expense-form").classList.add("active");
      document.getElementById("cr-expense-form").classList.remove("hidden");
      document.getElementById("cr-income-form").classList.add("hidden");
      document.getElementById("cr-income-form").classList.remove("active");

      document.getElementById("cr-expense-title").value = tx.title || "";
      document.getElementById("cr-expense-notes").value = tx.notes || "";
      expenseInput.value = tx.amount;
      document.getElementById("cr-chosen-expense-category").value = tx.category || "";
      document.getElementById("cr-chosen-expense-category-text").textContent = tx.category || "";
      headerAmountText.style.color = "#d32f2f";

      expenseInput.addEventListener("input", updateHeaderAmount);
    }
    // Update submit button texts for editing
    const saveIncomeBtn = document.querySelector("#cr-income-form .btn-primary");
    const saveExpenseBtn = document.querySelector("#cr-expense-form .btn-primary");
    saveIncomeBtn.textContent = "Save Income";
    saveExpenseBtn.textContent = "Save Expense";
  }

  // Hide transactions page and show the transaction popup
  const transactionsPage = document.getElementById("transactions-section");
  if (transactionsPage) {
    transactionsPage.classList.add("hidden");
    transactionsPage.classList.remove("show");
  }
  transactionPopup.classList.remove("hidden");
}



// ---------- DELETE TRANSACTION FUNCTIONALITY ----------

// When the delete icon is clicked, show the custom overlay popup
document.getElementById("delete-transaction-btn").addEventListener("click", () => {
  // If you want to show the transaction title in the popup, you can do:
  const titleField = document.getElementById("cr-income-title").value
    || document.getElementById("cr-expense-title").value;
  document.getElementById("delete-transaction-title").textContent = titleField || "";
  
  // Show the overlay
  document.getElementById("delete-confirmation-overlay").classList.remove("hidden");
});

// Confirm deletion
document.getElementById("confirm-delete-btn").addEventListener("click", async () => {
  try {
    await deleteTransaction(editingTransactionId);
   
    // Hide the overlay and the transaction popup
    document.getElementById("delete-confirmation-overlay").classList.add("hidden");
    transactionPopup.classList.add("hidden");
    // Optionally, refresh your transaction list here
  } catch (error) {
    console.error("Error deleting transaction:", error);
    alert("Failed to delete transaction.");
  }
});

// Cancel deletion
document.getElementById("cancel-delete-btn").addEventListener("click", () => {
  document.getElementById("delete-confirmation-overlay").classList.add("hidden");
});

async function deleteTransaction(transactionId) {
  const user = auth.currentUser;
  if (!user) {
    console.error("No user is logged in.");
    return;
  }
  
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);
  if (!userDoc.exists()) {
    console.error("User document not found.");
    return;
  }
  
  const data = userDoc.data();
  let incomes = data.incomes || [];
  let expenses = data.expenses || [];
  let newBalance = typeof data.balance === "number" ? data.balance : 0;
  
  // Try to find the transaction in incomes first
  let index = incomes.findIndex(tx => tx.id === transactionId);
  if (index > -1) {
    const tx = incomes[index];
    incomes.splice(index, 1);
    // Removing an income should decrease the balance by its amount
    newBalance -= parseFloat(tx.amount);
  } else {
    // Otherwise, look in expenses
    index = expenses.findIndex(tx => tx.id === transactionId);
    if (index > -1) {
      const tx = expenses[index];
      expenses.splice(index, 1);
      // Removing an expense should increase the balance (because the expense was subtracted when added)
      newBalance += parseFloat(tx.amount);
    } else {
      console.error("Transaction not found.");
      return;
    }
  }
  
  // Update the user document with the new arrays and balance
  await setDoc(userDocRef, {
    incomes,
    expenses,
    balance: newBalance
  }, { merge: true });
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
  const profileNameEl = document.getElementById("profile-name");
  profileNameEl.textContent = data.displayName ? data.displayName : "Your Display Name";
  
  // In loadDashboard(), update mobile profile images
const mobileProfileIcon = document.getElementById("mobile-profile-icon");
const mobileProfilePagePhoto = document.getElementById("profile-page-photo");
mobileProfileIcon.src = data.photoUrl ? data.photoUrl : "default-avatar.png";
mobileProfilePagePhoto.src = data.photoUrl ? data.photoUrl : "default-avatar.png";

   
     // When the mobile profile icon is clicked, show the profile modal smoothly
     mobileProfileIcon.addEventListener('click', () => {
      showSection('profile-section');
    });
    
  
    
    
      // -------------------------
// Real-time Clock Setup
// -------------------------
const transactionClock = document.getElementById("transaction-clock");

function updateTransactionClock() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  let displayHour = hours % 12 || 12;
  let ampm = hours >= 12 ? "PM" : "AM";
  transactionClock.textContent = `${displayHour}:${minutes} ${ampm}`;
}
setInterval(updateTransactionClock, 1000);
updateTransactionClock();

// -------------------------
// Global Element References
// -------------------------
const transactionLoading = document.getElementById("transaction-loading");


// Header Amount Display
const headerAmountText = document.getElementById("header-amount-text");


// -------------------------
// Form Input Listeners for Updating Big Amount Display
// -------------------------
const incomeAmountInput = document.getElementById("cr-popup-income-amount");
const expenseAmountInput = document.getElementById("cr-popup-expense-amount");

incomeAmountInput.addEventListener("input", () => {
  headerAmountText.textContent = `$${incomeAmountInput.value || 0}`;
});
expenseAmountInput.addEventListener("input", () => {
  headerAmountText.textContent = `$${expenseAmountInput.value || 0}`;
});

// -------------------------
// Income Form Submission 
// -------------------------
document.getElementById("cr-income-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  transactionLoading.classList.remove("hidden");
  try {
    const user = auth.currentUser;
    if (!user) {
      alert("Please log in first!");
      return;
    }
    const amount = parseFloat(incomeAmountInput.value);
    const source = document.getElementById("cr-chosen-income-category").value;
    const title = document.getElementById("cr-income-title").value.trim();
    const notes = document.getElementById("cr-income-notes").value.trim();

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    let userData = userDoc.exists()
      ? userDoc.data()
      : { balance: 0, incomes: [], expenses: [] };

    if (editingTransactionType === "Income" && editingTransactionId) {
      // Find the transaction by its unique id
      const txIndex = userData.incomes.findIndex(tx => tx.id === editingTransactionId);
      if (txIndex > -1) {
        const oldTx = userData.incomes[txIndex];
        // Remove the old transaction's amount from the balance
        userData.balance -= parseFloat(oldTx.amount);
        // Update the transaction while keeping its id and timestamp
        userData.incomes[txIndex] = {
          id: editingTransactionId,
          amount,
          source,
          timestamp: oldTx.timestamp,
          title,
          notes
        };
        // Add the new amount to the balance
        userData.balance += amount;
      }
    } else {
      // Create a new transaction with a unique id
      const now = new Date();
      const newId = 'inc-' + now.getTime() + '-' + Math.floor(Math.random() * 1000);
      userData.incomes.push({
        id: newId,
        amount,
        source,
        timestamp: now.toISOString(),
        title,
        notes
      });
      userData.balance += amount;
    }

    await setDoc(userDocRef, userData, { merge: true });
    balanceDisplay.textContent = `$${userData.balance.toFixed(2)}`;

    // Refresh the dashboard so changes are immediately visible
    loadDashboard(user);

    // Reset editing state and clear the popup
    editingTransactionId = null;
    editingTransactionType = null;
    document.getElementById("cr-income-form").reset();
    crChosenIncomeCategoryText.textContent = "";
    transactionPopup.classList.add("hidden");
  } catch (error) {
    console.error("Error saving income:", error);
    alert("Failed to save income.");
  } finally {
    transactionLoading.classList.add("hidden");
  }
});


// -------------------------
// Expense Form Submission 
// -------------------------
document.getElementById("cr-expense-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  transactionLoading.classList.remove("hidden");
  try {
    const user = auth.currentUser;
    if (!user) {
      alert("Please log in first!");
      return;
    }
    const amount = parseFloat(expenseAmountInput.value);
    const category = document.getElementById("cr-chosen-expense-category").value;
    const title = document.getElementById("cr-expense-title").value.trim();
    const notes = document.getElementById("cr-expense-notes").value.trim();

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    let userData = userDoc.exists()
      ? userDoc.data()
      : { balance: 0, incomes: [], expenses: [] };

    if (editingTransactionType === "Expense" && editingTransactionId) {
      // Find the transaction by its unique id
      const txIndex = userData.expenses.findIndex(tx => tx.id === editingTransactionId);
      if (txIndex > -1) {
        const oldTx = userData.expenses[txIndex];
        // For expense, first add back the old amount (since it was subtracted)
        userData.balance += parseFloat(oldTx.amount);
        // Update the transaction while keeping its id and original timestamp
        userData.expenses[txIndex] = {
          id: editingTransactionId,
          amount,
          category,
          timestamp: oldTx.timestamp,
          title,
          notes
        };
        // Subtract the new amount from the balance
        userData.balance -= amount;
      }
    } else {
      // Create a new expense transaction with a unique id
      const now = new Date();
      const newId = 'exp-' + now.getTime() + '-' + Math.floor(Math.random() * 1000);
      userData.expenses.push({
        id: newId,
        amount,
        category,
        timestamp: now.toISOString(),
        title,
        notes
      });
      userData.balance -= amount;
    }

    await setDoc(userDocRef, userData, { merge: true });
    balanceDisplay.textContent = `$${userData.balance.toFixed(2)}`;

    // Refresh the dashboard so that the update shows immediately
    loadDashboard(user);

    // Reset editing state and clear the popup
    editingTransactionId = null;
    editingTransactionType = null;
    document.getElementById("cr-expense-form").reset();
    crChosenExpenseCategoryText.textContent = "";
    transactionPopup.classList.add("hidden");
  } catch (error) {
    console.error("Error saving expense:", error);
    alert("Failed to save expense.");
  } finally {
    transactionLoading.classList.add("hidden");
  }
});



// -------------------------
// Tab Toggling: Income vs Expense
// -------------------------
expenseTab.addEventListener("click", () => {
  expenseTab.classList.add("active");
  incomeTab.classList.remove("active");
  document.getElementById("cr-expense-form").classList.add("active");
  document.getElementById("cr-expense-form").classList.remove("hidden");
  document.getElementById("cr-income-form").classList.add("hidden");
  document.getElementById("cr-income-form").classList.remove("active");
  headerAmountText.style.color = "#d32f2f"; // red for expense
});

incomeTab.addEventListener("click", () => {
  incomeTab.classList.add("active");
  expenseTab.classList.remove("active");
  document.getElementById("cr-income-form").classList.add("active");
  document.getElementById("cr-income-form").classList.remove("hidden");
  document.getElementById("cr-expense-form").classList.add("hidden");
  document.getElementById("cr-expense-form").classList.remove("active");
  headerAmountText.style.color = "#2e7d32"; // green for income
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
    
    
      updateSummaryBoxes(data);
  // =====================
// 1) Common Updates Based on Mode
// =====================
function getCommonChartUpdates(mode) {
  const dark = mode === 'dark';
  return {
    chart: {
      background: dark ? '#1e1e1e' : '#f0f0f0'
    },
    xaxis: {
      labels: {
        style: { colors: [dark ? '#ffffff' : '#000000'] }
      }
    },
    yaxis: {
      labels: {
        style: { colors: [dark ? '#ffffff' : '#000000'] }
      }
    },
    tooltip: {
      theme: dark ? 'dark' : 'light'
    },
    grid: {
      borderColor: dark ? '#444' : '#ddd'
    }
  };
}

// =====================
// 2) Determine Dark Mode & Build Net Balance Chart
// =====================
const isDark = document.body.classList.contains("dark-mode");

// Build your net balance series
const netBalanceSeries = buildDailyNetBalanceSeries(
  data.incomes || [],
  data.expenses || []
);

const chartOptions = {
  series: [
    {
      name: "Net Balance",
      data: netBalanceSeries,
    },
  ],
  chart: {
    type: "area",
    height: 350,
    background: isDark ? "#1e1e1e" : "#ffffff",
    toolbar: { show: false },
    zoom: { enabled: false },
    dropShadow: {
      enabled: true,
      top: 4,
      left: 0,
      blur: 6,
      opacity: isDark ? 0.3 : 0.15,
      color: "#000",
    },
  },
  stroke: {
    curve: "smooth",
    width: 3,
    colors: ["#4285F4"],
  },
  fill: {
    type: "gradient",
    gradient: {
      shadeIntensity: 1,
      gradientToColors: ["#4285F4"],
      opacityFrom: 0.3,
      opacityTo: 0.0,
      stops: [0, 90, 100],
      inverseColors: false,
    },
  },
  dataLabels: { enabled: false },
  markers: {
    size: 0,
    hover: { size: 6 },
    strokeWidth: 2,
    strokeColors: "#fff",
  },
  xaxis: {
    type: "datetime",
    labels: {
      format: "MMM d",
      style: {
        fontSize: "13px",
        colors: [isDark ? "#ffffff" : "#000000"],
      },
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      style: {
        fontSize: "13px",
        colors: [isDark ? "#ffffff" : "#000000"],
      },
      // Remove decimals entirely using Math.floor
      formatter: (val) => "$" + Math.floor(val)
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  tooltip: {
    theme: isDark ? "dark" : "light",
    x: { format: "MMM dd, yyyy" },
    y: {
      // Tooltip still shows cents
      formatter: (val) => "$" + val.toFixed(2),
      title: { formatter: () => "Balance:" },
    },
    style: { fontSize: "14px" },
  },
  grid: {
    borderColor: isDark ? "#444" : "#ddd",
    strokeDashArray: 4,
    padding: { left: 15, right: 15 },
  },
  legend: { show: false },
  responsive: [
    {
      breakpoint: 768,
      options: {
        chart: { height: 250 },
        stroke: { width: 2 },
        xaxis: {
          labels: {
            style: {
              fontSize: "12px",
              colors: [isDark ? "#ffffff" : "#000000"],
            },
          },
        },
        yaxis: {
          labels: {
            style: {
              fontSize: "12px",
              colors: [isDark ? "#ffffff" : "#000000"],
            },
          },
        },
      },
    },
  ],
};

// Destroy old chart if needed, then render
if (window.balanceChart) {
  window.balanceChart.destroy();
}
window.balanceChart = new ApexCharts(
  document.querySelector("#balance-chart"),
  chartOptions
);
window.balanceChart.render();


// =====================
// 3) Spending Donut Chart
// =====================
(function renderSpendingChart() {
  // Build category totals from expenses
  const catMap = {};
  (data.expenses || []).forEach(exp => {
    if (!catMap[exp.category]) catMap[exp.category] = 0;
    catMap[exp.category] += exp.amount;
  });

  const spendingCategories = Object.keys(catMap);
  const spendingAmounts = Object.values(catMap);

  // If there are no expenses, show a default slice
  if (spendingCategories.length === 0) {
    spendingCategories.push("No Expenses");
    spendingAmounts.push(0);
  }

  const donutOptions = {
    chart: {
      type: 'donut',
      height: 350,
      background: isDark ? '#1e1e1e' : '#ffffff',
      toolbar: { show: false },
      dropShadow: {
        enabled: true,
        top: 2,
        left: 2,
        blur: 4,
        color: '#000',
        opacity: isDark ? 0.3 : 0.1
      },
      offsetX: 0
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: {
            show: true,
            name: {
              fontSize: '14px',
              color: isDark ? '#ffffff' : '#000000'
            },
            value: {
              fontSize: '18px',
              color: isDark ? '#ffffff' : '#000000',
              formatter: val => val
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '16px',
              color: isDark ? '#ffffff' : '#000000',
              formatter: function (w) {
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
    colors: ['#66bb6a', '#ffa726', '#ef5350', '#26c6da', '#ab47bc', '#ffee58'],
    fill: { type: 'gradient' },
    stroke: {
      show: true,
      width: 2,
      colors: ['#fff']
    },
    legend: {
      position: 'left',
      horizontalAlign: 'center',
      offsetY: 0,
      fontSize: '14px',
      labels: {
        colors: isDark ? '#ffffff' : '#000000'
      },
      markers: {
        width: 14,
        height: 14,
        radius: 7
      }
    },
    responsive: [{
      breakpoint: 768,
      options: {
        chart: { height: 300 },
        legend: {
          fontSize: '12px',
          position: 'left',
          horizontalAlign: 'center'
        }
      }
    }]
  };

  window.spendingChart = new ApexCharts(
    document.querySelector("#spending-chart"),
    donutOptions
  );
  window.spendingChart.render();
})();


// =====================
// 4) Update Charts on Dark Mode Toggle
// =====================
const themeToggle = document.getElementById("theme-toggle");
if (themeToggle) {
  themeToggle.addEventListener("change", () => {
    const newMode = document.body.classList.contains("dark-mode") ? 'dark' : 'light';
    const updates = getCommonChartUpdates(newMode);
    if (window.balanceChart) {
      window.balanceChart.updateOptions({
        ...updates,
        yaxis: {
          labels: {
            style: { colors: [newMode === 'dark' ? '#ffffff' : '#000000'] },
            formatter: (val) => "$" + Math.floor(val)
          }
        }
      });
    }

    // ----- Update the spending donut chart -----
    if (window.spendingChart) {
      window.spendingChart.updateOptions({
        chart: { background: updates.chart.background },
        tooltip: { theme: updates.tooltip.theme },
        grid: { borderColor: updates.grid.borderColor },
        xaxis: {
          labels: { style: { colors: [ newMode === 'dark' ? '#ffffff' : '#000000' ] } }
        },
        yaxis: {
          labels: { style: { colors: [ newMode === 'dark' ? '#ffffff' : '#000000' ] } }
        },
        legend: { labels: { colors: [ newMode === 'dark' ? '#ffffff' : '#000000' ] } },
        plotOptions: {
          pie: {
            donut: {
              labels: {
                name:  { color: newMode === 'dark' ? '#ffffff' : '#000000' },
                value: { color: newMode === 'dark' ? '#ffffff' : '#000000' },
                total: { color: newMode === 'dark' ? '#ffffff' : '#000000' }
              }
            }
          }
        }
      });
    }
  });
}


      
      
    // --- Recent Transactions Section ---

// Combine incomes and expenses (add a 'type' property to each)
let incomes = data.incomes ? data.incomes.map(tx => ({ ...tx, type: "Income" })) : [];
let expenses = data.expenses ? data.expenses.map(tx => ({ ...tx, type: "Expense" })) : [];

// Combine and sort all transactions (most recent first)
let allTransactions = [...incomes, ...expenses];
allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

// Function to render the recent transactions list (only last 6 for the chosen filter)
// Use the same getCategoryIcon(tx) you have in your app
// to get the correct icon URL from the user's categories.
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
  container.innerHTML = "";

  if (!recent.length) {
    container.innerHTML = "<p>No recent transactions.</p>";
    return;
  }

  recent.forEach(tx => {
    const item = document.createElement("div");
    item.classList.add("recent-tx-item");

    // Icon
    const categoryIconUrl = getCategoryIcon(tx);
    const iconHtml = categoryIconUrl
      ? `<img src="${categoryIconUrl}" alt="icon" class="recent-tx-icon" />`
      : `<i class="fa fa-money-bill-wave"></i>`;

    // Show category (tx.source or tx.category) in bold, and title in smaller text
    const catOrSource = tx.type === "Income" ? tx.source : tx.category;
    const title = tx.title || ""; // fallback if no title

    // Format date and amount
    const dateStr = tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : "N/A";
    const sign = tx.type === "Income" ? "+" : "-";
    const amount = parseFloat(tx.amount).toFixed(2);

    // Build the row’s HTML
    item.innerHTML = `
      <div class="recent-tx-icon-wrapper">
        ${iconHtml}
      </div>
      <div class="recent-tx-info">
        <div class="tx-label">${catOrSource}</div>
        <div class="tx-subtitle">${title}</div> 
      </div>
      <span class="tx-date">${dateStr}</span>
      <span class="tx-amount ${tx.type === "Income" ? "positive" : "negative"}">
        ${sign}$${amount}
      </span>
    `;

    container.appendChild(item);
  });
}


function updateSummaryBoxes(data) {
  // Get incomes and expenses arrays from your user data
  const incomes = data.incomes || [];
  const expenses = data.expenses || [];
  
  // Calculate totals
  const totalIncome = incomes.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
  const totalExpense = expenses.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
  
  // Count transactions
  const incomeCount = incomes.length;
  const expenseCount = expenses.length;
  
  // Update the DOM elements with these values
  document.querySelector('.income-box .amount').textContent = `$${formatCompactNumber(totalIncome)}`;
  document.querySelector('.income-box .transactions-count').textContent = `${incomeCount} transactions`;
  
  document.querySelector('.expense-box .amount').textContent = `$${formatCompactNumber(totalExpense)}`;
  document.querySelector('.expense-box .transactions-count').textContent = `${expenseCount} transactions`;
}
function formatCompactNumber(num) {
  if (Math.abs(num) >= 1e6) {
    return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (Math.abs(num) >= 1e3) {
    return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  } else {
    return num.toFixed(2);
  }
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
document.getElementById('view-all-transactions')?.addEventListener('click', () => {
  showSection('transactions-section');
  setActiveNavItem("transactions-button-desktop"); // ✅ update sidebar green line
  setActiveTransactionTab("all"); // if this is how you show all tabs
});

document.getElementById("view-all-transactions")?.addEventListener("click", () => {
  showSection("transactions-section");
  setActiveNavItem("transactions-button-desktop");
  setActiveTransactionTab("all");
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
  
  
  addTransactionButton.addEventListener("click", () => {
    // Clear header and amount fields
    document.getElementById("header-amount-text").textContent = '$0';
    document.getElementById("cr-popup-income-amount").value = '';
    document.getElementById("cr-popup-expense-amount").value = '';
  
    // Clear title and notes
    document.getElementById("cr-income-title").value = '';
    document.getElementById("cr-expense-title").value = '';
    if (document.getElementById("cr-income-notes")) {
      document.getElementById("cr-income-notes").value = '';
    }
    if (document.getElementById("cr-expense-notes")) {
      document.getElementById("cr-expense-notes").value = '';
    }
    
    // Clear category selections
    document.getElementById("cr-chosen-income-category").value = '';
    document.getElementById("cr-chosen-income-category-text").textContent = '';
    document.getElementById("cr-chosen-expense-category").value = '';
    document.getElementById("cr-chosen-expense-category-text").textContent = '';
  
    // Reset editing state (so it knows this is a new transaction)
    editingTransactionId = null;
    editingTransactionType = null;
  
    // Hide delete icon since this is a new transaction
    document.getElementById("delete-transaction-btn").classList.add("hidden");
  
    // Show the popup and default to Income tab
    transactionPopup.classList.remove("hidden");
    setActiveTab(incomeTab, incomeFields);
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
     const amount   = parseFloat(document.getElementById("budget-amount").value);
     const limit    = parseFloat(document.getElementById("budget-amount").value);
    
      if (category && !isNaN(limit)) {
        const user       = auth.currentUser;
        const userDocRef = doc(db, "users", user.uid);
        const userSnap   = await getDoc(userDocRef);
    
        if (userSnap.exists()) {
          const data    = userSnap.data();
         
         const budgets = [
           ...data.budgets,
          { 
             category,     // same string the expense category uses
             total: limit, // your “budget limit”
             spent: 0      // we’ll start at zero spent
          }
         ];
    
          await setDoc(userDocRef, { budgets }, { merge: true });
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
    window.addEventListener("DOMContentLoaded", () => {
      // Find the section that is currently visible
      const visibleSection = document.querySelector("section:not(.hidden)");
      
      if (visibleSection) {
        const sectionId = visibleSection.id;
    
        // Map visible sections to their corresponding nav button IDs
        const sectionToNavMap = {
          "dashboard-section": "home-button-desktop",
          "transactions-section": "transactions-button-desktop",
          "profile-section": "profile-button-desktop",
          // Add more if you have more sections & buttons
        };
    
  
      }
    });




/* ==========================================================
   Weekly‑Insights  (card + modal)  FINAL  v1.0
   ========================================================== */
(function(){
  if (document.getElementById('insights‑styles')) return;

  const css = `
  /* ---------- summary card ---------- */
  #weekly-summary-card{border-radius:16px;padding:1.5rem;
    background:linear-gradient(135deg,var(--card-bg) 0%,rgba(76,175,80,.20) 30%,var(--secondary-bg) 60%,rgba(76,175,80,.10) 80%,var(--card-bg) 100%);
    text-align:center;width:100%;margin:1rem 0;box-shadow:0 4px 20px var(--shadow-color);display:none}
  #weekly-summary-card.visible{display:block}
  #weekly-summary-card h2{font-size:1.8rem;font-weight:700;margin:.5rem 0;color:var(--text-color)}
  #weekly-summary-card p {font-size:1rem;margin-bottom:1rem;opacity:.9;color:var(--text-color)}
  #weekly-summary-card button{background:var(--accent-color);color:#fff;padding:.75rem 1.5rem;font-size:1rem;font-weight:500;border:none;border-radius:25px;transition:background .3s}
  #weekly-summary-card button:hover{background:var(--hover-link-color)}
  @media(min-width:800px){#weekly-summary-card{display:none !important}}


/* ==========================================================
   Weekly‑Insights : Mobile full‑screen pop‑up
   ========================================================== */

/* ---------- BACKDROP ---------- */
.insights-overlay{
  position:fixed; inset:0;
  display:none;                        /* JS toggles */
  justify-content:center; align-items:center;
  padding:0;                           /* edge‑to‑edge */
  background:rgba(0,0,0,.85);          /* solid dark */
  backdrop-filter:blur(8px);
  z-index:10000;
  overflow-y:auto; -webkit-overflow-scrolling:touch;
  animation:insights-fade .35s ease both;
}
@keyframes insights-fade{from{opacity:0}to{opacity:1}}

/* ---------- POP‑UP BODY ---------- */
.insights-content{
  position:relative;
  width:100%; min-height:100%;
  display:flex; flex-direction:column; gap:2rem;
  text-color:var(--text-color);
  /* SAME gradient as summary card, but fully opaque */
  background:linear-gradient(
              158deg,
              var(--card-bg)         0%,
              rgba(76,175,80,.35)   38%,   /* ↓ was .55 */
              var(--secondary-bg)   60%,
              rgba(76,175,80,.25)   88%,   /* ↓ was .45 */
              var(--card-bg)        100%);
}
  /* decorative blobs (pseudo‑elements) */
  overflow:hidden;                 /* hide blob overflow */
}
.insights-content::before,
.insights-content::after{
  content:'';
  position:absolute;
  border-radius:50%;
  background:rgba(255,255,255,.06);
  filter:blur(40px);
}
.insights-content::before{
  width:320px; height:320px;
  top:-120px; right:-70px;
}
.insights-content::after{
  width:260px; height:260px;
  bottom:-100px; left:-60px;
}

/* ---------- CLOSE BUTTON (sticky) ---------- */
.insights-close{
  position:sticky;
  top:1rem;
  margin-left:auto;

  width:40px;  height:40px;      /* a touch smaller */
  border-radius:50%;
  font-size:1.4rem;              /* smaller “×”     */
  line-height:1;                 /* no vertical jig */

  background:rgba(255,255,255,.15);   /* very faint disc  */
  backdrop-filter:blur(4px);
  color:#fff;


  box-shadow:0 2px 8px rgba(0,0,0,.4);
  z-index:2;                     /* higher than ::before/::after */

  transition:background .25s,transform .2s;
}
.insights-close:hover{
  background:rgba(255,255,255,.25);
  transform:scale(1.06);
}




/* ─── HEADER ─── */
.insights-header {
  top: 1rem;
  padding-bottom: .5rem;
  font-size: 2rem;
  margin-top: 900px;
  color: var(--accent-color, #ffffff);
  text-shadow: 1px 1px 3px rgba(0, 0, 0, .35);
}
.insights-sub {
  font-size: 1.05rem;
  margin: 0;
  color: var(--button-color, #e6e6e6);
  line-height: 1.55;
}

/* ── Quick Fact ── */
.insights-quickfact-text {
  text-align: center;
  font-size: 1.2rem;
  color: #fff;
  margin-bottom: 1rem;
}

/* ── Core Stats Grid ── */
.insights-stats-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: space-around;
}
.insights-stat {
  flex: 1 1 40%;
  max-width: 45%;
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(4px);
  padding: 0.75rem 1rem;
  border-radius: 10px;
  text-align: center;
}
.stat-label {
  font-size: 0.85rem;
  color: #ddd;
}
.stat-value {
  font-size: 1.1rem;
  color: #fff;
  font-weight: 600;
  margin-top: 0.25rem;
}

/* ── Budget Overview Title & Grid ── */
.insights-budgets-title {
  text-align: center;
  font-size: 1.5rem;
  color: #fff;
  margin-bottom: 1.1rem;
}
.insights-grid {
  display: flex;

  overflow-x: auto;
  padding-block: 1.1rem;
  scrollbar-width: none;
  justify-content: center;
}
.insights-grid::-webkit-scrollbar {
  display: none;
}

/* ── Each Donut Item ── */
.insights-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 8px;
}

/* wrapper to fix canvas size & position emoji */
.insights-chart-wrapper {
  position: relative;
  width: 90px;
  height: 90px;
  margin-bottom: 8px;
}
.insights-chart-wrapper canvas {
  position: absolute;
  top: 0; left: 0;
  width: 100% !important;
  height: 100% !important;
}
/* emoji dead‑center in the hole */
.insights-chart-wrapper .insights-icon {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.6rem;
  pointer-events: none;
}

/* amounts & labels */
.insights-amount {
  font-weight: 700;
  font-size: 0.95rem;
  color: #fff;
}
.insights-status {
  margin-top: 2px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--status-color, #ddd);
}
/* red when “over” */
.insights-status.over { --status-color: #ff4d4f; }
/* green when “left” */
.insights-status.left { --status-color: #4caf50; }
.insights-label {
  margin-top: 4px;
  font-size: 0.75rem;
  color: #fff;
}

/* ── Budget Summary Card ── */
.insights-budget-summary {
  padding: 0 1.5rem;
}.insights-budget-summary {
  padding: 0 1.5rem;
}
.budget-summary-card {
  position: relative;
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(6px) saturate(130%);
  border: 1px solid rgba(255,255,255,0.20);
  border-radius: 14px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 10px rgba(0,0,0,0.45);
  color: #fff;
  margin-bottom: 2rem;
  height: 180px;            /* reserve space for chart */
}
.budget-summary-card h3 {
  margin: 0;
  font-size: 1.6rem;
}
.budget-summary-card p {
  margin: 0.4rem 0 1rem;
  font-size: 0.9rem;
  opacity: 0.8;
}
#budgetSummaryChart {
  width: 100% !important;
  height: calc(100% - 4rem) !important; /* allow room for text above */
  display: block;
  margin: 0 auto;
}
.insights-budget-summary canvas {
  display: block;       /* ensure it shows as a block */
  width: 100% !important;
  max-width: 300px;
  height: 120px !important;
  margin: 0 auto;
}

/* ── Income vs Expenses Chart ── */
.insights-comparison-title {
  text-align: center;
  font-size: 1.3rem;
  color: #fff;
  margin: 1.5rem 0 0.5rem;
}
#comparisonChart {
  width: 100%;
  max-width: 280px;
  height: 180px;
  margin: 0 auto;
  display: block;
}

/* ── Footer Buttons ── */
.insights-footer {
  display: flex;
  gap: 1.6rem;
  margin-top: 2.2rem;
}
.insights-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .55rem;
  font-size: 1.05rem;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: background .25s, transform .2s;
}
.insights-btn {
  background: #fff;
  color: #000;
}
.insights-btn-ghost {
  background: transparent;
  border: 2px solid #fff;
  color: #fff;
}
.insights-btn:hover {
  background: #f4f4f4;
  transform: translateY(-2px);
}
.insights-btn-ghost:hover {
  background: #fff;
  color: #000;
}

/* ── Fade‑up Animation ── */
.insights-content > * {
  animation: fadeUp .4s ease both;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px) }
  to   { opacity: 1; transform: none       }
}


/* ── QUICK‑FACT & CORE‑STATS AS PILLS ── */
.insights-quickfact,
.insights-stats {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
    top: calc(1rem + 2.5rem);  /* 1rem + header’s approximate height */
  margin-bottom: .5rem;
}

.insights-quickfact-text,
.insights-stat {
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(4px);
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  min-width: 120px;
  text-align: center;
}

.insights-quickfact-text {
  font-size: 1rem;
  font-weight: 500;
  color: #fff;
}

.insights-stat .stat-label {
  display: block;
  font-size: 0.75rem;
  color: #ddd;
}

.insights-stat .stat-value {
  display: block;
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  margin-top: 0.25rem;
}

/* ensure “Net Saved” uses the same pill style */
.insights-quickfact-text { 
  /* it’s already a single <p> in its own <section>,
     so it will show as its own pill (“Net Saved $502.70”) */
}


/* ── give the pop‑up more top padding so header + pills sit below the close button ── */
.insights-content {
  padding: 3rem 1.4rem 3.5rem;  /* ↑ bump top padding from 2rem to 3rem */
}



/* ── raise the close button above everything ── */
.insights-close {
  z-index: 4;
}



  `;
  const style=document.createElement('style');style.id='insights‑styles';style.textContent=css;
  document.head.appendChild(style);
})();


  /*************************************************************
 * 3) ADVANCED INSIGHT ALGORITHM (compare last week vs prior)
 *************************************************************/
async function generateAdvancedInsights(uid) {
  // Load user document from Firestore
  const userDocRef = doc(db, "users", uid);
  const snapshot = await getDoc(userDocRef);
  if (!snapshot.exists()) return [];

  const userData = snapshot.data() || {};
  const incomes  = userData.incomes  || [];
  const expenses = userData.expenses || [];

  const now            = new Date();
  const oneWeekMs      = 7 * 24 * 60 * 60 * 1000;
  const lastWeekStart  = new Date(now - oneWeekMs);
  const twoWeeksAgoStart = new Date(now - 2 * oneWeekMs);

  // Split transactions into last week vs. prior week
  const lastWeekTx  = [];
  const priorWeekTx = [];

  incomes.forEach(tx => {
    const d = new Date(tx.timestamp);
    if (d >= lastWeekStart && d <= now) {
      lastWeekTx.push({ ...tx, type: "Income" });
    } else if (d >= twoWeeksAgoStart && d < lastWeekStart) {
      priorWeekTx.push({ ...tx, type: "Income" });
    }
  });

  expenses.forEach(tx => {
    const d = new Date(tx.timestamp);
    if (d >= lastWeekStart && d <= now) {
      lastWeekTx.push({ ...tx, type: "Expense" });
    } else if (d >= twoWeeksAgoStart && d < lastWeekStart) {
      priorWeekTx.push({ ...tx, type: "Expense" });
    }
  });

  // Sum income & expenses for last week
  const sumLastWeekIncome = lastWeekTx
    .filter(tx => tx.type === "Income")
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  const sumLastWeekExpense = lastWeekTx
    .filter(tx => tx.type === "Expense")
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  // Sum income & expenses for prior week
  const sumPriorWeekIncome = priorWeekTx
    .filter(tx => tx.type === "Income")
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  const sumPriorWeekExpense = priorWeekTx
    .filter(tx => tx.type === "Expense")
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  // Calculate percent changes
  const incomeChange = sumPriorWeekIncome === 0
    ? 0
    : ((sumLastWeekIncome - sumPriorWeekIncome) / sumPriorWeekIncome) * 100;

  const expenseChange = sumPriorWeekExpense === 0
    ? 0
    : ((sumLastWeekExpense - sumPriorWeekExpense) / sumPriorWeekExpense) * 100;

  // Category‐by‐category expense totals
  const catMapLast  = {};
  const catMapPrior = {};

  lastWeekTx.forEach(tx => {
    if (tx.type === "Expense") {
      const cat = tx.category || "Other";
      catMapLast[cat] = (catMapLast[cat] || 0) + parseFloat(tx.amount);
    }
  });

  priorWeekTx.forEach(tx => {
    if (tx.type === "Expense") {
      const cat = tx.category || "Other";
      catMapPrior[cat] = (catMapPrior[cat] || 0) + parseFloat(tx.amount);
    }
  });

  // Identify largest category last week
  const sortedLastCats = Object.entries(catMapLast)
    .sort(([, a], [, b]) => b - a);
  const topCategory = sortedLastCats[0] || null;  // e.g. ["Food", 150]

  // Find biggest jump/fall in category spending
  let biggestJumpCategory = null;
  let biggestJumpPercent  = 0;

  Object.entries(catMapLast).forEach(([cat, lastAmt]) => {
    const priorAmt = catMapPrior[cat] || 0;
    let pct;

    if (priorAmt === 0 && lastAmt > 0) {
      pct = 999;  // arbitrary large jump
    } else if (priorAmt > 0) {
      pct = ((lastAmt - priorAmt) / priorAmt) * 100;
    } else {
      pct = 0;
    }

    if (Math.abs(pct) > Math.abs(biggestJumpPercent)) {
      biggestJumpPercent  = pct;
      biggestJumpCategory = cat;
    }
  });

  // Highest & lowest daily balances (if available)
  let highestDay     = null;
  let highestBalance = -Infinity;
  let lowestDay      = null;
  let lowestBalance  =  Infinity;

  if (userData.dailyBalances) {
    Object.entries(userData.dailyBalances).forEach(([dayStr, bal]) => {
      const d = new Date(dayStr);
      if (d >= lastWeekStart && d <= now) {
        if (bal > highestBalance) {
          highestBalance = bal;
          highestDay     = dayStr;
        }
        if (bal < lowestBalance) {
          lowestBalance = bal;
          lowestDay     = dayStr;
        }
      }
    });
  }

  // Debt payoff insight
  let debtInsight = null;
  if (userData.debts?.paidThisWeek > 0) {
    debtInsight = `You paid off $${userData.debts.paidThisWeek} in debt this week. Great job!`;
  }

  // Coffee‐spending fun fact
  const coffeeSpent = lastWeekTx
    .filter(tx => (tx.category || "").toLowerCase().includes("coffee"))
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  const coffeeMsg = coffeeSpent > 0
    ? `You spent enough on coffee to buy ${Math.floor(coffeeSpent/4.5)} lattes!`
    : null;

  // Build a list of candidate insights
  const potential = [];

  if (Math.abs(incomeChange) > 5) {
    potential.push({
      key: "incomeChange",
      text: incomeChange > 0
        ? `Your income rose by ${incomeChange.toFixed(1)}% vs. last week.`
        : `Your income fell by ${Math.abs(incomeChange).toFixed(1)}% vs. last week.`,
      impact: 8
    });
  }

  if (Math.abs(expenseChange) > 5) {
    potential.push({
      key: "expenseChange",
      text: expenseChange > 0
        ? `Your expenses increased by ${expenseChange.toFixed(1)}% from last week.`
        : `Your expenses decreased by ${Math.abs(expenseChange).toFixed(1)}% from last week.`,
      impact: 9
    });
  }

  if (topCategory) {
    potential.push({
      key: "topCategory",
      text: `Your largest expense category was "${topCategory[0]}" ($${topCategory[1].toFixed(2)}) this week.`,
      impact: 9
    });
  }

  if (biggestJumpCategory && Math.abs(biggestJumpPercent) > 30) {
    potential.push({
      key: "jumpCategory",
      text: biggestJumpPercent > 0
        ? `Spending on "${biggestJumpCategory}" jumped by ${biggestJumpPercent.toFixed(1)}%!`
        : `Spending on "${biggestJumpCategory}" fell by ${Math.abs(biggestJumpPercent).toFixed(1)}%!`,
      impact: 7
    });
  }

  if (highestDay && lowestDay) {
    potential.push({
      key: "balanceHighLow",
      text: `Your balance peaked on ${highestDay} at $${highestBalance.toFixed(2)} and dipped to $${lowestBalance.toFixed(2)} on ${lowestDay}.`,
      impact: 6
    });
  }

  if (debtInsight)   potential.push({ key: "debt",   text: debtInsight,   impact: 8 });
  if (coffeeMsg)     potential.push({ key: "coffee", text: coffeeMsg,     impact: 3 });

  // Avoid repeating insights used in the last 4 weeks
  const insightsHistory = userData.insightsHistory || {};
  const fourWeeksAgo = new Date(now - 4 * oneWeekMs);

  const finalCandidates = potential.filter(ins => {
    const lastUsedStr = insightsHistory[ins.key];
    if (!lastUsedStr) return true;
    return new Date(lastUsedStr) < fourWeeksAgo;
  });

  // Pick top 5 by impact
  finalCandidates.sort((a, b) => b.impact - a.impact);
  const chosen = finalCandidates.slice(0, 5);

  // Mark chosen insights as used today
  const todayStr = now.toISOString().split("T")[0];
  chosen.forEach(c => {
    insightsHistory[c.key] = todayStr;
  });
  await setDoc(userDocRef, { insightsHistory }, { merge: true });

  // Return just the text array
  return chosen.map(c => c.text);
}


/*************************************************************
 * 4) MAIN FUNCTION: initWeeklySummaryFeature(user)
 *************************************************************/
async function initWeeklySummaryFeature(user) {
  if (!user) return;

  const today = new Date();
  const dayOfWeek = today.getDay(); // Monday = 1
  const isTesting = false; // Set to true for testing on any day
  const forceShow = true; // Set to true to bypass lastShown check for testing

  // Hide card on non-Mondays in production
  if (!isTesting && dayOfWeek !== 2) {
    const cardEl = document.getElementById("weekly-summary-card");
    if (cardEl) cardEl.style.display = "none";
    return;
  }

  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const userDocRef = doc(db, "users", user.uid);
  const snap = await getDoc(userDocRef);

  if (!snap.exists()) {
    console.log(`User document does not exist. Creating with todayStr: ${todayStr}`);
    await setDoc(userDocRef, { weeklySummaryLastShown: todayStr }, { merge: true });
    showWeeklySummaryCard();
  } else {
    const data = snap.data();
    const lastShown = data.weeklySummaryLastShown || null;
    console.log(`lastShown: ${lastShown}, todayStr: ${todayStr}, forceShow: ${forceShow}`);
    if (forceShow || lastShown !== todayStr) {
      console.log(`Showing card. Updating lastShown to ${todayStr}`);
      await setDoc(userDocRef, { weeklySummaryLastShown: todayStr }, { merge: true });
      showWeeklySummaryCard();
    } else {
      console.log("Card already shown today. Hiding card.");
      const cardEl = document.getElementById("weekly-summary-card");
      if (cardEl) cardEl.style.display = "none";
    }
  }

  const viewBtn = document.getElementById("view-insights-btn");
  const popupEl = document.getElementById("weekly-insights-modal");
  const closeBtn = document.getElementById("insights-modal-close-btn");
  if (viewBtn) {
    viewBtn.addEventListener("click", async () => {
      await showInsightsPopup(user);
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      if (popupEl) {
        popupEl.classList.add("hidden");
        popupEl.style.display = "none";
      }
    });
  }
}

/*************************************************************
 * 5) Helper to show the card
 *************************************************************/
function showWeeklySummaryCard() {
  const cardEl = document.getElementById("weekly-summary-card");
  if (cardEl) {
    // Add a class to control visibility instead of directly setting display
    cardEl.classList.add("visible");
    console.log("showWeeklySummaryCard: Added 'visible' class, current display:", cardEl.style.display);
  } else {
    console.error("showWeeklySummaryCard: weekly-summary-card element not found");
  }
}


// 5) INIT: show card & hook button
(function createWeeklySummaryCard() {
  const dash = document.getElementById("dashboard-section")||document.body;
  let card = document.getElementById("weekly-summary-card");
  if (!card) {
    card = document.createElement("div");
    card.id = "weekly-summary-card";
    dash.appendChild(card);
  }
  card.innerHTML = `
    <h2>Weekly Insights</h2>
    <p>Uncover your financial highlights</p>
    <button id="view-insights-btn">View Insights</button>
  `;
  document
    .getElementById("view-insights-btn")
    
})();



async function showInsightsPopup() {
  // 1️⃣ Grab all the DOM nodes we need
  const popup        = document.getElementById("insights-popup");
  const closeBtn     = document.getElementById("close-insights-popup");
  const quickFactEl  = document.getElementById("insights-quickfact");
  const statsGridEl  = document.getElementById("insights-stats-grid");
  const budgetGridEl = document.getElementById("insights-grid");
  const compCanvas   = document.getElementById("comparisonChart");

  if (![popup, closeBtn, quickFactEl, statsGridEl, budgetGridEl, compCanvas].every(el => el)) {
    console.warn("Missing elements in Weekly Insights popup.");
    return;
  }

  // 2️⃣ Show the overlay
  popup.classList.remove("hidden");
  popup.style.display = "flex";
  popup.scrollTop     = 0;
  closeBtn.onclick    = () => {
    popup.classList.add("hidden");
    popup.style.display = "none";
  };

  // 3️⃣ Fetch data
  const user = auth.currentUser;
  if (!user) return;
  const [insights, snap] = await Promise.all([
    generateAdvancedInsights(user.uid),
    getDoc(doc(db, "users", user.uid))
  ]);
  const data     = snap.data() || {};
  const incomes  = Array.isArray(data.incomes)  ? data.incomes  : [];
  const expenses = Array.isArray(data.expenses) ? data.expenses : [];
  const budgets  = Array.isArray(data.budgets)  ? data.budgets  : [];

  // 4️⃣ Totals & averages
  const incomeTotal  = incomes.reduce((s,tx) => s + (parseFloat(tx.amount)||0), 0);
  const expenseTotal = expenses.reduce((s,tx)=> s + (parseFloat(tx.amount)||0), 0);
  const netBalance   = incomeTotal - expenseTotal;
  const avgExpense   = (expenseTotal/7).toFixed(2);

  // 5️⃣ Quick‑fact banner
  const dayCount = {};
  expenses.forEach(tx => {
    const d = new Date(tx.timestamp).toLocaleDateString();
    dayCount[d] = (dayCount[d]||0) + 1;
  });
  const frequentDay = Object.entries(dayCount)
    .sort((a,b)=> b[1]-a[1])[0]?.[0] || "N/A";
  const facts = [
    `You ${netBalance>=0?'saved':'spent'} $${Math.abs(netBalance).toFixed(2)} this week!`,
    `Total income was $${incomeTotal.toFixed(2)} over the last 7 days.`,
    `Total expenses were $${expenseTotal.toFixed(2)} this week.`,
    `Your highest spending day was ${frequentDay}.`,
    `Your average daily expense is $${avgExpense}.`
  ];
  quickFactEl.textContent = facts[Math.floor(Math.random()*facts.length)];

  // 6️⃣ Core‑stats grid
  const stats5 = [
    { label:'Total Income',      value:`$${incomeTotal.toFixed(2)}` },
    { label:'Total Expenses',    value:`$${expenseTotal.toFixed(2)}` },
    { label:'Avg Daily Expense', value:`$${avgExpense}`          },
    { label:'Top Spend Day',     value: frequentDay              },
    { label: netBalance>=0?'Net Saved':'Net Spent',
      value:`$${Math.abs(netBalance).toFixed(2)}` }
  ];
  statsGridEl.innerHTML = stats5.map(s => `
    <div class="insights-stat">
      <span class="stat-label">${s.label}</span>
      <span class="stat-value">${s.value}</span>
    </div>
  `).join("");

  // 7️⃣ Budget Overview Donuts (up to 5)
  budgetGridEl.innerHTML = budgets.slice(0,5).map((b,i) => {
    const start = new Date(b.start);
    const end   = b.deadline ? new Date(b.deadline) : new Date();
    const pool  = b.type === "expense" ? expenses : incomes;
    const actual = pool
      .filter(tx => {
        const d = new Date(tx.timestamp);
        return d >= start && d <= end;
      })
      .filter(tx => b.type === "expense"
        ? b.categories.includes(tx.category)
        : b.categories.includes(tx.source))
      .reduce((sum,tx)=> sum + (parseFloat(tx.amount)||0), 0);

    const total = parseFloat(b.goal) || 0;
    const pct   = total === 0 ? 0 : Math.min(100, (actual/total)*100);
    const ringColor = actual > total ? "#ff4d4f"
                    : pct > 50          ? "#ffa940"
                                        : "#4caf50";
    const trackColor = "#0d1f2c";
    const status = actual > total ? "over" : "left";
    const diff   = total - actual;
    const iconMap = { groceries:"🛒", food:"🍔", rent:"🏠", coffee:"☕️", gas:"⛽️", transport:"🚍", savings:"💰" };
    const icon = Object.entries(iconMap).find(([k])=> b.name.toLowerCase().includes(k))?.[1]
               || (b.type==="savings" ? "💰" : "💰");

    return `
      <div class="insights-item">
        <div class="insights-chart-wrapper">
          <canvas id="insights-chart-${i}"></canvas>
          <div class="insights-icon">${icon}</div>
        </div>
        <div class="insights-amount">$${Math.abs(diff).toFixed(2)}</div>
        <div class="insights-status ${status}">${status}</div>
        <div class="insights-label">${b.name}</div>
      </div>
    `;
  }).join("");

  // 8️⃣ Instantiate each donut chart
  budgets.slice(0,5).forEach((b,i) => {
    const start = new Date(b.start);
    const end   = b.deadline ? new Date(b.deadline) : new Date();
    const pool  = b.type === "expense" ? expenses : incomes;
    const actual = pool
      .filter(tx => {
        const d = new Date(tx.timestamp);
        return d >= start && d <= end;
      })
      .filter(tx => b.type === "expense"
        ? b.categories.includes(tx.category)
        : b.categories.includes(tx.source))
      .reduce((sum,tx)=> sum + (parseFloat(tx.amount)||0), 0);

    const total = parseFloat(b.goal) || 0;
    const pct   = total === 0 ? 0 : Math.min(100, (actual/total)*100);
    const ringColor = actual > total ? "#ff4d4f"
                    : pct > 50          ? "#ffa940"
                                        : "#4caf50";
    const trackColor = "#0d1f2c";

    new Chart(
      document.getElementById(`insights-chart-${i}`),
      {
        type: "doughnut",
        data: {
          datasets: [{
            data: [pct, 100 - pct],
            backgroundColor: [ringColor, trackColor],
            cutout: "85%",
            borderWidth: 0
          }]
        },
        options: {
          responsive: false,
          plugins: { tooltip:{enabled:false}, legend:{display:false} },
          animation:{ animateRotate:true, duration:600 }
        }
      }
    );
  });

  // ─── Budget Summary Sparkline & Text ───

  // A) compute totalBudget & totalSpent
  let totalBudget = 0, totalSpent = 0;
  budgets.forEach(b => {
    const goal = parseFloat(b.goal) || 0;
    totalBudget += goal;

    const pool = b.type === "expense" ? expenses : incomes;
    const actual = pool
      .filter(tx => {
        const d = new Date(tx.timestamp);
        const start = new Date(b.start);
        const end   = b.deadline ? new Date(b.deadline) : new Date();
        return d >= start && d <= end;
      })
      .filter(tx => b.type==="expense"
        ? b.categories.includes(tx.category)
        : b.categories.includes(tx.source))
      .reduce((sum,tx)=> sum + (parseFloat(tx.amount)||0), 0);

    totalSpent += actual;
  });
  const totalLeft = totalBudget - totalSpent;

  // B) inject the numbers
  document.getElementById("budget-summary-amount")
          .textContent = `$${totalLeft.toFixed(2)}`;
  document.getElementById("budget-summary-total")
          .textContent = `out of $${totalBudget.toFixed(2)} budgeted`;

  // C) prepare sparkline data
  const dailyBalances = data.dailyBalances || {};
  const entries = Object.entries(dailyBalances)
    .sort((a,b)=> new Date(a[0]) - new Date(b[0]))
    .slice(-7);
  const labels   = entries.map(e=> e[0].slice(5));      // “MM-DD”
  const actuals  = entries.map(e=> parseFloat(e[1])||0);
  const expected = labels.map((_,i) =>
    totalBudget * (i/(labels.length-1))
  );

  const ctx = document
    .getElementById("budgetSummaryChart")
    .getContext("2d");
  if (window.budgetSummaryChart?.destroy) window.budgetSummaryChart.destroy();
  window.budgetSummaryChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Expected",
          data: expected,
          borderColor: "#9e9e9e",
          borderDash: [6,4],
          pointRadius: 0,
          fill: false,
        },
        {
          label: "Actual",
          data: actuals,
          borderColor: actuals[actuals.length-1] > expected[expected.length-1]
                       ? "#ff4d4f"
                       : "#4caf50",
          pointBackgroundColor: actuals.map((v,i)=> v>expected[i]?"#ff4d4f":"#4caf50"),
          pointRadius: 4,
          tension: 0.3,
          fill: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { x:{display:false}, y:{display:false,beginAtZero:true} },
      plugins:{
        legend:{display:false},
        tooltip:{callbacks:{ label(ctx){ return `$${ctx.parsed.y.toFixed(2)}`; }}}
      }
    }
  });

  // 9️⃣ Income vs Expenses bar chart
  if (window.insightsComparisonChart?.destroy) {
    window.insightsComparisonChart.destroy();
  }
  window.insightsComparisonChart = new Chart(
    compCanvas.getContext("2d"),
    {
      type: "bar",
      data:{
        labels:["Income","Expenses"],
        datasets:[{
          data:[incomeTotal, expenseTotal],
          backgroundColor:["#4caf50","#f44336"]
        }]
      },
      options:{
        plugins:{
          title:{ display:true, text:"Income vs Expenses",
                  color:getComputedStyle(document.body).getPropertyValue("--text-color"),
                  font:{size:18} },
          legend:{display:false}
        },
        scales:{
          x:{ticks:{color:getComputedStyle(document.body).getPropertyValue("--text-color")}},
          y:{beginAtZero:true, ticks:{color:getComputedStyle(document.body).getPropertyValue("--text-color")}}
        }
      }
    }
  );
}
