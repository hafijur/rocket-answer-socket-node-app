/* eslint-disable prefer-const */
const moment = require("moment");
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
    customer_id,
    price,
    date = moment('2021-01-01').format('YYYY-MM-DD'),
    expert_category_id,

  } = payload;

  await db
    .table("jp_activity")
    .insert({
      title,
      description,
      customer_id,
      subject: description,
      price,
      date,
      expert_category_id,
      question_answers: JSON.stringify(questions)
    });



  // await db
  //   .table("conversations")
  //   .insert({
  //     code: Date.now(),
  //     expert_id: null,
  //     customer_id,
  //     expert_category_id: 1,
  //     expert_sub_category_id: 1,
  //     subject: "test",
  //     price: 1,
  //     date: "2021-01-01",
  //     start_time: "00:00:00",
  //     end_time: "00:00:00",
  //     expert_reply_date: "2021-01-01 00:00:00",
  //     rating: "1",

  //   });

  // io.emit(tag.NOTIFY_ACTIVITY_JOIN, {}
}

module.exports = CreateActivity;
