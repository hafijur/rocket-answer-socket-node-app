const axios = require("axios").default;

const appConfig = require("../config/app.config");

class Notification {
  constructor() {
    this.baseurl = appConfig.NOTIFICATION_URL;
    this.token = appConfig.NOTIFICATION_TOKEN;
  }

  async send(payload) {
    try {
      const { fcm_token, multiple, title, body } = payload;

      const notification = {
        title,
        body,
      };

      delete payload.fcm_token;
      delete payload.multiple;

      const notificationPayload = {
        data: payload,
        notification,
        direct_boot_ok: true,
        android: {
          priority: "high",
        },
      };

      if (multiple) {
        notificationPayload.registration_ids = [...fcm_token];
      } else {
        notificationPayload.to = fcm_token;
      }

      await axios.post(
        this.baseurl,

        notificationPayload,
        { headers: { "Content-Type": "application/json", Authorization: this.token } }
      );
    } catch (error) {
      // console.log(error);
      console.log("Failed to send notification");
    }
  }
}

module.exports = Notification;