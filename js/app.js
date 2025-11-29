class FitnessApp {
    constructor() {
        this.currentUser = null;
    }

    init() {
        this.bindEvents();
        this.checkAuthState();
        
        // Инициализируем navigationManager
        if (window.navigationManager) {
            window.navigationManager.init();
        } else {
            this.showSection('home');
        }
    }

    bindEvents() {
        console.log('🔧 Привязка событий...');
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('data-section');
                this.showSection(section);
                
                document.querySelectorAll('.nav-link').forEach(item => item.classList.remove('active'));
                e.target.classList.add('active');

                if (section === 'trainers') {
                    console.log('Переход на секцию тренеров, загружаем данные...');
                    if (window.catalogManager) {
                        window.catalogManager.loadTrainers();
                    } else {
                        console.error('catalogManager не найден');
                    }
                } else if (section === 'group-classes') {
                    console.log('Переход на секцию групповых занятий');
                }
            });
        });

        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        
        console.log('Кнопка Войти:', loginBtn);
        console.log('Кнопка Регистрация:', registerBtn);
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                console.log('Кнопка Войти нажата в app.js');
                this.openModal('login');
            });
        } else {
            console.log('Кнопка Войти не найдена в app.js');
        }
        
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                console.log('Кнопка Регистрация нажата в app.js');
                this.openModal('register');
            });
        }

        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => this.closeModals());
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });

        const goToRegister = document.getElementById('go-to-register');
        const goToLogin = document.getElementById('go-to-login');
        
        if (goToRegister) {
            goToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeModals();
                this.openModal('register');
            });
        }
        
        if (goToLogin) {
            goToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeModals();
                this.openModal('login');
            });
        }
    }

    showSection(sectionName) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        const activeSection = document.getElementById(`${sectionName}-section`);
        if (activeSection) {
            activeSection.classList.add('active');
        }

        this.loadSectionData(sectionName);
    }

    loadSectionData(sectionName) {
        switch(sectionName) {
            case 'group-classes':
                if (typeof loadGroupClasses === 'function') {
                    loadGroupClasses();
                }
                break;
            case 'trainers':
                if (typeof loadTrainers === 'function') {
                    loadTrainers();
                }
                break;
            case 'schedule':
                if (typeof loadSchedule === 'function') {
                    loadSchedule();
                }
                break;
        }
    }

    openModal(modalType) {
        console.log('🎯 openModal вызван для:', modalType);
        this.closeModals();
        const modal = document.getElementById(`${modalType}-modal`);
        if (modal) {
            modal.style.display = 'block';
            console.log('Модальное окно открыто:', modal);
        } else {
            console.log('Модальное окно не найдено:', `${modalType}-modal`);
        }
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    checkAuthState() {
        const userData = localStorage.getItem('fitnessUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.updateUIForAuth();
            this.redirectIfAuthenticated();
        }
    }

    updateUIForAuth() {
        const authButtons = document.querySelector('.auth-buttons');
        if (this.currentUser) {
            authButtons.innerHTML = `
                <div class="user-menu">
                    <span>${this.currentUser.name}</span>
                    <button id="logout-btn" class="btn btn-outline">Выйти</button>
                </div>
            `;
            document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        }
    }

    redirectIfAuthenticated() {
        if (this.currentUser) {
            // Обновляем интерфейс для авторизованного пользователя
            if (window.navigationManager) {
                window.navigationManager.refresh();
                const defaultSection = this.currentUser.role === 'guest' ? 'home' : 'dashboard';
                window.navigationManager.showSection(defaultSection);
            }
            this.protectPages();
        }
    }

    protectPages() {
        // Больше не нужно проверять страницы, так как все в одном файле
        // NavigationManager сам управляет доступом к секциям
    }

    redirectByRole(user) {
        console.log('🔄 Обновление интерфейса для пользователя:', user);
        
        // Используем navigationManager вместо редиректа
        if (window.navigationManager) {
            window.navigationManager.refresh();
            const defaultSection = user.role === 'guest' ? 'home' : 'dashboard';
            window.navigationManager.showSection(defaultSection);
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('fitnessUser');
        this.updateUIForAuth();
        this.showSection('home');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Инициализация FitnessApp...');
    window.fitnessApp = new FitnessApp();
    window.fitnessApp.init();
});