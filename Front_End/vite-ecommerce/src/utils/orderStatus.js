/**
 * Determines the effective status of an order based on various status fields.
 * This logic consolidates order.status, payment_status, and delivery_status
 * into a single status for display purposes.
 * 
 * @param {Object} order - The order object
 * @returns {string} - The effective status string
 */
export const getEffectiveOrderStatus = (order) => {
    if (!order) return 'pending';

    // Normalize statuses to lowercase for comparison
    const s = order.status?.toLowerCase();
    const ps = order.payment_status?.toLowerCase();
    const ds = order.delivery_status?.toLowerCase();

    // 1. Terminal statuses (override everything)
    if (s === 'cancelled') return 'cancelled';
    if (order.bank_transfer_details?.bank_payment_status === 'REJECTED') return 'rejected';
    if (s === 'completed') return 'delivered'; // specialized completed state often means delivered/received

    // 2. Delivery progression (highest priority after terminal)
    if (s === 'delivered' || ds === 'delivered') return 'delivered';
    if (ds === 'shipped') return 'shipped';
    if (ds === 'picked') return 'picked_up';
    if (ds === 'assigned') return 'delivery_assigned';

    // 3. Admin/System approval
    if (s === 'approved' || s === 'admin_approved') return 'admin_approved';

    // 4. Payment status
    if (ps === 'paid') return 'paid';

    // 5. Fallback to base status
    return s || 'pending';
};
