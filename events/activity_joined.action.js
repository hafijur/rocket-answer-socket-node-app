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
    console.log(`\nuser joining in ActivityJoined action\n`);
    await db
      .table("conversations")
      .update({
        expert_id: user_type === "expert" ? user_id : activityInfo.expert_id,
        customer_id: user_type === "customer" ? user_id : activityInfo.customer_id,

      })
      .where("id", activity_id);
    if (recent_attendants.length > 2) {
      recent_attendants.pop();
    }

    const $data = await db.select('*').from('jp_activity_attendant')
      .where('activity_id', activity_id)
      .where('user_id', user_id);

    if (!$data.length) {
      try {
        await db
          .table("jp_activity_attendant")
          .insert({
            activity_id,
            user_id,
            accepted: 1,
            icon_url: profile_picture,
            version: 1,

          });
      } catch (error) {
        console.log("activity_joined.action-77 ", error);
      }
    }

    if (privacy === 'public') {
      // await db
      //   .table("jp_group_chat_message")
      //   .insert({
      //     text: "has joined the activity",
      //     sent_at: `${sent_at}`,
      //     activity_id,
      //     sender_id: user_id,
      //     status: "sent",
      //     chat_message_type: "joined",
      //     owner: "",
      //   })
      //   .returning("*");
    } else if (privacy === 'private') {
      // await db
      //   .table("jp_group_chat_message")
      //   .insert({
      //     text: "wants to joined the activity",
      //     sent_at: `${sent_at}`,
      //     activity_id,
      //     sender_id: user_id,
      //     status: "sent",
      //     chat_message_type: "joinedRequest",
      //     owner: "",
      //   })
      //   .returning("*");
      // await db
      // .table("conversation_details")
      // .insert({
      //   text: "wants to joined the activity",
      //   sent_at: `${sent_at}`,
      //   activity_id,
      //   sender_id: user_id,
      //   status: "sent",
      //   chat_message_type: "joinedRequest",
      //   owner: "",
      // })
      // .returning("*");
    }
    // const chatList = await db.raw(
    //   `
    //   SELECT *
    //   FROM jp_group_chat_message jaa
    //   WHERE jaa.activity_id = ?
    //   AND jaa.sender_id = ?
    //   ORDER BY group_message_id DESC LIMIT 1
    // `,
    //   [activity_id, user_id]
    // );
    const chatList = await db.select('*')
      .from('conversation_details')
      .where('conversation_id', activity_id)

      .orderBy('id', 'desc');

    io.to(socket_id).emit('chat_m', chatList);

    if (privacy === "private") {
      // io.emit(tag.GET_MESSAGE_GP, {
      //   group_message_id: chatList.group_message_id,
      //   text: "wants to joined the activity",
      //   activity_id: `${activity_id}`,
      //   sent_at: `${sent_at}`,
      //   sender_id: user_id,
      //   chat_message_type: "joinedRequest",
      //   profile_name: `${profile_name}`,
      //   profile_picture: `${profile_picture}`,
      // });
    } else if (privacy === "public") {
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
    // console.log(
    //   `\nRecent attendants inside ActivityJoined ${status}--- ${recent_attendants}, and join count ${join_count}\n`
    // );
  } if (status === "leave") {
    // console.log(`\nuser leaving in ActivityJoined action\n`);

    if (recent_attendants.includes(joined_user_image)) {
      // recent_attendants = recent_attendants.filter((image) => image !== joined_user_image);

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

      // console.log(recent_attendants);
    }
  }

  // console.log(
  //   `\nEmitting ${tag.NOTIFY_ACTIVITY_JOIN} with payload--- recent_attendants: ${JSON.stringify(
  //     recent_attendants
  //   )}, status: ${status}, join_count: ${join_count}`
  // );

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
