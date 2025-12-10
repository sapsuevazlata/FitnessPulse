class AdminReportsManager {
    constructor() {
        this.API_BASE_URL = 'http://localhost:3000/api';
        this.token = Auth.getToken();
        this.subscriptionsChart = null;
        this.bookingsChart = null;
    }

    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    async loadReports() {
        try {
            const response = await fetch(this.API_BASE_URL + '/admin/reports', {
                headers: this.getAuthHeaders()
            });

            const data = await response.json();

            if (data.success) {
                this.renderSubscriptionsChart(data.subscriptions);
                this.renderBookingsChart(data.bookings, data.personalBookings);
            }
        } catch (error) {
        }
    }

    renderSubscriptionsChart(stats) {
        const ctx = document.getElementById('admin-subscriptions-chart');
        if (!ctx) return;

        const labels = stats.map(stat => {
            const [year, month] = stat.month.split('-');
            const date = new Date(year, month - 1);
            return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
        });
        const data = stats.map(stat => parseInt(stat.count));

        if (this.subscriptionsChart) {
            this.subscriptionsChart.destroy();
        }

        this.subscriptionsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Покупки абонементов',
                    data: data,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Покупки абонементов за последние 6 месяцев'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    renderBookingsChart(groupBookings, personalBookings) {
        const ctx = document.getElementById('admin-bookings-chart');
        if (!ctx) return;

        const dataMap = new Map();
        
        groupBookings.forEach(stat => {
            dataMap.set(stat.month, {
                month: stat.month,
                group: parseInt(stat.count),
                personal: 0
            });
        });

        personalBookings.forEach(stat => {
            if (dataMap.has(stat.month)) {
                dataMap.get(stat.month).personal = parseInt(stat.count);
            } else {
                dataMap.set(stat.month, {
                    month: stat.month,
                    group: 0,
                    personal: parseInt(stat.count)
                });
            }
        });

        const sortedData = Array.from(dataMap.values()).sort((a, b) => a.month.localeCompare(b.month));

        const labels = sortedData.map(stat => {
            const [year, month] = stat.month.split('-');
            const date = new Date(year, month - 1);
            return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
        });
        const groupData = sortedData.map(stat => stat.group);
        const personalData = sortedData.map(stat => stat.personal);

        if (this.bookingsChart) {
            this.bookingsChart.destroy();
        }

        this.bookingsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Групповые занятия',
                        data: groupData,
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Персональные тренировки',
                        data: personalData,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Записи на занятия за последние 6 месяцев'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
}

window.adminReportsManager = new AdminReportsManager();

