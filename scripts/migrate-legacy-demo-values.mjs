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
const replacements = [
  ["LPD901", "901"], ["LPD902", "902"], ["LPD903", "903"], ["LPD904", "904"], ["LPD905", "905"],
  ["东澜医疗配送中心", "东澜区域配送中心"], ["南屿医疗供应链", "南屿供应链中心"],
  ["北辰医疗服务中心", "北辰渠道服务中心"], ["西岭医疗配送中心", "西岭区域配送中心"],
  ["中衡医疗供应链", "中衡供应链中心"],
  ["PL001", "C01"], ["PL002", "C02"], ["PL003", "C03"], ["PL004", "C04"], ["PL005", "C05"], ["PL006", "C06"],
];

function quote(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

await client.connect();
try {
  await client.query("BEGIN");
  const columns = await client.query(
    `SELECT table_name, column_name
       FROM information_schema.columns
      WHERE table_schema = $1
        AND data_type IN ('character varying', 'character', 'text')
      ORDER BY table_name, ordinal_position`,
    [schema],
  );
  const updates = [];
  for (const { table_name: tableName, column_name: columnName } of columns.rows) {
    for (const [oldValue, newValue] of replacements) {
      const result = await client.query(
        `UPDATE ${quote(schema)}.${quote(tableName)} SET ${quote(columnName)} = $1 WHERE ${quote(columnName)} = $2`,
        [newValue, oldValue],
      );
      if (result.rowCount > 0) updates.push({ table: tableName, column: columnName, oldValue, newValue, rows: result.rowCount });
    }
  }
  await client.query("COMMIT");
  console.log(JSON.stringify({ updates, totalRows: updates.reduce((sum, item) => sum + item.rows, 0) }, null, 2));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
