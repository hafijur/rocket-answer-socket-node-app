const { io } = require("../app");

const actions = require("../events");
const tag = require("../constants/event.constants");

io.on(tag.CONNECTION, (socket) => {
  // console.log(`Socket connected on ${socket.id}`);

  socket.on(tag.ONLINE, (payload) => {
    // console.log("USER ONLINE-------", process.pid);

    socket.user_id = payload.user_id;
    socket.account_type = payload.account_type;
    socket.userData = payload;
    payload.socket_id = socket.id;

    actions.Online(payload);
    io.emit(tag.USER_JOINED, payload);
  });

  socket.on(tag.GET_NEAREST_USERS, async (payload) => {
    const users = await actions.GetNearestUsers(payload);

    console.log("Dispatching current user to nearest users");
    io.to(socket.id).emit(tag.NEAREST_USER_LIST, users);

    // actions.BroadcastToNearestUser({ users, userData: socket.userData });
  });

  socket.on(tag.ACTIVITY_CREATED, async (payload) => {
    console.log("activity created----");

    const activity = await actions.GetActivityInfo(payload, socket.user_id);

    io.emit(tag.NOTIFY_ACTIVITY, activity[0]);
  });

  socket.on(tag.ACTIVITY_JOINED, (payload) => {
    actions.ActivityJoined(payload);
  });

  socket.on(tag.CREATE_SURPRISE_ACTIVITY, (payload) => {
    actions.StartSurpriseActivity(payload);
  });

  socket.on(tag.INVITE_PARTICIPANT, (payload) => {
    actions.InviteParticipant(payload);
  });

  socket.on(tag.JOIN_SURPRISE_ACTIVITY, (payload) => {
    console.log(tag.JOIN_SURPRISE_ACTIVITY, payload);
    actions.JoinSurpriseActivity(payload);
  });

  socket.on(tag.CREATE_SURPRISE_POLL, (payload) => {
    io.emit(tag.NOTIFY_SURPRISE_POLL, payload);
  });

  socket.on(tag.VOTE_ACTIVITY, (payload) => {
    actions.VoteActivity(payload);
  });

  socket.on(tag.DISCONNECT, () => {
    console.log("User disconnected---", socket.user_id, socket.id, process.pid);
    actions.Disconnect({ user_id: socket.user_id, account_type: socket.account_type });
    io.emit(tag.USER_LEFT, socket.userData);
  });
});
