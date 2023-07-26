const { io } = require("../app");
const dbService = require("../service/db.service");
const tag = require("../constants/event.constants");
const CheckPayload = require("../utils/checkPayload.util");

/**
 * @param {{ surprise_activity_id: number, poll_option_id: number, title: string, user_id: number }} payload
 */

async function VoteActivity(payload) {
  try {
    const validated = CheckPayload(["surprise_activity_id", "poll_option_id", "user_id"], payload);

    if (!validated) {
      return;
    }

    const { surprise_activity_id, poll_option_id, user_id, title } = payload;

    // console.log(payload);
    let message;

    const hasInvited = await dbService
      .select("*")
      .from("jp_surprise_participant")
      .where({ user_id })
      .andWhere({ surprise_activity_id })
      .andWhere({ took_invitation: "yes" });

    if (!hasInvited) {
      return;
    }

    const isVoted = await dbService
      .select("*")
      .from("jp_surprise_poll_vote")
      .where({ surprise_activity_id })
      .andWhere({ poll_option_id })
      .andWhere({ user_id })
      .limit(1);

    // console.log("isVoted---", isVoted);
    let vote_count = 0;

    if (isVoted && isVoted.length) {
      // console.log("in downvote");
      await dbService.table("jp_surprise_poll_vote").where({ poll_vote_id: isVoted[0].poll_vote_id }).del();
      vote_count = await dbService.table("jp_surprise_poll_option").where({ poll_option_id }).decrement("total_vote", 1).returning("total_vote");
      message = `Downvoted ${title} `;
    } else {
      // console.log("in upvote");
      await dbService.table("jp_surprise_poll_vote").insert({ poll_option_id, surprise_activity_id, user_id });
      vote_count = await dbService.table("jp_surprise_poll_option").where({ poll_option_id }).increment("total_vote", 1).returning("total_vote");
      message = `Upvoted ${title} successfully`;
    }

    const eventPayload = {
      poll: {
        poll_option_id,
        total_vote: vote_count[0],
      },
      message,
      surprise_activity_id,
    };

    // console.log("\n\neventPayload---", eventPayload);
    io.emit(tag.NOTIFY_VOTE, eventPayload);
  } catch (error) {
    console.log("\n", error, "\n");
    console.log("\nFAILED TO VOTE ACTIVITY\n");
  }
}

module.exports = VoteActivity;
