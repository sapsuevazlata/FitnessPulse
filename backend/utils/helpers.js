function formatTimeSimply(time) {
    if (!time) return '10:00';
    try {
        if (typeof time === 'string') {
            return time.substring(0, 5);
        }
        return '10:00';
    } catch (error) {
        return '10:00';
    }
}

function getDayOfWeek(dateString) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const date = new Date(dateString);
    return days[date.getDay()];
}

function getNextDateForDayOfWeek(dayOfWeek) {
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

module.exports = { formatTimeSimply, getDayOfWeek, getNextDateForDayOfWeek };

