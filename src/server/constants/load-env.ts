import { config } from "dotenv";

export const CENTRAL_WAREHOUSE_ENV_PATHS = [".env.local", ".env"];

config({
  path: CENTRAL_WAREHOUSE_ENV_PATHS,
  override: false,
});
