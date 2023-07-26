const knex = require("knex");
const dbConfig = require("../config/db.config");

// console.log(process.env.NODE_ENV);

const node_env = process.env.NODE_ENV || "production";

const DBConfig = () => {
  const { DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USERNAME } = dbConfig;
  const config = {
    client: "mysql",
    pool: {
      min: 2,
      max: 100,
    },
    dialect: "mysql",
    // debug: true,
    connection: {
      charset: 'utf8mb4', // Set the charset option to 'utf8mb4' within the connection object
      host: DB_HOST,
      user: DB_USERNAME,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: DB_PORT,
    },
  };

  return config;
};

module.exports = knex(DBConfig(node_env));
