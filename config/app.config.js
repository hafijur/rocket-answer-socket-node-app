require('dotenv').config();

module.exports = {
  PORT: 5000,
  NOTIFICATION_URL: process.env.NOTIFICATION_URL,
  NOTIFICATION_TOKEN: process.env.NOTIFICATION_TOKEN,
};
