export const getErrorMessage = (error) => {
    if (!error) return 'An unexpected error occurred';
    if (typeof error === 'string') return error;
    return (
        error?.data?.message ||
        error?.data?.error ||
        error?.data?.errors?.[0]?.message ||
        error?.message ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'An unexpected error occurred'
    );
};
