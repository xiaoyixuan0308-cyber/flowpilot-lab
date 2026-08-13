import "dotenv/config";
import pg from "pg";

const client = new pg.Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});
const schema = process.env.DB_SCHEMA || "public";
const legacyPattern = "(SU_BU1|LPD90[1-5]|PL00[1-6]|东澜医疗|南屿医疗|北辰医疗|西岭医疗|中衡医疗)";

await client.connect();
try {
  const columns = await client.query(
    `SELECT table_name, column_name
       FROM information_schema.columns
      WHERE table_schema = $1
        AND data_type IN ('character varying', 'character', 'text')
      ORDER BY table_name, ordinal_position`,
    [schema],
  );
  const matches = [];
  for (const { table_name: tableName, column_name: columnName } of columns.rows) {
    const safeSchema = `"${schema.replaceAll('"', '""')}"`;
    const safeTable = `"${tableName.replaceAll('"', '""')}"`;
    const safeColumn = `"${columnName.replaceAll('"', '""')}"`;
    const result = await client.query(
      `SELECT count(*)::int AS count FROM ${safeSchema}.${safeTable} WHERE ${safeColumn} ~ $1`,
      [legacyPattern],
    );
    if (result.rows[0].count > 0) matches.push({ table: tableName, column: columnName, count: result.rows[0].count });
  }
  console.log(JSON.stringify({ matches, totalMatches: matches.reduce((sum, item) => sum + item.count, 0) }, null, 2));
} finally {
  await client.end();
}
