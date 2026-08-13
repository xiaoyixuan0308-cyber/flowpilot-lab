import "dotenv/config";
import pg from "pg";

const { Client } = pg;
const schema = process.env.DB_SCHEMA || "public";
const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

await client.connect();
try {
  await client.query("BEGIN");
  const columns = await client.query(
    `SELECT table_name
       FROM information_schema.columns
      WHERE table_schema = $1 AND column_name = 'sc_bu'
      ORDER BY table_name`,
    [schema],
  );

  const updated = [];
  for (const { table_name: tableName } of columns.rows) {
    const safeSchema = `"${schema.replaceAll('"', '""')}"`;
    const safeTable = `"${tableName.replaceAll('"', '""')}"`;
    const result = await client.query(
      `UPDATE ${safeSchema}.${safeTable} SET sc_bu = $1 WHERE sc_bu = $2`,
      ["华东业务单元", "SU_BU1"],
    );
    if (result.rowCount > 0) updated.push({ table: tableName, rows: result.rowCount });
  }
  await client.query("COMMIT");
  console.log(JSON.stringify({ updated, totalRows: updated.reduce((sum, item) => sum + item.rows, 0) }, null, 2));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
