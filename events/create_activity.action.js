/* eslint-disable prefer-const */
const { io } = require("../app");
const tag = require("../constants/event.constants");
const db = require("../service/db.service");

/**
 * add newly joined user to recent_attendants array
 * @param {{
 * title: string,
 * description: string,
 * questions: string,
 * }} payload
 */

async function CreateActivity(payload) {
  // console.log(`\nInside ActivityJoined action ---`, payload, "\n");
  let {
    title,
    description,
    questions,
  } = payload;

  await db
    .table("jp_activity")
    .insert({
      title,
      description,
      question_answers: JSON.stringify(questions)
    });

  // io.emit(tag.NOTIFY_ACTIVITY_JOIN, {}
}

module.exports = CreateActivity;
