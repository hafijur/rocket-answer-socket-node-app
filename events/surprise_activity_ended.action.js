const dbService = require("../service/db.service");
const CheckPayload = require("../utils/checkPayload.util");

/**
 *
 * @param {{ surprise_activity_id: number }} payload
 */
async function SurpriseActivityEnded(payload) {
  try {
    const validated = CheckPayload(["surprise_activity_id"], payload);

    // console.log("surprise activity ended---", validated, payload);

    if (!validated) {
      return;
    }

    const { surprise_activity_id } = payload;

    const surprise_data = await dbService.raw(`
    SELECT title, time_start, time_end, privacy, latitude, longitude, radius, creator AS owner, address AS place,
    
    ARRAY(
      SELECT jsp.user_id
      FROM jp_surprise_participant jsp
      INNER JOIN jp_base_user jbu
      ON jbu.user_id = jsp.user_id
      AND jbu.account_status = 'active'
      WHERE jsp.surprise_activity_id = ${surprise_activity_id}
      AND took_invitation = 'yes'
    ) AS participants
    

    FROM jp_surprise_activity jsa

    INNER JOIN
      jp_surprise_poll_option jspo
    ON
      jspo.surprise_activity_id = jsa.surprise_activity_id

    WHERE jsa.surprise_activity_id = ${surprise_activity_id}

    ORDER BY total_vote DESC
    LIMIT 1
    `);

    // console.log(surprise_data.rows[0]);

    if (!surprise_data.rows.length) {
      return;
    }

    const { title, owner, latitude, longitude, place, privacy, participants, radius } = surprise_data.rows[0];

    // check if already activity created
    const foundActivity = await dbService
      .select(["activity_id", "icon"])
      .from("jp_activity")
      .where({ title })
      .andWhere({ owner })
      .andWhere({ latitude })
      .andWhere({ longitude })
      .andWhere({ is_surprise: true })
      .andWhere({ place })
      .andWhere({ privacy });

    const createdAt = new Date();

    const attendantPayload = {
      activity_id: 0,
      icon_url: "",
      accepted: true,
      createdAt,
      updatedAt: createdAt,
      version: 1,
    };
    const attendants = [];

    if (foundActivity && foundActivity.length) {
      attendantPayload.activity_id = foundActivity[0].activity_id;
      attendantPayload.icon_url = foundActivity[0].icon;

      participants.forEach((p) => attendants.push({ ...attendantPayload, user_id: p }));

      await dbService.table("jp_activity_attendant").where({ activity_id: foundActivity[0].activity_id }).del();
      await dbService.table("jp_activity_attendant").insert(attendants);
    } else {
      const location = `POINT(${longitude} ${latitude})`;

      const hour = 1000 * 60 * 60;
      const time_start = Date.now() + hour * 1;
      const time_end = time_start + hour * 2;

      const createdActivity = await dbService
        .table("jp_activity")
        .insert({
          title,
          privacy,
          latitude,
          longitude,
          place,
          owner,
          location,
          is_surprise: true,
          description: title,
          time_start,
          time_end,
          icon: "1f004.svg",
          radius,
          createdAt,
          updatedAt: createdAt,
          version: 1,
        })
        .returning(["activity_id"]);

      attendantPayload.activity_id = createdActivity[0].activity_id;
      // TODO this shouldn't be hardcoded
      attendantPayload.icon_url = "1f004.svg";

      participants.forEach((user_id) => attendants.push({ ...attendantPayload, user_id }));

      await dbService.table("jp_activity_attendant").insert(attendants);
    }
  } catch (error) {
    console.log(error);
    console.log("Surprise activity ended event action failed");
  }
}

module.exports = SurpriseActivityEnded;
