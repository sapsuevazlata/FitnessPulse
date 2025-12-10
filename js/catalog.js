class CatalogManager {
    constructor() {
        this.API_BASE_URL = 'http://localhost:3000/api';
        this.token = Auth.getToken();
        this.groupSessionsCache = [];
        this.subscriptionsCache = [];
        this.initFilters();
    }

    getCurrentUserRole() {
        const user = Auth.getCurrentUser();
        return user && user.role ? user.role : 'guest';
    }

    isAdminUser() {
        return this.getCurrentUserRole() === 'admin';
    }

    getAuthHeaders() {
        const token = Auth.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    init() {
        const role = this.getCurrentUserRole();
        this.loadTrainers();
        if (!role || role === 'guest' || role === 'client') {
            this.loadGroupSessions();
            this.loadSubscriptions();
        }
    }

    async loadTrainers() {
        try {
            const response = await fetch(this.API_BASE_URL + '/public/trainers');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                await this.renderTrainers(data.trainers);
            } else {
                this.showError('Ошибка загрузки тренеров');
            }
        } catch (error) {
            this.showError('Не удалось загрузить список тренеров');
        }
    }

    async renderTrainers(trainers) {
        const container = document.getElementById('trainers-list');
        if (!container) {
            return;
        }

        if (!trainers || trainers.length === 0) {
            container.innerHTML = '<div class="loading">Тренеры не найдены</div>';
            return;
        }

        const cards = await Promise.all(trainers.map(trainer => this.renderTrainerCard(trainer)));
        container.innerHTML = cards.join('');
    }

    async renderTrainerCard(trainer) {
        const firstLetter = trainer.name ? trainer.name.charAt(0).toUpperCase() : 'T';
        const rating = trainer.rating || 0;
        const ratingStars = this.renderRatingStars(rating);
        
        const photoUrl = trainer.id ? `assets/images/trainers/trainer-${trainer.id}.jpg` : null;
        
        let canReviewButton = '';
        const user = Auth.getCurrentUser();
        if (user && user.role === 'client') {
            const safeName = (trainer.name || 'Тренер').replace(/'/g, "\\'");
            canReviewButton = `
                <button class="btn btn-primary btn-sm" 
                        onclick="catalogManager.openReviewModal(${trainer.id}, '${safeName}')"
                        style="margin-top: 0.5rem; width: 100%;">
                    <i class="fas fa-star"></i> Оставить отзыв
                </button>
            `;
        }
        
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
                    <i class="fas fa-award"></i> Опыт: ${trainer.experience || 'Не указан'}
                </div>
                
                <div class="trainer-bio">
                    ${trainer.bio || 'Профессиональный тренер с индивидуальным подходом к каждому клиенту.'}
                </div>
                
                    <div class="trainer-footer">
                        ${canReviewButton}
                    </div>
            </div>
        `;
    }

    renderRatingStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
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
        
        return stars + ` <span style="color: #666; font-size: 12px;">(${rating})</span>`;
    }

    showError(message) {
        const container = document.getElementById('trainers-list');
        if (container) {
            container.innerHTML = `<div class="loading error">${message}</div>`;
        }
    }

    async loadSubscriptions() {
        try {
            const response = await fetch(this.API_BASE_URL + '/public/subscriptions');
            const data = await response.json();
            
            if (data.success) {
                this.subscriptionsCache = data.subscriptions || [];
                this.renderSubscriptions(this.subscriptionsCache);
            } else {
                this.showSubscriptionsError('Ошибка загрузки абонементов');
            }
        } catch (error) {
            this.showSubscriptionsError('Не удалось загрузить список абонементов');
        }
    }

    renderSubscriptions(subscriptions) {
        const container = document.getElementById('subscriptions-list');
        if (!container) return;

        const role = this.getCurrentUserRole();
        if (role !== 'guest') {
            container.innerHTML = '';
            return;
        }

        if (!subscriptions || subscriptions.length === 0) {
            container.innerHTML = '<div class="loading">Абонементы не найдены</div>';
            return;
        }

        container.innerHTML = subscriptions.map(subscription => {
            return `
                <div class="card subscription-card" data-subscription-type="${subscription.type}" data-subscription-price="${subscription.price || 0}">
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
                            <button class="btn btn-primary" onclick="catalogManager.handleSubscriptionAction(${subscription.id})">
                                <i class="fas fa-shopping-cart"></i> Приобрести
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
            'combo': 'Все включено',
            'standard': 'Стандарт',
            'premium': 'Премиум',
            'unlimited': 'Безлимитный'
        };
        return types[type] || type;
    }

    handleSubscriptionAction(subscriptionId) {
        if (this.isAdminUser()) {
            showNotification('Администратор управляет абонементами через панель', 'info');
            return;
        }

        if (!Auth.getToken()) {
            showNotification('Пожалуйста, войдите в систему для приобретения абонемента', 'warning');
            const loginBtn = document.getElementById('login-btn');
            if (loginBtn) loginBtn.click();
            return;
        }
        
        showNotification('Функция покупки абонемента будет реализована позже', 'info');
    }

    showSubscriptionsError(message) {
        const container = document.getElementById('subscriptions-list');
        if (container) {
            container.innerHTML = `<div class="loading error">${message}</div>`;
        }
    }

    async loadGroupSessions() {
        try {
            const response = await fetch(this.API_BASE_URL + '/public/group-sessions');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.groupSessionsCache = data.sessions || [];
                this.renderGroupSessions(this.groupSessionsCache);
            } else {
                this.showGroupSessionsError('Ошибка загрузки занятий');
            }
        } catch (error) {
            this.showGroupSessionsError('Не удалось загрузить список занятий');
        }
    }

    renderGroupSessions(sessions) {
        const container = document.getElementById('group-classes-list');
        if (!container) {
            return;
        }

        const role = this.getCurrentUserRole();
        if (role === 'admin' || role === 'trainer') {
            container.innerHTML = '';
            return;
        }

        if (!sessions || sessions.length === 0) {
            container.innerHTML = '<div class="loading">Занятий не найдено</div>';
            return;
        }

        container.innerHTML = sessions.map(session => this.renderSessionCard(session)).join('');
    }

    renderSessionCard(session) {
        const days = session.days ? session.days.split(',') : [];
        const daysText = days.map(day => this.getDayText(day)).join(', ');
        const availableSpots = session.max_participants - (session.current_participants || 0);
        const isFull = availableSpots <= 0;
        const sessionName = session.name || 'Групповое занятие';
        
        return `
            <div class="session-card" data-session-id="${session.id}" data-session-name="${sessionName.toLowerCase()}">
                <div class="session-header">
                    <h3>${sessionName}</h3>
                    <span class="session-status ${isFull ? 'full' : 'available'}">
                        ${isFull ? 'Мест нет' : `${availableSpots} мест`}
                    </span>
                </div>
                
                <div class="session-description">
                    ${session.description || 'Интенсивное групповое занятие под руководством опытного тренера.'}
                </div>
                
                <div class="session-details">
                    <div class="detail-item">
                        <i class="fas fa-user-tie"></i>
                        <span>${session.trainer_name || 'Тренер'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-clock"></i>
                        <span>${session.time || '10:00'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-calendar"></i>
                        <span>${daysText || 'Пн, Ср, Пт'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-stopwatch"></i>
                        <span>${session.duration || 60} мин.</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-users"></i>
                        <span>${session.max_participants || 10} макс.</span>
                    </div>
                </div>

                <div class="session-actions">
                    <button class="btn btn-primary ${isFull ? 'disabled' : ''}" 
                            onclick="catalogManager.bookSession(${session.id})"
                            ${isFull ? 'disabled' : ''}>
                        <i class="fas fa-bookmark"></i> 
                        ${isFull ? 'Мест нет' : 'Записаться'}
                    </button>
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

    async bookSession(sessionId) {
        const token = Auth.getToken();
        if (!token) {
            showNotification('Пожалуйста, войдите в систему для записи на занятия', 'warning');
            const loginBtn = document.getElementById('login-btn');
            if (loginBtn) {
                loginBtn.click();
            }
            return;
        }
        
        const confirmed = await showConfirm('Вы уверены, что хотите записаться на это занятие? Будет использовано одно посещение из вашего абонемента.');
        if (!confirmed) {
            return;
        }
        
        try {
            const response = await fetch(this.API_BASE_URL + '/bookings/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    session_id: sessionId
                })
            });

            const data = await response.json();

            if (data.success) {
                showNotification(`Вы успешно записаны на занятие! Осталось посещений: ${data.remainingVisits}`, 'success');
                this.loadGroupSessions();
                if (typeof clientBookingsManager !== 'undefined') {
                    clientBookingsManager.loadBookings();
                    clientBookingsManager.loadSubscriptions();
                }
            } else {
                showNotification(data.error || 'Ошибка при записи на занятие', 'error');
            }
        } catch (error) {
            showNotification('Ошибка при записи на занятие: ' + error.message, 'error');
        }
    }

    showGroupSessionsError(message) {
        const container = document.getElementById('group-classes-list');
        if (container) {
            container.innerHTML = `<div class="loading error">${message}</div>`;
        }
    }
    
    initFilters() {
        const experienceFilter = document.getElementById('experience-filter');
        const subscriptionCategoryFilter = document.getElementById('subscription-category-filter');
        const subscriptionTypeFilter = document.getElementById('subscription-type-filter');
        const subscriptionSortFilter = document.getElementById('subscription-sort-filter');
        const groupClassesSearch = document.getElementById('group-classes-search');
        
        if (experienceFilter) {
            experienceFilter.addEventListener('change', () => this.filterTrainers());
        }
        
        if (subscriptionCategoryFilter) {
            subscriptionCategoryFilter.addEventListener('change', () => this.filterSubscriptions());
        }

        if (subscriptionTypeFilter) {
            subscriptionTypeFilter.addEventListener('change', () => this.filterSubscriptions());
        }

        if (subscriptionSortFilter) {
            subscriptionSortFilter.addEventListener('change', () => this.sortSubscriptions());
        }

        if (groupClassesSearch) {
            groupClassesSearch.addEventListener('input', () => this.filterGroupSessions());
        }
    }

    async openReviewModal(trainerId, trainerName) {
        const user = Auth.getCurrentUser();
        if (!user || user.role !== 'client') {
            showNotification('Для оставления отзыва необходимо войти как клиент', 'warning');
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/reviews/can-leave/${trainerId}`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Ошибка проверки возможности оставить отзыв');
            }

            const data = await response.json();

            if (!data.success || !data.canLeaveReview) {
                if (!data.hasBooking) {
                    showNotification('Вы можете оставить новый отзыв только тренеру, у которого была запись на персональную или групповую тренировку', 'warning');
                } else if (data.hasReview) {
                    showNotification('Вы уже оставили отзыв этому тренеру. Вы можете просмотреть свои и другие отзывы.', 'info');
                }
            }

            const reviewsResponse = await fetch(`${this.API_BASE_URL}/reviews/trainer/${trainerId}`);
            let reviewsData = { success: false, reviews: [], count: 0, avgRating: null };
            if (reviewsResponse.ok) {
                reviewsData = await reviewsResponse.json();
            }

            const modal = document.getElementById('review-modal');
            if (modal) {
                const trainerNameEl = document.getElementById('review-trainer-name');
                const summaryEl = document.getElementById('review-summary-text');
                const listEl = document.getElementById('review-list');

                if (trainerNameEl) {
                    trainerNameEl.textContent = trainerName;
                }

                if (summaryEl) {
                    if (reviewsData.success && reviewsData.count > 0) {
                        const count = reviewsData.count;
                        const avg = reviewsData.avgRating || '—';
                        summaryEl.textContent = `Средний рейтинг: ${avg} из 5 • Отзывов: ${count}`;
                    } else {
                        summaryEl.textContent = 'Отзывов пока нет — будьте первым!';
                    }
                }

                if (listEl) {
                    if (reviewsData.success && reviewsData.reviews && reviewsData.reviews.length > 0) {
                        listEl.innerHTML = reviewsData.reviews.map(r => {
                            const userName = r.user_name || 'Клиент';
                            const rating = r.rating || 0;
                            const comment = r.comment || '';
                            const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

                            return `
                                <div class="review-item" style="padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                                        <strong>${userName}</strong>
                                        <span style="font-size: 0.85rem; color: #f5c518;">${stars}</span>
                                    </div>
                                    ${comment ? `<div style="font-size: 0.9rem; color: var(--text-muted);">${comment}</div>` : ''}
                                </div>
                            `;
                        }).join('');
                    } else {
                        listEl.innerHTML = '<div style="font-size: 0.9rem; color: var(--text-muted);">Отзывов пока нет.</div>';
                    }
                }

                document.getElementById('review-trainer-id').value = trainerId;
                document.getElementById('review-rating').value = '5';
                document.getElementById('review-comment').value = '';
                modal.style.display = 'block';
            }
        } catch (error) {
            showNotification('Ошибка при открытии формы отзыва', 'error');
        }
    }

    closeReviewModal() {
        const modal = document.getElementById('review-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async submitReview(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        const trainerId = parseInt(formData.get('trainer_id'));
        const rating = parseInt(formData.get('rating'));
        const comment = formData.get('comment');

        if (!trainerId || !rating) {
            showNotification('Заполните все обязательные поля', 'warning');
            return;
        }

        if (rating < 1 || rating > 5) {
            showNotification('Оценка должна быть от 1 до 5', 'warning');
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/reviews/create`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    trainer_id: trainerId,
                    rating: rating,
                    comment: comment
                })
            });

            const data = await response.json();

            if (data.success) {
                showNotification('Отзыв успешно добавлен!', 'success');
                this.closeReviewModal();
                this.loadTrainers();
            } else {
                showNotification(data.error || 'Ошибка при добавлении отзыва', 'error');
            }
        } catch (error) {
            showNotification('Ошибка при отправке отзыва', 'error');
        }
    }

    filterTrainers() {
        const experienceFilter = document.getElementById('experience-filter');
        const experienceValue = experienceFilter ? experienceFilter.value : '';
        
        const trainers = Array.from(document.querySelectorAll('.trainer-card'));
        
        trainers.forEach(card => {
            const trainerExperience = card.dataset.experience || '';
            let show = true;
            
            if (experienceValue) {
                if (experienceValue === '1-3' && !trainerExperience.includes('1-3')) {
                    show = false;
                } else if (experienceValue === '3-5' && !trainerExperience.includes('3-5')) {
                    show = false;
                } else if (experienceValue === '5+' && !trainerExperience.includes('5+')) {
                    show = false;
                }
            }
            
            card.style.display = show ? 'block' : 'none';
        });
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
        
        this.sortSubscriptions();
    }

    sortSubscriptions() {
        const sortFilter = document.getElementById('subscription-sort-filter');
        const sortValue = sortFilter ? sortFilter.value : '';
        
        if (!sortValue) {
            return; 
        }
        
        const container = document.getElementById('subscriptions-list');
        if (!container) return;
        
        const subscriptions = Array.from(container.querySelectorAll('.subscription-card'));
        
        subscriptions.sort((a, b) => {
            const priceA = parseFloat(a.dataset.subscriptionPrice || 0);
            const priceB = parseFloat(b.dataset.subscriptionPrice || 0);
            
            if (sortValue === 'price-asc') {
                return priceA - priceB;
            } else if (sortValue === 'price-desc') {
                return priceB - priceA;
            }
            return 0;
        });
        
        subscriptions.forEach(card => {
            container.appendChild(card);
        });
    }

    filterGroupSessions() {
        const searchInput = document.getElementById('group-classes-search');
        const searchValue = searchInput ? searchInput.value.toLowerCase().trim() : '';
        
        const sessions = Array.from(document.querySelectorAll('.session-card'));
        
        sessions.forEach(card => {
            const sessionName = card.dataset.sessionName || (card.querySelector('h3')?.textContent || '').toLowerCase();
            let show = true;
            
            if (searchValue) {
                if (!sessionName.includes(searchValue)) {
                    show = false;
                }
            }
            
            card.style.display = show ? 'block' : 'none';
        });
    }
}

window.catalogManager = new CatalogManager();

document.addEventListener('DOMContentLoaded', function() {
    window.catalogManager.init();
});