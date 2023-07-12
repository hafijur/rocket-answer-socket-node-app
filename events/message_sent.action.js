const { io } = require("../app");
const dbService = require("../service/db.service");
const Notification = require("../service/notification.service");
const tag = require("../constants/event.constants");

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

async function MessageSent(payload) {
  try {
    const { text, sender_id, receiver_id, sent_at, sender_name, sender_image, room_id } = payload;

    // console.log(`\nMessageSent Payload ----${JSON.stringify(payload)}`);

    if (sender_id === receiver_id) {
      // console.log(`\nsender_id and receiver_id are same--- sender_id: ${sender_id}, receiver_id: ${receiver_id}`);
      return;
    }

    const newMessage = await dbService
      .table("jp_single_chat_message")
      .insert({
        text,
        sender_id,
        receiver_id,
        sent_at,
        received_at: 0,
        status: "sent",
        room_id: room_id || "",
      })
      .returning("*");

    // console.log({ newMessage });

    const foundUser = await dbService.raw(`
      SELECT 
        juo.device_token, socket_id, online_status, juo.profile_picture, juo.profile_name, send_notification
      FROM
        jp_user_online juo
      INNER JOIN
        jp_base_user jbu
      ON
        jbu.user_id = juo.user_id
      AND
        jbu.account_status = 'active'

      WHERE
        juo.user_id = ${receiver_id}
    `);

    const receiverInfo = foundUser.rows[0];

    // console.log(receiverInfo);

    if (!Object.keys(receiverInfo).length) {
      return;
    }

    if (receiverInfo.send_notification) {
      const notificationService = new Notification();

      const notificationPayload = {
        title: `${sender_name} sent you a message`,
        body: text,
        type: "chat_message",
        fcm_token: receiverInfo.device_token,
        sender_image,
        sender_name,
        sender_id,
        multiple: false,
        chat_message_type: "text",
        message_id: newMessage[0].single_message_id,
      };

      notificationService.send(notificationPayload);
    }

    const sockets = [];

    if (receiverInfo.socket_id) {
      sockets.push(receiverInfo.socket_id);

      io.to(sockets).emit(tag.GET_MESSAGE, payload);
    }
    // console.log({ sockets });

    const recentMessagePayload = {
      ...newMessage[0],
      sender_name,
      sender_image,
      sender_id,
      receiver_id,
      receiver_name: receiverInfo.profile_name,
      receiver_image: receiverInfo.profile_picture,
      chat_type: "single",
    };

    const senderInfo = await dbService.select(["socket_id"]).from("jp_user_online").where({ user_id: sender_id });

    if (senderInfo.length && senderInfo[0].socket_id) {
      sockets.push(senderInfo[0].socket_id);
    }

    // console.log({ sockets });

    io.to(sockets).emit(tag.RECENT_CHAT, recentMessagePayload);
  } catch (error) {
    console.log("\n\nFailed to sent message\n\n", error);
  }
}

module.exports = MessageSent;
