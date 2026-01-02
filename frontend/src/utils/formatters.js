// Currency formatter
export const formatCurrency = (amount) => {
    if (amount >= 100) {
        return `₹ ${(amount / 100).toFixed(2)} Cr`;
    } else {
        return `₹ ${Math.round(amount)} Lakhs`;
    }
};

// Short currency format
export const formatCurrencyShort = (amount) => {
    if (amount >= 100) {
        return `₹${(amount / 100).toFixed(1)}Cr`;
    } else {
        return `₹${Math.round(amount)}L`;
    }
};

// Time formatter
export const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Relative time (e.g., "2 minutes ago")
export const formatRelativeTime = (timestamp) => {
    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
};

// Date formatter
export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

// Date and time formatter
export const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Number abbreviation (e.g., 1.5K, 2M)
export const abbreviateNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
};

// Player role badge color
export const getRoleColor = (role) => {
    const colors = {
        'BATSMAN': 'bg-blue-500',
        'BOWLER': 'bg-green-500',
        'ALL-ROUNDER': 'bg-purple-500',
        'WICKET-KEEPER': 'bg-orange-500',
    };
    return colors[role] || 'bg-gray-500';
};

// Player status badge color
export const getStatusColor = (status) => {
    const colors = {
        'AVAILABLE': 'bg-green-500',
        'SOLD': 'bg-accent-gold',
        'UNSOLD': 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
};

/**
 * Calculate dynamic bid increment based on current bid price
 * @param {number} currentBidLakhs - Current bid amount in Lakhs
 * @returns {number} Increment value in Lakhs
 */
export const getDynamicIncrement = (currentBidLakhs) => {
    const bidInCrores = currentBidLakhs / 100;

    if (bidInCrores < 2) {
        return 10; // 10 Lakhs for bids under 2 Cr
    } else if (bidInCrores < 5) {
        return 25; // 25 Lakhs for bids 2-5 Cr
    } else if (bidInCrores < 10) {
        return 50; // 50 Lakhs for bids 5-10 Cr
    } else {
        return 100; // 1 Cr for bids above 10 Cr
    }
};
