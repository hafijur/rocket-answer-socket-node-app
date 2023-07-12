const Redis = require("ioredis");
const redisConfig = require("../config/redis.config");

const redis = new Redis({
  password: redisConfig.password,
  host: redisConfig.host,
  port: redisConfig.port,
  enableAutoPipelining: true,
});

module.exports = redis;
