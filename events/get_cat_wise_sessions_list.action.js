const db = require("../service/db.service");
const tag = require("../constants/event.constants");
const { io } = require("../app");

/**
 * notify all users about newly created activity
 * @param {{activity_id: number}} payload
 */
async function GetCatWiseSessionsList(payload) {
  // console.log('GetCatWiseSessionsList payload', payload);
  let category_id = null;
  if (payload?.category_id) {
    category_id = payload.category_id;
  }
  if (payload?.expert_category_id) {
    category_id = payload.expert_category_id;
  }
  console.log('GetCatWiseSessionsList category ID ', category_id);
  try {
    let session_sockets = [];
    if (category_id != null) {
      session_sockets = await db.select('user_online_id').from('jp_user_online')
        // .where('online_status', 'active')
        .where('category_id', category_id)
        .pluck('socket_id');
    }

    // console.log('found sessions', session_sockets);

    const activities = await db.select('*')
      .from('conversations')
      .where('expert_category_id', category_id)
      .andWhere('is_expert_closed', false)
      .whereNull('expert_id')
      .orderBy('id', 'desc');
    console.log('cat wise sessions socket is ', session_sockets);
    io.to(session_sockets).emit(tag.SESSIONS, activities);
    console.log('from get cat wise sessions', activities.length);
  } catch (error) {
    console.log(error);
  }

  // console.log(activity.rows);
}

module.exports = GetCatWiseSessionsList;
