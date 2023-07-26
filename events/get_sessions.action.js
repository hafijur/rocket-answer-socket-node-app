const db = require("../service/db.service");
const tag = require("../constants/event.constants");
const { io } = require("../app");

/**
 * notify all users about newly created activity
 * @param {{activity_id: number}} payload
 */
async function GetSessions() {
  try {
    const activities = await db.select('*')
      .from('jp_activity')
      .where('is_cancelled', false)
      .orderBy('activity_id', 'desc');

    io.emit("sessions", activities);
  } catch (error) {
    console.log(error);
  }

  // console.log(activity.rows);
}

module.exports = GetSessions;
