/* eslint-disable prefer-const */
const { io } = require("../app");
const tag = require("../constants/event.constants");
const db = require("../service/db.service");

/**
 * add newly joined user to recent_attendants array
 * @param {{
 * recent_attendants: string[],
 * joined_user_image: string,
 * user_id: number,
 * activity_id: number,
 * status: 'join' | 'leave'
 * join_count: number
 * }} payload
 */

async function GroupJoined(payload) {
  // console.log(`\nInside ActivityJoined action ---`, payload, "\n");
  let { recent_attendants, joined_user_image, activity_id, status, join_count, user_id } = payload;

  const activityInfo = await db.raw(
    `
    SELECT *
    FROM jp_activity jaa
    WHERE jaa.activity_id = ?
  `,
    [activity_id]
  );
  const activityPrivacy = activityInfo.rows[0].privacy;
  console.log(activityPrivacy);

  // console.log(`\nuser joining in ActivityJoined action\n`);
  if (recent_attendants.length > 2) {
    recent_attendants.pop();
  }

  await db
    .table("jp_group_chat_message")
    .insert({
      text: "has joined the activity",
      sent_at: Date.now(),
      activity_id,
      sender_id: user_id,
      status: "sent",
      chat_message_type: "joined",
      owner: "",
    })
    .returning("*");

  join_count += 1;

  recent_attendants.unshift(joined_user_image);
  // console.log(
  //   `\nRecent attendants inside ActivityJoined ${status}--- ${recent_attendants}, and join count ${join_count}\n`
  // );

  io.emit(tag.NOTIFY_ACTIVITY_JOIN, {
    recent_attendants,
    activity_id,
    status,
    join_count,
  });
}

module.exports = GroupJoined;
