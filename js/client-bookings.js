class ClientBookingsManager {
    constructor() {
        this.API_BASE_URL = 'http://localhost:3000/api';
    }

    getAuthHeaders() {
        const token = Auth.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    async init() {
        await this.loadSubscriptions();
        await this.loadBookings();
        await this.loadPersonalTrainings();
    }

    async loadSubscriptions() {
        try {
            const response = await fetch(this.API_BASE_URL + '/client/subscriptions/my', {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const container = document.getElementById('my-bookings-subscriptions');
            if (!container) return;

            if (data.success && data.subscriptions && data.subscriptions.length > 0) {
                this.renderSubscriptions(data.subscriptions, container);
            } else {
                container.innerHTML = `
                    <p class="no-subscription-message">
                        <i class="fas fa-info-circle"></i> 
                        У вас нет активных абонементов. Приобретите абонемент в разделе "Абонементы".
                    </p>
                `;
            }
        } catch (error) {
            const container = document.getElementById('my-bookings-subscriptions');
            if (container) {
                container.innerHTML = '<p>Ошибка загрузки абонементов</p>';
            }
        }
    }

    renderSubscriptions(subscriptions, container) {
        container.innerHTML = subscriptions.map(subscription => {
            const purchaseDate = new Date(subscription.purchase_date);
            const expiresAt = subscription.expires_at ? new Date(subscription.expires_at) : null;
            const daysLeft = expiresAt ? Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24)) : null;
            const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;

            return `
                <div class="card subscription-card active-subscription" style="margin-bottom: 1rem;">
                    <div class="card-content">
                        <div class="subscription-header">
                            <h4>${subscription.subscription_name}</h4>
                            <span class="subscription-type ${subscription.subscription_type}">
                                ${this.getTypeText(subscription.subscription_type)}
                            </span>
                        </div>
                        
                        <div class="subscription-details">
                            <div class="detail-item">
                                <i class="fas fa-ticket-alt"></i>
                                <span>Осталось посещений: <strong>${subscription.remaining_visits || 0}</strong></span>
                            </div>
                            ${expiresAt ? `
                                <div class="detail-item ${isExpiringSoon ? 'warning' : ''}">
                                    <i class="fas fa-calendar-times"></i>
                                    <span>Действует до: ${expiresAt.toLocaleDateString('ru-RU')}</span>
                                    ${isExpiringSoon ? `<span class="days-left"> (осталось ${daysLeft} ${this.getDaysWord(daysLeft)})</span>` : ''}
                                </div>
                            ` : ''}
                        </div>

                        <div class="subscription-status active">
                            <i class="fas fa-check-circle"></i> Активен
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadBookings() {
        try {
            const response = await fetch(this.API_BASE_URL + '/bookings/my', {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const container = document.getElementById('bookings-list');
            if (!container) return;

            if (data.success && data.bookings && data.bookings.length > 0) {
                this.renderBookings(data.bookings, container);
            } else {
                container.innerHTML = `
                    <p class="no-subscription-message">
                        <i class="fas fa-info-circle"></i> 
                        У вас пока нет записей на групповые занятия.
                    </p>
                `;
            }
        } catch (error) {
            const container = document.getElementById('bookings-list');
            if (container) {
                container.innerHTML = '<p>Ошибка загрузки записей</p>';
            }
        }
    }

    async loadPersonalTrainings() {
        try {
            const response = await fetch(this.API_BASE_URL + '/trainings/my', {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const container = document.getElementById('personal-trainings-list');
            if (!container) return;

            if (data.success && data.bookings && data.bookings.length > 0) {
                this.renderPersonalTrainings(data.bookings, container);
            } else {
                container.innerHTML = `
                    <p class="no-subscription-message">
                        <i class="fas fa-info-circle"></i> 
                        У вас пока нет записей на персональные тренировки.
                    </p>
                `;
            }
        } catch (error) {
            const container = document.getElementById('personal-trainings-list');
            if (container) {
                container.innerHTML = '<p>Ошибка загрузки персональных тренировок</p>';
            }
        }
    }

    renderPersonalTrainings(trainings, container) {
        container.innerHTML = trainings.map(training => {
            const bookingDate = new Date(training.booking_date);
            const time = training.booking_time ? training.booking_time.substring(0, 5) : '';
            const paymentMethodText = {
                'qr_code': 'QR-код',
                'cash': 'На месте в зале',
                'subscription': 'Абонемент'
            }[training.payment_method] || training.payment_method;
            
            const statusText = {
                'pending': 'Ожидает подтверждения',
                'confirmed': 'Подтверждено',
                'completed': 'Завершено',
                'cancelled': 'Отменено'
            }[training.status] || training.status;

            return `
                <div class="card booking-card" style="margin-bottom: 1rem;">
                    <div class="card-content">
                        <div class="booking-header">
                            <h4>${training.trainer_name ? `Тренировка с ${training.trainer_name}` : 'Тренировка без тренера'}</h4>
                            ${training.status === 'pending' || training.status === 'confirmed' ? `
                                <button class="btn btn-outline btn-sm" onclick="clientBookingsManager.cancelPersonalTraining(${training.id})">
                                    <i class="fas fa-times"></i> Отменить
                                </button>
                            ` : ''}
                        </div>
                        
                        <div class="booking-details">
                            ${training.trainer_name ? `
                                <div class="detail-item">
                                    <i class="fas fa-user-tie"></i>
                                    <span>Тренер: ${training.trainer_name}</span>
                                </div>
                            ` : ''}
                            <div class="detail-item">
                                <i class="fas fa-calendar"></i>
                                <span>Дата: ${bookingDate.toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-clock"></i>
                                <span>Время: ${time}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-credit-card"></i>
                                <span>Способ оплаты: ${paymentMethodText}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-info-circle"></i>
                                <span>Статус: ${statusText}</span>
                            </div>
                            ${training.inventory_name ? `
                                <div class="detail-item">
                                    <i class="fas fa-dumbbell"></i>
                                    <span>Инвентарь: ${training.inventory_name}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async cancelPersonalTraining(bookingId) {
        const confirmed = await showConfirm('Вы уверены, что хотите отменить эту тренировку?');
        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(this.API_BASE_URL + '/trainings/cancel', {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ booking_id: bookingId })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Тренировка успешно отменена', 'success');
                await this.loadPersonalTrainings();
            } else {
                this.showNotification(data.error || 'Ошибка отмены тренировки', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка отмены тренировки', 'error');
        }
    }

    showNotification(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
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

    renderBookings(bookings, container) {
        container.innerHTML = bookings.map(booking => {
            const bookingDate = new Date(booking.booking_date);
            const days = booking.session_days ? booking.session_days.split(',') : [];
            const daysText = days.map(day => this.getDayText(day)).join(', ') || 'Не указано';
            const time = booking.session_time ? booking.session_time.substring(0, 5) : '';

            return `
                <div class="card booking-card" style="margin-bottom: 1rem;">
                    <div class="card-content">
                        <div class="booking-header">
                            <h4>${booking.session_name || 'Групповое занятие'}</h4>
                            <button class="btn btn-outline btn-sm" onclick="clientBookingsManager.cancelBooking(${booking.id})">
                                <i class="fas fa-times"></i> Отменить
                            </button>
                        </div>
                        
                        ${booking.session_description ? `<p class="booking-description">${booking.session_description}</p>` : ''}
                        
                        <div class="booking-details">
                            <div class="detail-item">
                                <i class="fas fa-calendar"></i>
                                <span>Дни: ${daysText}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-clock"></i>
                                <span>Время: ${time}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-stopwatch"></i>
                                <span>Длительность: ${booking.session_duration || 60} мин.</span>
                            </div>
                            ${booking.trainer_name ? `
                                <div class="detail-item">
                                    <i class="fas fa-user-tie"></i>
                                    <span>Тренер: ${booking.trainer_name}</span>
                                </div>
                            ` : ''}
                            <div class="detail-item">
                                <i class="fas fa-calendar-check"></i>
                                <span>Запись создана: ${bookingDate.toLocaleDateString('ru-RU')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async cancelBooking(bookingId) {
        const confirmed = await showConfirm('Вы уверены, что хотите отменить запись? Посещение будет возвращено в ваш абонемент.');
        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(this.API_BASE_URL + '/bookings/cancel', {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    booking_id: bookingId
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('Запись отменена. Посещение возвращено в абонемент.', 'success');
                await this.loadBookings();
                await this.loadSubscriptions();
            } else {
                this.showNotification(data.error || 'Ошибка при отмене записи', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка при отмене записи', 'error');
        }
    }

    getTypeText(type) {
        const types = {
            'group': 'Групповые',
            'gym': 'Зал', 
            'combo': 'Все включено',
            'standard': 'Стандарт',
            'premium': 'Премиум',
            'unlimited': 'Безлимитный'
        };
        return types[type] || type;
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

    getDaysWord(days) {
        if (days === 1) return 'день';
        if (days >= 2 && days <= 4) return 'дня';
        return 'дней';
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
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

window.clientBookingsManager = new ClientBookingsManager();

