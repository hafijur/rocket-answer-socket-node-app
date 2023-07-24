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
    // console.log("\nInside online action---\npayload is ", payload);
    payload.online_status = "active";
    payload.last_seen = Date.now();
    // payload.location = `POINT(${payload.longitude} ${payload.latitude})`;

    //   let foundUser = await dbService.raw(`
    //   SELECT *
    //   FROM jp_user_online
    //   INNER JOIN users
    //   ON jp_user_online.user_id = users.id
    //   WHERE users.id = 2
    // `);
    const foundUser = await
    db.select('jp_user_online.user_id').from('jp_user_online').innerJoin('users', 'jp_user_online.user_id', 'users.id')
      .where('users.id', payload.user_id);

    // AND jbu.account_status = 'active'
    // console.log("\nfound user---\n", foundUser);
    // foundUser = foundUser.rows;
    // console.log("\nuser found on online action---", foundUser, "\n");
    // return;
    if (foundUser.length) {
    // if (Array.isArray(foundUser) && foundUser.length && foundUser[0].user_id === payload.user_id) {
      // console.log("\nexisting user\n");
      await db
        .table("jp_user_online")
        .update({
          online_status: 'active',
          last_seen: payload.last_seen,
          socket_id: payload.socket_id,
          device_token: payload.device_token
        })
        .where({ user_id: payload.user_id });
    } else {
      // console.log("\nnew user---\n", payload);

      await db.table("jp_user_online").insert({
        profile_picture: "http://192.168.1.209/roketanswer/storage/file_upload/168967876087091792.png",
        profile_name: `Rohit ${Math.floor(Math.random() * 1000)}`,
        online_status: payload.online_status,
        account_type: payload.account_type,
        latitude: 0,
        longitude: 0,
        user_id: payload.user_id,
        last_seen: payload.last_seen,
        socket_id: payload.socket_id,
        device_token: "niuqXN48ZfUvCp6XAAAD"
      });
    }
  } catch (error) {
    console.log("\nFailed to register user\n", error);
  }
}

module.exports = Online;
