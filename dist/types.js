/** Categories of a support ticket. */
export const SUPPORT_TICKET_CATEGORIES = [
    'bug',
    'legal',
    'billing',
    'account',
    'other'
];
/**
 * Check that a value is a message with a role and non-empty content, for example in a request body.
 * @param value - The value to check.
 */
export const isMessage = (value) => {
    const item = value;
    return ((item?.role === 'user' || item?.role === 'assistant') &&
        typeof item.content === 'string' &&
        item.content.trim() !== '');
};
