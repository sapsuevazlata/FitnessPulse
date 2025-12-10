class AdminSettingsManager {
    constructor() {
        this.token = Auth.getToken();
        this.API_BASE_URL = 'http://localhost:3000/api';
        this.currentUser = Auth.getCurrentUser();
    }

    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    init() {
        this.bindEvents();
        this.loadAdminProfile();
    }

    bindEvents() {
        const profileForm = document.getElementById('admin-profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateAdminProfile(profileForm);
            });
        }
    }

    async loadAdminProfile() {
        try {
            if (this.currentUser) {
                this.renderAdminProfile(this.currentUser);
            }
            
            const response = await fetch(this.API_BASE_URL + '/admin/profile', {
                headers: this.getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.renderAdminProfile(data.user);
                }
            }
        } catch (error) {
        }
    }

    renderAdminProfile(user) {
        document.getElementById('admin-profile-name').value = user.name || '';
        document.getElementById('admin-profile-email').value = user.email || '';
        document.getElementById('admin-profile-phone').value = user.phone || '';
        
        document.getElementById('admin-registration-date').textContent = 'Не указана';
        document.getElementById('admin-user-id').textContent = user.id || 'Не указан';
    }

    async updateAdminProfile(form) {
        const formData = new FormData(form);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm_password');
        
        if (password && password !== confirmPassword) {
            this.showNotification('Пароли не совпадают', 'error');
            return;
        }

        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone')
        };

        if (password) {
            data.password = password;
        }

        try {
            const response = await fetch(this.API_BASE_URL + '/admin/profile', {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Профиль успешно обновлен', 'success');
                
                if (result.user) {
                    localStorage.setItem('fitnessUser', JSON.stringify(result.user));
                    this.currentUser = result.user;
                    
                    const userNameElement = document.getElementById('userName');
                    if (userNameElement) {
                        userNameElement.textContent = result.user.name;
                    }
                }
            } else {
                this.showNotification(result.error || 'Ошибка обновления', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка обновления: ' + error.message, 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

window.adminSettingsManager = new AdminSettingsManager();