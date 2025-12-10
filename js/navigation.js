class NavigationManager {
    constructor() {
        this.currentUser = null;
        this.roleConfigs = {
            guest: {
                navItems: [
                    { section: 'home', label: 'Главная' },
                    { section: 'group-classes', label: 'Групповые занятия' },
                    { section: 'trainers', label: 'Тренеры' },
                    { section: 'subscriptions', label: 'Абонементы' }
                ],
                sections: ['home', 'group-classes', 'trainers', 'subscriptions']
            },
            client: {
                navItems: [
                    { section: 'home', label: 'Главная' },
                    { section: 'group-classes', label: 'Групповые занятия' },
                    { section: 'trainers', label: 'Тренеры' },
                    { section: 'trainings', label: 'Тренировки' },
                    { section: 'subscriptions', label: 'Абонементы' },
                    { section: 'my-bookings', label: 'Мои записи' }
                ],
                sections: ['home', 'group-classes', 'trainers', 'trainings', 'subscriptions', 'my-bookings']
            },
            trainer: {
                navItems: [
                    { section: 'home', label: 'Главная' },
                    { section: 'clients', label: 'Мои клиенты' },
                    { section: 'trainer-schedule', label: 'Расписание' },
                    { section: 'profile', label: 'Профиль' },
                    { section: 'statistics', label: 'Статистика' }
                ],
                sections: ['home', 'clients', 'trainer-schedule', 'profile', 'statistics']
            },
            admin: {
                navItems: [
                    { section: 'home', label: 'Главная' },
                    { section: 'trainers', label: 'Тренеры' },
                    { section: 'admin-trainer-schedule', label: 'Расписание тренеров' },
                    { section: 'group-classes', label: 'Занятия' },
                    { section: 'subscriptions', label: 'Абонементы' },
                    { section: 'users', label: 'Пользователи' },
                    { section: 'reports', label: 'Отчеты' },
                    { section: 'settings', label: 'Настройки' }
                ],
                sections: ['home', 'trainers', 'admin-trainer-schedule', 'group-classes', 'subscriptions', 'users', 'reports', 'settings']
            }
        };
    }

    init() {
        this.currentUser = Auth.getCurrentUser();
        this.updateNavigation();
        this.updateSections();
        this.updateAuthButtons();
        this.bindNavigationEvents();
    }

    updateNavigation() {
        const nav = document.querySelector('.nav');
        if (!nav) return;

        const role = this.currentUser ? this.currentUser.role : 'guest';
        const config = this.roleConfigs[role] || this.roleConfigs.guest;

        nav.innerHTML = '';
        config.navItems.forEach(item => {
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'nav-link';
            link.setAttribute('data-section', item.section);
            link.textContent = item.label;
            if (item.section === (config.sections[0] || 'home')) {
                link.classList.add('active');
            }
            nav.appendChild(link);
        });
    }

    updateSections() {
        const role = this.currentUser ? this.currentUser.role : 'guest';
        const config = this.roleConfigs[role] || this.roleConfigs.guest;
        this.availableSections = config.sections.slice();

        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });

        this.updateDashboardContent(role);
        this.updateSectionElements(role);

        const defaultSection = this.availableSections[0] || null;
        if (defaultSection) {
            this.showSection(defaultSection, true);
        }
    }

    updateDashboardContent(role) {
        const clientDashboard = document.getElementById('client-dashboard');
        const trainerDashboard = document.getElementById('trainer-dashboard');
        const adminDashboard = document.getElementById('admin-dashboard');

        if (clientDashboard) clientDashboard.style.display = 'none';
        if (trainerDashboard) trainerDashboard.style.display = 'none';
        if (adminDashboard) adminDashboard.style.display = 'none';

        if (role === 'client' && clientDashboard) {
            clientDashboard.style.display = 'block';
            const welcomeName = document.getElementById('welcomeUserName');
            if (welcomeName && this.currentUser) {
                welcomeName.textContent = this.currentUser.name;
            }
        } else if (role === 'trainer' && trainerDashboard) {
            trainerDashboard.style.display = 'block';
        } else if (role === 'admin' && adminDashboard) {
            adminDashboard.style.display = 'block';
            if (typeof adminManager !== 'undefined' && adminManager.loadStats) {
                adminManager.loadStats();
            }
        }
    }

    updateSectionElements(role) {
        const trainersTitle = document.getElementById('trainers-section-title');
        const adminTrainersHeader = document.getElementById('admin-trainers-header');
        const trainersFilters = document.getElementById('trainers-filters');
        const trainersList = document.getElementById('trainers-list');
        const adminTrainersList = document.getElementById('admin-trainers-list');

        if (role === 'admin') {
            if (trainersTitle) trainersTitle.style.display = 'none';
            if (adminTrainersHeader) adminTrainersHeader.style.display = 'flex';
            if (trainersFilters) trainersFilters.style.display = 'none';
            if (trainersList) trainersList.style.display = 'none';
            if (adminTrainersList) {
                adminTrainersList.style.display = 'grid';
            }
        } else {
            if (trainersTitle) trainersTitle.style.display = 'block';
            if (adminTrainersHeader) adminTrainersHeader.style.display = 'none';
            if (trainersFilters) trainersFilters.style.display = 'block';
            if (trainersList) trainersList.style.display = 'grid';
            if (adminTrainersList) adminTrainersList.style.display = 'none';
        }

        const groupClassesTitle = document.getElementById('group-classes-section-title');
        const adminSessionsHeader = document.getElementById('admin-sessions-header');
        const groupClassesFilters = document.getElementById('group-classes-filters');
        const groupClassesList = document.getElementById('group-classes-list');
        const adminSessionsList = document.getElementById('admin-sessions-list');
        const trainerGroupClassesList = document.getElementById('trainer-group-classes-list');
        const clientGroupClassesList = document.getElementById('client-group-classes-list');

        if (role === 'admin') {
            if (groupClassesTitle) groupClassesTitle.style.display = 'none';
            if (adminSessionsHeader) adminSessionsHeader.style.display = 'flex';
            if (groupClassesFilters) groupClassesFilters.style.display = 'none';
            if (groupClassesList) groupClassesList.style.display = 'none';
            if (adminSessionsList) adminSessionsList.style.display = 'block';
            if (trainerGroupClassesList) trainerGroupClassesList.style.display = 'none';
            if (clientGroupClassesList) clientGroupClassesList.style.display = 'none';
        } else if (role === 'trainer') {
            if (groupClassesTitle) groupClassesTitle.style.display = 'block';
            if (adminSessionsHeader) adminSessionsHeader.style.display = 'none';
            if (groupClassesFilters) groupClassesFilters.style.display = 'block';
            if (groupClassesList) groupClassesList.style.display = 'none';
            if (adminSessionsList) adminSessionsList.style.display = 'none';
            if (trainerGroupClassesList) trainerGroupClassesList.style.display = 'block';
            if (clientGroupClassesList) clientGroupClassesList.style.display = 'none';
        } else {
            if (groupClassesTitle) groupClassesTitle.style.display = 'block';
            if (adminSessionsHeader) adminSessionsHeader.style.display = 'none';
            if (groupClassesFilters) groupClassesFilters.style.display = 'block';
            if (groupClassesList) groupClassesList.style.display = 'block';
            if (adminSessionsList) adminSessionsList.style.display = 'none';
            if (trainerGroupClassesList) trainerGroupClassesList.style.display = 'none';
            if (clientGroupClassesList) clientGroupClassesList.style.display = 'none';
        }

        const subscriptionsTitle = document.getElementById('subscriptions-section-title');
        const adminSubscriptionsHeader = document.getElementById('admin-subscriptions-header');
        const guestSubscriptionsFilters = document.getElementById('guest-subscriptions-filters');
        const subscriptionsList = document.getElementById('subscriptions-list');
        const adminSubscriptionsList = document.getElementById('admin-subscriptions-list');
        const clientSubscriptionsList = document.getElementById('client-subscriptions-list');

        if (role === 'admin') {
            if (subscriptionsTitle) subscriptionsTitle.style.display = 'none';
            if (adminSubscriptionsHeader) adminSubscriptionsHeader.style.display = 'flex';
            if (guestSubscriptionsFilters) guestSubscriptionsFilters.style.display = 'none';
            if (subscriptionsList) subscriptionsList.style.display = 'none';
            if (adminSubscriptionsList) adminSubscriptionsList.style.display = 'block';
            if (clientSubscriptionsList) clientSubscriptionsList.style.display = 'none';
        } else if (role === 'client') {
            if (subscriptionsTitle) subscriptionsTitle.style.display = 'block';
            if (adminSubscriptionsHeader) adminSubscriptionsHeader.style.display = 'none';
            if (guestSubscriptionsFilters) guestSubscriptionsFilters.style.display = 'block';
            if (subscriptionsList) subscriptionsList.style.display = 'none';
            if (adminSubscriptionsList) adminSubscriptionsList.style.display = 'none';
            if (clientSubscriptionsList) clientSubscriptionsList.style.display = 'block';
        } else {
            if (subscriptionsTitle) subscriptionsTitle.style.display = 'block';
            if (adminSubscriptionsHeader) adminSubscriptionsHeader.style.display = 'none';
            if (guestSubscriptionsFilters) guestSubscriptionsFilters.style.display = 'block';
            if (subscriptionsList) subscriptionsList.style.display = 'block';
            if (adminSubscriptionsList) adminSubscriptionsList.style.display = 'none';
            if (clientSubscriptionsList) clientSubscriptionsList.style.display = 'none';
        }

        const clientProfileContent = document.getElementById('client-profile-content');
        const trainerProfileContent = document.getElementById('trainer-profile-content');

        if (role === 'client') {
            if (clientProfileContent) clientProfileContent.style.display = 'block';
            if (trainerProfileContent) trainerProfileContent.style.display = 'none';
        } else if (role === 'trainer') {
            if (clientProfileContent) clientProfileContent.style.display = 'none';
            if (trainerProfileContent) trainerProfileContent.style.display = 'block';
        } else {
            if (clientProfileContent) clientProfileContent.style.display = 'none';
            if (trainerProfileContent) trainerProfileContent.style.display = 'none';
        }
    }

    bindNavigationEvents() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.getAttribute('data-section');
                this.showSection(section);
            });
        });
    }

    showSection(sectionName, skipNavUpdate = false) {
        if (!this.availableSections || this.availableSections.length === 0) {
            return;
        }

        if (!this.availableSections.includes(sectionName)) {
            sectionName = this.availableSections[0];
        }

        const targetId = `${sectionName}-section`;

        this.availableSections.forEach(name => {
            const section = document.getElementById(`${name}-section`);
            if (!section) return;

            if (name === sectionName) {
                section.style.display = 'block';
                section.classList.add('active');
            } else {
                section.style.display = 'none';
                section.classList.remove('active');
            }
        });

        if (!skipNavUpdate) {
            this.setActiveNav(sectionName);
        }

        this.loadSectionData(sectionName);
    }

    setActiveNav(sectionName) {
        document.querySelectorAll('.nav-link').forEach(link => {
            const linkSection = link.getAttribute('data-section');
            if (linkSection === sectionName) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    loadSectionData(sectionName) {
        const role = this.currentUser ? this.currentUser.role : 'guest';
        
        if (sectionName === 'trainers' && typeof catalogManager !== 'undefined') {
            catalogManager.loadTrainers();
        }
        
        if (sectionName === 'trainings' && role === 'client') {
            if (typeof clientTrainingsManager !== 'undefined') {
                clientTrainingsManager.init();
            }
        }
        
        if (sectionName === 'group-classes' && typeof catalogManager !== 'undefined') {
            if (!role || role === 'guest' || role === 'client') {
                const guestList = document.getElementById('group-classes-list');
                if (guestList) guestList.style.display = '';
                catalogManager.loadGroupSessions();
            } else {
                const guestList = document.getElementById('group-classes-list');
                if (guestList) guestList.style.display = 'none';
            }
        }

        if (role === 'admin') {
            if (sectionName === 'trainers' && typeof adminManager !== 'undefined') {
                adminManager.loadTrainers();
            }
            if (sectionName === 'users' && typeof adminManager !== 'undefined') {
                adminManager.loadUsers();
            }
            if (sectionName === 'group-classes' && typeof adminManager !== 'undefined') {
                adminManager.loadGroupSessions();
            }
            if (sectionName === 'admin-trainer-schedule' && typeof adminScheduleManager !== 'undefined') {
                adminScheduleManager.init();
            }
            if (sectionName === 'subscriptions' && typeof adminSubscriptionsManager !== 'undefined') {
                const guestFilters = document.getElementById('guest-subscriptions-filters');
                const guestList = document.getElementById('subscriptions-list');
                const adminHeader = document.getElementById('admin-subscriptions-header');
                const adminList = document.getElementById('admin-subscriptions-list');

                if (guestFilters) guestFilters.style.display = 'none';
                if (guestList) {
                    guestList.style.display = 'none';
                    guestList.innerHTML = '';
                }
                if (adminHeader) adminHeader.style.display = 'flex';
                if (adminList) adminList.style.display = 'grid';

                adminSubscriptionsManager.loadSubscriptions();
            }
            if (sectionName === 'settings' && typeof adminSettingsManager !== 'undefined') {
                adminSettingsManager.loadAdminProfile();
            }
            if (sectionName === 'reports' && typeof adminReportsManager !== 'undefined') {
                adminReportsManager.loadReports();
            }
        }

        if (sectionName === 'subscriptions') {
            const guestFilters = document.getElementById('guest-subscriptions-filters');
            const guestList = document.getElementById('subscriptions-list');
            const adminHeader = document.getElementById('admin-subscriptions-header');
            const adminList = document.getElementById('admin-subscriptions-list');
            const clientList = document.getElementById('client-subscriptions-list');

            if (role === 'guest') {
                if (guestFilters) guestFilters.style.display = '';
                if (guestList) guestList.style.display = '';
                if (clientList) clientList.style.display = 'none';
                if (adminHeader) adminHeader.style.display = 'none';
                if (adminList) adminList.style.display = 'none';
            } else if (role === 'client') {
                if (guestFilters) guestFilters.style.display = 'none';
                if (guestList) guestList.style.display = 'none';
                if (clientList) clientList.style.display = '';
                if (adminHeader) adminHeader.style.display = 'none';
                if (adminList) adminList.style.display = 'none';

                if (typeof clientSubscriptionsManager !== 'undefined') {
                    clientSubscriptionsManager.init();
                }
            }
        }

        if (role === 'client' && typeof clientSubscriptionsManager !== 'undefined') {
            if (sectionName === 'profile') {
                clientSubscriptionsManager.loadMySubscription();
                clientSubscriptionsManager.loadClientProfile();
            }
            if (sectionName === 'my-bookings' && typeof clientBookingsManager !== 'undefined') {
                clientBookingsManager.init();
            }
        }

        if (role === 'trainer' && typeof trainerManager !== 'undefined') {
            if (sectionName === 'trainer-schedule') {
                trainerManager.loadSchedule();
            }
            if (sectionName === 'group-classes') {
                trainerManager.loadGroupSessions();
            }
            if (sectionName === 'clients') {
                trainerManager.loadClients();
            }
            if (sectionName === 'profile' && typeof trainerProfileManager !== 'undefined') {
                trainerProfileManager.init();
            }
            if (sectionName === 'statistics' && typeof trainerStatsManager !== 'undefined') {
                trainerStatsManager.loadStats();
            }
        }
    }

    updateAuthButtons() {
        const authButtons = document.querySelector('.auth-buttons');
        if (!authButtons) return;

        if (this.currentUser) {
            authButtons.innerHTML = `
                <div class="user-menu">
                    <span id="userName">${this.currentUser.name}</span>
                    <button class="btn btn-outline" onclick="Auth.logout()">Выйти</button>
                </div>
            `;
        } else {
            authButtons.innerHTML = `
                <button id="login-btn" class="btn btn-outline">Войти</button>
                <button id="register-btn" class="btn btn-primary">Регистрация</button>
            `;
            
            setTimeout(() => {
                const loginBtn = document.getElementById('login-btn');
                const registerBtn = document.getElementById('register-btn');
                
                if (loginBtn && window.fitnessApp) {
                    loginBtn.addEventListener('click', () => {
                        window.fitnessApp.openModal('login');
                    });
                }
                
                if (registerBtn && window.fitnessApp) {
                    registerBtn.addEventListener('click', () => {
                        window.fitnessApp.openModal('register');
                    });
                }
            }, 10);
        }
    }

    refresh() {
        this.currentUser = Auth.getCurrentUser();
        this.updateNavigation();
        this.updateSections();
        this.updateAuthButtons();
        this.bindNavigationEvents();
        
        if (this.currentUser) {
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = this.currentUser.name;
            }
        }
    }
}

window.navigationManager = new NavigationManager();

