const { io } = require("../app");
const dbService = require("../service/db.service");
const Notification = require("../service/notification.service");
const tag = require("../constants/event.constants");
const MyTime = require("../service/my_time.service");

/**
 * handles message sending action
 * @param {{
 * text: string,
 * room_id: string
 * sender_id: number,
 * receiver_id: number,
 * sent_at: number
 * sender_name: string,
 * sender_image: string
 * }} payload
 */

async function MessageSentGp(payload) {
  console.log(`\nMessageSent Payload ----`, payload);
  try {
    const {
      text,
      activity_id,
      sender_id,
      user_type = "customer" || "expert",
      chat_message_type = 'text',
      receiver_id = null
    } = payload;

    // console.log(`\nMessageSent Payload ----${payload}`);
    let senderType = null;
    let receiverType = null;
    if (user_type === "customer") {
      senderType = 1;
      receiverType = 2;
    } else {
      senderType = 2;
      receiverType = 1;
    }

    const activityInfo = await dbService.select(["*"]).from("conversations").where({ id: activity_id });
    // const activityAttendant = await dbService.select(["user_id"]).from("jp_activity_attendant").where({ activity_id });

    if (activityInfo.length > 0) {
      console.log('working here', sender_id, activityInfo[0].expert_id, activityInfo[0].customer_id, user_type);
      if (user_type == 'expert' && activityInfo[0].expert_id != sender_id) {
        console.log('working here expert not matched');
        return;
      }
      if (user_type == 'customer' && activityInfo[0].customer_id != sender_id) {
        return;
      }
    }
    console.log('working here 2');
    const newMessage = await dbService
      .table("conversation_details")
      .insert({
        message: text,
        // sent_at: Date.now(),
        conversation_id: activity_id,
        sender_id,
        is_sender: senderType,
        is_receiver: receiverType,
        sender_status: 1,
        receiver_status: 0,
        receiver_id,
        created_at: MyTime.getDateTime(),
        // status: "sent",
        chat_message_type,
      // owner: "",
      });

    if (!Object.keys(activityInfo).length) {
      return;
    }

    const ids = [activityInfo[0]?.customer_id, activityInfo[0]?.expert_id].filter((id) => id != null);
    console.log('activity attendant user ids ', ids);

    const activity_users = await dbService.select('*').table('jp_user_online')
      .whereIn('user_id', ids);

    const activity_user_sockets = [];
    activity_users.forEach((user) => {
      activity_user_sockets.push(user.socket_id);
    });

    const newPayload = {
      id: newMessage[0],
      ...payload,
    };

    console.log('activity_attendant sockets', activity_user_sockets);
    console.log('sending to activity------------------------------------- ', activity_id);

    io.to(activity_id).emit(tag.GET_MESSAGE_GP, newPayload);

    if (user_type == 'customer') {
      const $found_notification = await dbService.table('notifications').where({
        type: 1,
        expert_id: activityInfo[0]?.expert_id,
        conversation_id: activityInfo[0]?.id,
      }).first();

      if ($found_notification) {
        await dbService.table('notifications').where({
          type: 1,
          expert_id: activityInfo[0]?.expert_id,
          conversation_id: activityInfo[0]?.id,
        }).update({
          seen_total: false,
          updated_at: MyTime.getDateTime()
        });
      } else {
        await dbService.table('notifications').insert({
          type: 1,
          expert_id: activityInfo[0]?.expert_id,
          conversation_id: activityInfo[0]?.id,
          title: 'New message has been added',
          body: text
        });
      }
    }

    // console.log('sender id ', sender_id);
    const alter_user = activity_users.filter((user) => user.user_id != sender_id);

    // console.log('alter user is ', alter_user);

    const notificationService = new Notification();

    const notificationPayload = {
      title: `${payload?.user_name}`,
      body: text,
      type: "chat_message",
      activity_id,
      fcm_token: alter_user[0]?.device_token,
      sender_image: '',
      sender_name: payload?.username ?? '',
      sender_id,
      multiple: false,
      chat_message_type: "text",
      message_id: newMessage[0]?.id,
    };

    notificationService.send(notificationPayload);
  } catch (error) {
    console.log("\n\nFailed to sent message\n\n", error);
  }
}

module.exports = MessageSentGp;
