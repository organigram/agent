export const isMessage = (value) => {
    const item = value;
    return ((item?.role === 'user' || item?.role === 'assistant') &&
        typeof item.content === 'string' &&
        item.content.trim() !== '');
};
