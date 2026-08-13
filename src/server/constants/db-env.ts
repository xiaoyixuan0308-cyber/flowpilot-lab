import "./load-env";

export interface DbEnvConfig {
  host: string;
  port: string;
  database: string;
  schema: string;
  user: string;
  password: string;
  url: string;
}

function buildDatabaseUrl(config: Omit<DbEnvConfig, "url">) {
  const { user, password, host, port, database, schema } = config;
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?schema=${schema}`;
}

export function getDbEnvConfig(): DbEnvConfig {
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "5432";
  const database = process.env.DB_NAME || "dsc_poc";
  const schema = process.env.DB_SCHEMA || "poc";
  const user = process.env.DB_USER || "postgres";
  const password = process.env.DB_PASSWORD || "";

  const url = buildDatabaseUrl({ host, port, database, schema, user, password });

  return {
    host,
    port,
    database,
    schema,
    user,
    password,
    url,
  };
}
