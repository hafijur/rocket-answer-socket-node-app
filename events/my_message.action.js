const { io } = require("../app");
const dbService = require("../service/db.service");
const tag = require("../constants/event.constants");

/**
 * handles message viewed actions
 * @param {{
 * single_message_id: number,
 * sender_id: number,
 * receiver_id: number
 * }} payload
 */

async function MyMessage(payload) {
  try {
    const users = await dbService
      .select('*')
      .from("conversation_details")
      .where({ conversation_id: payload.conversation_id });

    if (users && users.length) {
      // io.emit('chat_m', users);
    }
  } catch (error) {
    console.log("Failed to update message status");
  }
}

module.exports = MyMessage;
