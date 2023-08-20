const axios = require("axios").default;

const appConfig = require("../config/app.config");

class Notification {
  constructor() {
    this.baseurl = appConfig.NOTIFICATION_URL;
    this.token = appConfig.NOTIFICATION_TOKEN;
  }

  async send(payload) {
    try {
      console.log('hitting into notification----------------', payload);
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
      // console.log(`notification sent to ${fcm_token}\n Token--${this.token}`);
    } catch (error) {
      // console.log(error);
      console.log("Failed to send notification", error);
    }
  }

  async sendTopicNotificaion(payload) {
    console.log('hitting into topic notification----------------', payload);
    try {
      const { topic, title, body } = payload;

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

      notificationPayload.to = `/topics/${topic}`;

      // console.log('hitting notificaiton ',notificationPayload);

      await axios.post(
        this.baseurl,

        notificationPayload,
        { headers: { "Content-Type": "application/json", Authorization: this.token } }
      );
    } catch (error) {
      // console.log(error);
      console.log("Failed to send notification", error);
    }
  }
}

module.exports = Notification;
