const { io } = require("../app");
const dbService = require("../service/db.service");

const tag = require("../constants/event.constants");

/**
 * @param {{user_id: number, surprise_activity_id: number, profile_picture: string}} payload
 * @returns {void}
 */

async function JoinSurpriseActivity(payload) {
  // console.log(`\nInside JoinSurpriseActivity\n`);
  const { user_id, surprise_activity_id } = payload;

  try {
    await dbService
      .table("jp_surprise_participant")
      .update({
        took_invitation: "yes",
      })
      .where({ user_id })
      .andWhere({ surprise_activity_id });

    // console.log(`\nEmitting ${tag.JOINED_SURPRISE_ACTIVITY} event with payload: ${JSON.stringify(payload)}\n`);

    io.emit(tag.JOINED_SURPRISE_ACTIVITY, payload);
  } catch (error) {
    console.log("Failed to update join surprise activity");
  }
}

module.exports = JoinSurpriseActivity;
