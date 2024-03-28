/* eslint-disable prefer-const */
const { io } = require("../app");
const tag = require("../constants/event.constants");
const db = require("../service/db.service");
const my_timeService = require("../service/my_time.service");

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

async function ActivityJoined(payload) {
  // console.log(`\nInside ActivityJoined action ---`, payload, "\n");
  let { recent_attendants = [],
    joined_user_image,
    activity_id,
    user_type,
    privacy = "private",
    status = "join",
    join_count,
    user_id,
    profile_picture = "",
    profile_name,
    socket_id,
  } = payload;

  const sent_at = Date.now();

  const activityInfo = await db.select('*').from('conversations')
    .where('id', activity_id).first();
  if (!activityInfo) {
    return;
  }

  if (status === "join") {
    // console.log(`\nuser joining in ActivityJoined action\n`);
    await db
      .table("conversations")
      .update({
        expert_id: user_type === "expert" ? user_id : activityInfo.expert_id,
        customer_id: user_type === "customer" ? user_id : activityInfo.customer_id,
        start_time: (activityInfo.start_time == null && user_type === "expert") ? my_timeService.getTime() : null,
        expert_reply_date: (activityInfo.date == null && user_type === "expert") ? my_timeService.getDate() : null

      })
      .where("id", activity_id);

    let session_sockets = [];
    const category_id = activityInfo.expert_category_id;
    console.log('category_id', category_id);
    if (category_id != null) {
      session_sockets = await db.select('user_online_id').from('jp_user_online')
      // .where('online_status', 'active')
        .where('category_id', category_id)
        .pluck('socket_id');
    }
    console.log('calling session from activity joined');
    const activities = await db.select('*')
      .from('conversations')
      .where('expert_category_id', activityInfo.expert_category_id)
      .andWhere('is_customer_closed', false)
      .andWhere('is_expert_closed', false)
      .whereNull('expert_id')
      .orderBy('id', 'desc');
    console.log('sessions socket is ', session_sockets, 'activities', activities.length);
    io.to(session_sockets).emit(tag.SESSIONS, activities);

    const chatList = await db.select('*')
      .from('conversation_details')
      .where('conversation_id', activity_id)

      .orderBy('id', 'desc');

    io.to(socket_id).emit('chat_m', chatList);

    if (privacy === "public") {
      io.emit(tag.GET_MESSAGE_GP, {
        group_message_id: chatList.rows[0].group_message_id,
        text: "has joined the activity",
        activity_id: `${activity_id}`,
        sent_at: `${sent_at}`,
        sender_id: user_id,
        chat_message_type: "joined",
        profile_name: `${profile_name}`,
        profile_picture: `${profile_picture}`,
      });
    }

    join_count += 1;

    recent_attendants.unshift(joined_user_image);
  } if (status === "leave") {
    if (recent_attendants.includes(joined_user_image)) {
      await db
        .table("jp_group_chat_message")
        .insert({
          text: "has left the activity",
          sent_at: Date.now(),
          activity_id,
          sender_id: user_id,
          status: "sent",
          chat_message_type: "leave",
          owner: "",
        })
        .returning("*");

      const chatList = await db.raw(
        `
          SELECT *
          FROM jp_group_chat_message jaa
          WHERE jaa.activity_id = ?
          AND jaa.sender_id = ?
          ORDER BY group_message_id DESC LIMIT 1
        `,
        [activity_id, user_id]
      );

      io.emit(tag.GET_MESSAGE_GP, {
        group_message_id: chatList.rows[0].group_message_id,
        text: "has left the activity",
        activity_id: `${activity_id}`,
        sent_at: `${sent_at}`,
        sender_id: user_id,
        chat_message_type: "leave",
        profile_name: `${profile_name}`,
        profile_picture: `${profile_picture}`,
      });

      join_count -= 1;

      const images = await db.raw(
        `
        SELECT jbu.profile_picture
        FROM jp_activity_attendant jaa
        INNER JOIN jp_base_user jbu
        ON jbu.user_id = jaa.user_id
        AND jbu.account_status = 'active'
        AND jbu.user_id != ?
        WHERE jaa.activity_id = ?
        ORDER BY jaa.activity_attendant_id DESC
        LIMIT 3
      `,
        [user_id, activity_id]
      );

      if (images && images.rows.length) {
        recent_attendants = [];

        images.rows.forEach((img) => {
          recent_attendants.push(img.profile_picture);
        });
      }
    }
  }

  if (privacy === "public") {
    io.emit(tag.NOTIFY_ACTIVITY_JOIN, {
      recent_attendants,
      activity_id,
      status,
      join_count,
    });
  }
}

module.exports = ActivityJoined;
