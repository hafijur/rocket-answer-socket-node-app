const { io } = require("../app");
const dbService = require("../service/db.service");
const tag = require("../constants/event.constants");

async function UserAcceptJoinRequest(payload) {
  const activity_id = payload;

  const attendantList = await dbService.select("*").from("jp_activity_attendant").where({ activity_id });
  const activityInfo = await dbService.select("*").from("jp_activity").where({ activity_id });

  // const attendants = await dbService.raw(`select * from jp_activity_attendant where activity_id = ${activity_id} order by activity_attendant_id desc limit ${1}`);

  let recent_attendants;

  const images = await dbService.raw(
    `
    SELECT jbu.profile_picture
    FROM jp_activity_attendant jaa
    INNER JOIN jp_base_user jbu
    ON jbu.user_id = jaa.user_id
    AND jbu.account_status = 'active'
    AND jbu.user_id != jaa.user_id
    WHERE jaa.activity_id = ?
    ORDER BY jaa.activity_attendant_id DESC
    LIMIT 3
  `,
    [activity_id]
  );

  if (images && images.rows.length) {
    // eslint-disable-next-line no-const-assign
    recent_attendants = [];

    images.rows.forEach((img) => {
      recent_attendants.push(img.profile_picture);
    });
  }

  io.emit(tag.NOTIFY_ACTIVITY_JOIN, {
    recent_attendants,
    activity_id,
    status: activityInfo.status,
    join_count: attendantList.length,
  });
}

module.exports = UserAcceptJoinRequest;
