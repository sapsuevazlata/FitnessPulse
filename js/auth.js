const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    const goToRegisterLink = document.getElementById('go-to-register');
    if (goToRegisterLink) {
        goToRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            const loginModal = document.getElementById('login-modal');
            const registerModal = document.getElementById('register-modal');
            if (loginModal) loginModal.style.display = 'none';
            if (registerModal) registerModal.style.display = 'block';
        });
    }
    
    const goToLoginLink = document.getElementById('go-to-login');
    if (goToLoginLink) {
        goToLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            const loginModal = document.getElementById('login-modal');
            const registerModal = document.getElementById('register-modal');
            if (registerModal) registerModal.style.display = 'none';
            if (loginModal) loginModal.style.display = 'block';
        });
    }
    
    window.addEventListener('click', function(e) {
        const loginModal = document.getElementById('login-modal');
        const registerModal = document.getElementById('register-modal');
        
        if (e.target === loginModal) {
            loginModal.style.display = 'none';
        }
        if (e.target === registerModal) {
            registerModal.style.display = 'none';
        }
    });
});

function redirectByRole(user) {
    if (!user || !user.role) {
        showNotification('Ошибка: данные пользователя не получены', 'error');
        return;
    }

    window.location.reload();
}

async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
        const response = await fetch(API_BASE_URL + '/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('fitnessUser', JSON.stringify(data.user));
            localStorage.setItem('fitnessToken', data.token);
            
            const modal = document.getElementById('login-modal');
            if (modal) modal.style.display = 'none';
            
            redirectByRole(data.user);
            
        } else {
            showNotification('Ошибка: ' + data.error, 'error');
        }
    } catch (error) {
        showNotification('Ошибка соединения с сервером', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    if (!name || name.trim() === '') {
        showNotification('Пожалуйста, заполните имя', 'warning');
        return;
    }
    if (!email || email.trim() === '') {
        showNotification('Пожалуйста, заполните email', 'warning');
        return;
    }
    if (phone && phone.trim() !== '') {
        const phoneRegex = /^\+375[0-9]{9}$/;
        if (!phoneRegex.test(phone.trim())) {
            showNotification('Номер телефона должен быть в формате +375XXXXXXXXX (например, +375291234567) или оставьте поле пустым', 'error');
            return;
        }
    }
    
    if (!password || password.trim() === '') {
        showNotification('Пожалуйста, заполните пароль', 'warning');
        return;
    }
    
    if (password.length < 8) {
        showNotification('Пароль должен содержать минимум 8 символов', 'error');
        return;
    }
    
    if (!confirmPassword || confirmPassword.trim() === '') {
        showNotification('Пожалуйста, подтвердите пароль', 'warning');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('Пароли не совпадают', 'error');
        return;
    }

    try {
        const response = await fetch(API_BASE_URL + '/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                name: name.trim(),
                email: email.trim(),
                phone: phone ? phone.trim() : '',
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Регистрация прошла успешно!', 'success');
            
            localStorage.setItem('fitnessUser', JSON.stringify(data.user));
            localStorage.setItem('fitnessToken', data.token);
            
            const modal = document.getElementById('register-modal');
            if (modal) modal.style.display = 'none';
            
            redirectByRole(data.user);
            
        } else {
            showNotification('Ошибка: ' + data.error, 'error');
        }
    } catch (error) {
        showNotification('Ошибка соединения с сервером', 'error');
    }
}

class Auth {
    static getCurrentUser() {
        const userData = localStorage.getItem('fitnessUser');
        return userData ? JSON.parse(userData) : null;
    }
    
    static logout() {
        localStorage.removeItem('fitnessUser');
        localStorage.removeItem('fitnessToken');

        window.location.reload();
    }
    
    static getToken() {
        return localStorage.getItem('fitnessToken');
    }
    
    static isAuthenticated() {
        return !!localStorage.getItem('fitnessUser');
    }
}

function logout() {
    Auth.logout();
    return false;
}