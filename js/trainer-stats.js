class TrainerStatsManager {
    constructor() {
        this.API_BASE_URL = 'http://localhost:3000/api';
        this.token = Auth.getToken();
        this.chart = null;
    }

    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    async loadStats() {
        try {
            const response = await fetch(this.API_BASE_URL + '/trainer/stats', {
                headers: this.getAuthHeaders()
            });

            const data = await response.json();

            if (data.success) {
                this.renderChart(data.stats);
            }
        } catch (error) {
        }
    }

    renderChart(stats) {
        const ctx = document.getElementById('trainer-bookings-chart');
        if (!ctx) return;

        const labels = stats.map(stat => {
            const [year, month] = stat.month.split('-');
            const date = new Date(year, month - 1);
            return date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
        });
        const data = stats.map(stat => stat.count);
        
        const total = data.reduce((sum, val) => sum + val, 0);
        const average = data.length > 0 ? (total / data.length).toFixed(1) : 0;
        const max = Math.max(...data, 0);

        if (this.chart) {
            this.chart.destroy();
        }

        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Количество записей',
                    data: data,
                    backgroundColor: data.map((value, index) => {
                        const intensity = value / (max || 1);
                        return `rgba(59, 130, 246, ${0.3 + intensity * 0.5})`;
                    }),
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Статистика записей к вам за последние 6 месяцев',
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        padding: {
                            top: 10,
                            bottom: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                const percentage = max > 0 ? ((value / max) * 100).toFixed(0) : 0;
                                return `Записей: ${value} (${percentage}% от максимума)`;
                            },
                            afterLabel: function(context) {
                                return `Среднее: ${average} записей/месяц`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: {
                                size: 12
                            },
                            color: '#666'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        title: {
                            display: true,
                            text: 'Количество записей',
                            font: {
                                size: 13,
                                weight: 'bold'
                            },
                            color: '#333'
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 12
                            },
                            color: '#666'
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart'
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }
}

window.trainerStatsManager = new TrainerStatsManager();

