const db = require("../service/db.service");
const tag = require("../constants/event.constants");
const { io } = require("../app");

/**
 * notify all users about newly created activity
 * @param {{activity_id: number}} payload
 */
async function GetMySessions(payload) {
  try {
    const activities = await db.select('*')
      .from('conversations')
      .where('expert_category_id', payload.category_id)
      .andWhere('is_expert_closed', false)
      .andWhere('is_customer_closed', false)
      .whereNull('expert_id')
      .orderBy('id', 'desc');
    console.log('get my sessions socket is ', payload?.socket_id);
    if (payload?.category_id != null) {
      io.to(payload.socket_id).emit(tag.SESSIONS, activities);
    }
    console.log('from get my sessions', activities.length);
  } catch (error) {
    console.log(error);
  }

  // console.log(activity.rows);
}

module.exports = GetMySessions;
