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

  console.log('sender_id :- ', sender_id);

  attendantList.forEach(async (list) => {
    const userOnline = await dbService.select("*").from("jp_user_online").where({ user_id: list.user_id });
    const baseUser = await dbService.select("*").from("jp_base_user").where({ user_id: sender_id });

    console.log('userOnline :-', userOnline[0]);

    if (userOnline[0].socket_id && userOnline[0].socket_id.length) {
      sockets.push(userOnline[0].socket_id);
    }
    // eslint-disable-next-line eqeqeq
    if (list.user_id == sender_id) {
      //
    } else {
      const notificationService = new Notification();
      const notificationPayload = {
        title: `${baseUser[0].profile_name} sent a image in ${activityInfo[0].title}`,
        body: "1 new message",
        type: "chat_message",
        activity_id,
        fcm_token: userOnline[0].device_token,
        sender_image: activityInfo[0].icon,
        sender_name: activityInfo[0].title,
        sender_id: chatMessage[0].sender_id,
        multiple: false,
        chat_message_type: "file",
        message_id: chatMessage[0].group_message_id,
      };

      console.log('notificationPayload :-', notificationPayload);

      notificationService.send(notificationPayload);
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
