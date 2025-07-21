
import 'server-only';
import {Pool} from 'pg';
import fs from 'fs';
import path from 'path';

// Use a global variable to store the connection pool singleton.
// This prevents re-creating the pool on every hot reload in development.
const globalForDb = globalThis as unknown as { pool: Pool | undefined };

const getPool = () => {
  if (globalForDb.pool) {
    return globalForDb.pool;
  }
  
  const { DATABASE_URL, DATABASE_CERT_PATH, DATABASE_CERT, VERCEL } = process.env;

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in your environment variables');
  }

  let sslConfig: { ca: string } | undefined;

  // Vercel deployment uses the DATABASE_CERT env var
  if (VERCEL && DATABASE_CERT) {
    console.log('Using DATABASE_CERT from environment variable for Vercel.');
    sslConfig = { ca: DATABASE_CERT };
  } 
  // Local development uses the file path
  else if (DATABASE_CERT_PATH) {
    const certPath = path.resolve(process.cwd(), DATABASE_CERT_PATH);
    if (!fs.existsSync(certPath)) {
      throw new Error(`Database certificate not found at: ${certPath}`);
    }
    console.log('Using DATABASE_CERT_PATH from file for local development.');
    sslConfig = { ca: fs.readFileSync(certPath).toString() };
  } else {
    throw new Error('Database certificate environment variables (DATABASE_CERT or DATABASE_CERT_PATH) are not set.');
  }

  console.log('Creating new database connection pool.');
  globalForDb.pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: sslConfig,
  });

  return globalForDb.pool;
};

const pool = getPool();

export default pool;
