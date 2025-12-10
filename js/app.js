class FitnessApp {
    constructor() {
        this.currentUser = null;
    }

    init() {
        this.checkAuthState();
        
        if (window.navigationManager) {
            window.navigationManager.init();
        }
    }

    openModal(modalType) {
        this.closeModals();
        const modal = document.getElementById(`${modalType}-modal`);
        if (modal) {
            modal.style.display = 'block';
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
        if (this.currentUser && window.navigationManager) {
            window.navigationManager.refresh();
            window.navigationManager.showSection('home');
        }
    }

    redirectByRole(user) {
        if (window.navigationManager) {
            window.navigationManager.refresh();
            window.navigationManager.showSection('home');
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('fitnessUser');
        this.updateUIForAuth();
        if (window.navigationManager) {
            window.navigationManager.showSection('home');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.fitnessApp = new FitnessApp();
    window.fitnessApp.init();
});