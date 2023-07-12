const { io } = require("../app");
const dbService = require("../service/db.service");
const tag = require("../constants/event.constants");
const Notification = require("../service/notification.service");

/**
 * handles start surprise activity logic
 * @param {{
 * latitude: number,
 * longitude: number,
 * profile_picture: string,
 * surprise_activity_id: number,
 * time_start: number,
 * time_end: number,
 * user_id: number,
 * owner: string,
 * }} payload
 */

async function StartSurpriseActivity(payload) {
  try {
    console.log(`\nInside StartSurpriseActivity\n`);
    const { latitude, longitude, profile_picture, surprise_activity_id, time_start, time_end, user_id, owner } = payload;

    const origin = {
      type: "Point",
      coordinates: [+longitude, +latitude],
    };
    const range = 2000;

    let users = await dbService.raw(
      `
      SELECT 
        jbu.user_id, socket_id, jbu.device_token
      FROM
        jp_user_online juo
      INNER JOIN
        jp_base_user jbu
      ON
        jbu.user_id = juo.user_id
      AND
        jbu.account_status = 'active'

      WHERE
        ST_DWithin(location, ST_SetSRID(ST_GeomFromGeoJSON(?), ST_SRID(location)) , ?)
 
    `,
      [JSON.stringify(origin), range]
    );

    users = users.rows;

    // console.log(`\nFound nearest users in StartSurpriseActivity---${JSON.stringify(users)}\n`);

    // if (!users.length) {
    //   console.log("\nFinding followers in StartSurpriseActivity---\n");

    //   users = await dbService.raw(`
    //   select
    //     juo.user_id as user_id, juo.socket_id , juo.device_token
    //   from
    //     jp_follow_info jfi
    //   inner join
    //     jp_user_online juo
    //   on
    //     juo.user_id = jfi .following_id
    //   where
    //     jfi.follower_id = ${user_id}
    //   `);

    //   users = users.rows;

    //   console.log(`\nFound follower list in StartSurpriseActivity---${JSON.stringify(users)}\n`);
    // }

    if (users.length) {
      const sockets = [];
      const participants = [];
      const device_tokens = [];

      users.forEach((user) => {
        if (user.socket_id.length) {
          sockets.push(user.socket_id);
        }

        if (user.user_id !== user_id) {
          device_tokens.push(user.device_token);

          participants.push({
            took_invitation: "no",
            user_id: user.user_id,
            surprise_activity_id,
          });
        }
      });

      // console.log("\n\nsocket_ids from StartSurpriseActivity---", sockets);
      // console.log("\ndevice_tokens from StartSurpriseActivity---", device_tokens);
      // console.log("\nParticipants from StartSurpriseActivity---", participants);

      const notificationService = new Notification();
      const notificationPayload = {
        type: "invite_participant",
        body: `${owner} invited you to a surprise activity`,
        title: "New surprise activity",
        fcm_token: device_tokens,
        multiple: true,
      };

      // console.log(`\nPush notification payload---${JSON.stringify(notificationPayload)}`);
      await notificationService.send(notificationPayload);

      if (participants.length) {
        // console.log(`\nInserting participants in StartSurpriseActivity\n`);
        await dbService.table("jp_surprise_participant").insert(participants);
      }

      const notifyPayload = {
        title: "New Surpris Activity",
        recent_attendants: [profile_picture],
        join_count: 1,
        time_start,
        time_end,
        latitude,
        longitude,
        owner,
        surprise_activity_id,
      };

      // console.log(`\nEmitting ${tag.SURPRISE_ACTIVITY_STARTED} with payload: ${JSON.stringify(notifyPayload)}`);

      io.to(sockets).emit(tag.SURPRISE_ACTIVITY_STARTED, notifyPayload);
    }
  } catch (error) {
    console.log(error);
    console.log("Start surprise activity action failed");
  }
}

module.exports = StartSurpriseActivity;
