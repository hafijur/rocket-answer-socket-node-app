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

async function FileUploadedGp(payload) {
  const { activity_id, sender_id } = payload;

  const attendantList = await dbService.select("*").from("jp_activity_attendant").where({ activity_id });
  const activityInfo = await dbService.select("*").from("jp_activity").where({ activity_id });

  const chatMessage = await dbService.select("*").from("jp_group_chat_message").where({ activity_id }).orderBy('group_message_id', 'desc')
    .limit(1);

  // console.log('chatMessage', chatMessage[0]);
  // .orderBy('name', 'desc')
  // .limit(10)
  // console.log('attendantList', attendantList);

  const sockets = [];
  const receiverInfo = {};

  attendantList.forEach(async (list) => {
    const userOnline = await dbService.select("*").from("jp_user_online").where({ user_id: list.user_id });
    const baseUser = await dbService.select("*").from("jp_base_user").where({ user_id: list.user_id });

    if (userOnline.socket_id && userOnline.socket_id.length) {
      sockets.push(userOnline.socket_id);
    }
    if (baseUser.user_id) {
      receiverInfo.receiver_name = baseUser.profile_name;
      receiverInfo.receiver_image = baseUser.profile_picture;
      if (baseUser.send_notification) {
        const notificationService = new Notification();
        notificationService.send({
          fcm_token: userOnline.device_token,
          type: "group_chat_message",
          title: `${activityInfo.title} sent you new file `,
          body: "1 new message",
          sender_id: chatMessage[0].sender_id,
          sender_image: activityInfo.icon,
          sender_name: activityInfo.title,
          message_id: chatMessage[0].group_message_id,
          chat_message_type: "file",
        });
      }
    }
  });

  io.to(sockets).emit(tag.FILE_UPLOADED, payload);

  const Message = await dbService.raw(`select * from jp_group_chat_message where group_message_id = ${chatMessage[0].group_message_id} order by group_message_id desc limit ${1}`);

  const foundMessage = Message.rows[0];

  // console.log("foundMessage", foundMessage.rows[0]);

  const newUser = await dbService.select("*").from("jp_base_user").where({ user_id: foundMessage.sender_id });

  const recentMessagePayload = {
    ...foundMessage[0],
    sender_name: newUser.profile_name,
    sender_image: newUser.profile_picture,
    sender_id: foundMessage.sender_id,
    receiver_id: "",
    receiver_name: receiverInfo.profile_name || "",
    receiver_image: receiverInfo.profile_picture || "",
    chat_type: "group",
  };

  // const senderInfo = await dbService.select(["socket_id"]).from("jp_user_online").where({ user_id: sender_id });
  const senderInfo = await dbService.raw(`select socket_id from jp_user_online where user_id = ${sender_id}`);

  if (senderInfo.length && senderInfo[0].socket_id) {
    sockets.push(senderInfo[0].socket_id);
  }

  io.to(sockets).emit(tag.RECENT_CHAT, recentMessagePayload);
}

module.exports = FileUploadedGp;
