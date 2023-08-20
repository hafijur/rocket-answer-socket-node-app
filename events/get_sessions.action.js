const db = require("../service/db.service");
const tag = require("../constants/event.constants");
const { io } = require("../app");

/**
 * notify all users about newly created activity
 * @param {{activity_id: number}} payload
 */
async function GetSessions(socket = null) {
  try {
    const activities = await db.select('*')
      .from('conversations')
      .andWhere('is_expert_closed', false)
      .whereNull('expert_id')
      .orderBy('id', 'desc');
    console.log('GetSessions sessions socket is ', socket);
    io.emit("sessions", activities);
  } catch (error) {
    console.log(error);
  }

  // console.log(activity.rows);
}

module.exports = GetSessions;
