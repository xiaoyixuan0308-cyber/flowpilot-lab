import { defineConfig } from "prisma/config";
import { getDbEnvConfig } from "./src/server/constants/db-env";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: getDbEnvConfig().url,
  },
});
