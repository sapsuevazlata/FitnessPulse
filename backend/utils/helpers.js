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

module.exports = { formatTimeSimply, getDayOfWeek };

