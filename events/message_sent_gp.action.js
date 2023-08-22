const { io } = require("../app");
const dbService = require("../service/db.service");
const Notification = require("../service/notification.service");
const tag = require("../constants/event.constants");
const appConfig = require("../config/app.config");
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
      chat_message_type,
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

    const activity_users = await dbService.select('*').table('jp_user_online')
      .whereIn('user_id', [activityInfo[0]?.customer_id, activityInfo[0]?.expert_id]);

    const activity_user_sockets = [];
    activity_users.forEach((user) => {
      activity_user_sockets.push(user.socket_id);
    });

    const newPayload = {
      id: newMessage[0],
      ...payload,
    };

    console.log('new payload is ', newPayload);

    io.to(activity_user_sockets).emit(tag.GET_MESSAGE_GP, newPayload);

    if (user_type === 'customer') {
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

    // console.log('notification payload is ', notificationPayload);

    notificationService.send(notificationPayload);

    // activityAttendant.forEach(async (attendant) => {
    //   const senderInfo = await dbService.select(["socket_id", "user_id", "device_token"])
    //     .from("jp_user_online")
    //     .where({ user_id: attendant.user_id });

    //   const baseUser = await dbService.select("*").from("users").where({ id: sender_id });
    //   if (activity_id && sender_id !== attendant.user_id) {
    //     const notificationService = new Notification();

    //     const notificationPayload = {
    //       title: `${baseUser[0]?.name}`,
    //       body: text,
    //       type: "chat_message",
    //       activity_id,
    //       fcm_token: senderInfo[0]?.device_token,
    //       sender_image: (baseUser[0]?.profile_photo_path == null) ? null : `${appConfig.PHOTO_BASE_PATH}/${baseUser[0].profile_photo_path}`,
    //       sender_name: baseUser[0]?.username,
    //       sender_id,
    //       multiple: false,
    //       chat_message_type: "text",
    //       message_id: newMessage[0].single_message_id,
    //     };

    //     notificationService.send(notificationPayload);
    //   }

    //   const sockets = [];
    //   if (senderInfo[0]?.socket_id) {
    //     // find user_id from senderifo where user_id != sender_id
    //     senderInfo.forEach((info) => {
    //       // if (info.user_id !== sender_id) {
    //       sockets.push(info.socket_id);
    //       // }
    //     });

    //     sockets.push(senderInfo[0].socket_id);

    //     io.to(sockets).emit(tag.GET_MESSAGE_GP, payload);
    //   }

    //   // // console.log({ sockets });
    //   const recentMessagePayload = {
    //     ...newMessage[0],
    //     sender_name: senderInfo[0]?.username,
    //     sender_image: senderInfo[0]?.profile_picture,
    //     sender_id,
    //     activity_id,
    //     chat_type: "group",
    //   };

    //   if (senderInfo.length && senderInfo[0]?.socket_id) {
    //     sockets.push(senderInfo[0].socket_id);
    //   }

    //   // // console.log({ sockets });

    //   // io.to(sockets).emit(tag.RECENT_CHAT, recentMessagePayload);
    // });
  } catch (error) {
    console.log("\n\nFailed to sent message\n\n", error);
  }
}

module.exports = MessageSentGp;
