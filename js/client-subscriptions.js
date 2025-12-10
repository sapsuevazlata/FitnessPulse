class ClientSubscriptionsManager {
    constructor() {
        this.API_BASE_URL = 'http://localhost:3000/api';
        this.mySubscription = null;
        this.mySubscriptions = []; 
    }

    getAuthHeaders() {
        const token = Auth.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    async init() {
        await this.loadMySubscription();
        await this.loadAvailableSubscriptions();
        this.loadClientProfile();
        this.initFilters();
    }

    initFilters() {
        const categoryFilter = document.getElementById('subscription-category-filter');
        const typeFilter = document.getElementById('subscription-type-filter');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.filterSubscriptions());
        }

        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.filterSubscriptions());
        }
    }

    filterSubscriptions() {
        const categoryFilter = document.getElementById('subscription-category-filter');
        const typeFilter = document.getElementById('subscription-type-filter');
        const categoryValue = categoryFilter ? categoryFilter.value.toLowerCase() : '';
        const typeValue = typeFilter ? typeFilter.value : '';
        
        const subscriptions = Array.from(document.querySelectorAll('.subscription-card'));
        
        subscriptions.forEach(card => {
            const subscriptionName = (card.querySelector('h3')?.textContent || '').toLowerCase();
            const subscriptionType = card.dataset.subscriptionType || '';
            let show = true;
            
            if (categoryValue) {
                if (!subscriptionName.includes(categoryValue)) {
                    show = false;
                }
            }
            
            if (typeValue && subscriptionType !== typeValue) {
                show = false;
            }
            
            card.style.display = show ? 'block' : 'none';
        });
    }

    loadClientProfile() {
        const user = Auth.getCurrentUser();
        const container = document.getElementById('client-profile-info');
        if (!container || !user) return;

        container.innerHTML = `
            <div class="profile-info">
                <div class="detail-item">
                    <i class="fas fa-user"></i>
                    <span><strong>Имя:</strong> ${user.name || 'Не указано'}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-envelope"></i>
                    <span><strong>Email:</strong> ${user.email || 'Не указано'}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-user-tag"></i>
                    <span><strong>Роль:</strong> Клиент</span>
                </div>
            </div>
        `;
    }

    async loadAvailableSubscriptions() {
        try {
            const response = await fetch(this.API_BASE_URL + '/public/subscriptions');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.renderAvailableSubscriptions(data.subscriptions);
            } else {
                this.showError('Ошибка загрузки абонементов');
            }
        } catch (error) {
            this.showError('Не удалось загрузить список абонементов');
        }
    }

    async loadMySubscription() {
        const container = document.getElementById('client-subscription-display');
        if (!container) return;

        try {
            const token = Auth.getToken();
            if (!token) {
                container.innerHTML = `
                    <div class="card">
                        <div class="card-content">
                            <p class="no-subscription-message">
                                <i class="fas fa-info-circle"></i> 
                                Войдите в систему, чтобы увидеть ваши абонементы.
                            </p>
                        </div>
                    </div>
                `;
                return;
            }

            const response = await fetch(this.API_BASE_URL + '/client/subscriptions/my', {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                if (response.status === 404) {
                    this.mySubscriptions = [];
                    this.mySubscription = null;
                    this.renderMySubscription([]);
                    return;
                } else if (response.status === 401 || response.status === 403) {
                    container.innerHTML = `
                        <div class="card">
                            <div class="card-content">
                                <p class="no-subscription-message">
                                    <i class="fas fa-info-circle"></i> 
                                    У вас нет активных абонементов.
                                </p>
                            </div>
                        </div>
                    `;
                    return;
                }
                const errorText = await response.text();
                this.mySubscriptions = [];
                this.mySubscription = null;
                this.renderMySubscription([]);
                return;
            }

            const data = await response.json();
            
            if (data.success) {
                this.mySubscriptions = data.subscriptions || [];
                this.mySubscription = data.subscription; 
                this.renderMySubscription(data.subscriptions || []);
            } else {
                this.mySubscriptions = [];
                this.mySubscription = null;
                this.renderMySubscription([]);
            }
        } catch (error) {
            this.mySubscriptions = [];
            this.mySubscription = null;
            this.renderMySubscription([]);
        }
    }

    renderAvailableSubscriptions(subscriptions) {
        const container = document.getElementById('client-subscriptions-list');
        if (!container) return;

        if (!subscriptions || subscriptions.length === 0) {
            container.innerHTML = '<div class="loading">Абонементы не найдены</div>';
            return;
        }

        container.innerHTML = subscriptions.map(subscription => {
            const subscriptionType = subscription.type;
            
            const hasSameType = this.mySubscriptions.some(sub => sub.subscription_type === subscriptionType);
            const hasCombo = this.mySubscriptions.some(sub => sub.subscription_type === 'combo');
            
            let canPurchase = true;
            let disabledReason = '';
            
            if (subscriptionType === 'combo') {
                canPurchase = true;
            } else if (hasSameType) {
                canPurchase = false;
                disabledReason = 'У вас уже есть абонемент этого типа';
            } else if (hasCombo) {
                canPurchase = true;
            }
            
            return `
                <div class="card subscription-card" data-subscription-type="${subscription.type}">
                    <div class="card-content">
                        <div class="subscription-header">
                            <h3>${subscription.name}</h3>
                            <span class="subscription-type ${subscription.type}">
                                ${this.getTypeText(subscription.type)}
                            </span>
                        </div>
                        
                        <p class="subscription-description">${subscription.description || ''}</p>
                        
                        <div class="subscription-details">
                            <div class="detail-item">
                                <i class="fas fa-coins"></i>
                                <span>${subscription.price} Br</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-ticket-alt"></i>
                                <span>${subscription.visits_count} посещений</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-calendar"></i>
                                <span>${subscription.duration_days} дней</span>
                            </div>
                        </div>

                        <div class="card-actions">
                            <button class="btn btn-primary" 
                                    onclick="clientSubscriptionsManager.purchaseSubscription(${subscription.id})"
                                    ${!canPurchase ? 'disabled' : ''}>
                                <i class="fas fa-shopping-cart"></i> 
                                ${!canPurchase ? disabledReason : 'Приобрести'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderMySubscription(subscriptions) {
        const container = document.getElementById('client-subscription-display');
        if (!container) return;

        if (!subscriptions || subscriptions.length === 0) {
            container.innerHTML = `
                <div class="card">
                    <div class="card-content">
                        <p class="no-subscription-message">
                            <i class="fas fa-info-circle"></i> 
                            У вас нет активных абонементов. Приобретите абонемент в разделе "Абонементы".
                        </p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = subscriptions.map(subscription => {
            const purchaseDate = new Date(subscription.purchase_date);
            const expiresAt = subscription.expires_at ? new Date(subscription.expires_at) : null;
            const daysLeft = expiresAt ? Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24)) : null;
            const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;

            return `
                <div class="card subscription-card active-subscription" style="margin-bottom: 1rem;">
                    <div class="card-content">
                        <div class="subscription-header">
                            <h3>${subscription.subscription_name}</h3>
                            <span class="subscription-type ${subscription.subscription_type}">
                                ${this.getTypeText(subscription.subscription_type)}
                            </span>
                        </div>
                        
                        <p class="subscription-description">${subscription.description || ''}</p>
                        
                        <div class="subscription-details">
                            <div class="detail-item">
                                <i class="fas fa-calendar-check"></i>
                                <span>Куплен: ${purchaseDate.toLocaleDateString('ru-RU')}</span>
                            </div>
                            ${expiresAt ? `
                                <div class="detail-item ${isExpiringSoon ? 'warning' : ''}">
                                    <i class="fas fa-calendar-times"></i>
                                    <span>Действует до: ${expiresAt.toLocaleDateString('ru-RU')}</span>
                                    ${isExpiringSoon ? `<span class="days-left"> (осталось ${daysLeft} ${this.getDaysWord(daysLeft)})</span>` : ''}
                                </div>
                            ` : ''}
                            <div class="detail-item">
                                <i class="fas fa-ticket-alt"></i>
                                <span>Осталось посещений: <strong>${subscription.remaining_visits || 0}</strong></span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-coins"></i>
                                <span>Стоимость: ${subscription.price} Br</span>
                            </div>
                        </div>

                        <div class="subscription-status active">
                            <i class="fas fa-check-circle"></i> Активен
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async purchaseSubscription(subscriptionTypeId) {
        const token = Auth.getToken();
        if (!token) {
            this.showNotification('Пожалуйста, войдите в систему для покупки абонемента', 'error');
            return;
        }

        const confirmed = await showConfirm('Вы уверены, что хотите приобрести этот абонемент?');
        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(this.API_BASE_URL + '/client/subscriptions/purchase', {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    subscription_type_id: subscriptionTypeId
                })
            });

            if (!response.ok) {
                if (response.status === 404) {
                    const errorMsg = 'Функция покупки временно недоступна. Убедитесь, что сервер перезапущен.';
                    this.showNotification(errorMsg, 'error');
                    return;
                }
                let errorData;
                try {
                    const responseText = await response.text();
                    try {
                        errorData = JSON.parse(responseText);
                    } catch (e) {
                        this.showNotification(`Ошибка сервера: ${response.status}. Убедитесь, что сервер перезапущен.`, 'error');
                        return;
                    }
                } catch (e) {
                    this.showNotification(`Ошибка сервера: ${response.status}`, 'error');
                    return;
                }
                this.showNotification(errorData.error || 'Ошибка при покупке абонемента', 'error');
                return;
            }

            const data = await response.json();

            if (data.success) {
                this.showNotification('Абонемент успешно приобретен!', 'success');
                await this.loadMySubscription();
                await this.loadAvailableSubscriptions();
            } else {
                this.showNotification(data.error || 'Ошибка при покупке абонемента', 'error');
            }
        } catch (error) {
            if (error.message && error.message.includes('JSON')) {
                this.showNotification('Ошибка: сервер вернул неверный ответ. Убедитесь, что сервер запущен и перезапущен.', 'error');
            } else {
                this.showNotification('Ошибка при покупке абонемента: ' + (error.message || 'Неизвестная ошибка'), 'error');
            }
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

    getDaysWord(days) {
        if (days === 1) return 'день';
        if (days >= 2 && days <= 4) return 'дня';
        return 'дней';
    }

    showError(message) {
        const container = document.getElementById('client-subscriptions-list');
        if (container) {
            container.innerHTML = `<div class="loading error">${message}</div>`;
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
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

window.clientSubscriptionsManager = new ClientSubscriptionsManager();

