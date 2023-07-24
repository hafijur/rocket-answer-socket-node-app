const db = require("../service/db.service");

/**
 * notify all users about newly created activity
 * @param {{activity_id: number}} payload
 */
async function NotifyActivity(payload) {
  try {
    // console.log(`\nInside NotifyActivity action--- new \n`);
    // console.log(payload);

    if (Object.keys(payload).length && payload.activity_id && typeof payload.activity_id === "number") {
      const activity = await db.raw(
        `
        SELECT
          activity_id, icon, title, time_start, time_end, place, privacy, latitude, longitude,
          radius AS event_radius, is_wish, is_boosted, is_surprise, owner,
          0 AS distance,
          
          ARRAY(
            SELECT
              jbu.profile_picture
            FROM
              jp_activity_attendant jaa
            INNER JOIN
              jp_base_user jbu
            ON
              jbu.user_id = jaa.user_id
            AND 
              jbu.account_status = 'active'
            WHERE
              jaa.activity_id = ? 
            AND
              jaa.accepted = true
            ORDER BY
              jaa.activity_attendant_id DESC
            LIMIT 3
          ) AS recent_attendants,
  
          (SELECT COUNT(activity_attendant_id) FROM jp_activity_attendant  WHERE activity_id = ? AND accepted = true)::INTEGER AS join_count
  
        FROM
          jp_activity
        WHERE
          activity_id = ?
      `,
        [payload.activity_id, payload.activity_id, payload.activity_id]
      );

      // console.log(`\nFound activities: ${activity.rows}\n`);
      return activity.rows;
    }
  } catch (error) {
    console.log(error);
  }

  // console.log(activity.rows);
}

module.exports = NotifyActivity;
