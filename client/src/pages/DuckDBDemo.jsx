import React, { useState, useEffect } from 'react';
import { useDuckDB } from '../hooks/useDuckDB';

const DuckDBDemo = () => {
    const { connection, loading, error } = useDuckDB();
    const [data, setData] = useState([]);
    const [query, setQuery] = useState('SELECT * FROM my_table');
    const [querying, setQuerying] = useState(false);

    useEffect(() => {
        if (!connection) return;

        const setupData = async () => {
            try {
                // Create a generic table and insert some dummy data
                await connection.query(`
                    CREATE TABLE IF NOT EXISTS my_table (id INTEGER, name VARCHAR, value DOUBLE);
                    INSERT INTO my_table VALUES 
                        (1, 'Cyberpunk VR Tour', 100.50),
                        (2, 'Ancient Egypt Tour', 250.00),
                        (3, 'Mars Exploration', 75.25);
                `);
                runQuery();
            } catch (err) {
                console.error(err);
            }
        };

        setupData();
    }, [connection]);

    const runQuery = async () => {
        if (!connection) return;
        try {
            setQuerying(true);
            const table = await connection.query(query);
            // Convert Apache Arrow table format to JSON array of objects
            setData(table.toArray().map(row => row.toJSON()));
            setQuerying(false);
        } catch (err) {
            console.error("Query failed:", err);
            alert("Query failed: " + err.message);
            setQuerying(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-xl text-white">Loading DuckDB-WASM Engine...</div>;
    if (error) return <div className="p-8 text-red-500">Error loading DuckDB: {error.message}</div>;

    return (
        <div className="p-8 bg-gray-900 min-h-screen text-white">
            <h1 className="text-3xl font-bold mb-6 text-primary">DuckDB WebAssembly Demo</h1>
            <p className="mb-6 text-gray-300">
                This table is running entirely in your browser using standard SQL!
                No backend server is required.
            </p>
            
            <div className="mb-4">
                <textarea 
                    className="w-full p-4 bg-gray-800 border border-gray-700 rounded-md text-white font-mono focus:border-primary focus:outline-none"
                    rows="3"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>
            <button 
                className="bg-primary hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-md transition mb-8 disabled:opacity-50"
                onClick={runQuery}
                disabled={querying}
            >
                {querying ? 'Running...' : 'Run Query'}
            </button>

            <div className="bg-gray-800 p-6 rounded-lg overflow-x-auto shadow-lg">
                <h2 className="text-xl mb-4 font-semibold border-b border-gray-700 pb-2">Results</h2>
                {data.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-gray-400 border-b border-gray-700">
                                {Object.keys(data[0]).map(key => (
                                    <th key={key} className="py-3 px-4 uppercase text-sm tracking-wider">{key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <tr key={i} className="border-b border-gray-700/50 hover:bg-gray-700/50 transition">
                                    {Object.values(row).map((val, j) => (
                                        <td key={j} className="py-3 px-4">
                                            {typeof val === 'number' && !Number.isInteger(val) ? val.toFixed(2) : String(val)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-gray-400 py-4 text-center">No data or rows returned for the query.</p>
                )}
            </div>
        </div>
    );
};

export default DuckDBDemo;
