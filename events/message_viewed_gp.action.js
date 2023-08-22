const { io } = require("../app");
const dbService = require("../service/db.service");
const tag = require("../constants/event.constants");

/**
 * handles message viewed actions
 * @param {{
 * single_message_id: number,
 * sender_status: number,
 * receiver_id: number
 * }} payload
 */

async function MessageViewedGp(payload) {
  try {
    // console.log("Message viewed event fired---");
    const { conversation_id, receiver_id, id } = payload;
    const updatedMessage = await dbService
      .table("conversation_details")
      .update({ receiver_status: 1 })
      .where({
        conversation_id,
        id,
        receiver_id
      });

    // .returning("*");

    // const users = await dbService
    //   .select(["socket_id", "profile_picture", "profile_name", "user_id"])
    //   .from("jp_user_online")
    //   .where({ user_id: sender_id });

    console.log("Message view gp == updateMessage ", id);

    const retrievedMessage = await dbService.from("conversation_details")
      .join('conversations', 'conversation_details.conversation_id', '=', 'conversations.id')
      .where({ 'conversation_details.id': id })
      .select('conversation_details.*', 'conversations.expert_id', 'conversations.customer_id')
      .first();

    // const updatedMessagePayload = {
    console.log("Message view gp == updateMessage", retrievedMessage);

    const foundSockets = await dbService.select('socket_id').from("jp_user_online")
      .whereIn('user_id', [retrievedMessage?.expert_id, retrievedMessage?.customer_id]).pluck('socket_id');

    console.log("Message view gp == updateMessage", retrievedMessage.expert_id, retrievedMessage.customer_id, foundSockets);

    io.to(foundSockets).emit(tag.RECENT_CHAT, retrievedMessage);
    // }
  } catch (error) {
    console.log("Message view gp == Failed to update message status", error);
  }
}

module.exports = MessageViewedGp;
