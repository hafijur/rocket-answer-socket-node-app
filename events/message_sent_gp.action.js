const { io } = require("../app");
const dbService = require("../service/db.service");
const Notification = require("../service/notification.service");
const tag = require("../constants/event.constants");
const appConfig = require("../config/app.config");

/**
 * handles message sending action
 * @param {{
 * text: string,
 * room_id: string
 * sender_id: number,
 * receiver_id: number,
 * sent_at: number
 * sender_name: string,
 * sender_image: string
 * }} payload
 */

async function MessageSentGp(payload) {
  // console.log(`\nMessageSent Payload ----`, payload);
  try {
    const { text, activity_id, sender_id, chat_message_type } = payload;

    // console.log(`\nMessageSent Payload ----${payload}`);

    const newMessage = await dbService
      .table("jp_group_chat_message")
      .insert({
        text,
        sent_at: Date.now(),
        activity_id,
        sender_id,
        status: "sent",
        chat_message_type,
        owner: "",
      });

    const activityInfo = await dbService.select(["*"]).from("jp_activity").where({ activity_id });
    const activityAttendant = await dbService.select(["user_id"]).from("jp_activity_attendant").where({ activity_id });

    console.log('attendantList', activityAttendant);
    if (!Object.keys(activityInfo).length) {
      return;
    }

    activityAttendant.forEach(async (attendant) => {
      const senderInfo = await dbService.select(["socket_id","user_id","device_token"])
        .from("jp_user_online")
        .where({ user_id: attendant.user_id });
      console.log("Sender info", senderInfo);

      const baseUser = await dbService.select("*").from("users").where({ id: sender_id });
      // console.log('base user', baseUser);
      if (activity_id) {
        // eslint-disable-next-line eqeqeq
        if (sender_id == attendant.user_id) {
          // Thie user con't send any  notification
        } else {
          const notificationService = new Notification();

          const notificationPayload = {
            title: `${baseUser[0].name}`,
            body: text,
            type: "chat_message",
            activity_id,
            fcm_token: senderInfo[0].device_token,
            // fcm_token: "e6ZWuAylRASM-FcCUPSuJy:APA91bFQe-3nE7tkGf7VOaJfGJg41e2Z8vZp7Uv5fw_tGqBhyZAJmqfO_qNFakV2rI2CvPBoxKdWHv31deGJb0pYVFolpwsxhlhDfIb16Kky3uJ2KVCTqsZ7qAfj-YawNtXjqwIHHQMS", //senderInfo[0].device_token,
            sender_image: (baseUser[0].profile_photo_path == null) ? null : `${appConfig.PHOTO_BASE_PATH}/${baseUser[0].profile_photo_path}`,
            sender_name: baseUser[0].username,
            sender_id,
            multiple: false,
            chat_message_type: "text",
            message_id: newMessage[0].single_message_id,
          };

          // console.log('working-----------------',notificationPayload);

          notificationService.send(notificationPayload);
        }
      }

      const sockets = [];
      if (senderInfo[0].socket_id) {
        // find user_id from senderifo where user_id != sender_id
        senderInfo.forEach((info) => {
          // if (info.user_id !== sender_id) {
          sockets.push(info.socket_id);
          // }
        });

        sockets.push(senderInfo[0].socket_id);
        console.log('payload');
        console.log(payload);
        console.log('sockets found', sockets);
        io.to(sockets).emit(tag.GET_MESSAGE_GP, payload);
      }

      // // console.log({ sockets });
      const recentMessagePayload = {
        ...newMessage[0],
        sender_name: senderInfo[0].username,
        sender_image: senderInfo[0].profile_picture,
        sender_id,
        activity_id,
        chat_type: "group",
      };

      if (senderInfo.length && senderInfo[0].socket_id) {
        sockets.push(senderInfo[0].socket_id);
      }

      // // console.log({ sockets });

      // io.to(sockets).emit(tag.RECENT_CHAT, recentMessagePayload);
    });
  } catch (error) {
    console.log("\n\nFailed to sent message\n\n", error);
  }
}

module.exports = MessageSentGp;
