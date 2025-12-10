class ClientTrainingsManager {
    constructor() {
        this.API_BASE_URL = 'http://localhost:3000/api';
        this.selectedTrainer = null;
        this.currentTrainingType = null;
        this.selectedInventory = null; // Теперь одно значение, а не массив
        this.inventoryList = []; 
        this.init();
    }

    init() {
        const today = new Date().toISOString().split('T')[0];
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (input.id.includes('training-date')) {
                input.min = today;
            }
        });
        
        const timeInputNoTrainer = document.getElementById('training-time-no-trainer');
        if (timeInputNoTrainer) {
            timeInputNoTrainer.min = '09:00';
            timeInputNoTrainer.max = '21:00';
        }
    }

    getAuthHeaders() {
        const token = localStorage.getItem('fitnessToken');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    openBookingModal() {
        const userData = localStorage.getItem('fitnessUser');
        if (!userData) {
            this.showNotification('Для записи необходимо войти в систему', 'error');
            return;
        }
        
        const user = JSON.parse(userData);
        if (!user || user.role !== 'client') {
            this.showNotification('Для записи необходимо войти в систему как клиент', 'error');
            return;
        }
        
        this.currentTrainingType = null;
        this.selectedTrainer = null;
        document.getElementById('training-type-modal').style.display = 'block';
    }

    selectTrainingType(type) {
        this.currentTrainingType = type;
        this.closeModals();
        
        if (type === 'without_trainer') {
            this.openWithoutTrainerModal();
        } else if (type === 'with_trainer') {
            this.openTrainerSelectionMethodModal();
        }
    }

    openWithoutTrainerModal() {
        this.loadPaymentMethods('no-trainer');
        const modal = document.getElementById('training-without-trainer-modal');
        if (modal) {
            const today = new Date().toISOString().split('T')[0];
            const dateInput = document.getElementById('training-date-no-trainer');
            const timeInput = document.getElementById('training-time-no-trainer');
            if (dateInput) {
                dateInput.min = today;
                dateInput.value = today; 
            }
            if (timeInput) {
                timeInput.min = '09:00';
                timeInput.max = '21:00';
            }
            modal.style.display = 'block';
        }
    }

    openTrainerSelectionMethodModal() {
        document.getElementById('trainer-selection-method-modal').style.display = 'block';
    }

    selectTrainerMethod(method) {
        this.closeModals();
        
        if (method === 'manual') {
            this.loadTrainers();
        } else if (method === 'smart') {
            document.getElementById('smart-trainer-search-modal').style.display = 'block';
        }
    }

    async loadTrainers() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/public/trainers`);
            const data = await response.json();
            
            if (data.success && data.trainers) {
                this.renderTrainersList(data.trainers);
                document.getElementById('trainer-selection-modal').style.display = 'block';
            } else {
                this.showNotification('Ошибка загрузки тренеров', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка загрузки тренеров', 'error');
        }
    }

    renderTrainersList(trainers) {
        const container = document.getElementById('trainers-list-container');
        if (!container) return;

        if (trainers.length === 0) {
            container.innerHTML = '<p>Тренеры не найдены</p>';
            return;
        }

        container.innerHTML = trainers
            .map(trainer => {
                let ratingText = 'Нет оценок';
                if (trainer.rating !== null && trainer.rating !== undefined) {
                    const ratingNum = typeof trainer.rating === 'number' ? trainer.rating : parseFloat(trainer.rating);
                    if (!isNaN(ratingNum)) {
                        ratingText = ratingNum.toFixed(1);
                    }
                }
                
                const safeName = (trainer.name || '').replace(/'/g, "\\'");
                const safeSpecialization = (trainer.specialization || '').replace(/'/g, "\\'");
                const safeRating = trainer.rating && typeof trainer.rating === 'number' ? trainer.rating : 0;
                
                const firstLetter = trainer.name ? trainer.name.charAt(0).toUpperCase() : 'T';
                const photoUrl = trainer.id ? `assets/images/trainers/trainer-${trainer.id}.jpg` : null;
                const ratingStars = this.renderRatingStars(ratingText !== 'Нет оценок' ? parseFloat(ratingText) : 0);
                
                return `
                    <div class="trainer-card" style="cursor: pointer;" onclick="clientTrainingsManager.selectTrainer(${trainer.id}, '${safeName}', '${safeSpecialization}', ${safeRating})">
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
                    </div>
                `;
            }).join('');
    }

    renderRatingStars(rating) {
        if (!rating || rating === 0) {
            return '<span style="color: #cbd5e1; font-size: 12px;">Нет оценок</span>';
        }
        
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
        
        return stars + ` <span style="color: #cbd5e1; font-size: 12px;">(${rating.toFixed(1)})</span>`;
    }

    async selectTrainer(trainerId, name, specialization, rating) {
        this.selectedTrainer = {
            id: trainerId,
            name: name,
            specialization: specialization,
            rating: rating
        };
        this.closeModals();
        await this.loadTrainerScheduleAndOpenModal();
    }

    async loadTrainerScheduleAndOpenModal() {
        if (!this.selectedTrainer) return;

        try {
            const response = await fetch(`${this.API_BASE_URL}/public/trainer-schedule?trainer_id=${this.selectedTrainer.id}`);

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.schedule && data.schedule.length > 0) {
                    this.trainerSchedule = data.schedule;
                    this.populateScheduleSelect(data.schedule);
                } else {
                    const select = document.getElementById('training-schedule-with-trainer');
                    if (select) {
                        select.innerHTML = '<option value="">У тренера нет доступного расписания</option>';
                    }
                    const dateSelectGroup = document.getElementById('training-date-select-group');
                    if (dateSelectGroup) {
                        dateSelectGroup.style.display = 'none';
                    }
                }
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
                const select = document.getElementById('training-schedule-with-trainer');
                if (select) {
                    select.innerHTML = '<option value="">Ошибка загрузки расписания</option>';
                }
            }
        } catch (error) {
            const select = document.getElementById('training-schedule-with-trainer');
            if (select) {
                select.innerHTML = '<option value="">Ошибка загрузки расписания</option>';
            }
        }

        this.openWithTrainerModal();
    }

    populateScheduleSelect(schedule) {
        const select = document.getElementById('training-schedule-with-trainer');
        if (!select) return;

        const dayNames = {
            'monday': 'Понедельник',
            'tuesday': 'Вторник',
            'wednesday': 'Среда',
            'thursday': 'Четверг',
            'friday': 'Пятница',
            'saturday': 'Суббота',
            'sunday': 'Воскресенье'
        };

        const scheduleByDay = {};
        schedule.forEach(slot => {
            if (!scheduleByDay[slot.day_of_week]) {
                scheduleByDay[slot.day_of_week] = [];
            }
            scheduleByDay[slot.day_of_week].push(slot);
        });

        const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        let html = '<option value="">Выберите день и время...</option>';
        
        dayOrder.forEach(day => {
            if (scheduleByDay[day]) {
                scheduleByDay[day].forEach(slot => {
                    const startTime = slot.start_time.substring(0, 5);
                    const endTime = slot.end_time.substring(0, 5);
                    const dayName = dayNames[day] || day;
                    const value = `${slot.day_of_week}|${slot.start_time}`;
                    html += `<option value="${value}">${dayName}, ${startTime} - ${endTime}</option>`;
                });
            }
        });

        select.innerHTML = html;
        
        const newSelect = select.cloneNode(true);
        select.parentNode.replaceChild(newSelect, select);
        
        const updatedSelect = document.getElementById('training-schedule-with-trainer');
        if (updatedSelect) {
            updatedSelect.addEventListener('change', (e) => {
                const selectedValue = e.target.value;
                if (selectedValue) {
                    const [dayOfWeek, time] = selectedValue.split('|');
                    this.populateDateSelect(dayOfWeek);
                } else {
                    const dateSelectGroup = document.getElementById('training-date-select-group');
                    if (dateSelectGroup) {
                        dateSelectGroup.style.display = 'none';
                    }
                }
            });
            
            if (updatedSelect.options.length > 1) {
                updatedSelect.selectedIndex = 1;
                const firstValue = updatedSelect.options[1].value;
                if (firstValue) {
                    const [dayOfWeek, time] = firstValue.split('|');
                    this.populateDateSelect(dayOfWeek);
                }
            }
        }
    }

    populateDateSelect(dayOfWeek) {
        const dateSelect = document.getElementById('training-date-select-with-trainer');
        const dateSelectGroup = document.getElementById('training-date-select-group');
        
        if (!dateSelect || !dateSelectGroup) return;

        const dates = this.getAvailableDatesForDayOfWeek(dayOfWeek, 4);
        
        if (dates.length === 0) {
            dateSelectGroup.style.display = 'none';
            return;
        }

        let html = '<option value="">Выберите дату...</option>';
        dates.forEach(date => {
            const [year, month, day] = date.split('-').map(Number);
            const dateObj = new Date(year, month - 1, day, 12, 0, 0); 
            const formattedDate = dateObj.toLocaleDateString('ru-RU', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            const actualDay = dateObj.getDay();
            const expectedDay = this.getDayOfWeekNumber(dayOfWeek);
            
            html += `<option value="${date}">${formattedDate}</option>`;
        });

        dateSelect.innerHTML = html;
        dateSelectGroup.style.display = 'block';
        
        if (dateSelect.options.length > 1) {
            dateSelect.selectedIndex = 1;
        }
    }

    getDayOfWeekNumber(dayOfWeek) {
        const dayMap = {
            'monday': 1,
            'tuesday': 2,
            'wednesday': 3,
            'thursday': 4,
            'friday': 5,
            'saturday': 6,
            'sunday': 0
        };
        return dayMap[dayOfWeek.toLowerCase()];
    }

    getAvailableDatesForDayOfWeek(dayOfWeek, weeksAhead = 4) {
        const dayMap = {
            'monday': 1,
            'tuesday': 2,
            'wednesday': 3,
            'thursday': 4,
            'friday': 5,
            'saturday': 6,
            'sunday': 0
        };

        const targetDay = dayMap[dayOfWeek.toLowerCase()];
        if (targetDay === undefined) {
            return [];
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentDay = today.getDay();
        
        let daysUntilTarget = targetDay - currentDay;

        if (daysUntilTarget < 0) {
            daysUntilTarget += 7;
        } else if (daysUntilTarget === 0) {
            daysUntilTarget = 7;
        }

        const dates = [];
        for (let week = 0; week < weeksAhead; week++) {
            const targetDate = new Date(today);
            const daysToAdd = daysUntilTarget + (week * 7);
            targetDate.setDate(today.getDate() + daysToAdd);
            
            const year = targetDate.getFullYear();
            const month = String(targetDate.getMonth() + 1).padStart(2, '0');
            const day = String(targetDate.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;
            
            const checkDay = targetDate.getDay();
            if (checkDay !== targetDay) {
                const correction = targetDay - checkDay;
                const finalCorrection = correction < 0 ? correction + 7 : correction;
                targetDate.setDate(targetDate.getDate() + finalCorrection);
                
                const correctedYear = targetDate.getFullYear();
                const correctedMonth = String(targetDate.getMonth() + 1).padStart(2, '0');
                const correctedDay = String(targetDate.getDate()).padStart(2, '0');
                const correctedDateString = `${correctedYear}-${correctedMonth}-${correctedDay}`;
                dates.push(correctedDateString);
            } else {
                dates.push(dateString);
            }
        }

        return dates;
    }


    openWithTrainerModal() {
        if (this.selectedTrainer) {
            document.getElementById('selected-trainer-name').textContent = 
                `${this.selectedTrainer.name} (${this.selectedTrainer.specialization || 'Без специализации'})`;
        }
        this.loadPaymentMethods('with-trainer');
        document.getElementById('training-with-trainer-modal').style.display = 'block';
    }

    async loadPaymentMethods(type) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/client/subscriptions/my`, {
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            
            const container = type === 'no-trainer' 
                ? document.getElementById('payment-method-no-trainer')
                : document.getElementById('payment-method-with-trainer');
            
            if (!container) return;

            let gymSubscription = null;
            if (data.success && data.subscriptions) {
                gymSubscription = data.subscriptions.find(sub => 
                    (sub.subscription_type === 'gym' || sub.subscription_type === 'combo') && 
                    sub.status === 'active' && 
                    sub.remaining_visits > 0
                );
            }

            const paymentName = type === 'no-trainer' ? 'payment_method_no-trainer' : 'payment_method_with-trainer';
            
            if (type === 'with-trainer') {
                container.innerHTML = `
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="radio" name="${paymentName}" value="qr_code" checked onchange="clientTrainingsManager.toggleQRCode('${type}', 'qr_code')">
                        <span>QR-код для оплаты</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="radio" name="${paymentName}" value="cash" onchange="clientTrainingsManager.toggleQRCode('${type}', 'cash')">
                        <span>Оплата на месте в зале</span>
                    </label>
                `;
            } else {
                container.innerHTML = `
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="radio" name="${paymentName}" value="qr_code" checked onchange="clientTrainingsManager.toggleQRCode('${type}', 'qr_code')">
                        <span>QR-код для оплаты</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="radio" name="${paymentName}" value="cash" onchange="clientTrainingsManager.toggleQRCode('${type}', 'cash')">
                        <span>Оплата на месте в зале</span>
                    </label>
                    ${gymSubscription ? `
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="radio" name="${paymentName}" value="subscription" onchange="clientTrainingsManager.toggleQRCode('${type}', 'subscription')" data-subscription-id="${gymSubscription.id}">
                            <span>Абонемент "${gymSubscription.subscription_name}" (осталось ${gymSubscription.remaining_visits} посещений)</span>
                        </label>
                    ` : ''}
                `;
            }
        } catch (error) {
            const container = type === 'no-trainer' 
                ? document.getElementById('payment-method-no-trainer')
                : document.getElementById('payment-method-with-trainer');
            if (container) {
                const paymentName = type === 'no-trainer' ? 'payment_method_no-trainer' : 'payment_method_with-trainer';
                
                if (type === 'with-trainer') {
                    container.innerHTML = `
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="radio" name="${paymentName}" value="qr_code" checked onchange="clientTrainingsManager.toggleQRCode('${type}', 'qr_code')">
                            <span>QR-код для оплаты</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="radio" name="${paymentName}" value="cash" onchange="clientTrainingsManager.toggleQRCode('${type}', 'cash')">
                            <span>Оплата на месте в зале</span>
                        </label>
                    `;
                } else {
                    container.innerHTML = `
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="radio" name="${paymentName}" value="qr_code" checked onchange="clientTrainingsManager.toggleQRCode('${type}', 'qr_code')">
                            <span>QR-код для оплаты</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="radio" name="${paymentName}" value="cash" onchange="clientTrainingsManager.toggleQRCode('${type}', 'cash')">
                            <span>Оплата на месте в зале</span>
                        </label>
                    `;
                }
            }
        }
    }

    toggleQRCode(type, paymentMethod) {
        const qrContainer = type === 'no-trainer' 
            ? document.getElementById('qr-code-preview')
            : document.getElementById('qr-code-preview-trainer');
        
        if (qrContainer) {
            if (paymentMethod === 'qr_code') {
                qrContainer.style.display = 'block';
                const paymentCode = `PAYMENT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const qrImage = qrContainer.querySelector('img');
                if (qrImage) {
                    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentCode)}`;
                }
            } else {
                qrContainer.style.display = 'none';
            }
        }
    }

    async searchSmartTrainer() {
        const form = document.getElementById('smart-trainer-search-form');
        const formData = new FormData(form);
        
        const filters = {
            rating: formData.get('rating') || null,
            experience: formData.get('experience') || null
        };

        try {
            const headers = this.getAuthHeaders();
            const token = localStorage.getItem('fitnessToken');
            
            if (!token) {
                this.showNotification('Необходимо войти в систему', 'error');
                return;
            }
            
            const response = await fetch(`${this.API_BASE_URL}/trainings/smart-search`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(filters)
            });
            
            if (response.status === 401) {
                this.showNotification('Сессия истекла. Пожалуйста, войдите снова', 'error');
                return;
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.trainers && data.trainers.length > 0) {
                this.renderTrainersList(data.trainers);
                this.closeModals();
                document.getElementById('trainer-selection-modal').style.display = 'block';
            } else {
                this.showNotification('Тренеры по заданным критериям не найдены', 'warning');
            }
        } catch (error) {
            this.showNotification('Ошибка поиска тренера: ' + (error.message || 'Неизвестная ошибка'), 'error');
        }
    }

    closeModals() {
        const modals = [
            'training-type-modal',
            'training-without-trainer-modal',
            'training-with-trainer-modal',
            'trainer-selection-method-modal',
            'smart-trainer-search-modal',
            'trainer-selection-modal'
        ];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
            }
        });
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

    async submitWithoutTrainerForm(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        const date = formData.get('date');
        const time = formData.get('time');
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            this.showNotification('Нельзя выбрать прошедшую дату', 'error');
            return;
        }
        
        if (time) {
            const [hours, minutes] = time.split(':').map(Number);
            const timeInMinutes = hours * 60 + minutes;
            const minTime = 9 * 60; 
            const maxTime = 21 * 60; 
            
            if (timeInMinutes < minTime || timeInMinutes > maxTime) {
                this.showNotification('Время тренировки без тренера должно быть с 9:00 до 21:00', 'error');
                return;
            }
        }
        
        const paymentMethod = form.querySelector(`input[name="payment_method_no-trainer"]:checked`)?.value || 'qr_code';
        const subscriptionId = form.querySelector(`input[name="payment_method_no-trainer"]:checked`)?.dataset?.subscriptionId || null;

        const selectedInventoryItem = this.selectedInventory 
            ? this.inventoryList.find(inv => inv.id === parseInt(this.selectedInventory))
            : null;

        const bookingData = {
            trainer_id: null,
            booking_date: date,
            booking_time: time,
            payment_method: paymentMethod,
            subscription_id: subscriptionId || null,
            inventory_id: this.selectedInventory ? parseInt(this.selectedInventory) : null
        };

        try {
            const response = await fetch(`${this.API_BASE_URL}/trainings/book`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(bookingData)
            });
            const data = await response.json();
            
            if (data.success) {
                let message = 'Вы успешно записались на тренировку!';
                if (selectedInventoryItem) {
                    message += ` Забронирован инвентарь: ${selectedInventoryItem.name}.`;
                }
                this.showNotification(message, 'success');
                this.closeModals();
                form.reset();
                this.selectedInventory = null; 
                this.updateSelectedInventoryDisplay();
            } else {
                this.showNotification(data.error || 'Ошибка записи на тренировку', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка записи на тренировку', 'error');
        }
    }

    async submitWithTrainerForm(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        if (!this.selectedTrainer) {
            this.showNotification('Выберите тренера', 'error');
            return;
        }

        const scheduleSlot = formData.get('schedule_slot');
        if (!scheduleSlot) {
            this.showNotification('Выберите день и время тренировки', 'error');
            return;
        }

        const [dayOfWeek, time] = scheduleSlot.split('|');
        
        if (!dayOfWeek || !time) {
            this.showNotification('Ошибка: некорректные данные расписания', 'error');
            return;
        }

        const dateSelect = document.getElementById('training-date-select-with-trainer');
        const bookingDate = dateSelect ? dateSelect.value : null;
        
        if (!bookingDate) {
            this.showNotification('Выберите дату тренировки', 'error');
            return;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(bookingDate);
        selectedDate.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            this.showNotification('Нельзя выбрать прошедшую дату', 'error');
            return;
        }

        const paymentRadio = form.querySelector('input[name="payment_method_with-trainer"]:checked');
        const paymentMethod = paymentRadio?.value || 'qr_code';
        const subscriptionId = paymentRadio?.dataset?.subscriptionId || null;

        const selectedInventoryItem = this.selectedInventory 
            ? this.inventoryList.find(inv => inv.id === parseInt(this.selectedInventory))
            : null;

        const bookingData = {
            trainer_id: this.selectedTrainer.id,
            booking_date: bookingDate,
            booking_time: time,
            day_of_week: dayOfWeek, 
            payment_method: paymentMethod,
            subscription_id: subscriptionId || null,
            inventory_id: this.selectedInventory ? parseInt(this.selectedInventory) : null
        };

        try {
            const response = await fetch(`${this.API_BASE_URL}/trainings/book`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(bookingData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                let message = 'Вы успешно записались на тренировку!';
                if (selectedInventoryItem) {
                    message += ` Забронирован инвентарь: ${selectedInventoryItem.name}.`;
                }
                this.showNotification(message, 'success');
                this.closeModals();
                form.reset();
                this.selectedTrainer = null;
                this.selectedInventory = null; 
                this.updateSelectedInventoryDisplay();
            } else {
                const errorMessage = data.error || 'Ошибка записи на тренировку';
                this.showNotification(errorMessage, 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка записи на тренировку: ' + (error.message || 'Неизвестная ошибка'), 'error');
        }
    }

    getNextDateForDayOfWeek(dayOfWeek) {
        const dayMap = {
            'monday': 1,
            'tuesday': 2,
            'wednesday': 3,
            'thursday': 4,
            'friday': 5,
            'saturday': 6,
            'sunday': 0
        };

        const targetDay = dayMap[dayOfWeek.toLowerCase()];
        if (targetDay === undefined) return null;

        const today = new Date();
        const currentDay = today.getDay();
        let daysUntilTarget = targetDay - currentDay;

        if (daysUntilTarget < 0) {
            daysUntilTarget += 7;
        } else if (daysUntilTarget === 0) {
            const now = new Date();
            const hours = now.getHours();
            if (hours >= 20) { 
                daysUntilTarget = 7;
            }
        }

        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysUntilTarget);
        
        return targetDate.toISOString().split('T')[0];
    }

    async openInventoryModal() {
        const modal = document.getElementById('inventory-modal');
        if (!modal) {
            return;
        }

        document.getElementById('inventory-loading').style.display = 'block';
        document.getElementById('inventory-list').style.display = 'none';
        document.getElementById('inventory-error').style.display = 'none';
        document.getElementById('confirm-inventory-btn').style.display = 'none';

        modal.style.display = 'block';

        try {
            const response = await fetch(`${this.API_BASE_URL}/inventory`);
            const data = await response.json();

            if (data.success && data.inventory) {
                this.inventoryList = data.inventory;
                this.renderInventoryList();
                document.getElementById('inventory-loading').style.display = 'none';
                document.getElementById('inventory-list').style.display = 'block';
                document.getElementById('confirm-inventory-btn').style.display = 'block';
            } else {
                throw new Error(data.error || 'Ошибка загрузки инвентаря');
            }
        } catch (error) {
            document.getElementById('inventory-loading').style.display = 'none';
            document.getElementById('inventory-error').style.display = 'block';
            document.getElementById('inventory-error').textContent = 'Ошибка загрузки инвентаря: ' + error.message;
        }
    }

    renderInventoryList() {
        const container = document.querySelector('#inventory-list > div');
        if (!container) return;

        if (this.inventoryList.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Инвентарь не найден</p>';
            return;
        }

        container.innerHTML = this.inventoryList.map(item => {
            const isSelected = this.selectedInventory && this.selectedInventory.toString() === item.id.toString();
            return `
                <label style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border: 1px solid ${isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}; border-radius: 8px; cursor: pointer; background: ${isSelected ? 'rgba(74, 144, 226, 0.1)' : 'transparent'}; transition: all 0.2s;">
                    <input type="radio" 
                           name="inventory_selection"
                           value="${item.id}" 
                           ${isSelected ? 'checked' : ''} 
                           onchange="clientTrainingsManager.selectInventory(${item.id})"
                           style="cursor: pointer;">
                    <span style="flex: 1; cursor: pointer;">${item.name}</span>
                </label>
            `;
        }).join('');
    }

    selectInventory(inventoryId) {
        // Если выбран тот же инвентарь, снимаем выбор
        if (this.selectedInventory && this.selectedInventory.toString() === inventoryId.toString()) {
            this.selectedInventory = null;
        } else {
            this.selectedInventory = inventoryId.toString();
        }
        
        this.renderInventoryList();
        this.updateSelectedInventoryDisplay();
    }

    updateSelectedInventoryDisplay() {
        const displayDiv = document.getElementById('selected-inventory-display');
        const listDiv = document.getElementById('selected-inventory-list');
        
        if (!displayDiv || !listDiv) return;

        if (!this.selectedInventory) {
            displayDiv.style.display = 'none';
            return;
        }

        const selectedItem = this.inventoryList.find(inv => inv.id === parseInt(this.selectedInventory));

        if (!selectedItem) {
            displayDiv.style.display = 'none';
            return;
        }

        listDiv.innerHTML = `<span style="display: inline-block; padding: 0.25rem 0.5rem; margin: 0.25rem; background: var(--primary); color: white; border-radius: 4px; font-size: 0.85rem;">${selectedItem.name}</span>`;
        displayDiv.style.display = 'block';
    }

    confirmInventorySelection() {
        this.closeInventoryModal();
    }

    closeInventoryModal() {
        const modal = document.getElementById('inventory-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

let clientTrainingsManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClientTrainingsManager);
} else {
    initClientTrainingsManager();
}

function initClientTrainingsManager() {
    clientTrainingsManager = new ClientTrainingsManager();
    window.clientTrainingsManager = clientTrainingsManager; 
    
    const withoutTrainerForm = document.getElementById('training-without-trainer-form');
    if (withoutTrainerForm) {
        withoutTrainerForm.addEventListener('submit', (e) => clientTrainingsManager.submitWithoutTrainerForm(e));
    }
    
    const withTrainerForm = document.getElementById('training-with-trainer-form');
    if (withTrainerForm) {
        withTrainerForm.addEventListener('submit', (e) => clientTrainingsManager.submitWithTrainerForm(e));
    }
    
    const smartSearchForm = document.getElementById('smart-trainer-search-form');
    if (smartSearchForm) {
        smartSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            clientTrainingsManager.searchSmartTrainer();
        });
    }
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            clientTrainingsManager.closeModals();
        }
    });
}


