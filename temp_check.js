
        const navHome = document.getElementById('nav-home');
        const navGames = document.getElementById('nav-games');
        const navShop = document.getElementById('nav-shop');
        const exploreBtn = document.getElementById('explore-btn');
        const logoHome = document.getElementById('logo-home');
        const footerLogoHome = document.getElementById('footer-logo-home');

        // Helper to check if any modal is active
        function isModalActive() {
            return (document.getElementById('auth-modal').classList.contains('active') ||
                    (document.getElementById('profile-modal') && document.getElementById('profile-modal').classList.contains('active')));
        }

        // Keyboard navigation scroll block during active modals
        window.addEventListener('keydown', (e) => {
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
                return;
            }
            if (isModalActive()) {
                if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(e.key)) {
                    e.preventDefault();
                }
            }
        });

        // Click Scroll Bindings
        function scrollToSection(elementId) {
            const el = document.getElementById(elementId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        }

        navHome.addEventListener('click', (e) => {
            e.preventDefault();
            scrollToSection('page-home');
        });

        logoHome.addEventListener('click', (e) => {
            e.preventDefault();
            scrollToSection('page-home');
        });

        footerLogoHome.addEventListener('click', (e) => {
            e.preventDefault();
            scrollToSection('page-home');
        });

        navGames.addEventListener('click', (e) => {
            e.preventDefault();
            scrollToSection('page-games');
        });

        exploreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            scrollToSection('page-games');
        });

        navShop.addEventListener('click', (e) => {
            currentUser = getSessionUser();
            if (!currentUser) {
                e.preventDefault();
                showToast("Please sign in or register to access the Items Shop.", "error");
                openAuthModal('signin');
            }
        });

        // Dynamic Active Nav Highlighting on Scroll
        function updateActiveNavOnScroll() {
            const home = document.getElementById('page-home');
            const games = document.getElementById('page-games');
            
            if (!home || !games) return;
            
            const scrollPos = window.scrollY || window.pageYOffset;
            const threshold = window.innerHeight * 0.45; // threshold of viewport height
            
            const homeTop = home.offsetTop;
            const gamesTop = games.offsetTop;
            
            navHome.classList.remove('active');
            navGames.classList.remove('active');
            
            if (scrollPos + threshold >= gamesTop) {
                navGames.classList.add('active');
            } else {
                navHome.classList.add('active');
            }
        }

        window.addEventListener('scroll', updateActiveNavOnScroll);

        // ==========================================
        // SECURITY & AUTHENTICATION MOCK DATA LOGIC
        // ==========================================

        let currentUser = null;

        // Secure password requirement validator
        function validatePassword(password) {
            const minLength = 8;
            const hasUppercase = /[A-Z]/.test(password);
            const hasLowercase = /[a-z]/.test(password);
            const hasDigit = /[0-9]/.test(password);
            const hasSpecial = /[^A-Za-z0-9]/.test(password);
            
            if (password.length < minLength) return "Password must be at least 8 characters long.";
            if (!hasUppercase) return "Password must contain at least one uppercase letter.";
            if (!hasLowercase) return "Password must contain at least one lowercase letter.";
            if (!hasDigit) return "Password must contain at least one number.";
            if (!hasSpecial) return "Password must contain at least one special character.";
            return null;
        }

        // Email regex validator
        function validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!re.test(email)) return "Invalid email address format.";
            return null;
        }

        // Cryptographically Salt & Hash the password client side
        async function hashPassword(password, salt) {
            if (!window.crypto || !window.crypto.subtle) {
                // Defensive Fallback for non-secure contexts (e.g. file:/// local schemes)
                console.warn("Web Crypto subtle is not available in this context. Utilizing local fallback hashing.");
                let hash = 0;
                const combined = password + salt;
                for (let i = 0; i < combined.length; i++) {
                    hash = (hash << 5) - hash + combined.charCodeAt(i);
                    hash |= 0;
                }
                return "fallback-hash-" + Math.abs(hash).toString(16);
            }
            const encoder = new TextEncoder();
            const data = encoder.encode(password + salt);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        // Generate strong random hex salt
        function generateSalt() {
            if (!window.crypto || !window.crypto.getRandomValues) {
                return Math.random().toString(36).substring(2);
            }
            const array = new Uint32Array(4);
            window.crypto.getRandomValues(array);
            return Array.from(array).map(n => n.toString(16)).join('');
        }

        // Database read helper
        function getAccounts() {
            try {
                const data = localStorage.getItem('realm_link_accounts');
                return data ? JSON.parse(data) : {};
            } catch (e) {
                console.error("Failed to read database.", e);
                return {};
            }
        }

        // Database write helper
        function saveAccounts(accounts) {
            try {
                localStorage.setItem('realm_link_accounts', JSON.stringify(accounts));
            } catch (e) {
                console.error("Failed to write to database.", e);
            }
        }

        // Ensure user account has all necessary fields populated
        function ensureUserFields(user) {
            let changed = false;
            if (!user.userId) {
                user.userId = 'RL-' + Math.floor(10000 + Math.random() * 90000);
                changed = true;
            }
            if (!user.friends) {
                user.friends = [
                    { name: 'CyberPioneer', status: 'online' },
                    { name: 'SpellCaster99', status: 'offline' },
                    { name: 'NeonKnight', status: 'online' }
                ];
                changed = true;
            }
            if (!user.gameActivity) {
                user.gameActivity = {
                    'planet-plunder': Math.floor(5 + Math.random() * 145),
                    'spell-controller': Math.floor(5 + Math.random() * 145)
                };
                changed = true;
            }
            if (user.points === undefined) {
                user.points = 0;
                changed = true;
            }
            if (!user.inventory) {
                user.inventory = [];
                changed = true;
            }
            return changed;
        }

        // Retrieve current active user session
        function getSessionUser() {
            try {
                const email = sessionStorage.getItem('realm_link_session');
                if (!email) return null;
                const accounts = getAccounts();
                const user = accounts[email.toLowerCase().trim()] || null;
                if (user) {
                    if (ensureUserFields(user)) {
                        saveAccounts(accounts);
                    }
                }
                return user;
            } catch (e) {
                return null;
            }
        }

        // Set or clear session
        function setSessionUser(email) {
            try {
                if (email) {
                    sessionStorage.setItem('realm_link_session', email.toLowerCase().trim());
                } else {
                    sessionStorage.removeItem('realm_link_session');
                }
            } catch (e) {}
        }

        // Update the Auth navigation displays dynamically
        function updateAuthHUD() {
            const btnSignIn = document.getElementById('btn-open-auth');
            const userHud = document.getElementById('user-hud');
            const hudUsername = document.getElementById('hud-username');
            const hudPoints = document.getElementById('hud-points');
            
            currentUser = getSessionUser();
            
            if (currentUser) {
                btnSignIn.style.display = 'none';
                userHud.style.display = 'flex';
                
                if (currentUser.email && currentUser.email.toLowerCase() === 'admin@realmlink.com') {
                    hudUsername.textContent = `${currentUser.username} (Admin)`;
                } else {
                    hudUsername.textContent = currentUser.username;
                }
                
                const pts = currentUser.points !== undefined ? currentUser.points : 0;
                hudPoints.textContent = `🪙 ${pts.toLocaleString()} Points`;
                
                const avatarBtn = document.getElementById('user-avatar-btn');
                if (currentUser.avatarUrl) {
                    avatarBtn.innerHTML = `<img src="${currentUser.avatarUrl}" class="user-hud-avatar-img" alt="User Avatar" referrerPolicy="no-referrer">`;
                } else {
                    avatarBtn.textContent = currentUser.username.charAt(0).toUpperCase();
                }

                // Populate dynamic dropdown menu values
                const dropdownUsername = document.getElementById('dropdown-username');
                const dropdownUid = document.getElementById('dropdown-uid');
                const dropdownPoints = document.getElementById('dropdown-points');
                
                if (dropdownUsername) dropdownUsername.textContent = currentUser.username;
                if (dropdownUid) dropdownUid.textContent = `UID: ${currentUser.userId || 'RL-00000'}`;
                if (dropdownPoints) dropdownPoints.textContent = `🪙 ${pts.toLocaleString()} Points`;
            } else {
                btnSignIn.style.display = 'block';
                userHud.style.display = 'none';
            }
        }

        // ==========================================
        // TOAST NOTIFICATION CONTAINER SYSTEM
        // ==========================================

        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            
            let icon = 'ℹ️';
            if (type === 'success') icon = '✅';
            if (type === 'error') icon = '❌';
            
            // XSS Defense: textContent sanitizes input string
            toast.textContent = `${icon} ${message}`;
            container.appendChild(toast);
            
            setTimeout(() => {
                toast.classList.add('show');
            }, 10);
            
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, 4000);
        }

        // ==========================================
        // AUTH MODAL UI CONTROL & TAB SWITCHES
        // ==========================================

        const authModal = document.getElementById('auth-modal');
        const tabSignin = document.getElementById('tab-signin');
        const tabRegister = document.getElementById('tab-register');
        const formSignin = document.getElementById('form-signin');
        const formRegister = document.getElementById('form-register');

        function openAuthModal(defaultTab = 'signin') {
            authModal.classList.add('active');
            switchTab(defaultTab);
        }

        function closeAuthModal() {
            authModal.classList.remove('active');
            clearFormErrors();
        }

        function switchTab(tab) {
            if (tab === 'signin') {
                tabSignin.classList.add('active');
                tabRegister.classList.remove('active');
                formSignin.classList.add('active');
                formRegister.classList.remove('active');
            } else {
                tabRegister.classList.add('active');
                tabSignin.classList.remove('active');
                formRegister.classList.add('active');
                formSignin.classList.remove('active');
            }
            clearFormErrors();
        }

        function clearFormErrors() {
            document.querySelectorAll('.form-error').forEach(el => {
                el.textContent = '';
                el.style.display = 'none';
            });
        }

        document.getElementById('btn-open-auth').addEventListener('click', () => openAuthModal('signin'));
        document.getElementById('btn-close-auth').addEventListener('click', closeAuthModal);
        
        tabSignin.addEventListener('click', () => switchTab('signin'));
        tabRegister.addEventListener('click', () => switchTab('register'));

        // Sign Up submission handler
        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearFormErrors();
            
            const username = document.getElementById('register-username').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            
            let hasError = false;
            
            if (username.length < 3) {
                document.getElementById('error-register-username').textContent = "Username must be at least 3 characters.";
                document.getElementById('error-register-username').style.display = 'block';
                hasError = true;
            }
            
            const emailErr = validateEmail(email);
            if (emailErr) {
                document.getElementById('error-register-email').textContent = emailErr;
                document.getElementById('error-register-email').style.display = 'block';
                hasError = true;
            }
            
            const pwdErr = validatePassword(password);
            if (pwdErr) {
                document.getElementById('error-register-password').textContent = pwdErr;
                document.getElementById('error-register-password').style.display = 'block';
                hasError = true;
            }
            
            if (password !== confirmPassword) {
                document.getElementById('error-register-confirm').textContent = "Passwords do not match.";
                document.getElementById('error-register-confirm').style.display = 'block';
                hasError = true;
            }
            
            if (hasError) return;
            
            const accounts = getAccounts();
            const lowerEmail = email.toLowerCase();
            
            if (accounts[lowerEmail]) {
                document.getElementById('error-register-email').textContent = "An account with this email already exists.";
                document.getElementById('error-register-email').style.display = 'block';
                return;
            }
            
            const salt = generateSalt();
            const hashedPassword = await hashPassword(password, salt);
            
            // Randomly seed gameplay hours and generate a unique User ID
            const randomId = 'RL-' + Math.floor(10000 + Math.random() * 90000);
            const seededFriends = [
                { name: 'CyberPioneer', status: 'online' },
                { name: 'SpellCaster99', status: 'offline' },
                { name: 'NeonKnight', status: 'online' }
            ];
            const seededHours = {
                'planet-plunder': Math.floor(5 + Math.random() * 145),
                'spell-controller': Math.floor(5 + Math.random() * 145)
            };

            accounts[lowerEmail] = {
                username: username,
                email: email,
                salt: salt,
                hashedPassword: hashedPassword,
                points: 0,
                userId: randomId,
                friends: seededFriends,
                gameActivity: seededHours,
                inventory: []
            };
            
            saveAccounts(accounts);
            setSessionUser(email);
            updateAuthHUD();
            closeAuthModal();
            showToast(`Account successfully registered, welcome ${username}!`, "success");
        });

        // Sign In submission handler
        formSignin.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearFormErrors();
            
            const email = document.getElementById('signin-email').value.trim();
            const password = document.getElementById('signin-password').value;
            
            const lowerEmail = email.toLowerCase();
            const accounts = getAccounts();
            const user = accounts[lowerEmail];
            
            if (!user) {
                document.getElementById('error-signin-email').textContent = "No registered account matches this email.";
                document.getElementById('error-signin-email').style.display = 'block';
                return;
            }
            
            const hash = await hashPassword(password, user.salt);
            if (hash !== user.hashedPassword) {
                document.getElementById('error-signin-password').textContent = "Invalid login credentials.";
                document.getElementById('error-signin-password').style.display = 'block';
                return;
            }
            
            setSessionUser(email);
            updateAuthHUD();
            closeAuthModal();
            showToast(`Welcome back, ${user.username}!`, "success");
        });

        // User dropdown menu toggles
        const userAvatarBtn = document.getElementById('user-avatar-btn');
        const userDropdown = document.getElementById('user-dropdown');
        const btnLogout = document.getElementById('btn-logout');
        
        userAvatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });
        
        window.addEventListener('click', () => {
            userDropdown.classList.remove('active');
        });

        btnLogout.addEventListener('click', () => {
            setSessionUser(null);
            updateAuthHUD();
            showToast("You have been signed out.", "info");
        });

        // ==========================================
        // PROFILE DASHBOARD TAB CONTROL & UI RENDERING
        // ==========================================

        const profileModal = document.getElementById('profile-modal');
        const btnCloseProfile = document.getElementById('btn-close-profile');
        let activeProfileTab = 'overview';

        function bindDropdownShortcuts(elId, tabName) {
            const btn = document.getElementById(elId);
            if (btn) {
                btn.addEventListener('click', () => {
                    const user = getSessionUser();
                    if (user) {
                        switchProfileTab(tabName);
                        profileModal.classList.add('active');
                    }
                });
            }
        }

        bindDropdownShortcuts('btn-dropdown-overview', 'overview');
        bindDropdownShortcuts('btn-dropdown-inventory', 'inventory');
        bindDropdownShortcuts('btn-dropdown-friends', 'friends');
        bindDropdownShortcuts('btn-dropdown-achievements', 'achievements');

        btnCloseProfile.addEventListener('click', () => {
            profileModal.classList.remove('active');
        });

        function initProfileTabs() {
            const navItems = document.querySelectorAll('.profile-nav-item');
            navItems.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tab = e.currentTarget.getAttribute('data-tab');
                    switchProfileTab(tab);
                });
            });
        }

        function switchProfileTab(tabName) {
            activeProfileTab = tabName;
            
            // Update active state class on side menu buttons
            const navItems = document.querySelectorAll('.profile-nav-item');
            navItems.forEach(btn => {
                if (btn.getAttribute('data-tab') === tabName) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            drawProfileTab();
        }

        function drawProfileTab() {
            const user = getSessionUser();
            if (!user) return;
            
            // Update sidebar user details
            const avatar = document.getElementById('profile-avatar');
            const username = document.getElementById('profile-username');
            const badge = document.getElementById('profile-badge');
            
            if (user.avatarUrl) {
                avatar.innerHTML = `<img src="${user.avatarUrl}" class="profile-sidebar-avatar-img" alt="User Avatar" referrerPolicy="no-referrer">`;
            } else {
                avatar.textContent = user.username.charAt(0).toUpperCase();
            }
            username.textContent = user.username;
            
            // Check if admin
            if (user.email && user.email.toLowerCase() === 'admin@realmlink.com') {
                badge.textContent = 'Admin';
                badge.classList.add('admin-badge');
            } else {
                badge.textContent = 'Member';
                badge.classList.remove('admin-badge');
            }
            
            const contentArea = document.getElementById('profile-content-area');
            contentArea.textContent = ''; // Clear previous contents
            
            if (activeProfileTab === 'overview') {
                drawOverviewTab(user, contentArea);
            } else if (activeProfileTab === 'inventory') {
                drawInventoryTab(user, contentArea);
            } else if (activeProfileTab === 'billing') {
                drawBillingTab(user, contentArea);
            } else if (activeProfileTab === 'friends') {
                drawFriendsTab(user, contentArea);
            } else if (activeProfileTab === 'achievements') {
                drawAchievementsTab(user, contentArea);
            }
        }

        // 1. Overview Tab
        function drawOverviewTab(user, container) {
            const grid = document.createElement('div');
            grid.className = 'overview-grid';
            
            // Left Card: Stats Overview
            const statsCard = document.createElement('div');
            statsCard.className = 'profile-card';
            
            const statsTitle = document.createElement('span');
            statsTitle.className = 'profile-card-title';
            statsTitle.textContent = 'User Overview';
            statsCard.appendChild(statsTitle);
            
            // User ID
            const idRow = document.createElement('div');
            idRow.style.margin = '0.5rem 0';
            idRow.style.fontSize = '0.9rem';
            idRow.style.color = 'var(--text-secondary)';
            
            const idLabel = document.createElement('strong');
            idLabel.textContent = 'Account ID: ';
            idLabel.style.color = 'var(--text-primary)';
            
            const idVal = document.createTextNode(user.userId || 'RL-00000');
            idRow.appendChild(idLabel);
            idRow.appendChild(idVal);
            statsCard.appendChild(idRow);
            
            // Level and Points
            const level = Math.floor((user.points || 0) / 1000) + 1;
            const xp = (user.points || 0) % 1000;
            
            const lvlRow = document.createElement('div');
            lvlRow.style.display = 'flex';
            lvlRow.style.justifyContent = 'space-between';
            lvlRow.style.alignItems = 'baseline';
            lvlRow.style.marginTop = '0.5rem';
            
            const lvlLabel = document.createElement('span');
            lvlLabel.textContent = `Level ${level}`;
            lvlLabel.style.fontWeight = '800';
            lvlLabel.style.fontSize = '1.25rem';
            lvlLabel.style.color = 'var(--accent-blue-light)';
            
            const xpText = document.createElement('span');
            xpText.textContent = `${xp} / 1000 XP`;
            xpText.style.fontSize = '0.8rem';
            xpText.style.color = 'var(--text-muted)';
            
            lvlRow.appendChild(lvlLabel);
            lvlRow.appendChild(xpText);
            statsCard.appendChild(lvlRow);
            
            // XP Bar
            const xpBarContainer = document.createElement('div');
            xpBarContainer.className = 'xp-bar-container';
            
            const xpBarFill = document.createElement('div');
            xpBarFill.className = 'xp-bar-fill';
            xpBarFill.style.width = `${(xp / 1000) * 100}%`;
            
            xpBarContainer.appendChild(xpBarFill);
            statsCard.appendChild(xpBarContainer);
            
            // Total points
            const ptsText = document.createElement('div');
            ptsText.style.fontSize = '0.8rem';
            ptsText.style.color = 'var(--text-secondary)';
            ptsText.style.marginTop = '0.5rem';
            ptsText.textContent = `Total Points Earned: 🪙 ${(user.points || 0).toLocaleString()}`;
            statsCard.appendChild(ptsText);
            
            grid.appendChild(statsCard);
            
            // Right Card: Game Activity
            const activityCard = document.createElement('div');
            activityCard.className = 'profile-card';
            
            const actTitle = document.createElement('span');
            actTitle.className = 'profile-card-title';
            actTitle.textContent = 'Game Activity';
            activityCard.appendChild(actTitle);
            
            const activityList = document.createElement('div');
            activityList.style.display = 'flex';
            activityList.style.flexDirection = 'column';
            activityList.style.gap = '0.75rem';
            activityList.style.marginTop = '0.5rem';
            
            const games = [
                { id: 'planet-plunder', name: '🚀 Planet Plunder', hours: user.gameActivity['planet-plunder'] || 0 },
                { id: 'spell-controller', name: '🪄 Spell Controller', hours: user.gameActivity['spell-controller'] || 0 }
            ];
            
            games.forEach(game => {
                const row = document.createElement('div');
                row.className = 'game-activity-row';
                
                const gameName = document.createElement('span');
                gameName.textContent = game.name;
                gameName.style.fontWeight = '600';
                gameName.style.fontSize = '0.9rem';
                
                const gameHours = document.createElement('span');
                gameHours.textContent = `${game.hours} hrs`;
                gameHours.style.fontSize = '0.85rem';
                gameHours.style.color = 'var(--text-secondary)';
                
                row.appendChild(gameName);
                row.appendChild(gameHours);
                activityList.appendChild(row);
            });
            
            activityCard.appendChild(activityList);
            grid.appendChild(activityCard);
            
            container.appendChild(grid);
        }

        // 2. Inventory Tab
        function drawInventoryTab(user, container) {
            const h3 = document.createElement('h3');
            h3.style.marginBottom = '0.5rem';
            h3.style.fontWeight = '800';
            h3.style.fontSize = '1.3rem';
            h3.textContent = '🎒 My Inventory';
            container.appendChild(h3);
            
            const desc = document.createElement('p');
            desc.style.color = 'var(--text-secondary)';
            desc.style.marginBottom = '1.5rem';
            desc.style.fontSize = '0.85rem';
            desc.textContent = 'Cosmetics, upgrades, and item packs you have unlocked or purchased.';
            container.appendChild(desc);
            
            const listContainer = document.createElement('div');
            listContainer.className = 'inventory-list';
            listContainer.style.maxHeight = 'none';
            
            if (!user.inventory || user.inventory.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'inventory-empty';
                empty.textContent = 'No purchased items yet. Start shopping!';
                listContainer.appendChild(empty);
            } else {
                user.inventory.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'inventory-item';
                    
                    const details = document.createElement('div');
                    details.className = 'inventory-item-details';
                    
                    const nameEl = document.createElement('span');
                    nameEl.className = 'inventory-item-name';
                    nameEl.textContent = `${item.graphic || '📦'} ${item.title}`;
                    
                    const gameEl = document.createElement('span');
                    gameEl.className = `inventory-item-game ${item.game === 'spell-controller' ? 'spell-game' : ''}`;
                    gameEl.textContent = item.game === 'spell-controller' ? 'Spell Controller' : 'Planet Plunder';
                    
                    details.appendChild(nameEl);
                    details.appendChild(gameEl);
                    
                    const priceEl = document.createElement('span');
                    priceEl.style.fontWeight = 'bold';
                    priceEl.textContent = item.price > 0 ? `$${item.price.toFixed(2)}` : 'FREE (Redeemed)';
                    
                    div.appendChild(details);
                    div.appendChild(priceEl);
                    listContainer.appendChild(div);
                });
            }
            container.appendChild(listContainer);
        }

        // 3. Billing Log Tab
        function drawBillingTab(user, container) {
            const h3 = document.createElement('h3');
            h3.style.marginBottom = '0.5rem';
            h3.style.fontWeight = '800';
            h3.style.fontSize = '1.3rem';
            h3.textContent = '💳 Billing & Transactions';
            container.appendChild(h3);
            
            const desc = document.createElement('p');
            desc.style.color = 'var(--text-secondary)';
            desc.style.marginBottom = '1.5rem';
            desc.style.fontSize = '0.85rem';
            desc.textContent = 'Review your direct purchases and points shop redemptions below.';
            container.appendChild(desc);
            
            const transactions = (user.inventory || []).filter(item => item.purchaseDate);
            
            if (transactions.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'inventory-empty';
                empty.textContent = 'No transaction receipts found.';
                container.appendChild(empty);
                return;
            }
            
            const tableWrapper = document.createElement('div');
            tableWrapper.style.overflowX = 'auto';
            
            const table = document.createElement('table');
            table.className = 'billing-table';
            
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            ['Order ID', 'Item / Reward', 'Method', 'Cost', 'Date'].forEach(text => {
                const th = document.createElement('th');
                th.textContent = text;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            const tbody = document.createElement('tbody');
            const sortedTxns = [...transactions].sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
            
            sortedTxns.forEach(item => {
                const tr = document.createElement('tr');
                
                let txnId = item.txnId;
                if (!txnId) {
                    let hash = 0;
                    const str = (item.purchaseDate || '') + (item.title || '');
                    for (let i = 0; i < str.length; i++) {
                        hash = (hash << 5) - hash + str.charCodeAt(i);
                        hash |= 0;
                    }
                    txnId = 'TXN-' + Math.abs(hash).toString().substring(0, 8).padEnd(8, '0');
                }
                
                let method = item.method;
                if (!method) {
                    if (item.price === 0 || (item.title && item.title.includes('Redeemed'))) {
                        method = 'Points Shop';
                    } else {
                        method = 'Credit Card';
                    }
                }
                
                const tdId = document.createElement('td');
                tdId.textContent = txnId;
                tdId.style.fontFamily = 'monospace';
                tdId.style.color = 'var(--text-muted)';
                
                const tdTitle = document.createElement('td');
                tdTitle.textContent = `${item.graphic || '📦'} ${item.title}`;
                tdTitle.style.fontWeight = '600';
                
                const tdMethod = document.createElement('td');
                tdMethod.textContent = method;
                
                const tdCost = document.createElement('td');
                tdCost.textContent = item.price > 0 ? `$${item.price.toFixed(2)}` : 'FREE';
                tdCost.style.fontWeight = 'bold';
                if (item.price > 0) {
                    tdCost.style.color = 'hsl(140, 80%, 45%)';
                } else {
                    tdCost.style.color = 'var(--text-muted)';
                }
                
                const tdDate = document.createElement('td');
                let dateStr = 'Unknown';
                if (item.purchaseDate) {
                    try {
                        const d = new Date(item.purchaseDate);
                        dateStr = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                    } catch (err) {}
                }
                tdDate.textContent = dateStr;
                tdDate.style.color = 'var(--text-secondary)';
                
                tr.appendChild(tdId);
                tr.appendChild(tdTitle);
                tr.appendChild(tdMethod);
                tr.appendChild(tdCost);
                tr.appendChild(tdDate);
                
                tbody.appendChild(tr);
            });
            
            table.appendChild(tbody);
            tableWrapper.appendChild(table);
            container.appendChild(tableWrapper);
        }

        // 4. Friends Hub Tab
        function drawFriendsTab(user, container) {
            const h3 = document.createElement('h3');
            h3.style.marginBottom = '0.5rem';
            h3.style.fontWeight = '800';
            h3.style.fontSize = '1.3rem';
            h3.textContent = '👥 Friends Hub';
            container.appendChild(h3);
            
            const desc = document.createElement('p');
            desc.style.color = 'var(--text-secondary)';
            desc.style.marginBottom = '1.25rem';
            desc.style.fontSize = '0.85rem';
            desc.textContent = 'Connect with other gamers, view their online status, or manage your list.';
            container.appendChild(desc);
            
            const formWrapper = document.createElement('div');
            formWrapper.className = 'friends-input-wrapper';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.id = 'friend-username-input';
            input.className = 'form-input';
            input.placeholder = 'Enter username (e.g. PixelGlitch)';
            input.style.flex = '1';
            
            const addBtn = document.createElement('button');
            addBtn.className = 'btn-buy';
            addBtn.style.padding = '0.75rem 1.5rem';
            addBtn.textContent = 'Add Friend';
            
            addBtn.addEventListener('click', () => {
                const val = input.value.trim();
                if (val) {
                    handleAddFriend(val);
                } else {
                    showToast('Please enter a valid username.', 'error');
                }
            });
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addBtn.click();
                }
            });
            
            formWrapper.appendChild(input);
            formWrapper.appendChild(addBtn);
            container.appendChild(formWrapper);
            
            const listTitle = document.createElement('h4');
            listTitle.style.marginBottom = '0.75rem';
            listTitle.style.fontSize = '1rem';
            listTitle.style.fontWeight = '700';
            listTitle.textContent = `My Friends (${(user.friends || []).length})`;
            container.appendChild(listTitle);
            
            const listContainer = document.createElement('div');
            listContainer.className = 'friends-list';
            
            if (!user.friends || user.friends.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'inventory-empty';
                empty.textContent = 'Your friends list is currently empty. Add someone above!';
                listContainer.appendChild(empty);
            } else {
                user.friends.forEach(friend => {
                    const item = document.createElement('div');
                    item.className = 'friend-item';
                    
                    const leftSide = document.createElement('div');
                    leftSide.style.display = 'flex';
                    leftSide.style.alignItems = 'center';
                    
                    const statusDot = document.createElement('span');
                    statusDot.className = `friend-status ${friend.status === 'online' ? 'online' : 'offline'}`;
                    
                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = friend.name;
                    nameSpan.style.fontWeight = '600';
                    nameSpan.style.fontSize = '0.9rem';
                    
                    const statusLabel = document.createElement('span');
                    statusLabel.textContent = ` (${friend.status})`;
                    statusLabel.style.fontSize = '0.75rem';
                    statusLabel.style.color = 'var(--text-muted)';
                    
                    leftSide.appendChild(statusDot);
                    leftSide.appendChild(nameSpan);
                    leftSide.appendChild(statusLabel);
                    
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'btn-remove-friend';
                    removeBtn.textContent = 'Remove';
                    removeBtn.addEventListener('click', () => {
                        handleRemoveFriend(friend.name);
                    });
                    
                    item.appendChild(leftSide);
                    item.appendChild(removeBtn);
                    listContainer.appendChild(item);
                });
            }
            container.appendChild(listContainer);
        }

        function handleAddFriend(name) {
            currentUser = getSessionUser();
            if (!currentUser) return;
            
            // XSS Defense: sanitize name string strictly
            const cleanName = name.replace(/[^A-Za-z0-9_ -]/g, '').substring(0, 20).trim();
            if (!cleanName || cleanName.length < 3) {
                showToast('Username must be at least 3 alphanumeric characters.', 'error');
                return;
            }
            
            const accounts = getAccounts();
            const userKey = currentUser.email.toLowerCase().trim();
            const friendsList = accounts[userKey].friends || [];
            
            const exists = friendsList.some(f => f.name.toLowerCase() === cleanName.toLowerCase());
            if (exists) {
                showToast(`${cleanName} is already on your friends list.`, 'error');
                return;
            }
            
            if (cleanName.toLowerCase() === currentUser.username.toLowerCase()) {
                showToast("You cannot add yourself as a friend.", 'error');
                return;
            }
            
            const status = Math.random() > 0.4 ? 'online' : 'offline';
            friendsList.push({ name: cleanName, status: status });
            accounts[userKey].friends = friendsList;
            
            saveAccounts(accounts);
            showToast(`${cleanName} added to friends list!`, 'success');
            drawProfileTab();
        }

        function handleRemoveFriend(name) {
            currentUser = getSessionUser();
            if (!currentUser) return;
            
            const accounts = getAccounts();
            const userKey = currentUser.email.toLowerCase().trim();
            let friendsList = accounts[userKey].friends || [];
            
            const exists = friendsList.some(f => f.name === name);
            if (!exists) return;
            
            friendsList = friendsList.filter(f => f.name !== name);
            accounts[userKey].friends = friendsList;
            
            saveAccounts(accounts);
            showToast(`${name} removed from friends list.`, 'info');
            drawProfileTab();
        }

        // 5. Achievements Tab
        function drawAchievementsTab(user, container) {
            const h3 = document.createElement('h3');
            h3.style.marginBottom = '0.5rem';
            h3.style.fontWeight = '800';
            h3.style.fontSize = '1.3rem';
            h3.textContent = '🏆 Achievements & Medals';
            container.appendChild(h3);
            
            const desc = document.createElement('p');
            desc.style.color = 'var(--text-secondary)';
            desc.style.marginBottom = '1.5rem';
            desc.style.fontSize = '0.85rem';
            desc.textContent = 'Complete milestones through store purchases and point earnings to unlock badges.';
            container.appendChild(desc);
            
            const grid = document.createElement('div');
            grid.className = 'achievements-grid';
            
            const level = Math.floor((user.points || 0) / 1000) + 1;
            const itemsCount = (user.inventory || []).length;
            const isAdmin = user.email && user.email.toLowerCase() === 'admin@realmlink.com';
            
            const badges = [
                {
                    title: 'First Deal',
                    desc: 'Buy any store deal or redeem a free reward',
                    icon: '🤝',
                    unlocked: itemsCount >= 1
                },
                {
                    title: 'Collector',
                    desc: 'Own 3 or more shop items in inventory',
                    icon: '👑',
                    unlocked: itemsCount >= 3
                },
                {
                    title: 'Ascended',
                    desc: 'Reach Account Level 2 or higher',
                    icon: '⭐',
                    unlocked: level >= 2
                },
                {
                    title: 'Realm Legend',
                    desc: 'Attain VIP Status (Admin or Level 10+)',
                    icon: '🏆',
                    unlocked: isAdmin || level >= 10 || (user.points || 0) >= 10000
                }
            ];
            
            badges.forEach(badge => {
                const card = document.createElement('div');
                card.className = `achievement-card ${badge.unlocked ? 'unlocked' : ''}`;
                
                const icon = document.createElement('div');
                icon.className = 'achievement-icon';
                icon.textContent = badge.icon;
                
                const title = document.createElement('div');
                title.className = 'achievement-title';
                title.textContent = badge.title;
                
                const desc = document.createElement('div');
                desc.className = 'achievement-desc';
                desc.textContent = badge.desc;
                
                card.appendChild(icon);
                card.appendChild(title);
                card.appendChild(desc);
                grid.appendChild(card);
            });
            
            container.appendChild(grid);
        }

        // ==========================================
        // INITIALIZATION
        // ==========================================

        // Ensure default Admin Account is securely created/updated on application boot
        async function initAdminAccount() {
            const accounts = getAccounts();
            const adminEmail = 'admin@realmlink.com';
            let changed = false;
            
            if (!accounts[adminEmail]) {
                const salt = generateSalt();
                const hashed = await hashPassword('AdminSecure2026!', salt);
                accounts[adminEmail] = {
                    username: 'RealmAdmin',
                    email: adminEmail,
                    salt: salt,
                    hashedPassword: hashed,
                    points: 12500,
                    userId: 'RL-00001',
                    friends: [
                        { name: 'CyberPioneer', status: 'online' },
                        { name: 'SpellCaster99', status: 'offline' },
                        { name: 'NeonKnight', status: 'online' },
                        { name: 'PixelGlitch', status: 'online' }
                    ],
                    gameActivity: {
                        'planet-plunder': 184,
                        'spell-controller': 92
                    },
                    inventory: [
                        {
                            id: 'pp-bundle-explorer',
                            title: 'Elite Voyager Pack',
                            price: 29.99,
                            graphic: '📦',
                            game: 'planet-plunder',
                            purchaseDate: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
                        },
                        {
                            id: 'sc-bundle-sorcerer',
                            title: 'Archmage Vault Chest',
                            price: 34.99,
                            graphic: '🔮',
                            game: 'spell-controller',
                            purchaseDate: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
                        }
                    ]
                };
                changed = true;
            } else {
                const admin = accounts[adminEmail];
                if (!admin.userId) { admin.userId = 'RL-00001'; changed = true; }
                if (!admin.friends) {
                    admin.friends = [
                        { name: 'CyberPioneer', status: 'online' },
                        { name: 'SpellCaster99', status: 'offline' },
                        { name: 'NeonKnight', status: 'online' },
                        { name: 'PixelGlitch', status: 'online' }
                    ];
                    changed = true;
                }
                if (!admin.gameActivity) {
                    admin.gameActivity = {
                        'planet-plunder': 184,
                        'spell-controller': 92
                    };
                    changed = true;
                }
                if (!admin.points || admin.points < 12500) { admin.points = 12500; changed = true; }
                if (!admin.inventory || admin.inventory.length === 0) {
                    admin.inventory = [
                        {
                            id: 'pp-bundle-explorer',
                            title: 'Elite Voyager Pack',
                            price: 29.99,
                            graphic: '📦',
                            game: 'planet-plunder',
                            purchaseDate: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
                        },
                        {
                            id: 'sc-bundle-sorcerer',
                            title: 'Archmage Vault Chest',
                            price: 34.99,
                            graphic: '🔮',
                            game: 'spell-controller',
                            purchaseDate: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
                        }
                    ];
                    changed = true;
                }
            }
            if (changed) {
                saveAccounts(accounts);
            }
        }

        // ==========================================
        // ==========================================
        // REAL GOOGLE IDENTITY SERVICES OIDC FLOW
        // ==========================================
        let googleInitialized = false;

        function decodeJwt(token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                return JSON.parse(jsonPayload);
            } catch (e) {
                console.error("JWT decoding failed:", e);
                return null;
            }
        }

        async function handleCredentialResponse(response) {
            const payload = decodeJwt(response.credential);
            if (!payload) {
                showToast("Failed to parse authentication payload from Google.", "error");
                return;
            }

            const email = payload.email;
            const name = payload.name || payload.given_name || "Google User";
            const picture = payload.picture || "";

            const lowerEmail = email.toLowerCase().trim();
            const accounts = getAccounts();

            if (!accounts[lowerEmail]) {
                // Auto register a new account
                const randomId = 'RL-' + Math.floor(10000 + Math.random() * 90000);
                const seededFriends = [
                    { name: 'CyberPioneer', status: 'online' },
                    { name: 'SpellCaster99', status: 'offline' },
                    { name: 'NeonKnight', status: 'online' }
                ];
                const seededHours = {
                    'planet-plunder': Math.floor(5 + Math.random() * 145),
                    'spell-controller': Math.floor(5 + Math.random() * 145)
                };

                accounts[lowerEmail] = {
                    username: name,
                    email: email,
                    avatarUrl: picture,
                    salt: 'google-oauth-flow',
                    hashedPassword: 'google-oauth-flow-placeholder',
                    points: 0,
                    userId: randomId,
                    friends: seededFriends,
                    gameActivity: seededHours,
                    inventory: []
                };

                saveAccounts(accounts);
                showToast(`Registered new account via Google: welcome ${name}!`, "success");
            } else {
                // Update photo url if updated
                accounts[lowerEmail].avatarUrl = picture || accounts[lowerEmail].avatarUrl || "";
                ensureUserFields(accounts[lowerEmail]);
                saveAccounts(accounts);
                showToast(`Welcome back, ${accounts[lowerEmail].username}!`, "success");
            }

            setSessionUser(email);
            updateAuthHUD();
            closeAuthModal();
        }

        function initGoogleAuth() {
            const inputClientId = document.getElementById('input-google-client-id');
            const savedClientId = localStorage.getItem('google_oauth_client_id');
            const defaultClientId = '102073495655-r4onl2ccm5skdf4jvl3bd1ebhaoetgi9.apps.googleusercontent.com'; // User-provided Google Client ID
            
            const client_id = savedClientId || defaultClientId;

            if (inputClientId && !inputClientId.value) {
                inputClientId.value = savedClientId || '';
            }

            try {
                google.accounts.id.initialize({
                    client_id: client_id,
                    callback: handleCredentialResponse
                });

                const signinBtnEl = document.getElementById('google-signin-btn-signin');
                if (signinBtnEl) {
                    signinBtnEl.innerHTML = '';
                    google.accounts.id.renderButton(signinBtnEl, {
                        type: 'standard',
                        theme: 'outline',
                        size: 'large',
                        text: 'signin_with',
                        shape: 'rectangular',
                        logo_alignment: 'left',
                        width: '320'
                    });
                }

                const registerBtnEl = document.getElementById('google-signin-btn-register');
                if (registerBtnEl) {
                    registerBtnEl.innerHTML = '';
                    google.accounts.id.renderButton(registerBtnEl, {
                        type: 'standard',
                        theme: 'outline',
                        size: 'large',
                        text: 'signup_with',
                        shape: 'rectangular',
                        logo_alignment: 'left',
                        width: '320'
                    });
                }

                googleInitialized = true;
            } catch (e) {
                console.warn("Failed to initialize or render Google Auth buttons:", e);
            }
        }

        function checkGoogleLibrary() {
            if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                initGoogleAuth();
            } else {
                setTimeout(checkGoogleLibrary, 100);
            }
        }

        // Local Settings Panel hooks
        const inputClientId = document.getElementById('input-google-client-id');
        const btnSaveClientId = document.getElementById('btn-save-google-client-id');

        if (btnSaveClientId) {
            btnSaveClientId.addEventListener('click', () => {
                const val = inputClientId.value.trim();
                if (val) {
                    localStorage.setItem('google_oauth_client_id', val);
                    showToast("Google Client ID saved. Re-initializing Google Authentication...", "success");
                    initGoogleAuth();
                } else {
                    localStorage.removeItem('google_oauth_client_id');
                    showToast("Google Client ID cleared. Re-initializing Google Authentication...", "success");
                    initGoogleAuth();
                }
            });
        }

        // ==========================================
        // DYNAMIC GAMES SHOWCASE & INTERACTIVE MODAL
        // ==========================================
        const gamesMetadata = {
            'planet-plunder': {
                title: "Planet Plunder",
                genre: "Space Action / Multiplayer",
                platforms: "Windows / macOS",
                description: "Plunder across the stars, command custom spacecraft, and form cooperative or competitive alliances to secure rare resources in this open-universe sandbox. Engage in heavy tactical ship battles, deploy planetary drill setups, and trade items at neutral black markets to climb the intergalactic leaderboard.",
                rating: 4.4,
                ratingCount: 184,
                features: [
                    "Customizable heavy cruisers, fighters, and carrier ships.",
                    "Dynamic zero-gravity combat zones with procedural asteroid fields.",
                    "Real-time economy and trading logs synced globally.",
                    "Cross-play support between Windows and macOS clients."
                ],
                specs: {
                    minOs: "Windows 10 / macOS 11 Big Sur",
                    minCpu: "Intel Core i5-6400 / Apple M1",
                    minGpu: "NVIDIA GTX 960 4GB / Apple Silicon 7-Core",
                    minRam: "8 GB RAM",
                    recOs: "Windows 11 / macOS 13 Ventura",
                    recCpu: "Intel Core i7-10700K / Apple M2 Pro",
                    recGpu: "NVIDIA RTX 2060 6GB / Apple Silicon 16-Core",
                    recRam: "16 GB RAM"
                },
                screenshots: ["pp-screen-1.png", "pp-screen-2.png"]
            },
            'spell-controller': {
                title: "Spell Controller",
                genre: "Fantasy Action / Spellcaster",
                platforms: "Windows",
                description: "Command elemental spellcasting, shape complex combat combinations, and navigate challenging dungeons using innovative motion controls. Master the schools of Fire, Frost, Lightning, and Arcane to defeat ancient bosses, collect wizard staves, and customize your magical spellbook to fit your playstyle.",
                rating: 4.6,
                ratingCount: 92,
                features: [
                    "Innovative gestures mapping spells directly to controller motion.",
                    "Over 40 unlockable staves, hoods, and visual cast animations.",
                    "Challenging roguelike dungeons with randomized encounters.",
                    "Real-time leaderboards for speedruns and dungeon-clear points."
                ],
                specs: {
                    minOs: "Windows 10 64-bit",
                    minCpu: "Intel Core i5-4460 / AMD FX-8300",
                    minGpu: "NVIDIA GTX 960 2GB / AMD Radeon R9 280",
                    minRam: "8 GB RAM",
                    recOs: "Windows 11 64-bit",
                    recCpu: "Intel Core i7-8700K / AMD Ryzen 5 3600X",
                    recGpu: "NVIDIA RTX 2070 8GB / AMD Radeon RX 5700 XT",
                    recRam: "16 GB RAM"
                },
                screenshots: ["sc-screen-1.png", "sc-screen-2.png"]
            },
            'neon-racer': {
                title: "Neon Racer",
                genre: "Futuristic / Arcade Racing",
                platforms: "Windows / macOS",
                description: "Race through stunning synthwave cities, custom-build hypercars, and dominate the global leaderboards with high-speed drifts in this fast-paced neon arcade racer. Dodge obstacles, fire plasma speed boosts, and listen to a premium synthwave soundtrack as you speed to victory.",
                rating: 4.5,
                ratingCount: 145,
                features: [
                    "Customize speeds, colors, neon underglows, and tires.",
                    "High-speed drifting controls with kinetic energy boosts.",
                    "15 unique tracks across cyberpunk city skylines.",
                    "Integrated multiplayer matchmaking and online time trials."
                ],
                specs: {
                    minOs: "Windows 10 / macOS 12 Monterey",
                    minCpu: "Intel Core i5-8400 / Apple M1",
                    minGpu: "NVIDIA GTX 1060 6GB / Apple M1 GPU",
                    minRam: "8 GB RAM",
                    recOs: "Windows 11 / macOS 14 Sonoma",
                    recCpu: "Intel Core i7-11700K / Apple M3",
                    recGpu: "NVIDIA RTX 3060 12GB / Apple M3 Pro GPU",
                    recRam: "16 GB RAM"
                },
                screenshots: ["neon-racer-cover.png", "pp-screen-2.png"]
            },
            'shadow-blade': {
                title: "Shadow Blade",
                genre: "Cyber-Stealth / Action",
                platforms: "Windows",
                description: "Embark on stealth infiltration missions across cyberpunk skyscrapers as a lethal cyber-ninja. Combine agile acrobatic parkour, tactical cloak systems, and precise katana combat techniques to outwit corrupt corporate defense teams in a futuristic Neo-Tokyo backdrop.",
                rating: 4.7,
                ratingCount: 78,
                features: [
                    "Acrobatic wall-running, dash maneuvers, and grappling hooks.",
                    "Active holographic camo systems for full-stealth layouts.",
                    "Tactical swordplay mechanics reflecting oncoming laser fire.",
                    "Dynamic alert states and stealth score leaderboards."
                ],
                specs: {
                    minOs: "Windows 10 64-bit",
                    minCpu: "Intel Core i5-7400 / AMD Ryzen 3 3100",
                    minGpu: "NVIDIA GTX 1050 Ti 4GB / AMD RX 570",
                    minRam: "8 GB RAM",
                    recOs: "Windows 11 64-bit",
                    recCpu: "Intel Core i7-9700K / AMD Ryzen 7 3700X",
                    recGpu: "NVIDIA RTX 2060 6GB / AMD RX 5600 XT",
                    recRam: "16 GB RAM"
                },
                screenshots: ["shadow-blade-cover.png", "sc-screen-2.png"]
            },
            'eco-builder': {
                title: "Eco Builder",
                genre: "Strategy / Planetary Builder",
                platforms: "Windows / macOS",
                description: "Establish modular colony dome habitats, terraform barren planet surfaces, and restore biological flora and fauna ecosystems in this deep sci-fi colony building simulator. Balance atmosphere mixtures, capture solar currents, and guide colonist survival across harsh environment zones.",
                rating: 4.3,
                ratingCount: 64,
                features: [
                    "Sandbox modular colony designs with greenhouse domes.",
                    "Complex atmospheric synthesis modeling (Oxygen, Nitrogen, CO2).",
                    "Flora and fauna progression logs with genetic seed drafting.",
                    "Dynamic weather systems including duststorms and solar storms."
                ],
                specs: {
                    minOs: "Windows 10 / macOS 11 Big Sur",
                    minCpu: "Intel Core i5-6500 / Apple M1",
                    minGpu: "NVIDIA GTX 1060 3GB / Apple M1 GPU",
                    minRam: "8 GB RAM",
                    recOs: "Windows 11 / macOS 13 Ventura",
                    recCpu: "Intel Core i7-10700 / Apple M2",
                    recGpu: "NVIDIA RTX 3050 8GB / Apple M2 GPU",
                    recRam: "16 GB RAM"
                },
                screenshots: ["eco-builder-cover.png", "pp-screen-1.png"]
            },
            'spell-craft': {
                title: "Spell Craft",
                genre: "Cooperative / Voxel Sandbox",
                platforms: "Windows",
                description: "Explore blocky floating voxel islands, gather magical materials, craft spellbooks, and construct wizard castles with friends in this cooperative fantasy sandbox. Battle rogue elemental bosses and defend your domain from shadow invasions.",
                rating: 4.8,
                ratingCount: 112,
                features: [
                    "Voxel building grid with floating physics mechanics.",
                    "Craft custom spell combos using gathered runes.",
                    "Co-op multiplayer supporting up to 8 players per server.",
                    "Procedural fantasy realms containing distinct biome logs."
                ],
                specs: {
                    minOs: "Windows 10 64-bit",
                    minCpu: "Intel Core i3-8100 / AMD Ryzen 3 1200",
                    minGpu: "Intel UHD Graphics 630 / NVIDIA GTX 750 Ti",
                    minRam: "6 GB RAM",
                    recOs: "Windows 11 64-bit",
                    recCpu: "Intel Core i5-10400 / AMD Ryzen 5 3600",
                    recGpu: "NVIDIA GTX 1060 6GB / AMD RX 580",
                    recRam: "12 GB RAM"
                },
                screenshots: ["spell-craft-cover.png", "sc-screen-1.png"]
            }
        };

        // ==========================================
        // SHOWCASE CAROUSEL SLIDER ENGINE
        // ==========================================
        let showcaseIndex = 0;

        function updateShowcaseCarousel() {
            const track = document.getElementById('showcase-carousel-track');
            if (!track) return;

            const cards = track.querySelectorAll('.carousel-game-card');
            if (cards.length === 0) return;

            let visibleCount = 3;
            if (window.innerWidth <= 600) visibleCount = 1;
            else if (window.innerWidth <= 900) visibleCount = 2;

            const maxIndex = cards.length - visibleCount;
            if (showcaseIndex > maxIndex) showcaseIndex = maxIndex;
            if (showcaseIndex < 0) showcaseIndex = 0;

            const cardWidth = cards[0].getBoundingClientRect().width;
            const gap = parseFloat(window.getComputedStyle(track).gap) || 0;
            const offset = showcaseIndex * (cardWidth + gap);

            track.style.transform = `translateX(-${offset}px)`;

            // Update disabled status for arrows
            const btnPrev = document.getElementById('btn-showcase-prev');
            const btnNext = document.getElementById('btn-showcase-next');
            if (btnPrev) btnPrev.disabled = (showcaseIndex === 0);
            if (btnNext) btnNext.disabled = (showcaseIndex >= maxIndex);

            renderShowcaseDots(cards.length, visibleCount);
        }

        function renderShowcaseDots(totalCount, visibleCount) {
            const dotsContainer = document.getElementById('showcase-dots');
            if (!dotsContainer) return;
            dotsContainer.innerHTML = '';

            const maxIndex = totalCount - visibleCount;
            if (maxIndex <= 0) return;

            for (let i = 0; i <= maxIndex; i++) {
                const dot = document.createElement('span');
                dot.className = `showcase-dot ${i === showcaseIndex ? 'active' : ''}`;
                dot.addEventListener('click', () => {
                    showcaseIndex = i;
                    updateShowcaseCarousel();
                });
                dotsContainer.appendChild(dot);
            }
        }

        const btnShowcasePrev = document.getElementById('btn-showcase-prev');
        const btnShowcaseNext = document.getElementById('btn-showcase-next');

        if (btnShowcasePrev) {
            btnShowcasePrev.addEventListener('click', () => {
                if (showcaseIndex > 0) {
                    showcaseIndex--;
                    updateShowcaseCarousel();
                }
            });
        }

        if (btnShowcaseNext) {
            btnShowcaseNext.addEventListener('click', () => {
                const track = document.getElementById('showcase-carousel-track');
                if (!track) return;
                const cards = track.querySelectorAll('.carousel-game-card');
                
                let visibleCount = 3;
                if (window.innerWidth <= 600) visibleCount = 1;
                else if (window.innerWidth <= 900) visibleCount = 2;

                const maxIndex = cards.length - visibleCount;
                if (showcaseIndex < maxIndex) {
                    showcaseIndex++;
                    updateShowcaseCarousel();
                }
            });
        }

        window.addEventListener('resize', updateShowcaseCarousel);
        window.addEventListener('load', updateShowcaseCarousel);

        // ==========================================
        // GAME DETAIL MODAL
        // ==========================================
        let activeGameId = null;
        let activeSlideIndex = 0;
        let activeRatingSelect = 0;
        let downloadInterval = null;

        const gameDetailModal = document.getElementById('game-detail-modal');

        function openGameDetail(gameId) {
            activeGameId = gameId;
            const meta = gamesMetadata[gameId];
            if (!meta) return;

            // Populate text details
            document.getElementById('game-detail-title').textContent = meta.title;
            document.getElementById('game-detail-genre').textContent = meta.genre;
            document.getElementById('game-detail-platforms').textContent = meta.platforms;
            document.getElementById('game-detail-description').textContent = meta.description;

            // Calculate active average rating
            const reviews = getGameReviews(gameId);
            let avgRating = meta.rating;
            let totalCount = meta.ratingCount + reviews.length;
            if (reviews.length > 0) {
                let sum = meta.rating * meta.ratingCount;
                reviews.forEach(r => sum += r.rating);
                avgRating = sum / totalCount;
            }

            // Render unicode star scores
            let starsStr = '';
            const fullStars = Math.floor(avgRating);
            const remaining = avgRating - fullStars;
            for (let i = 1; i <= 5; i++) {
                if (i <= fullStars) {
                    starsStr += '★';
                } else if (i === fullStars + 1 && remaining >= 0.4) {
                    starsStr += '★';
                } else {
                    starsStr += '☆';
                }
            }
            document.getElementById('game-detail-rating-stars').textContent = starsStr;
            document.getElementById('game-detail-rating-count').textContent = `(${avgRating.toFixed(1)} / 5 - ${totalCount} Reviews)`;

            // Populate features checklist
            const featuresList = document.getElementById('game-detail-features');
            featuresList.innerHTML = '';
            meta.features.forEach(feat => {
                const li = document.createElement('li');
                li.textContent = feat;
                featuresList.appendChild(li);
            });

            // Populate requirements specifications
            document.getElementById('game-spec-min-os').textContent = meta.specs.minOs;
            document.getElementById('game-spec-min-cpu').textContent = meta.specs.minCpu;
            document.getElementById('game-spec-min-gpu').textContent = meta.specs.minGpu;
            document.getElementById('game-spec-min-ram').textContent = meta.specs.minRam;

            document.getElementById('game-spec-rec-os').textContent = meta.specs.recOs;
            document.getElementById('game-spec-rec-cpu').textContent = meta.specs.recCpu;
            document.getElementById('game-spec-rec-gpu').textContent = meta.specs.recGpu;
            document.getElementById('game-spec-rec-ram').textContent = meta.specs.recRam;

            // Load carousel screenshots
            const carouselSlides = document.getElementById('carousel-slides');
            carouselSlides.innerHTML = '';
            meta.screenshots.forEach(src => {
                const slide = document.createElement('div');
                slide.className = 'carousel-slide';
                const img = document.createElement('img');
                img.src = src;
                img.alt = `${meta.title} screenshot`;
                slide.appendChild(img);
                carouselSlides.appendChild(slide);
            });

            // Populate dots navigation indicator
            const carouselDots = document.getElementById('carousel-dots');
            carouselDots.innerHTML = '';
            meta.screenshots.forEach((_, index) => {
                const dot = document.createElement('span');
                dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
                dot.setAttribute('data-slide', index);
                dot.addEventListener('click', () => setCarouselSlide(index));
                carouselDots.appendChild(dot);
            });

            activeSlideIndex = 0;
            updateCarouselPosition();

            // Populate comments feed
            renderReviewsFeed(gameId);

            // Display review box if signed in
            const user = getSessionUser();
            const reviewForm = document.getElementById('review-form-container');
            const reviewSigninHint = document.getElementById('review-signin-hint');
            if (user) {
                reviewForm.style.display = 'block';
                reviewSigninHint.style.display = 'none';
            } else {
                reviewForm.style.display = 'none';
                reviewSigninHint.style.display = 'block';
            }

            resetRatingInput();
            switchGameTab('about');
            resetDownloadSimulator();

            gameDetailModal.classList.add('active');
        }

        function closeGameDetailModal() {
            gameDetailModal.classList.remove('active');
            activeGameId = null;
            resetDownloadSimulator();
        }

        const btnCloseGameDetail = document.getElementById('btn-close-game-detail');
        if (btnCloseGameDetail) {
            btnCloseGameDetail.addEventListener('click', closeGameDetailModal);
        }

        // Carousel Slider Navigation
        function setCarouselSlide(index) {
            activeSlideIndex = index;
            updateCarouselPosition();
        }

        function updateCarouselPosition() {
            const carouselSlides = document.getElementById('carousel-slides');
            if (carouselSlides) {
                carouselSlides.style.transform = `translateX(-${activeSlideIndex * 100}%)`;
            }
            const dots = document.querySelectorAll('#carousel-dots .carousel-dot');
            dots.forEach((dot, idx) => {
                if (idx === activeSlideIndex) dot.classList.add('active');
                else dot.classList.remove('active');
            });
        }

        const btnCarouselPrev = document.getElementById('btn-carousel-prev');
        const btnCarouselNext = document.getElementById('btn-carousel-next');

        if (btnCarouselPrev) {
            btnCarouselPrev.addEventListener('click', () => {
                if (activeGameId) {
                    const meta = gamesMetadata[activeGameId];
                    activeSlideIndex = (activeSlideIndex > 0) ? activeSlideIndex - 1 : meta.screenshots.length - 1;
                    updateCarouselPosition();
                }
            });
        }

        if (btnCarouselNext) {
            btnCarouselNext.addEventListener('click', () => {
                if (activeGameId) {
                    const meta = gamesMetadata[activeGameId];
                    activeSlideIndex = (activeSlideIndex < meta.screenshots.length - 1) ? activeSlideIndex + 1 : 0;
                    updateCarouselPosition();
                }
            });
        }

        // Inner Tab Switching
        const gameDetailTabs = [
            { tab: document.getElementById('tab-game-about'), content: document.getElementById('content-game-about'), name: 'about' },
            { tab: document.getElementById('tab-game-specs'), content: document.getElementById('content-game-specs'), name: 'specs' },
            { tab: document.getElementById('tab-game-reviews'), content: document.getElementById('content-game-reviews'), name: 'reviews' }
        ];

        function switchGameTab(tabName) {
            gameDetailTabs.forEach(item => {
                if (item.name === tabName) {
                    if (item.tab) item.tab.classList.add('active');
                    if (item.content) item.content.classList.add('active');
                } else {
                    if (item.tab) item.tab.classList.remove('active');
                    if (item.content) item.content.classList.remove('active');
                }
            });
        }

        gameDetailTabs.forEach(item => {
            if (item.tab) {
                item.tab.addEventListener('click', () => {
                    switchGameTab(item.name);
                });
            }
        });

        // Reviews Storage Logic
        function getGameReviews(gameId) {
            try {
                const key = `game_reviews_${gameId}`;
                const raw = localStorage.getItem(key);
                return raw ? JSON.parse(raw) : [];
            } catch (e) {
                return [];
            }
        }

        function saveGameReviews(gameId, reviews) {
            try {
                const key = `game_reviews_${gameId}`;
                localStorage.setItem(key, JSON.stringify(reviews));
            } catch (e) {}
        }

        function renderReviewsFeed(gameId) {
            const feed = document.getElementById('game-reviews-feed');
            if (!feed) return;
            feed.innerHTML = '';

            const baselineReviews = {
                'planet-plunder': [
                    { username: 'StarCap_X', rating: 5, text: 'Spectacular sci-fi cruiser battles. The ship customization depth is top tier, and looting sector bases with a fleet is incredibly satisfying.', date: '2026-06-18' },
                    { username: 'NebulaDrifter', rating: 4, text: 'Great sandbox mechanics, though grinding for credits takes some dedication. Grayscale theme looks extremely premium.', date: '2026-06-21' }
                ],
                'spell-controller': [
                    { username: 'MageSlayer', rating: 5, text: 'Staves upgrades are super rewarding and combining motion cast controllers feels fluid in dungeons.', date: '2026-06-19' },
                    { username: 'DungeonRunner', rating: 4, text: 'Roguelike levels generate interesting layouts and the cast visuals look neat. Solid performance throughout.', date: '2026-06-22' }
                ],
                'neon-racer': [
                    { username: 'SpeedDemon', rating: 5, text: 'Pure arcade drift perfection! Soundtrack goes so hard and customization has so many options.', date: '2026-06-20' }
                ],
                'shadow-blade': [
                    { username: 'GhostInTheRain', rating: 5, text: 'Best stealth gameplay on the platform. The deflect mechanics make parkour infiltration feel amazing.', date: '2026-06-22' }
                ]
            };

            const customReviews = getGameReviews(gameId);
            const allReviews = [...(baselineReviews[gameId] || []), ...customReviews];

            // Sort newest first
            allReviews.sort((a, b) => new Date(b.date) - new Date(a.date));

            allReviews.forEach(rev => {
                const bubble = document.createElement('div');
                bubble.className = 'review-bubble';

                const header = document.createElement('div');
                header.className = 'review-header';

                const userSpan = document.createElement('span');
                userSpan.className = 'review-username';
                userSpan.textContent = rev.username;

                const ratingSpan = document.createElement('span');
                ratingSpan.className = 'review-rating';
                ratingSpan.textContent = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);

                header.appendChild(userSpan);
                header.appendChild(ratingSpan);

                const textP = document.createElement('p');
                textP.className = 'review-text';
                textP.textContent = rev.text;

                const dateSpan = document.createElement('span');
                dateSpan.className = 'review-date';
                try {
                    const d = new Date(rev.date);
                    dateSpan.textContent = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                } catch (err) {
                    dateSpan.textContent = rev.date;
                }

                bubble.appendChild(header);
                bubble.appendChild(textP);
                bubble.appendChild(dateSpan);
                feed.appendChild(bubble);
            });
        }

        // Interactive Review Star Input
        const starInputs = document.querySelectorAll('#review-rating-input .star-input');
        starInputs.forEach(star => {
            star.addEventListener('click', (e) => {
                const rating = parseInt(e.currentTarget.getAttribute('data-rating'));
                activeRatingSelect = rating;
                updateRatingStarsSelection();
            });
            star.addEventListener('mouseenter', (e) => {
                const rating = parseInt(e.currentTarget.getAttribute('data-rating'));
                starInputs.forEach((s, idx) => {
                    if (idx < rating) s.style.color = 'hsl(45, 100%, 65%)';
                    else s.style.color = 'var(--text-muted)';
                });
            });
            star.addEventListener('mouseleave', () => {
                updateRatingStarsSelection();
            });
        });

        function updateRatingStarsSelection() {
            starInputs.forEach((s, idx) => {
                if (idx < activeRatingSelect) {
                    s.classList.add('active');
                    s.style.color = 'hsl(45, 100%, 65%)';
                } else {
                    s.classList.remove('active');
                    s.style.color = 'var(--text-muted)';
                }
            });
        }

        function resetRatingInput() {
            activeRatingSelect = 0;
            updateRatingStarsSelection();
            const textInput = document.getElementById('review-text-input');
            if (textInput) textInput.value = '';
        }

        // Submit review Form
        const btnSubmitReview = document.getElementById('btn-submit-review');
        if (btnSubmitReview) {
            btnSubmitReview.addEventListener('click', () => {
                const user = getSessionUser();
                if (!user) {
                    showToast("Please sign in or register to submit reviews.", "error");
                    return;
                }

                if (activeRatingSelect === 0) {
                    showToast("Please select a star rating first.", "error");
                    return;
                }

                const textInput = document.getElementById('review-text-input');
                const text = textInput ? textInput.value.trim() : '';
                if (!text) {
                    showToast("Please write a short comment about the game.", "error");
                    return;
                }

                const reviews = getGameReviews(activeGameId);
                reviews.push({
                    username: user.username,
                    rating: activeRatingSelect,
                    text: text,
                    date: new Date().toISOString()
                });

                saveGameReviews(activeGameId, reviews);
                showToast("Review submitted successfully!", "success");

                // Refresh details view
                openGameDetail(activeGameId);
            });
        }

        // Simulated Installer Downloader logic
        const downloadProgressContainer = document.getElementById('download-progress-container');
        const downloadProgressFill = document.getElementById('download-progress-fill');
        const downloadPercentageLabel = document.getElementById('download-percentage-label');
        const downloadStatusLabel = document.getElementById('download-status-label');
        const downloadSpeedLabel = document.getElementById('download-speed-label');
        const downloadEtaLabel = document.getElementById('download-eta-label');
        const btnTriggerDownload = document.getElementById('btn-trigger-download');

        function resetDownloadSimulator() {
            if (downloadInterval) {
                clearInterval(downloadInterval);
                downloadInterval = null;
            }
            if (btnTriggerDownload) {
                btnTriggerDownload.style.display = 'block';
                btnTriggerDownload.disabled = false;
                btnTriggerDownload.textContent = 'Download Installer';
            }
            if (downloadProgressContainer) downloadProgressContainer.style.display = 'none';
            if (downloadProgressFill) downloadProgressFill.style.width = '0%';
            if (downloadPercentageLabel) downloadPercentageLabel.textContent = '0%';
            if (downloadStatusLabel) downloadStatusLabel.textContent = 'Downloading game files...';
            if (downloadSpeedLabel) downloadSpeedLabel.textContent = '0.0 MB/s';
            if (downloadEtaLabel) downloadEtaLabel.textContent = 'Calculating ETA...';
        }

        if (btnTriggerDownload) {
            btnTriggerDownload.addEventListener('click', () => {
                if (btnTriggerDownload.textContent.includes('Launch Game')) {
                    showToast(`Launching ${gamesMetadata[activeGameId].title}... Have fun!`, "success");
                    return;
                }

                btnTriggerDownload.style.display = 'none';
                if (downloadProgressContainer) downloadProgressContainer.style.display = 'block';
                
                let progress = 0;
                downloadInterval = setInterval(() => {
                    progress += Math.floor(Math.random() * 5) + 2;
                    if (progress >= 100) {
                        progress = 100;
                        clearInterval(downloadInterval);
                        downloadInterval = null;
                        
                        if (downloadProgressFill) downloadProgressFill.style.width = '100%';
                        if (downloadPercentageLabel) downloadPercentageLabel.textContent = '100%';
                        if (downloadStatusLabel) downloadStatusLabel.textContent = 'Installation successful!';
                        if (downloadSpeedLabel) downloadSpeedLabel.textContent = '0.0 MB/s';
                        if (downloadEtaLabel) downloadEtaLabel.textContent = 'Completed';
                        
                        showToast(`Finished downloading installer for ${gamesMetadata[activeGameId].title}!`, "success");
                        
                        setTimeout(() => {
                            if (downloadProgressContainer) downloadProgressContainer.style.display = 'none';
                            if (btnTriggerDownload) {
                                btnTriggerDownload.style.display = 'block';
                                btnTriggerDownload.textContent = 'Launch Game ⚡';
                                btnTriggerDownload.disabled = false;
                            }
                        }, 1200);
                    } else {
                        if (downloadProgressFill) downloadProgressFill.style.width = `${progress}%`;
                        if (downloadPercentageLabel) downloadPercentageLabel.textContent = `${progress}%`;
                        
                        const speed = (Math.random() * 18 + 14).toFixed(1);
                        if (downloadSpeedLabel) downloadSpeedLabel.textContent = `${speed} MB/s`;
                        
                        const sizeLeftMb = (100 - progress) * 22; 
                        const etaSec = Math.ceil(sizeLeftMb / parseFloat(speed));
                        
                        if (downloadEtaLabel) {
                            if (etaSec > 60) {
                                const min = Math.floor(etaSec / 60);
                                const sec = etaSec % 60;
                                downloadEtaLabel.textContent = `ETA: ${min}m ${sec}s`;
                            } else {
                                downloadEtaLabel.textContent = `ETA: ${etaSec}s`;
                            }
                        }
                    }
                }, 150);
            });
        }

        window.addEventListener('DOMContentLoaded', async () => {
            await initAdminAccount();
            updateAuthHUD();
            initProfileTabs();
            checkGoogleLibrary();
            updateShowcaseCarousel();
            
            // Check if redirect triggered authentication prompt
            const params = new URLSearchParams(window.location.search);
            if (params.get('triggerAuth') === 'true') {
                openAuthModal('signin');
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        });
    