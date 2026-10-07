import { useState, useCallback, useEffect, useRef } from 'react';
import { useDebouncedCallback } from 'src/hooks/use-debounce';

/**
 * Hook for debounced input with immediate UI update
 * @param {string} initialValue - Initial value
 * @param {Function} onDebouncedChange - Callback when debounced value changes
 * @param {number} delay - Debounce delay in ms
 * @returns {Object} - { displayValue, debouncedValue, handleChange, reset, setDisplayValue }
 */
export function useDebouncedInput(initialValue = '', onDebouncedChange, delay = 500) {
    const [displayValue, setDisplayValue] = useState(initialValue);
    const [debouncedValue, setDebouncedValue] = useState(initialValue);
    const isInitialMount = useRef(true);

    const debouncedUpdate = useDebouncedCallback(
        (value) => {
            setDebouncedValue(value);
            if (onDebouncedChange) {
                onDebouncedChange(value);
            }
        },
        delay,
        []
    );

    const handleChange = useCallback(
        (event) => {
            const value = event.target.value;
            setDisplayValue(value); // Update UI immediately for responsive feel
            debouncedUpdate(value); // Debounce the actual action
        },
        [debouncedUpdate]
    );

    const reset = useCallback(() => {
        setDisplayValue(initialValue);
        setDebouncedValue(initialValue);
        debouncedUpdate.cancel();
    }, [initialValue, debouncedUpdate]);

    // Sync with external value changes (e.g., when resetting filters)
    useEffect(() => {
        // Skip on initial mount to avoid unnecessary updates
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        if (initialValue !== displayValue) {
            setDisplayValue(initialValue);
            setDebouncedValue(initialValue);
        }
    }, [initialValue]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            debouncedUpdate.cancel();
        };
    }, [debouncedUpdate]);

    return {
        displayValue,
        debouncedValue,
        handleChange,
        reset,
        setDisplayValue,
    };
}