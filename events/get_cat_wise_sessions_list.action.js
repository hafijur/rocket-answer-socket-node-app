const db = require("../service/db.service");
const tag = require("../constants/event.constants");
const { io } = require("../app");

/**
 * notify all users about newly created activity
 * @param {{activity_id: number}} payload
 */
async function GetCatWiseSessionsList(payload) {
  // console.log('GetCatWiseSessionsList socket is ', payload);
  const category_id = payload?.category_id || payload?.expert_category_id || null;
  try {
    const session_sockets = await db.select('user_online_id').from('jp_user_online')
      // .where('online_status', 'active')
      .where('category_id', category_id)
      .pluck('socket_id');

    // console.log('found sessions', session_sockets);

    const activities = await db.select('*')
      .from('conversations')
      .where('expert_category_id', category_id)
      .andWhere('is_expert_closed', false)
      .whereNull('expert_id')
      .orderBy('id', 'desc');
    // console.log('sessions socket is ', payload.socket.id);
    io.to(session_sockets).emit(tag.SESSIONS, activities);
  } catch (error) {
    console.log(error);
  }

  // console.log(activity.rows);
}

module.exports = GetCatWiseSessionsList;
