const db = require("../service/db.service");

/**
 * gets all users nearest given lat, long
 * @param {{latitude: number, longitude: number}} payload
 */
async function GetNearestUsers(payload) {
  console.log(`\nInside GetNearestUsers action---\n`);
  console.log(payload);
  const range = 2000;
  const origin = {
    type: "Point",
    coordinates: [payload.longitude, payload.latitude],
  };
  const userID = payload.user_id;

  try {
    const users = await db.raw(
      `
      SELECT
        jbu.profile_picture, jbu.user_id, jbu.profile_name, juo.latitude, juo.longitude, socket_id
  
      FROM
        jp_user_online juo

      INNER JOIN
        jp_base_user jbu
      ON
        jbu.user_id = juo.user_id
      AND
        jbu.account_status = 'active'
  
      WHERE
        online_status = 'active'
      AND
        ST_DWithin(location, ST_SetSRID(ST_GeomFromGeoJSON(?), ST_SRID(location)) , ?)
    `,
      [JSON.stringify(origin), range]
    );

    const blockUser = await db.raw(`SELECT * FROM jp_user_block`);
    const blockUserList = blockUser.rows;

    const checkBlock = (user_id) => {
      let revelu;
      blockUserList.forEach((item) => {
        if (user_id === item.blocked_user_id) {
          revelu = true;
        } else if (user_id === item.blocker_user_id) {
          revelu = true;
        } else {
          revelu = false;
        }
      });
      return revelu;
    };

    // console.log(`\nfound users on GetNearestUsers action--- ${JSON.stringify(users.rows)}\n`);

    const getUsersList = users.rows;
    const usersList = [];

    // eslint-disable-next-line no-shadow, array-callback-return
    getUsersList.map((users) => {
      usersList.push({
        profile_picture: users.profile_picture,
        user_id: users.user_id,
        profile_name: users.profile_name,
        latitude: users.latitude,
        longitude: users.longitude,
        socket_id: users.socket_id,
        is_block: checkBlock(userID),
      });
    });

    console.log('usersList : ');
    console.log(usersList);

    // return users.rows;
    return usersList;
  } catch (error) {
    console.log("Failed to get user list");
  }
}

module.exports = GetNearestUsers;
