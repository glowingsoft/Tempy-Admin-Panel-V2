import { toast } from 'src/components/snackbar';

export const extractErrorMessage = (error) => {
    if (!error) return 'An unexpected error occurred';

    const possibleErrorPaths = [
        error?.data?.message,
        error?.data?.msg,
        error?.message,
        error?.msg,
        error?.error,
    ];

    return (
        possibleErrorPaths.find((msg) => typeof msg === 'string') ||
        'An unexpected error occurred'
    );
};

export const handleApiError = (error) => {
    const message = extractErrorMessage(error);
    toast.error(message);
    console.error('API Error:', error);
};
