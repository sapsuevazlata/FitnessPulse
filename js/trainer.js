class TrainerManager {
    constructor() {
        this.API_BASE_URL = 'http://localhost:3000/api';
        this.currentUser = Auth.getCurrentUser();
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
        this.loadSchedule();
        this.loadGroupSessions();
    }

    async loadSchedule() {
        try {
            const response = await fetch(this.API_BASE_URL + '/trainer/schedule', {
                headers: this.getAuthHeaders()
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.renderSchedule(data.schedule);
            } else {
                this.showNotification('Ошибка загрузки расписания', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка загрузки расписания', 'error');
        }
    }

    async loadGroupSessions() {
        try {
            const response = await fetch(this.API_BASE_URL + '/trainer/group-sessions', {
                headers: this.getAuthHeaders()
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.renderGroupSessionsInSchedule(data.sessions);
                this.renderGroupSessionsInClasses(data.sessions);
            }
        } catch (error) {
        }
    }

    renderGroupSessionsInSchedule(sessions) {
        const container = document.getElementById('trainer-group-sessions');
        if (!container) {
            return;
        }

        if (!sessions || sessions.length === 0) {
            container.innerHTML = `
                <div class="card">
                    <div class="empty-state">
                        <i class="fas fa-users fa-2x"></i>
                        <p>У вас пока нет групповых занятий</p>
                        <small>Групповые занятия будут отображаться здесь</small>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = sessions.map(session => this.renderGroupSessionCard(session)).join('');
    }

    renderGroupSessionsInClasses(sessions) {
        const container = document.getElementById('trainer-group-classes-list');
        if (!container) {
            return;
        }

        if (!sessions || sessions.length === 0) {
            container.innerHTML = '<p>У вас нет запланированных групповых занятий</p>';
            return;
        }

        container.innerHTML = sessions.map(session => `
            <div class="group-session-card">
                <h4>${session.name || 'Групповое занятие'}</h4>
                <p><strong>Описание:</strong> ${session.description || 'Нет описания'}</p>
                <p><strong>Дни:</strong> ${session.days || 'Не указаны'}</p>
                <p><strong>Время:</strong> ${session.time || 'Не указано'}</p>
                <p><strong>Длительность:</strong> ${session.duration || 0} мин.</p>
                <p><strong>Участников:</strong> ${session.current_participants || 0}/${session.max_participants || 0}</p>
            </div>
        `).join('');
    }

    renderGroupSessionCard(session) {
        const days = session.days ? session.days.split(',') : [];
        const daysText = days.map(day => this.getDayText(day)).join(', ');
        const availableSpots = session.max_participants - (session.current_participants || 0);
        const isFull = availableSpots <= 0;
        
        return `
            <div class="card group-session-card" data-session-id="${session.id}">
                <div class="session-header">
                    <div class="session-info">
                        <h4>${session.name || 'Групповое занятие'}</h4>
                        <span class="session-status ${isFull ? 'full' : 'available'}">
                            ${isFull ? '🔴 Мест нет' : '🟢 Доступно'}
                        </span>
                    </div>
                </div>
                
                <div class="session-description">
                    ${session.description || 'Групповое занятие под вашим руководством.'}
                </div>
                
                <div class="session-details">
                    <div class="detail-row">
                        <div class="detail-item">
                            <i class="fas fa-clock"></i>
                            <span>Время: ${session.time || '10:00'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-stopwatch"></i>
                            <span>Длительность: ${session.duration || 60} мин.</span>
                        </div>
                    </div>
                    
                    <div class="detail-row">
                        <div class="detail-item">
                            <i class="fas fa-calendar"></i>
                            <span>Дни: ${daysText || 'Пн, Ср, Пт'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-users"></i>
                            <span>Записано: ${session.current_participants || 0}/${session.max_participants || 10}</span>
                        </div>
                    </div>
                </div>

                <div class="session-stats">
                    <div class="stat-item">
                        <span class="stat-label">Свободных мест:</span>
                        <span class="stat-value ${isFull ? 'full' : ''}">${availableSpots}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Заполненность:</span>
                        <span class="stat-value">${Math.round(((session.current_participants || 0) / (session.max_participants || 10)) * 100)}%</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderSchedule(schedule) {
        const container = document.getElementById('trainer-schedule');
        if (!container) return;

        if (!schedule || schedule.length === 0) {
            container.innerHTML = `
                <div class="empty-schedule">
                    <p>Ваше расписание еще не настроено администратором</p>
                    <p class="text-muted">Обратитесь к администратору для настройки расписания</p>
                </div>
            `;
            return;
        }

        const days = {
            monday: { name: 'Понедельник', slots: [] },
            tuesday: { name: 'Вторник', slots: [] },
            wednesday: { name: 'Среда', slots: [] },
            thursday: { name: 'Четверг', slots: [] },
            friday: { name: 'Пятница', slots: [] },
            saturday: { name: 'Суббота', slots: [] },
            sunday: { name: 'Воскресенье', slots: [] }
        };

        schedule.forEach(slot => {
            if (days[slot.day_of_week]) {
                days[slot.day_of_week].slots.push(slot);
            }
        });

        Object.values(days).forEach(day => {
            day.slots.sort((a, b) => {
                const timeA = a.start_time || '';
                const timeB = b.start_time || '';
                return timeA.localeCompare(timeB);
            });
        });

        const totalHours = schedule.length;
        const uniqueDays = new Set(schedule.map(s => s.day_of_week)).size;

        container.innerHTML = `
            <div class="schedule-header">
                <h3>Мое расписание</h3>
                <div class="schedule-stats">
                    <span class="stat-badge">
                        <i class="fas fa-calendar"></i> ${uniqueDays} дней в неделю
                    </span>
                    <span class="stat-badge">
                        <i class="fas fa-clock"></i> ${totalHours} часов
                    </span>
                </div>
            </div>
            <div class="weekly-schedule">
                ${Object.values(days).map(day => `
                    <div class="day-column ${day.slots.length > 0 ? 'has-slots' : 'no-slots'}">
                        <div class="day-header">${day.name}</div>
                        <div class="day-slots">
                            ${day.slots.length > 0 ? 
                                day.slots.map(slot => this.renderScheduleSlot(slot)).join('') :
                                '<div class="no-slots-message">Нет занятий</div>'
                            }
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderScheduleSlot(slot) {
        const startTime = slot.start_time ? slot.start_time.substring(0, 5) : '';
        const endTime = slot.end_time ? slot.end_time.substring(0, 5) : '';
        const isPersonal = slot.slot_type === 'personal';
        
        return `
            <div class="schedule-slot personal">
                <div class="slot-time">${startTime} — ${endTime}</div>
                <div class="slot-info">
                    <span class="slot-type-badge">1 час</span>
                    ${slot.max_slots ? `<span class="slots-count">${slot.max_slots} мест</span>` : ''}
                </div>
            </div>
        `;
    }

    getDayText(day) {
        const daysMap = {
            'monday': 'Пн',
            'tuesday': 'Вт', 
            'wednesday': 'Ср',
            'thursday': 'Чт',
            'friday': 'Пт',
            'saturday': 'Сб',
            'sunday': 'Вс'
        };
        return daysMap[day.toLowerCase()] || day;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        const autoRemoveTimeout = setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
        
        notification.addEventListener('click', () => {
            clearTimeout(autoRemoveTimeout);
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    }

    getNotificationColor(type) {
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        return colors[type] || colors.info;
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    async loadClients() {
        try {
            const response = await fetch(this.API_BASE_URL + '/trainer/clients', {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.renderClients(data.bookings);
            } else {
                this.showNotification('Ошибка загрузки клиентов: ' + (data.error || 'неизвестная ошибка'), 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка загрузки клиентов: ' + error.message, 'error');
        }
    }

    renderClients(bookings) {
        const container = document.getElementById('trainer-clients-list');
        if (!container) {
            return;
        }

        if (!bookings || bookings.length === 0) {
            container.innerHTML = `
                <div class="card">
                    <div class="empty-state">
                        <i class="fas fa-users fa-2x"></i>
                        <p>У вас пока нет записей</p>
                        <small>Записи клиентов на индивидуальные тренировки будут отображаться здесь</small>
                    </div>
                </div>
            `;
            return;
        }

        const sortedBookings = bookings.sort((a, b) => {
            const dateA = new Date(a.booking_date + 'T' + (a.booking_time || '00:00:00'));
            const dateB = new Date(b.booking_date + 'T' + (b.booking_time || '00:00:00'));
            return dateA - dateB;
        });

        const upcomingBookings = sortedBookings.filter(b => {
            const bookingDate = new Date(b.booking_date + 'T' + (b.booking_time || '00:00:00'));
            const isUpcoming = bookingDate >= new Date() && b.status !== 'cancelled';
            return isUpcoming;
        });

        const pastBookings = sortedBookings.filter(b => {
            const bookingDate = new Date(b.booking_date + 'T' + (b.booking_time || '00:00:00'));
            return bookingDate < new Date() || b.status === 'cancelled';
        });

        let html = '';

        if (upcomingBookings.length > 0) {
            html += `
                <div style="margin-bottom: 2rem;">
                    <h3 style="margin-bottom: 1rem; color: white; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-calendar-check" style="color: var(--success-color);"></i>
                        Предстоящие записи (${upcomingBookings.length})
                    </h3>
                    <div style="display: grid; gap: 1rem;">
                        ${upcomingBookings.map(booking => this.renderBookingCard(booking, false)).join('')}
                    </div>
                </div>
            `;
        }

        if (pastBookings.length > 0) {
            html += `
                <div>
                    <h3 style="margin-bottom: 1rem; color: white; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-history" style="color: #94a3b8;"></i>
                        Прошедшие записи (${pastBookings.length})
                    </h3>
                    <div style="display: grid; gap: 1rem;">
                        ${pastBookings.slice(0, 10).map(booking => this.renderBookingCard(booking, true)).join('')}
                        ${pastBookings.length > 10 ? `<p style="color: #94a3b8; font-size: 0.9rem; margin-top: 0.5rem; text-align: center;">... и еще ${pastBookings.length - 10} записей</p>` : ''}
                    </div>
                </div>
            `;
        }

        if (upcomingBookings.length === 0 && pastBookings.length === 0) {
            html = `
                <div style="margin-bottom: 2rem;">
                    <h3 style="margin-bottom: 1rem; color: white; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-calendar-check" style="color: var(--success-color);"></i>
                        Все записи (${sortedBookings.length})
                    </h3>
                    <div style="display: grid; gap: 1rem;">
                        ${sortedBookings.map(booking => this.renderBookingCard(booking, false)).join('')}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    renderBookingCard(booking, isPast = false) {
        const bookingDate = new Date(booking.booking_date);
        const bookingTime = booking.booking_time ? booking.booking_time.substring(0, 5) : '';
        const statusClass = booking.status === 'cancelled' ? 'cancelled' : booking.status === 'confirmed' ? 'confirmed' : 'pending';
        const statusText = booking.status === 'cancelled' ? 'Отменена' : booking.status === 'confirmed' ? 'Подтверждена' : 'Ожидает';
        const clientName = booking.client_name || 'Клиент';
        const clientEmail = booking.client_email || '';
        const clientPhone = booking.client_phone || '';
        
        const trainingType = booking.trainer_id ? 'Индивидуальная тренировка' : 'Тренировка';
        const paymentMethod = booking.payment_method === 'subscription' ? 'Абонемент' : 
                             booking.payment_method === 'qr_code' ? 'QR-код' : 
                             booking.payment_method || 'Не указан';
        
        return `
            <div class="card booking-card client-booking-card ${isPast ? 'past' : ''}" style="padding: 1.5rem;">
                <div class="client-header" style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--graphite-light);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                        <h3 style="color: white; margin: 0; font-size: 1.2rem;">${clientName}</h3>
                        <span class="status-badge ${statusClass}" style="font-size: 0.85rem;">${statusText}</span>
                    </div>
                    <div style="display: inline-block; background: rgba(37, 99, 235, 0.2); color: var(--primary-blue); padding: 4px 8px; border-radius: 12px; font-size: 0.85rem; margin-bottom: 0.5rem;">
                        <i class="fas fa-dumbbell"></i> ${trainingType}
                    </div>
                    ${clientEmail ? `
                        <div class="detail-item" style="margin: 0.25rem 0;">
                            <i class="fas fa-envelope" style="color: var(--primary-blue);"></i>
                            <span style="color: #cbd5e1;">${clientEmail}</span>
                        </div>
                    ` : ''}
                    ${clientPhone ? `
                        <div class="detail-item" style="margin: 0.25rem 0;">
                            <i class="fas fa-phone" style="color: var(--primary-blue);"></i>
                            <span style="color: #cbd5e1;">${clientPhone}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div class="detail-item">
                        <i class="fas fa-calendar" style="color: var(--primary-blue);"></i>
                        <span style="color: white; font-weight: 600;">
                            ${bookingDate.toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                    ${bookingTime ? `
                        <div class="detail-item">
                            <i class="fas fa-clock" style="color: var(--primary-blue);"></i>
                            <span class="client-booking-time" style="color: var(--primary-blue); font-weight: 600; font-size: 1.1rem;">
                                Время: ${bookingTime}
                            </span>
                        </div>
                    ` : ''}
                    <div class="detail-item">
                        <i class="fas fa-credit-card" style="color: var(--primary-blue);"></i>
                        <span style="color: #cbd5e1;">Способ оплаты: ${paymentMethod}</span>
                    </div>
                </div>
            </div>
        `;
    }
}

window.trainerManager = new TrainerManager();