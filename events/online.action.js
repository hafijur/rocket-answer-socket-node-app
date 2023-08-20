const dbService = require("../service/db.service");
const db = require("../service/db.service");
const GetCatWiseSessionsList = require("./get_cat_wise_sessions_list.action");
const GetMySessions = require("./get_my_sessions.action");

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

    db.table('users')
      .update({ device_token: payload.device_token })
      .where('id', payload.user_id);
    const foundUser = await
    db.select('jp_user_online.user_id', 'jp_user_online.category_id').from('jp_user_online')
    // .innerJoin('users', 'jp_user_online.user_id', 'users.id')
      .where('jp_user_online.user_id', payload.user_id).first();

    // console.log('found user is ', foundUser, 'payload is ', payload?.socket_id);

    if (foundUser) {
      await db
        .table("jp_user_online")
        .update({
          online_status: 'active',
          last_seen: payload.last_seen,
          socket_id: payload.socket_id,
          device_token: payload.device_token,
          category_id: payload?.category_id,
          category_name: payload?.category_name,
          subcategory_id: payload?.subcategory_id,
        })
        .where({ user_id: payload.user_id });
    } else {
      await db.table("jp_user_online").insert({
        profile_picture: "http://24.199.122.48/roketanswer/storage/file_upload/168967876087091792.png",
        profile_name: `Rohit ${Math.floor(Math.random() * 1000)}`,
        online_status: payload.online_status,
        account_type: 'personal',
        latitude: 0,
        longitude: 0,
        user_id: payload.user_id,
        last_seen: payload.last_seen,
        socket_id: payload.socket_id,
        device_token: "niuqXN48ZfUvCp6XAAAD",
        user_type: payload.user_type,
        category_id: payload?.category_id,
        category_name: payload?.category_name,
        subcategory_id: payload?.subcategory_id,
      });
    }
    if (foundUser && foundUser.category_id !== null) {
      console.log('online: found user category id is ', foundUser.category_id);
      payload.category_id = foundUser.category_id;
      GetMySessions(payload);
    }
  } catch (error) {
    console.log("\nFailed to register user\n", error);
  }
}

module.exports = Online;
