import { config } from "dotenv";

export const BSC_ENV_PATHS = [".env.local", ".env"];

config({
  path: BSC_ENV_PATHS,
  override: false,
});
