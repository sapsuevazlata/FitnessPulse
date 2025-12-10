class TrainerProfileManager {
    constructor() {
        this.API_BASE_URL = 'http://localhost:3000/api';
    }

    getAuthHeaders() {
        const token = Auth.getToken();
        if (!token) {
            this.showNotification('Необходимо войти в систему', 'error');
            return null;
        }
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    init() {
        this.loadProfile();
        this.bindEvents();
    }

    bindEvents() {
        const form = document.getElementById('trainer-profile-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProfile(form);
            });
        }
    }

    async loadProfile() {
        try {
            const headers = this.getAuthHeaders();
            if (!headers) return;

            const response = await fetch(this.API_BASE_URL + '/trainer/profile', {
                headers: headers
            });

            if (response.status === 401 || response.status === 403) {
                this.showNotification('Сессия истекла. Пожалуйста, войдите снова', 'error');
                return;
            }

            const data = await response.json();

            if (data.success) {
                const form = document.getElementById('trainer-profile-form');
                if (form) {
                    form.name.value = data.user.name || '';
                    form.email.value = data.user.email || '';
                    form.phone.value = data.user.phone || '';
                    form.experience.value = data.user.experience || '';
                    form.specialization.value = data.user.specialization || '';
                    form.bio.value = data.user.bio || '';
                }
            } else {
                this.showNotification(data.error || 'Ошибка загрузки профиля', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка загрузки профиля: ' + error.message, 'error');
        }
    }

    async updateProfile(form) {
        const formData = new FormData(form);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm_password');

        if (password && password !== confirmPassword) {
            this.showNotification('Пароли не совпадают', 'error');
            return;
        }

        const phone = formData.get('phone');
        if (phone && phone.trim() !== '') {
            const phoneRegex = /^\+375[0-9]{9}$/;
            if (!phoneRegex.test(phone.trim())) {
                this.showNotification('Номер телефона должен быть в формате +375XXXXXXXXX (например, +375291234567) или оставьте поле пустым', 'error');
                return;
            }
        }

        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: phone && phone.trim() !== '' ? phone.trim() : null,
            experience: formData.get('experience') || null,
            specialization: formData.get('specialization') || null,
            bio: formData.get('bio') || null
        };

        if (password) {
            data.password = password;
        }

        try {
            const headers = this.getAuthHeaders();
            if (!headers) return;

            const response = await fetch(this.API_BASE_URL + '/trainer/profile', {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(data)
            });

            if (response.status === 401 || response.status === 403) {
                const errorData = await response.json().catch(() => ({ error: 'Доступ запрещен' }));
                this.showNotification(errorData.error || 'Сессия истекла. Пожалуйста, войдите снова', 'error');
                return;
            }

            const result = await response.json();

            if (result.success) {
                this.showNotification('Профиль успешно обновлен', 'success');
                
                if (result.user) {
                    localStorage.setItem('fitnessUser', JSON.stringify(result.user));
                    
                    const userNameElement = document.getElementById('userName');
                    if (userNameElement) {
                        userNameElement.textContent = result.user.name;
                    }
                }
            } else {
                this.showNotification(result.error || 'Ошибка обновления', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка обновления профиля: ' + error.message, 'error');
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

window.trainerProfileManager = new TrainerProfileManager();

