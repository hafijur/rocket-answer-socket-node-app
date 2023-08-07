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
 * receiver_id: number,
 * sent_at: number
 * sender_name: string,
 * sender_image: string
 * }} payload
 */

async function MessageSentGpUpdated(payload) {
  try {
    const { text, activity_id, sender_id, chat_message_type, receiver_id = null } = payload;

    await dbService
      .table("jp_group_chat_message")
      .insert({
        text,
        sent_at: Date.now(),
        activity_id,
        sender_id,
        receiver_id,
        status: "sent",
        chat_message_type,
        owner: "",
      });

      
      const activityInfo = await dbService.select(["*"]).from("jp_activity").where({ activity_id }).first();
    if (!activityInfo) return;

    io.to(activityInfo.activity_id).emit(tag.GET_MESSAGE_GP, payload); // // console.log({ sockets });
  } catch (error) {
    console.log("\n\nFailed to sent message\n\n", error);
  }
}

module.exports = MessageSentGpUpdated;
