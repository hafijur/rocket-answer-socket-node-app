const { io } = require("../app");

const actions = require("../events");
const tag = require("../constants/event.constants");
const Notification = require('./notification.service');
const dbService = require("./db.service");

const socketRooms = new Map();
const sessions = new Map();
// const chatcicle = {};
const questions = [
  'What is your name?',
  'How old are you?'
];

io.on(tag.CONNECTION, (socket) => {
  // console.log(socket);
  console.log(`Socket connected on ${socket.id}`);
  // actions.GetSessions(socket);

  function askQuestion(index) {
    if (index >= questions.length) {
      // All questions have been asked
      const session = sessions.get(socket.id);
      if (session) {
        const responses = questions.map((question, i) => ({
          question,
          answer: session.answers[i].answer
        }));
        io.to(socket.id).emit('questions completed', responses);
        // Close the session and remove session data
        socket.disconnect(true);
        sessions.delete(socket.id);
      }
      return;
    }

    const question = questions[index];
    io.to(socket.id).emit('ask question', question);
  }

  // Start asking questions when the client is ready
  socket.on('ready', () => {
    // Initialize session data for the client
    sessions.set(socket.id, { answers: [], currentIndex: 0 });

    askQuestion(0);
  });

  socket.on('get_my_sessions', (payload) => {
    actions.GetMySessions(payload);
  });
  socket.on(tag.GET_ONLINE_EXPERTS, (payload) => {
    // console.log('GetCatWiseOnlineList socket is ', payload);
    actions.GetCatWiseOnlineList(payload);
  });

  // Handle client's answers
  socket.on('answer', (answer) => {
    const session = sessions.get(socket.id);
    if (session) {
      session.answers.push(answer);
      const nextIndex = session.currentIndex + 1;
      session.currentIndex = nextIndex;

      if (nextIndex >= questions.length) {
        // All questions have been answered
        askQuestion(nextIndex); // This will emit "questions completed" event
      } else {
        // Ask the next question
        askQuestion(nextIndex);
      }
    }
  });

  // Join a room
  socket.on('join room', (room) => {
    socket.join(room);
    socketRooms.set(socket, room);
    console.log(`User joined room: ${room}`);
    actions.GetSessions();
  });

  // Handle incoming chat messages
  socket.on('chat message', (data) => {
    if (socketRooms.has(socket)) {
      const room = socketRooms.get(socket);
      console.log(`Broadcasting message to room: ${room}`);

      io.to(room).emit('chat message', data);
    }
  });

  socket.on(`typing`, (data) => {
    if (socketRooms.has(socket)) {
      const room = socketRooms.get(socket);
      console.log(`Broadcasting message to room: ${room}`);
      io.to(room).emit(`typing`, data);
    }
  });

  /** ********************
  * end of new code
  *********************** */

  socket.on(tag.ONLINE, (payload) => {
    socket.user_id = payload.user_id;
    socket.account_type = payload.account_type;
    payload.socket_id = socket.id;
    socket.userData = payload;

    actions.Online(payload);

    io.emit(tag.USER_JOINED, payload);

    const onlinePayload = {
      user_id: payload.user_id,
      last_seen: Date.now(),
      account_type: payload.account_type,
      online_status: "active",
    };

    io.emit(tag.USER_ONLINE, onlinePayload);
  });

  socket.on(tag.GET_NEAREST_USERS, async (payload) => {
    const users = await actions.GetNearestUsers(payload);

    io.to(socket.id).emit(tag.NEAREST_USER_LIST, users);
  });

  socket.on(tag.ACTIVITY_CREATED, async (payload) => {

    const notificationService = new Notification();

    const notificationPayload = {
      title: payload.title,
      body: payload.description,
      topic: payload.topic,
      type: "notify_new_request",

    };

    notificationService.sendTopicNotificaion(notificationPayload);

    io.emit(tag.NOTIFY_ACTIVITY, payload);
    actions.GetCatWiseSessionsList(payload);
  });

  socket.on(tag.REFRESH_SESSIONS, async (payload) => {
    actions.GetSessions(payload);
  });

  socket.on(tag.ACTIVITY_JOINED, (payload, error) => {
    console.log('Activity joined', payload);
    dbService.table('conversations').where('id', payload.activity_id).first().then((res) => {
      actions.ActivityJoined(payload);
      // if(payload.user_type === 'expert') {
        // actions.GetCatWiseSessionsList(payload);
      // }
      // if (payload.user_type === 'customer') {
      //   if (res.customer_id == null || payload.user_id === res.customer_id) {
      //     error("Already joined a customer");
      //   } else {
      //     actions.ActivityJoined(payload);
      //   }
      // } else if (payload.user_type === 'expert') {
      //   if (res.expert_id == null || payload.user_id === res.expert_id) {
      //     actions.ActivityJoined(payload);
      //   } else {
      //     error("Already joined an expert");
      //   }
      // }
    });
  });

  // socket.on(tag.GROUP_JOINED, (payload) => {
  //   actions.GroupJoined(payload);
  // });

  // socket.on(tag.CREATE_SURPRISE_ACTIVITY, (payload) => {
  //   actions.StartSurpriseActivity(payload);
  // });

  // socket.on(tag.INVITE_PARTICIPANT, (payload) => {
  //   actions.InviteParticipant(payload);
  // });

  // socket.on(tag.JOIN_SURPRISE_ACTIVITY, (payload) => {
  //   actions.JoinSurpriseActivity(payload);
  // });

  // socket.on(tag.CREATE_SURPRISE_POLL, (payload) => {
  //   io.emit(tag.NOTIFY_SURPRISE_POLL, payload);
  // });

  // socket.on(tag.VOTE_ACTIVITY, (payload) => {
  //   actions.VoteActivity(payload);
  // });

  // socket.on(tag.SURPRISE_ACTIVITY_ENDED, (payload) => {
  //   actions.SurpriseActivityEnded(payload);
  // });

  // socket.on(tag.ACTIVITY_CANCELLED, (payload) => {

  //   io.emit(tag.NOTIFY_ACTIVITY_CANCELLED, payload);
  // });

  // socket.on(tag.MESSAGE_SENT, (payload) => {
  //   actions.MessageSent(payload);
  // });

  socket.on(tag.MESSAGE_SENT_GP, (payload) => {
    actions.MessageSentGp(payload);
  });

  io.on(tag.GET_MESSAGE, (payload) => {
    console.log('GET_MESSAGE listening: ', payload);
  });

  socket.on(tag.SET_MESSAGE_GP, (payload) => {
    io.emit(tag.GET_MESSAGE_GP, payload);
  });

  socket.on(tag.SET_VIEW_MESSAGE_GP, (payload) => {
    // console.log(`SET_VIEW_MESSAGE_GP`);
    // console.log(payload);
    actions.MessageViewedGp(payload);
    io.emit(tag.GET_VIEW_MESSAGE_GP, payload);
  });

  socket.on(tag.SET_REMOVE_JOIN_REQUEST, (payload) => {
    // console.log(`SET_REMOVE_JOIN_REQUEST`);
    // console.log(payload);
    io.emit(tag.GET_REMOVE_JOIN_REQUEST, payload);
  });

  socket.on(tag.MESSAGE_VIEWED, (payload) => {
    // console.log(`user_id:${payload.receiver_id} viewed user_id:${payload.sender_id} message_id:${payload.message_id}`);
    // console.log(`\nCaught ${tag.MESSAGE_VIEWED} event with payload: ${JSON.stringify(payload)}\n`);
    actions.MessageViewed(payload);
  });

  socket.on(tag.UPLOAD_FILE, (payload) => {
    console.log("upload file event fired---", payload);
    // console.log(`\nCaught ${tag.UPLOAD_FILE} event with payload: ${JSON.stringify(payload)}\n`);

    actions.FileUploaded(payload);
  });

  socket.on(tag.UPLOAD_FILE_GP, (payload) => {
    console.log("upload file event fired---", payload);
    actions.FileUploadedGp(payload);
  });

  socket.on(tag.USER_ACCEPT_JOIN_REQUEST, (payload) => {
    console.log("USER ACCEPT JOIN REQUEST event fired---", payload);
    actions.UserAcceptJoinRequest(payload);
  });

  socket.on(tag.FORCE_DISCONNECT, () => {
    // console.log("\n\n", "inside force disconnect", "\n\n");
    // console.log(socket.userData);
    // console.log(socket.user_id);
    // console.log(socket.account_type);
  });

  socket.on(tag.DISCONNECT, () => {
    console.log("\nUser disconnected--- user_id:", socket.user_id, " socket_id:", socket.id, "\n");
    actions.Disconnect({ user_id: socket.user_id, account_type: 'personal' });
    io.emit(tag.USER_LEFT, socket.userData);
    io.emit(tag.USER_OFFLINE, {
      user_id: socket.user_id,
      account_type: socket.account_type,
      last_seen: Date.now(),
      online_status: "inactive",
    });
  });
});
