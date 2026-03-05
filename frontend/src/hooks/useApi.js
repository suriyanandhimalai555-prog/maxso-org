// Custom hook for API data fetching with loading/error states
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * useApi — fetches data from an API endpoint with loading, error, and refetch support
 * 
 * @param {string} path - API path to fetch (e.g. '/api/plans')
 * @param {object} options - { immediate: true } to fetch on mount
 * @returns {{ data, loading, error, refetch }}
 * 
 * Usage:
 *   const { data: plans, loading, error, refetch } = useApi('/api/plans', { immediate: true });
 */
const useApi = (path, { immediate = true } = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async (overridePath) => {
        const fetchPath = overridePath || path;
        setLoading(true);
        setError(null);
        try {
            const result = await api.get(fetchPath);
            setData(result);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [path]);

    useEffect(() => {
        if (immediate && path) {
            fetchData();
        }
    }, [path, immediate, fetchData]);

    return { data, loading, error, refetch: fetchData, setData };
};

export default useApi;
