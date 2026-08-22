import sql from 'mssql';

let pool: sql.ConnectionPool | null = null;

export function getMssqlConfig(): sql.config | null {
  const server = process.env.MSSQL_SERVER || process.env.MSSQL_HOST;
  const user = process.env.MSSQL_USER;
  const password = process.env.MSSQL_PASSWORD;
  const database = process.env.MSSQL_DATABASE;
  const port = process.env.MSSQL_PORT ? parseInt(process.env.MSSQL_PORT, 10) : 1433;

  if (!server || !user || !password || !database) {
    return null;
  }

  const encrypt = process.env.MSSQL_ENCRYPT !== 'false';
  const trustServerCertificate = process.env.MSSQL_TRUST_SERVER_CERTIFICATE !== 'false';

  return {
    server,
    port,
    user,
    password,
    database,
    options: {
      encrypt,
      trustServerCertificate,
      enableArithAbort: true,
    },
    pool: {
      max: 25,
      min: 2,
      idleTimeoutMillis: 30000,
    },
  };
}

/**
 * Get or initialize the MSSQL connection pool lazily.
 */
export async function getDbPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool;
  }

  const config = getMssqlConfig();
  if (!config) {
    throw new Error(
      'MSSQL configuration missing. Please ensure MSSQL_SERVER, MSSQL_USER, MSSQL_PASSWORD, and MSSQL_DATABASE are set in your environment.'
    );
  }

  try {
    pool = await new sql.ConnectionPool(config).connect();
    console.log(`[MSSQL] Successfully connected to database: ${config.database} on ${config.server}`);
    return pool;
  } catch (error) {
    console.error('[MSSQL] Connection failed:', error);
    pool = null;
    throw error;
  }
}

/**
 * Test the database connection status.
 */
export async function testDbConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const activePool = await getDbPool();
    const result = await activePool.request().query('SELECT 1 AS status, GETDATE() AS serverTime');
    return {
      success: true,
      message: `Conexión exitosa a MSSQL (${result.recordset[0]?.serverTime})`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Error al conectar con MSSQL',
    };
  }
}

export { sql };
