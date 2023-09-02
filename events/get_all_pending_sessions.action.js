const db = require("../service/db.service");
const tag = require("../constants/event.constants");
const { io } = require("../app");

/**
 * notify all users about newly created activity
 * @param {{activity_id: number}} payload
 */
async function GetAllPendingSessions() {
  try {
    const data = await db.select([
      'conversations.*',
      'expert_categories.name as category_name',
      'customers.name as c_name',

    ]).table('conversations')
      .leftJoin('expert_categories', 'conversations.expert_category_id', '=', 'expert_categories.id')
      .leftJoin('customers', 'conversations.customer_id', '=', 'customers.user_id')
      .whereNull('expert_id')
      .orderBy('conversations.id', 'desc');
    console.log('from get all pending sessions');
    io.emit(tag.EXPERT_ALL_PENDING_SESSIONS, data);
  } catch (error) {
    console.log('error from get all pending sessions', error);
  }

  // console.log(activity.rows);
}

module.exports = GetAllPendingSessions;
