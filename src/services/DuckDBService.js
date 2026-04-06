import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

const MANUAL_BUNDLES = {
    mvp: {
        mainModule: duckdb_wasm,
        mainWorker: mvp_worker,
    },
    eh: {
        mainModule: duckdb_wasm_eh,
        mainWorker: eh_worker,
    },
};

let db = null;
let connection = null;

export const initDuckDB = async () => {
    if (db) return { db, connection };

    try {
        // Select a bundle based on browser checks
        const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

        const worker = new Worker(bundle.mainWorker);
        const logger = new duckdb.ConsoleLogger();

        db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

        // Attempt to persist data using Origin Private File System (OPFS)
        try {
            await db.open({
                path: 'opfs://vradventure.db'
            });
            console.log("DuckDB connected with OPFS Persistence.");
        } catch (e) {
            console.warn("OPFS failed or unsupported, falling back to in-memory mode.", e);
        }

        connection = await db.connect();

        return { db, connection };
    } catch (e) {
        console.error("DuckDB Init Error", e);
        throw e;
    }
};

export const initTables = async () => {
    if (!connection) await initDuckDB();
    try {
        await connection.query(`
            CREATE SEQUENCE IF NOT EXISTS id_seq START 1;
            CREATE TABLE IF NOT EXISTS tour_packages (
                id INTEGER DEFAULT nextval('id_seq'),
                title VARCHAR,
                description TEXT,
                price DOUBLE,
                duration INTEGER
            );
        `);
        const countRes = await connection.query(`SELECT count(*) as count FROM tour_packages`);
        const countRow = countRes.toArray().map(r => r.toJSON())[0];
        const count = typeof countRow.count === 'bigint' ? Number(countRow.count) : countRow.count;

        if (count === 0) {
            const savedJson = localStorage.getItem('tour_packages_db');
            if (savedJson && savedJson.length > 5) {
                const savedTours = JSON.parse(savedJson);
                for (const t of [...savedTours].reverse()) {
                    await connection.query(`
                        INSERT INTO tour_packages (id, title, description, price, duration) VALUES 
                        (${t.id}, '${t.title.replace(/'/g, "''")}', '${t.description.replace(/'/g, "''")}', ${t.price}, ${t.duration})
                    `);
                }
                const maxId = Math.max(...savedTours.map(t => t.id), 0);
                if (maxId > 0) {
                    await connection.query(`SELECT nextval('id_seq') FROM generate_series(1, ${maxId})`);
                }
            } else {
                await connection.query(`
                    INSERT INTO tour_packages (title, description, price, duration) VALUES 
                    ('Bora Bora Overwater Bungalows', 'Experience paradise in 360', 1200.00, 60),
                    ('Swiss Alps Ski Resort', 'Virtual skiing experience', 850.00, 45),
                    ('Kyoto Ancient Temples', 'Peaceful cherry blossom walk', 920.00, 120);
                `);
            }
        }
    } catch (e) {
        console.error('Error init tables:', e);
    }
};

export const getDBConnection = async () => {
    if (!connection) {
        await initDuckDB();
    }
    return connection;
};
