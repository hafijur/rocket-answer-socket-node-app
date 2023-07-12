const knex = require("knex");
const dbConfig = require("../config/db.config");

// console.log(process.env.NODE_ENV);

const node_env = process.env.NODE_ENV || "production";

const DBConfig = () => {
  const config = {
    client: "pg",
    pool: {
      min: 2,
      max: 100,
    },
    dialect: "postgres",
    // debug: true,
    connection: "",
  };

  const { DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USERNAME } = dbConfig;
  config.connection = `postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

  return config;
};

module.exports = knex(DBConfig(node_env));
