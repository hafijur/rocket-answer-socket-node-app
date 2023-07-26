const db = require("../service/db.service");

/**
 * disconnects a user from socket
 * @param {{user_id: number, account_type: "personal" | "business"}} payload
 */

async function Disconnect(payload) {
  if (typeof payload === "object" && payload.user_id && payload.account_type) {
    await db
      .table("jp_user_online")
      .update({ online_status: "inactive",
        last_seen: Date.now(),
        socket_id: "",
        latitude: 0,
        longitude: 0,
        location: `fgfg`
      })
      .where({ user_id: payload.user_id })
      .andWhere({ account_type: payload.account_type });
    console.log(`disconnected`, payload.user_id);
  }
}

module.exports = Disconnect;
