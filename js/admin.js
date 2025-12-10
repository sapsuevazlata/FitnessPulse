class AdminManager {
    constructor() {
        this.API_BASE_URL = 'http://localhost:3000/api';
        this.trainers = [];
    }

    getAuthHeaders() {
        const token = Auth.getToken();
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    init() {
        this.bindEvents();
        this.loadTrainers();
        this.loadStats();
        this.loadGroupSessions();
    }

    bindEvents() {
        const trainerForm = document.getElementById('trainer-form');
        if (trainerForm) {
            trainerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTrainer(trainerForm);
            });
        }

        const sessionForm = document.getElementById('session-form');
        if (sessionForm) {
            sessionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSession(sessionForm);
            });
            
            const dayRadios = sessionForm.querySelectorAll('input[name="days"]');
            dayRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    const selectedDay = e.target.value;
                    const allowedDays = ['saturday', 'sunday'];
                    
                    if (!allowedDays.includes(selectedDay)) {
                        e.target.checked = false;
                        this.showNotification('Для групповых занятий можно выбрать только Субботу или Воскресенье', 'warning');
                    }
                });
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
    }

    async loadStats() {
        try {
            const response = await fetch(this.API_BASE_URL + '/admin/stats', {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.renderStats(data.stats);
            }
        } catch (error) {
            const fallbackStats = {
                totalClients: 0,
                activeTrainers: 0,
                todaySessions: 0,
                monthlyRevenue: 0
            };
            this.renderStats(fallbackStats);
        }
    }

    renderStats(stats) {
        if (stats.totalClients !== undefined) {
            document.getElementById('totalClients').textContent = stats.totalClients;
        }
        if (stats.activeTrainers !== undefined) {
            document.getElementById('activeTrainers').textContent = stats.activeTrainers;
        }
        if (stats.todaySessions !== undefined) {
            document.getElementById('todaySessions').textContent = stats.todaySessions;
        }
        if (stats.monthlyRevenue !== undefined) {
            document.getElementById('monthlyRevenue').textContent = stats.monthlyRevenue + ' Br';
        }
    }

    async loadTrainers() {
        try {
            const url = this.API_BASE_URL + '/trainers';
            
            const response = await fetch(url, {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.trainers = data.trainers;
                this.renderTrainers(data.trainers);
            } else {
                this.showNotification('Ошибка загрузки тренеров: ' + (data.error || 'неизвестная ошибка'), 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка загрузки тренеров: ' + error.message, 'error');
        }
    }

    renderTrainers(trainers) {
        const container = document.getElementById('admin-trainers-list');
        if (!container) {
            return;
        }
        
        // Убеждаемся, что контейнер видим
        if (container.style.display === 'none') {
            container.style.display = 'grid';
        }

        if (!trainers || trainers.length === 0) {
            container.innerHTML = '<div class="card"><p>Тренеры не найдены</p></div>';
            return;
        }

        container.innerHTML = trainers.map(trainer => {
            const firstLetter = trainer.name ? trainer.name.charAt(0).toUpperCase() : 'T';
            const photoUrl = trainer.id ? `assets/images/trainers/trainer-${trainer.id}.jpg` : null;
            const rating = trainer.rating || 0;
            const ratingStars = this.renderRatingStars(rating);
            
            return `
                <div class="trainer-card" data-trainer-id="${trainer.id}" data-experience="${trainer.experience || ''}">
                    <div class="trainer-header">
                        <div class="trainer-avatar-wrapper">
                            ${photoUrl ? `
                                <img src="${photoUrl}" alt="${trainer.name || 'Тренер'}" class="trainer-photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                            ` : ''}
                            <div class="trainer-avatar" style="${photoUrl ? 'display:none;' : ''}">${firstLetter}</div>
                        </div>
                        <div class="trainer-info">
                            <h3>${trainer.name || 'Тренер'}</h3>
                            <div class="trainer-rating">${ratingStars}</div>
                        </div>
                    </div>
                    
                    <div class="trainer-specialization">${trainer.specialization || 'Фитнес'}</div>
                    
                    <div class="trainer-experience">
                        <i class="fas fa-award"></i> Опыт: ${this.getExperienceText(trainer.experience)}
                    </div>
                    
                    <div class="trainer-details">
                        <div class="detail-item">
                            <i class="fas fa-envelope"></i>
                            <span>${trainer.email || 'Не указан'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-phone"></i>
                            <span>${trainer.phone || 'Не указан'}</span>
                        </div>
                    </div>
                    
                    ${trainer.bio ? `
                        <div class="trainer-bio">
                            ${trainer.bio}
                        </div>
                    ` : ''}
                    
                    <div class="trainer-footer">
                        <div class="card-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                            <button class="btn btn-outline btn-sm" onclick="adminManager.editTrainer(${trainer.id})">
                                <i class="fas fa-edit"></i> Редактировать
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="adminManager.deleteTrainer(${trainer.id})">
                                <i class="fas fa-trash"></i> Удалить
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderRatingStars(rating) {
        const ratingNum = typeof rating === 'number' ? rating : (rating ? parseFloat(rating) : 0);
        
        if (isNaN(ratingNum) || ratingNum === 0) {
            return '<span style="color: #cbd5e1; font-size: 12px;">Нет оценок</span>';
        }
        
        const fullStars = Math.floor(ratingNum);
        const hasHalfStar = ratingNum % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars + ` <span style="color: #cbd5e1; font-size: 12px;">(${ratingNum.toFixed(1)})</span>`;
    }

    openCreateTrainerModal() {
        const modal = document.getElementById('create-trainer-modal');
        if (modal) {
            modal.style.display = 'block';
            const form = document.getElementById('trainer-form');
            form.reset();
            form.dataset.mode = 'create';
            
            const title = document.getElementById('trainer-modal-title');
            if (title) title.textContent = 'Добавить тренера';
            
            const passwordField = form.querySelector('#password-field');
            if (passwordField) passwordField.style.display = 'block';
            
            const activeField = form.querySelector('#active-field');
            if (activeField) activeField.remove();
        }
    }

    async saveTrainer(form) {
        const mode = form.dataset.mode;
        const trainerId = form.dataset.trainerId;
        
        const formData = new FormData(form);
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
            experience: formData.get('experience'),
            specialization: formData.get('specialization'),
            bio: formData.get('bio')
        };

        if (mode === 'create') {
            const password = formData.get('password');
            if (!password) {
                this.showNotification('Пароль обязателен', 'error');
                return;
            }
            data.password = password;
        }

        try {
            let response;
            const url = mode === 'create' 
                ? this.API_BASE_URL + '/trainers' 
                : this.API_BASE_URL + '/trainers/' + trainerId;
            const method = mode === 'create' ? 'POST' : 'PUT';

            response = await fetch(url, {
                method: method,
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification(result.message, 'success');
                this.closeModals();
                this.loadTrainers();
                this.loadStats();
            } else {
                this.showNotification(result.error || 'Ошибка сервера', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка сохранения: ' + error.message, 'error');
        }
    }

    async editTrainer(trainerId) {
        try {
            const response = await fetch(this.API_BASE_URL + '/trainers', {
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.success) {
                const trainer = data.trainers.find(t => t.id == trainerId);
                if (trainer) {
                    this.openEditTrainerModal(trainer);
                } else {
                    this.showNotification('Тренер не найден', 'error');
                }
            }
        } catch (error) {
            this.showNotification('Ошибка загрузки данных тренера', 'error');
        }
    }

    openEditTrainerModal(trainer) {
        const modal = document.getElementById('create-trainer-modal');
        if (modal) {
            modal.style.display = 'block';
            const form = document.getElementById('trainer-form');
            form.dataset.mode = 'edit';
            form.dataset.trainerId = trainer.id;
            
            const title = document.getElementById('trainer-modal-title');
            if (title) title.textContent = 'Изменить тренера';
            
            form.name.value = trainer.name || '';
            form.email.value = trainer.email || '';
            form.phone.value = trainer.phone || '';
            form.experience.value = trainer.experience || '';
            form.specialization.value = trainer.specialization || '';
            form.bio.value = trainer.bio || '';
            
            const passwordField = form.querySelector('#password-field');
            if (passwordField) passwordField.style.display = 'none';
            
        }
    }

    async deleteTrainer(trainerId) {
        try {
            const response = await fetch(this.API_BASE_URL + '/trainers', {
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.success) {
                const trainer = data.trainers.find(t => t.id == trainerId);
                if (trainer) {
                    this.openDeleteConfirmModal(trainer);
                } else {
                    this.showNotification('Тренер не найден', 'error');
                }
            }
        } catch (error) {
            this.showNotification('Ошибка загрузки данных тренера', 'error');
        }
    }

    openDeleteConfirmModal(trainer) {
        const modal = document.getElementById('delete-confirm-modal');
        if (modal) {
            modal.style.display = 'block';
            
            document.getElementById('delete-trainer-name').textContent = trainer.name || 'Без имени';
            
            const confirmBtn = document.getElementById('confirm-delete-btn');
            confirmBtn.onclick = null;
            confirmBtn.onclick = () => this.confirmDeleteTrainer(trainer.id);
        }
    }

    async confirmDeleteTrainer(trainerId) {
        try {
            const response = await fetch(this.API_BASE_URL + '/trainers/' + trainerId, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(data.message, 'success');
                this.closeModals();
                this.loadTrainers();
                this.loadStats();
            } else {
                this.showNotification(data.error, 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка удаления', 'error');
        }
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    getExperienceText(experience) {
        const experiences = {
            '1-3': '1-3 года',
            '3-5': '3-5 лет', 
            '5+': 'Более 5 лет'
        };
        return experiences[experience] || 'Не указан';
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

    async loadUsers() {
        try {
            const response = await fetch(this.API_BASE_URL + '/users', {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                const clients = data.users.filter(user => user.role === 'client');
                this.renderUsers(clients);
            } else {
                this.showNotification('Ошибка загрузки клиентов', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка загрузки клиентов: ' + error.message, 'error');
        }
    }

    renderUsers(clients) {
        const container = document.getElementById('admin-users-list');
        if (!container) {
            return;
        }

        if (!clients || clients.length === 0) {
            container.innerHTML = '<div class="card"><p>Клиенты не найдены</p></div>';
            return;
        }

        container.innerHTML = clients.map(client => `
            <div class="card user-card">
                <div class="card-content">
                    <div class="user-header">
                        <h3>${client.name || 'Без имени'}</h3>
                        <span class="role-badge client">Клиент</span>
                    </div>
                    <div class="user-info">
                        <p><strong>Email:</strong> ${client.email || 'Не указан'}</p>
                        <p><strong>Телефон:</strong> ${client.phone || 'Не указан'}</p>
                        <p><strong>ID:</strong> ${client.id}</p>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-danger" onclick="adminManager.deleteUser(${client.id}, '${client.name || 'Клиент'}')">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }


    async deleteUser(userId, userName) {
    const confirmed = await showConfirm(`Вы уверены, что хотите удалить клиента "${userName}"? Это действие нельзя отменить.`);
    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(this.API_BASE_URL + '/users/' + userId, {
            method: 'DELETE',
            headers: this.getAuthHeaders()
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            
            if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
                throw new Error(`Сервер вернул HTML вместо JSON. Проверьте endpoint. Статус: ${response.status}`);
            }
            
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText.substring(0, 100)}`);
        }
       
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(`Клиент "${userName}" успешно удален`, 'success');
                this.loadUsers();
            } else {
                this.showNotification(data.error || 'Ошибка удаления клиента', 'error');
            }
        } else {
            const text = await response.text();
            this.showNotification('Ошибка сервера: неверный формат ответа', 'error');
        }
        
    } catch (error) {
        this.showNotification('Ошибка удаления клиента: ' + error.message, 'error');
    }
}

    formatDate(dateString) {
        if (!dateString) return 'Не указана';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    }

    async loadGroupSessions() {
        try {
            const response = await fetch(this.API_BASE_URL + '/group-sessions', {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.renderGroupSessions(data.sessions);
            } else {
                this.showNotification('Ошибка загрузки занятий: ' + (data.error || 'неизвестная ошибка'), 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка загрузки занятий: ' + error.message, 'error');
        }
    }

    renderGroupSessions(sessions) {
        const container = document.getElementById('admin-sessions-list');
        if (!container) return;

        container.innerHTML = sessions.map(session => `
            <div class="class-card" data-session-id="${session.id}">
                <div class="card-header">
                    <h3>${session.name}</h3>
                    <div class="card-actions">
                        <button class="btn btn-sm btn-outline" onclick="adminManager.openEditSessionModal(${JSON.stringify(session).replace(/"/g, '&quot;')})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminManager.deleteSession(${session.id}, '${session.name}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="card-content">
                    <p class="class-description">${session.description || 'Описание отсутствует'}</p>
                    
                    <div class="class-details">
                        <div class="detail-item">
                            <i class="fas fa-calendar"></i>
                            <span>${this.getDaysText(session.days)}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-clock"></i>
                            <span>${session.time ? session.time.substring(0, 5) : '--:--'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-stopwatch"></i>
                            <span>${session.duration || 0} мин.</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-users"></i>
                            <span>${session.current_participants || 0}/${session.max_participants || 0}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-user-tie"></i>
                            <span>${session.trainer_name || 'Не назначен'}</span>
                        </div>
                    </div>

                </div>
            </div>
        `).join('');
    }

    async openCreateSessionModal() {
        const modal = document.getElementById('create-session-modal');
        if (modal) {
            modal.style.display = 'block';
            const form = document.getElementById('session-form');
            form.reset();
            form.dataset.mode = 'create';
            document.getElementById('session-modal-title').textContent = 'Добавить групповое занятие';
            
            if (!this.trainers || this.trainers.length === 0) {
                await this.loadTrainers();
            }
            this.populateSessionTrainerSelect();
            
            const activeField = form.querySelector('#session-active-field');
            if (activeField) activeField.remove();
        }
    }

    async editSession(sessionId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/group-sessions/${sessionId}`, {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Занятие не найдено');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.openEditSessionModal(data.session);
            } else {
                this.showNotification('Ошибка загрузки данных: ' + (data.error || ''), 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка загрузки данных занятия: ' + error.message, 'error');
        }
    }

    openEditSessionModal(session) {
        const modal = document.getElementById('create-session-modal');
        if (modal) {
            modal.style.display = 'block';
            const form = document.getElementById('session-form');
            form.dataset.mode = 'edit';
            form.dataset.sessionId = session.id;
            document.getElementById('session-modal-title').textContent = 'Редактировать занятие';
            
            form.name.value = session.name || '';
            form.description.value = session.description || '';
            form.time.value = session.time ? session.time.substring(0, 5) : '10:00';
            form.max_participants.value = session.max_participants || '';
            form.duration.value = session.duration || '';
            
            let selectedDay = null;
            if (session.days) {
                if (Array.isArray(session.days)) {
                    selectedDay = session.days.find(day => day === 'saturday' || day === 'sunday') || session.days[0];
                } else {
                    const daysArray = session.days.split(',');
                    selectedDay = daysArray.find(day => day.trim() === 'saturday' || day.trim() === 'sunday') || daysArray[0].trim();
                }
            }
            
            form.querySelectorAll('input[name="days"]').forEach(radio => {
                radio.checked = radio.value === selectedDay;
            });
            
            this.populateSessionTrainerSelect(session.trainer_id);
            
        }
    }

    populateSessionTrainerSelect(selectedTrainerId = null) {
        const select = document.getElementById('session-trainer-select');
        if (!select) {
            return;
        }

        if (!this.trainers || this.trainers.length === 0) {
            select.innerHTML = '<option value="">Нет доступных тренеров</option>';
            return;
        }
        
        select.innerHTML = '<option value="">Выберите тренера</option>' +
            this.trainers
                .map(trainer => `
                    <option value="${trainer.id}" ${trainer.id == selectedTrainerId ? 'selected' : ''}>
                        ${trainer.name} - ${trainer.specialization || 'Без специализации'}
                    </option>
                `).join('');
    }

    async saveSession(form) {
        const mode = form.dataset.mode;
        const sessionId = form.dataset.sessionId;
        
        const formData = new FormData(form);
        const selectedDay = form.querySelector('input[name="days"]:checked');
        
        if (!selectedDay) {
            this.showNotification('Пожалуйста, выберите день недели (Суббота или Воскресенье)', 'error');
            return;
        }
        
        const trainerId = form.trainer_id.value;
        
        if (!trainerId || trainerId === '') {
            this.showNotification('Пожалуйста, выберите тренера', 'error');
            return;
        }
        
        const time = form.time.value;
        if (time) {
            const [hours, minutes] = time.split(':').map(Number);
            const timeInMinutes = hours * 60 + minutes;
            const minTime = 9 * 60; 
            const maxTime = 21 * 60; 
            
            if (timeInMinutes < minTime || timeInMinutes > maxTime) {
                this.showNotification('Время занятия должно быть с 9:00 до 21:00', 'error');
                return;
            }
        }
        
        const data = {
            name: form.name.value,
            description: form.description.value,
            days: selectedDay.value, 
            time: time,
            max_participants: parseInt(form.max_participants.value),
            duration: parseInt(form.duration.value),
            trainer_id: parseInt(trainerId)
        };

        try {
            const url = mode === 'create' 
                ? this.API_BASE_URL + '/group-sessions' 
                : this.API_BASE_URL + '/group-sessions/' + sessionId;
            const method = mode === 'create' ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method: method,
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification(result.message, 'success');
                this.closeModals();
                this.loadGroupSessions();
            } else {
                this.showNotification(result.error || 'Ошибка сервера', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка сохранения: ' + error.message, 'error');
        }
    }

    async deleteSession(sessionId) {
        try {
            const response = await fetch(this.API_BASE_URL + '/group-sessions/' + sessionId, {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.openDeleteSessionConfirmModal(data.session);
            } else {
                this.showNotification('Ошибка удаления: ' + (data.error || ''), 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка: ' + error.message, 'error');
        }
    }

    openDeleteSessionConfirmModal(session) {
        const modal = document.getElementById('delete-session-confirm-modal');
        if (modal) {
            modal.style.display = 'block';
            
            document.getElementById('delete-session-name').textContent = session.name || 'Без названия';
            
            const confirmBtn = document.getElementById('confirm-session-delete-btn');
            confirmBtn.onclick = null;
            confirmBtn.onclick = () => this.confirmDeleteSession(session.id);
        }
    }

    async confirmDeleteSession(sessionId) {
        try {
            const response = await fetch(this.API_BASE_URL + '/group-sessions/' + sessionId, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(data.message, 'success');
                this.closeModals();
                this.loadGroupSessions();
            } else {
                this.showNotification(data.error, 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка удаления', 'error');
        }
    }

    getDaysText(daysString) {
        const daysMap = {
            'monday': 'Понедельник',
            'tuesday': 'Вторник',
            'wednesday': 'Среда',
            'thursday': 'Четверг',
            'friday': 'Пятница',
            'saturday': 'Суббота',
            'sunday': 'Воскресенье'
        };
        
        if (!daysString) return 'Не указаны';
        
        return daysString.split(',')
            .map(day => daysMap[day] || day)
            .join(', ');
    }
}

window.adminManager = new AdminManager();