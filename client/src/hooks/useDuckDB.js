import { useState, useEffect } from 'react';
import { initDuckDB } from '../services/DuckDBService';

export const useDuckDB = () => {
    const [connection, setConnection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        initDuckDB()
            .then(({ connection: conn }) => {
                if (isMounted) {
                    setConnection(conn);
                    setLoading(false);
                }
            })
            .catch((err) => {
                console.error("Failed to init DuckDB", err);
                if (isMounted) {
                    setError(err);
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return { connection, loading, error };
};
