class AdminSubscriptionsManager {
    constructor() {
        this.token = Auth.getToken();
        this.API_BASE_URL = 'http://localhost:3000/api';
    }

    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    init() {
        this.bindEvents();
        this.loadSubscriptions();
    }

    bindEvents() {
        const subscriptionForm = document.getElementById('subscription-form');
        if (subscriptionForm) {
            subscriptionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSubscription(subscriptionForm);
            });
        }
    }

    async loadSubscriptions() {
        try {
            const response = await fetch(this.API_BASE_URL + '/admin/subscriptions', {
                headers: this.getAuthHeaders()
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.renderSubscriptions(data.subscriptions);
            }
        } catch (error) {
        }
    }

    renderSubscriptions(subscriptions) {
        const container = document.getElementById('admin-subscriptions-list');
        if (!container) return;

        if (!subscriptions || subscriptions.length === 0) {
            container.innerHTML = '<div class="empty-state">Абонементы не найдены</div>';
            return;
        }

        container.innerHTML = subscriptions.map(subscription => {
            return `
                <div class="card subscription-card">
                    <div class="card-content">
                        <div class="subscription-header">
                            <h3>${subscription.name}</h3>
                            <span class="subscription-type ${subscription.type}">
                                ${this.getTypeText(subscription.type)}
                            </span>
                        </div>
                        
                        <p class="subscription-description">${subscription.description}</p>
                        
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
                            <button class="btn btn-outline" onclick="adminSubscriptionsManager.editSubscription(${subscription.id})">
                                <i class="fas fa-edit"></i> Редактировать
                            </button>
                            <button class="btn btn-danger" onclick="adminSubscriptionsManager.deleteSubscription(${subscription.id})">
                                <i class="fas fa-trash"></i> Удалить
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getTypeText(type) {
        const types = {
            'group': 'Групповые',
            'gym': 'Зал', 
            'combo': 'Все включено'
        };
        return types[type] || type;
    }


    openCreateSubscriptionModal() {
        const modal = document.getElementById('create-subscription-modal');
        if (modal) {
            modal.style.display = 'block';
            const form = document.getElementById('subscription-form');
            form.reset();
            form.dataset.mode = 'create';
            document.getElementById('subscription-modal-title').textContent = 'Добавить абонемент';
        }
    }

    async editSubscription(subscriptionId) {
        try {
            const response = await fetch(this.API_BASE_URL + '/admin/subscriptions', {
                headers: this.getAuthHeaders()
            });
            
            const data = await response.json();
            
            if (data.success) {
                const subscription = data.subscriptions.find(s => s.id == subscriptionId);
                if (subscription) {
                    this.openEditSubscriptionModal(subscription);
                }
            }
        } catch (error) {
            this.showNotification('Ошибка загрузки данных', 'error');
        }
    }

    openEditSubscriptionModal(subscription) {
        const modal = document.getElementById('create-subscription-modal');
        if (modal) {
            modal.style.display = 'block';
            const form = document.getElementById('subscription-form');
            form.dataset.mode = 'edit';
            form.dataset.subscriptionId = subscription.id;
            document.getElementById('subscription-modal-title').textContent = 'Редактировать абонемент';
            
            form.name.value = subscription.name || '';
            form.type.value = subscription.type || '';
            form.description.value = subscription.description || '';
            form.price.value = subscription.price || '';
            form.visits_count.value = subscription.visits_count || '';
            form.duration_days.value = subscription.duration_days || '';
        }
    }

    async saveSubscription(form) {
        const mode = form.dataset.mode;
        const subscriptionId = form.dataset.subscriptionId;
        
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            type: formData.get('type'),
            description: formData.get('description'),
            price: parseFloat(formData.get('price')),
            visits_count: parseInt(formData.get('visits_count')),
            duration_days: parseInt(formData.get('duration_days'))
        };

        try {
            const url = mode === 'create' 
                ? this.API_BASE_URL + '/admin/subscriptions' 
                : this.API_BASE_URL + '/admin/subscriptions/' + subscriptionId;
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
                this.loadSubscriptions();
            } else {
                this.showNotification(result.error || 'Ошибка сервера', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка сохранения: ' + error.message, 'error');
        }
    }

    async deleteSubscription(subscriptionId) {
        try {
            const response = await fetch(this.API_BASE_URL + '/admin/subscriptions', {
                headers: this.getAuthHeaders()
            });
            
            const data = await response.json();
            
            if (data.success) {
                const subscription = data.subscriptions.find(s => s.id == subscriptionId);
                if (subscription) {
                    this.openDeleteConfirmModal(subscription);
                }
            }
        } catch (error) {
            this.showNotification('Ошибка загрузки данных', 'error');
        }
    }

    openDeleteConfirmModal(subscription) {
        const modal = document.getElementById('delete-subscription-confirm-modal');
        if (modal) {
            modal.style.display = 'block';
            
            document.getElementById('delete-subscription-name').textContent = subscription.name || 'Без названия';
            
            const confirmBtn = document.getElementById('confirm-subscription-delete-btn');
            confirmBtn.onclick = null;
            confirmBtn.onclick = () => this.confirmDeleteSubscription(subscription.id);
        }
    }

    async confirmDeleteSubscription(subscriptionId) {
        try {
            const response = await fetch(this.API_BASE_URL + '/admin/subscriptions/' + subscriptionId, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(data.message, 'success');
                this.closeModals();
                this.loadSubscriptions();
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

window.adminSubscriptionsManager = new AdminSubscriptionsManager();