const dbService = require("../service/db.service");
const db = require("../service/db.service");

/**
 * User online event
 * @param {{
 * latitude: number,
 * longitude: number, user_id: number,
 * account_type: 'personal' | 'business',
 * profile_picture: string, profile_name: string,
 * socket_id: string
 * device_token: string }} payload
 *
 */
async function Online(payload) {
  try {
    // console.log("\nInside online action---\n");
    payload.online_status = "active";
    payload.last_seen = Date.now();
    payload.location = `POINT(${payload.longitude} ${payload.latitude})`;

    let foundUser = await dbService.raw(`
      SELECT juo.user_id
      FROM jp_user_online juo
      INNER JOIN jp_base_user jbu
      ON jbu.user_id = juo.user_id
      AND jbu.account_status = 'active'
      WHERE juo.user_id = ${payload.user_id}
    `);

    foundUser = foundUser.rows;

    // console.log("\nuser found on online action---", foundUser, "\n");

    if (Array.isArray(foundUser) && foundUser.length && foundUser[0].user_id === payload.user_id) {
      // console.log("\nexisting user\n");
      await db
        .table("jp_user_online")
        .update({
          online_status: payload.online_status,
          last_seen: payload.last_seen,
          location: payload.location,
          socket_id: payload.socket_id,
          device_token: payload.device_token,
          latitude: payload.latitude,
          longitude: payload.longitude,
        })
        .where({ user_id: payload.user_id })
        .andWhere({ account_type: payload.account_type });
    } else {
      // console.log("\nnew user---\n");
      await db.table("jp_user_online").insert(payload);
    }
  } catch (error) {
    console.log("\nFailed to register user\n");
  }
}

module.exports = Online;
