var path = require("path");
require("dotenv").config();

require("sql-migrations").run({
  migrationsDir: path.resolve(__dirname, "migrations"),
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT) || 5432,
  db: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  adapter: "pg",
  config: {
    ssl: {
      rejectUnauthorized: false,
      require: true,
    },
  },
});
