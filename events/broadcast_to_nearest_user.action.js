const { io } = require("../app");
const tag = require("../constants/event.constants");

/**
 * Broadcast joined user to all other nearest user
 * @param {*} payload
 */
function BroadcastToNearestUser(payload) {
  // console.log("Inside broadcast payload");

  if (payload.users && payload.users.length && payload.userData && typeof payload.userData === "object") {
    const sockets = [];

    payload.users.forEach((user) => sockets.push(user.socket_id));
    io.to(sockets).emit(tag.USER_JOINED, payload.userData);
  }
}

module.exports = BroadcastToNearestUser;
