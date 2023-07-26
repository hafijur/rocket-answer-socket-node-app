const dbService = require("../service/db.service");
const tag = require("../constants/event.constants");
const { io } = require("../app");
const Notification = require("../service/notification.service");
const appConfig = require("../config/app.config");

async function GetActivityInfo(surprise_activity_id) {
  const activityInfo = await dbService.raw(
    `
    SELECT 
      jsa.time_start, jsa.time_end,
      'New Surprise Activity' AS title,
      (SELECT COUNT(participant_id) FROM jp_surprise_participant jsp WHERE jsp.surprise_activity_id = ? AND took_invitation = 'yes') AS join_count,

    ARRAY(
      SELECT
        jbu.profile_picture
      FROM
        jp_surprise_participant jspa
      INNER JOIN
        jp_base_user jbu
      ON
        jbu.user_id = jspa.user_id
      AND
        jbu.account_status = 'active'
      AND
        took_invitation = 'yes'
      AND
        jspa.surprise_activity_id = ?

      ORDER BY
        jspa.participant_id DESC
      LIMIT 3
    ) AS recent_attendants
    
    FROM
      jp_surprise_activity jsa
    WHERE
      jsa.surprise_activity_id = ?
`,
    [surprise_activity_id, surprise_activity_id, surprise_activity_id]
  );

  return activityInfo.rows[0];
}

/**
 * @param {{
 * id: number[], surprise_activity_id: number,
 * owner: string, user_id: number,
 * latitude: number, longitude: number
 * }} payload
 */

async function InviteParticipant(payload) {
  try {
    // console.log(`\nInside InviteParticipant\n`);
    const { id, surprise_activity_id, owner, latitude, longitude, user_id } = payload;

    // console.log("invite payload---", payload);

    if (!Array.isArray(id) && !id.length) {
      // console.log("NOT ARRAY---");
      return;
    }

    let users = await dbService.raw(`
        SELECT
        juo.device_token, socket_id, juo.user_id, jbu.send_notification
      FROM
        jp_user_online juo
      INNER JOIN
        jp_base_user jbu
      ON
        jbu.user_id = juo.user_id
      AND
        jbu.account_status = 'active'
  
      WHERE
        juo.user_id IN (${id})
    `);

    users = users.rows;

    // console.log(`\n found users in InviteParticipant---${users}\n`);

    if (!users.length) {
      return;
    }

    const sockets = [];
    const device_tokens = [];
    const invitationPayload = [];

    users.forEach((user) => {
      if (user.socket_id && user.socket_id.length) {
        sockets.push(user.socket_id);
      }

      if (user.user_id !== user_id) {
        invitationPayload.push({
          surprise_activity_id,
          user_id: user.user_id,
          took_invitation: "no",
        });
      }

      if (user.send_notification) {
        device_tokens.push(user.device_token);
      }
    });

    // console.log(`\nsockets in InviteParticipant---${sockets}`);
    // console.log(`\ndevice tokens in InviteParticipant---${device_tokens}`);
    // console.log(`\nInvitation payload in InviteParticipant---${invitationPayload}`);

    if (sockets.length) {
      const activityInfo = await GetActivityInfo(surprise_activity_id);
      activityInfo.owner = owner;
      activityInfo.surprise_activity_id = surprise_activity_id;
      activityInfo.latitude = latitude;
      activityInfo.longitude = longitude;
      // console.log(`\nEmitting ${tag.SURPRISE_ACTIVITY_STARTED} with payload--- ${JSON.stringify(activityInfo)}\n`);
      io.to(sockets).emit(tag.SURPRISE_ACTIVITY_STARTED, activityInfo);
    }

    const time_start = Date.now();
    const time_end = time_start + appConfig.ACTIVITY_DURATION;

    // console.log(`\nUpdating surprise activity time\n`);
    await dbService
      .table("jp_surprise_activity")
      .update({
        time_start,
        time_end,
      })
      .where({ surprise_activity_id });

    await dbService.table("jp_surprise_participant").insert(invitationPayload);

    // console.log("device_tokens---", device_tokens);
    if (device_tokens.length) {
      const notificationService = new Notification();

      const notificationPayload = {
        type: "invite_participant",
        body: owner ? `${owner} invited you to a surprise activity` : "You are invited to a new surprise party",
        title: "New surprise activity",
        fcm_token: device_tokens,
        multiple: true,
      };

      notificationService.send(notificationPayload);
    }
  } catch (error) {
    // console.log(error);
  }
}

module.exports = InviteParticipant;
