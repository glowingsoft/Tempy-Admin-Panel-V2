import { useEffect, useState, useCallback, useRef } from 'react';
import { debounce } from 'lodash';

/**
 * Custom hook for debouncing values
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} Debounced value
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for debouncing callback functions
 * @param {Function} callback - The callback function to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {Array} deps - Dependency array
 * @returns {Function} Debounced callback function
 */
export function useDebouncedCallback(callback, delay = 500, deps = []) {
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Create debounced function
  const debouncedCallback = useCallback(
    debounce((...args) => {
      callbackRef.current(...args);
    }, delay),
    [delay, ...deps]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedCallback.cancel();
    };
  }, [debouncedCallback]);

  return debouncedCallback;
}

// import { useMemo, useState, useEffect, useCallback } from 'react';

// // ----------------------------------------------------------------------

// export function useDebounce(value, delay = 500) {
//   const [debouncedValue, setDebouncedValue] = useState(value);

//   const debounceHandler = useCallback(() => {
//     const handler = setTimeout(() => {
//       setDebouncedValue(value);
//     }, delay);

//     return () => {
//       clearTimeout(handler);
//     };
//   }, [value, delay]);

//   useEffect(() => {
//     debounceHandler();
//   }, [debounceHandler]);

//   const memoizedValue = useMemo(() => debouncedValue, [debouncedValue]);

//   return memoizedValue;
// }
