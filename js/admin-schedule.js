class AdminScheduleManager {
    constructor() {
        this.API_BASE_URL = 'http://localhost:3000/api';
        this.trainers = [];
        this.trainerSchedule = [];
        this.scheduleMap = {};
        this.currentTrainerId = null;
        this.initialized = false;
        this.days = [
            { key: 'monday', label: 'Понедельник', short: 'Пн' },
            { key: 'tuesday', label: 'Вторник', short: 'Вт' },
            { key: 'wednesday', label: 'Среда', short: 'Ср' },
            { key: 'thursday', label: 'Четверг', short: 'Чт' },
            { key: 'friday', label: 'Пятница', short: 'Пт' }
        ];
        this.hours = this.generateHours(9, 21);
    }

    generateHours(start = 9, end = 21) {
        const hours = [];
        for (let h = start; h <= end; h++) {
            hours.push(`${h.toString().padStart(2, '0')}:00`);
        }
        return hours;
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

    async init() {
        if (this.initialized) {
            this.renderGrid();
            this.renderTrainerSchedule(this.trainerSchedule);
            return;
        }

        this.initialized = true;
        this.bindEvents();

        await Promise.all([this.loadTrainers(), this.loadTrainerSchedule()]);
        this.populateTrainerPicker();
        this.renderTrainerSchedule(this.trainerSchedule);
    }

    bindEvents() {
        const saveBtn = document.getElementById('save-trainer-schedule-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveCurrentSchedule());
        }

        const clearBtn = document.getElementById('clear-schedule-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearCurrentSchedule());
        }

        const picker = document.getElementById('schedule-trainer-picker');
        if (picker) {
            picker.addEventListener('change', (event) => {
                const trainerId = event.target.value;
                this.selectTrainer(trainerId);
            });
        }

        this.gridWrapper = document.getElementById('trainer-schedule-grid');
        if (this.gridWrapper) {
            this.gridWrapper.addEventListener('click', (event) => {
                const slotButton = event.target.closest('.slot-cell');
                if (!slotButton || !this.currentTrainerId) {
                    return;
                }

                const day = slotButton.dataset.day;
                const hour = slotButton.dataset.hour;
                this.toggleSlot(day, hour, slotButton);
            });
        }
    }

    async loadTrainerSchedule() {
        try {
            const response = await fetch(this.API_BASE_URL + '/admin/trainer-schedule', {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.trainerSchedule = data.schedule || [];
                this.buildScheduleMap(this.trainerSchedule);
                this.renderTrainerSchedule(this.trainerSchedule);
                this.renderGrid();
            } else {
                this.showNotification('Ошибка загрузки расписания', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка загрузки расписания', 'error');
        }
    }

    buildScheduleMap(schedule) {
        this.scheduleMap = {};

        schedule.forEach(slot => {
            const trainerId = String(slot.trainer_id);
            if (!this.scheduleMap[trainerId]) {
                this.scheduleMap[trainerId] = this.createEmptyDayMap();
            }
            
            const dayExists = this.days.some(day => day.key === slot.day_of_week);
            if (!dayExists) {
                return;
            }
            
            const hour = slot.start_time ? slot.start_time.substring(0, 5) : null;
            if (hour && this.scheduleMap[trainerId][slot.day_of_week]) {
                this.scheduleMap[trainerId][slot.day_of_week].add(hour);
            }
        });
    }

    createEmptyDayMap() {
        const map = {};
        this.days.forEach(day => {
            map[day.key] = new Set();
        });
        return map;
    }

    ensureTrainerMap(trainerId) {
        const key = String(trainerId);
        if (!this.scheduleMap[key]) {
            this.scheduleMap[key] = this.createEmptyDayMap();
        }
        return this.scheduleMap[key];
    }

    renderTrainerSchedule(schedule) {
        const container = document.getElementById('admin-trainer-schedule');
        if (!container) return;

        if (!schedule || schedule.length === 0) {
            container.innerHTML = `
                <div class="empty-schedule">
                    <p>Расписание тренеров не настроено</p>
                </div>
            `;
            return;
        }

        const trainersMap = {};
        schedule.forEach(slot => {
            if (!trainersMap[slot.trainer_id]) {
                trainersMap[slot.trainer_id] = {
                    name: slot.trainer_name,
                    specialization: slot.specialization,
                    slots: []
                };
            }
            trainersMap[slot.trainer_id].slots.push(slot);
        });

        container.innerHTML = `
            <div class="schedule-header">
                <h3>Расписание тренеров</h3>
            </div>
            <div class="trainers-schedule-grid">
                ${Object.values(trainersMap).map((trainer) => `
                    <div class="trainer-schedule-card">
                        <div class="trainer-header">
                            <h4>${trainer.name}</h4>
                            <span class="specialization">${trainer.specialization || 'Специализация не указана'}</span>
                            <div class="schedule-stats">
                                <span class="stat">${this.getDaysCount(trainer.slots)} дней</span>
                                <span class="stat">${this.getTotalHours(trainer.slots)} часов</span>
                            </div>
                        </div>
                        <div class="schedule-slots">
                            ${this.renderTrainerSlots(trainer.slots)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getDaysCount(slots) {
        const uniqueDays = new Set(slots.map(slot => slot.day_of_week));
        return uniqueDays.size;
    }

    getTotalHours(slots) {
        return slots.length;
    }

    renderTrainerSlots(slots) {
        const days = {
            monday: { name: 'Понедельник', slots: [] },
            tuesday: { name: 'Вторник', slots: [] },
            wednesday: { name: 'Среда', slots: [] },
            thursday: { name: 'Четверг', slots: [] },
            friday: { name: 'Пятница', slots: [] },
            saturday: { name: 'Суббота', slots: [] },
            sunday: { name: 'Воскресенье', slots: [] }
        };

        slots.forEach(slot => {
            if (days[slot.day_of_week]) {
                days[slot.day_of_week].slots.push(slot);
            }
        });

        return `
            <div class="weekly-schedule">
                ${Object.values(days).map((day) => `
                    <div class="day-column ${day.slots.length > 0 ? 'has-slots' : 'no-slots'}">
                        <div class="day-header">${day.name}</div>
                        <div class="day-slots">
                            ${day.slots.map(slot => this.renderScheduleSlot(slot)).join('')}
                            ${day.slots.length === 0 ? '<div class="no-slots-message">Нет тренировок</div>' : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderScheduleSlot(slot) {
        const startTime = slot.start_time.substring(0, 5);
        const endTime = slot.end_time.substring(0, 5);
        
        return `
            <div class="schedule-slot personal">
                <div class="slot-time">${startTime} — ${endTime}</div>
                <div class="slot-info">
                    <span class="slot-type-badge">1 час</span>
                </div>
            </div>
        `;
    }

    async loadTrainers() {
        try {
            const response = await fetch(this.API_BASE_URL + '/trainers', {
                headers: this.getAuthHeaders()
            });

            const data = await response.json();

            if (data.success) {
                this.trainers = data.trainers || [];
            }
        } catch (error) {
        }
    }

    populateTrainerPicker() {
        const select = document.getElementById('schedule-trainer-picker');
        if (!select) return;

        if (!this.trainers || this.trainers.length === 0) {
            select.innerHTML = '<option value="">Нет доступных тренеров</option>';
            this.renderGrid();
            return;
        }

        select.innerHTML = this.trainers.map(trainer => `
            <option value="${trainer.id}">
                ${trainer.name}
            </option>
        `).join('');

        const firstActive = this.trainers[0];
        if (firstActive) {
            select.value = firstActive.id;
            this.selectTrainer(firstActive.id);
        }
    }

    selectTrainer(trainerId) {
        if (!trainerId) {
            this.currentTrainerId = null;
            this.renderGrid();
            return;
        }

        this.currentTrainerId = trainerId;
        this.ensureTrainerMap(trainerId);
        this.renderGrid();
    }

    renderGrid() {
        if (!this.gridWrapper) return;

        if (!this.currentTrainerId) {
            this.gridWrapper.innerHTML = `
                <div class="schedule-grid-placeholder">
                    <p>Сначала выберите тренера</p>
                </div>
            `;
            return;
        }

        const trainerMap = this.ensureTrainerMap(this.currentTrainerId);

        const tableHead = `
            <thead>
                <tr>
                    <th>Время</th>
                    ${this.days.map(day => `<th>${day.short}</th>`).join('')}
                </tr>
            </thead>
        `;

        const tableBody = `
            <tbody>
                ${this.hours.map(hour => `
                    <tr>
                        <th>${hour}</th>
                        ${this.days.map(day => {
                            const active = trainerMap[day.key].has(hour);
                            return `
                                <td>
                                    <button 
                                        class="slot-cell ${active ? 'active' : ''}" 
                                        data-day="${day.key}" 
                                        data-hour="${hour}">
                                        ${active ? '<span>•</span>' : ''}
                                    </button>
                                </td>
                            `;
                        }).join('')}
                    </tr>
                `).join('')}
            </tbody>
        `;

        this.gridWrapper.innerHTML = `
            <table class="schedule-grid-table">
                ${tableHead}
                ${tableBody}
            </table>
        `;

        this.updateSelectedCounter();
    }

    toggleSlot(day, hour, button) {
        const trainerMap = this.ensureTrainerMap(this.currentTrainerId);
        const daySet = trainerMap[day];

        if (daySet.has(hour)) {
            daySet.delete(hour);
            button.classList.remove('active');
            button.textContent = '';
        } else {
            daySet.add(hour);
            button.classList.add('active');
            button.innerHTML = '<span>•</span>';
        }

        this.updateSelectedCounter();
    }

    clearCurrentSchedule() {
        if (!this.currentTrainerId) return;
        this.scheduleMap[this.currentTrainerId] = this.createEmptyDayMap();
        this.renderGrid();
    }

    collectSlots(trainerId) {
        const map = this.ensureTrainerMap(trainerId);
        const slots = [];

        this.days.forEach(day => {
            map[day.key].forEach(hour => {
                slots.push({ day_of_week: day.key, start_time: hour });
            });
        });

        return slots;
    }

    async saveCurrentSchedule() {
        if (!this.currentTrainerId) {
            this.showNotification('Выберите тренера', 'warning');
            return;
        }

        const slots = this.collectSlots(this.currentTrainerId);
        
        if (slots.length === 0) {
            this.showNotification('Нет выбранных слотов для сохранения', 'warning');
            return;
        }

        try {
            const response = await fetch(this.API_BASE_URL + '/admin/trainer-schedule', {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    trainer_id: Number(this.currentTrainerId),
                    slots: slots
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification(`Расписание сохранено (${data.slots || slots.length} слотов)`, 'success');
                await this.loadTrainerSchedule();
            } else {
                this.showNotification(data.error || 'Ошибка сохранения', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка сохранения: ' + error.message, 'error');
        }
    }

showProgressIndicator(total) {
    let progressContainer = document.getElementById('save-progress-container');
    if (!progressContainer) {
        progressContainer = document.createElement('div');
        progressContainer.id = 'save-progress-container';
        progressContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            min-width: 300px;
            text-align: center;
        `;
        
        progressContainer.innerHTML = `
            <h4>Сохранение расписания</h4>
            <div class="progress-bar" style="width: 100%; height: 20px; background: #f0f0f0; border-radius: 10px; margin: 10px 0;">
                <div id="save-progress-bar" style="width: 0%; height: 100%; background: #4CAF50; border-radius: 10px; transition: width 0.3s;"></div>
            </div>
            <div id="save-progress-text">0/${total}</div>
            <button id="cancel-save-btn" style="margin-top: 10px; padding: 5px 15px; background: #ff4444; color: white; border: none; border-radius: 4px; cursor: pointer;">Отмена</button>
        `;
        
        document.body.appendChild(progressContainer);
        
        document.getElementById('cancel-save-btn').addEventListener('click', () => {
            this.hideProgressIndicator();
            this.showNotification('Сохранение отменено', 'warning');
        });
    }
}

updateProgressIndicator(current, total) {
    const progressBar = document.getElementById('save-progress-bar');
    const progressText = document.getElementById('save-progress-text');
    
    if (progressBar && progressText) {
        const percent = (current / total) * 100;
        progressBar.style.width = percent + '%';
        progressText.textContent = `${current}/${total}`;
    }
}

hideProgressIndicator() {
    const progressContainer = document.getElementById('save-progress-container');
    if (progressContainer) {
        progressContainer.remove();
    }
}

calculateEndTime(startTime) {
    const [hours, minutes] = startTime.split(':');
    const endHours = String(parseInt(hours) + 1).padStart(2, '0');
    return `${endHours}:${minutes}:00`;
}

    updateSelectedCounter() {
        const counter = document.getElementById('schedule-selected-counter');
        if (!counter || !this.currentTrainerId) {
            if (counter) counter.textContent = 'Выбрано 0 часов';
            return;
        }

        const slots = this.collectSlots(this.currentTrainerId);
        counter.textContent = `Выбрано ${slots.length} час(ов)`;
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

window.adminScheduleManager = new AdminScheduleManager();