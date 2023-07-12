const { io } = require("../app");
const dbService = require("../service/db.service");
const tag = require("../constants/event.constants");
const Notification = require("../service/notification.service");

/**
 * handles file upload actions
 * @param {{
 * single_message_id: number,
 * text: string,
 * sent_at: string,
 * received_at: string,
 * status: "sent" | "delivered" | "seen" | "deleted",
 * sender_id: number,
 * receiver_id: number,
 * sender_name: string,
 * sender_image: string,
 * room_id: string,
 * chat_message_type: "file" | "text"
 * }} payload
 */

async function FileUploaded(payload) {
  const { sender_id, receiver_id, sender_name, sender_image, single_message_id } = payload;

  let users = await dbService.raw(`
    SELECT 
      socket_id, juo.user_id, juo.device_token, juo.profile_picture, juo.profile_name, jbu.send_notification
    FROM
      jp_user_online juo
    INNER JOIN 
      jp_base_user jbu
    ON
      jbu.user_id = juo.user_id
    AND
      jbu.account_status = 'active'
    WHERE
      juo.user_id IN (${sender_id}, ${receiver_id})
  `);

  users = users.rows;

  if (!users.length) {
    return;
  }

  const sockets = [];
  const receiverInfo = {};

  users.forEach((user) => {
    if (user.socket_id && user.socket_id.length) {
      sockets.push(user.socket_id);
    }

    if (user.user_id === receiver_id) {
      receiverInfo.receiver_name = user.profile_name;
      receiverInfo.receiver_image = user.profile_picture;
      // fcm_token = user.device_token;

      if (user.send_notification) {
        const notificationService = new Notification();

        notificationService.send({
          fcm_token: user.device_token,
          type: "chat_message",
          title: `${sender_name} sent you new file `,
          body: "1 new message",
          sender_id,
          sender_image,
          sender_name,
          message_id: single_message_id,
          chat_message_type: "file",
        });
      }
    }
  });

  io.to(sockets).emit(tag.FILE_UPLOADED, payload);

  const foundMessage = await dbService.select("*").from("jp_single_chat_message").where({ single_message_id });

  const recentMessagePayload = {
    ...foundMessage[0],
    sender_name,
    sender_image,
    sender_id,
    receiver_id,
    receiver_name: receiverInfo.profile_name || "",
    receiver_image: receiverInfo.profile_picture || "",
    chat_type: "single",
  };

  const senderInfo = await dbService.select(["socket_id"]).from("jp_user_online").where({ user_id: sender_id });

  if (senderInfo.length && senderInfo[0].socket_id) {
    sockets.push(senderInfo[0].socket_id);
  }

  io.to(sockets).emit(tag.RECENT_CHAT, recentMessagePayload);
}

module.exports = FileUploaded;
