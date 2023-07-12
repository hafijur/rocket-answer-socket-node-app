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

async function MessageViewed(payload) {
  try {
    // console.log("Message viewed event fired---");
    const { single_message_id, sender_id, receiver_id } = payload;
    const updatedMessage = await dbService
      .table("jp_single_chat_message")
      .update({ status: "seen", received_at: Date.now() })
      .where({ single_message_id })
      .andWhere({ receiver_id })
      .andWhere({ sender_id })
      .returning("*");

    const users = await dbService
      .select(["socket_id", "profile_picture", "profile_name", "user_id"])
      .from("jp_user_online")
      .where({ user_id: sender_id })
      .orWhere({ user_id: receiver_id });

    if (users && users.length) {
      const userInfo = {};
      const sockets = [];

      users.forEach((user) => {
        if (user.user_id === sender_id) {
          userInfo.sender_name = user.profile_name;
          userInfo.sender_image = user.profile_picture;
        } else if (user.user_id === receiver_id) {
          userInfo.receiver_name = user.profile_name;
          userInfo.receiver_image = user.profile_picture;
        }

        if (user.socket_id.length) {
          sockets.push(user.socket_id);
        }
      });

      const recentMessagePayload = {
        ...userInfo,
        ...updatedMessage[0],
      };

      io.to(sockets).emit(tag.RECENT_CHAT, recentMessagePayload);
    }
  } catch (error) {
    console.log("Failed to update message status");
  }
}

module.exports = MessageViewed;
