const db = require("../service/db.service");
const tag = require("../constants/event.constants");
const { io } = require("../app");

/**
 * notify all users about newly created activity
 * @param {{activity_id: number}} payload
 */
async function GetCatWiseOnlineList(payload) {
  console.log('GetCatWiseOnlineList socket is ', payload);
  try {
    const online_users = await db.count('user_online_id as total').from('jp_user_online')
    .where('online_status', 'active')
    .first();
    io.to(payload.socket_id).emit(tag.ONLINE_EXPERTS, online_users.total);
  } catch (error) {
    console.log(error);
  }

  // console.log(activity.rows);
}

module.exports = GetCatWiseOnlineList;
