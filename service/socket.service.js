const { io } = require("../app");

const actions = require("../events");
const tag = require("../constants/event.constants");

const socketRooms = new Map();
const sessions = new Map();
// const chatcicle = {};
const questions = [
  'What is your name?',
  'How old are you?'
];

io.on(tag.CONNECTION, (socket) => {
  // console.log(socket);
  // console.log(`Socket connected on ${socket.id}`);
  actions.GetSessions();

  let connection = 0;

  /** ********************
  * start of new code
  *********************** */
  console.log('A user connected');

  // Function to ask a question to the client
  // Function to ask a question to the client
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
    actions.MyMessage({ conversation_activity_idid: 1 });
    // actions.MyMessage(room);
  });

  // Handle incoming chat messages
  socket.on('chat message', (data) => {
    // eslint-disable-next-line no-plusplus
    connection++;
    console.log('Received message:', data);
    // Check if the socket has joined a room before broadcasting the message
    if (socketRooms.has(socket)) {
      const room = socketRooms.get(socket);
      console.log(`Broadcasting message to room: ${room}`);

      io.to(room).emit('chat message', data);
    }
    // console.log(`Total connections: ${connection}`);
  });

  // on typing

  socket.on(`typing`, (data) => {
    // eslint-disable-next-line no-plusplus

    console.log('typing:', data);
    // Check if the socket has joined a room before broadcasting the message
    if (socketRooms.has(socket)) {
      const room = socketRooms.get(socket);
      console.log(`Broadcasting message to room: ${room}`);
      io.to(room).emit(`typing`, data);
    }
    console.log(`Total connections: ${connection}`);
  });

  /** ********************
  * end of new code
  *********************** */

  socket.on(tag.ONLINE, (payload) => {
    // console.log("\nUSER ONLINE------- payload: ", payload, "\n");
    // console.log("\nUSER ONLINE-------  ", payload.user_id, "\n");

    // console.log('user online', payload);

    socket.user_id = payload.user_id;
    socket.account_type = payload.account_type;
    payload.socket_id = socket.id;
    // console.log("\n\n", tag.ONLINE, payload, "\n");
    socket.userData = payload;

    actions.Online(payload);

    // console.log(`\nEmitting ${tag.USER_JOINED} with payload: ${JSON.stringify(payload)}`);
    io.emit(tag.USER_JOINED, payload);

    const onlinePayload = {
      user_id: payload.user_id,
      last_seen: Date.now(),
      account_type: payload.account_type,
      online_status: "active",
    };

    // console.log(`\nEmitting ${tag.USER_ONLINE} with payload: ${JSON.stringify(onlinePayload)}`);

    io.emit(tag.USER_ONLINE, onlinePayload);
  });

  socket.on(tag.GET_NEAREST_USERS, async (payload) => {
    // console.log(`\nCaught ${tag.GET_NEAREST_USERS} event with payload: ${JSON.stringify(payload)}\n`);

    const users = await actions.GetNearestUsers(payload);

    // console.log(`\nEmitting ${tag.NEAREST_USER_LIST} with payload ${JSON.stringify(users)}\n`);
    io.to(socket.id).emit(tag.NEAREST_USER_LIST, users);

    // actions.BroadcastToNearestUser({ users, userData: socket.userData });
  });

  socket.on(tag.ACTIVITY_CREATED, async (payload) => {
    // console.log(`\nCaught ${tag.ACTIVITY_CREATED} event with payload: ${JSON.stringify(payload)}\n`);

    const activity = await actions.GetActivityInfo(payload, socket.user_id);
    // console.log("activity : ");
    // console.log(activity);

    if (activity.length) {
      // console.log(`\nEmitting ${tag.NOTIFY_ACTIVITY} with payload ${JSON.stringify(activity[0])}\n`);

      io.emit(tag.NOTIFY_ACTIVITY, activity[0]);
    }
  });

  socket.on(tag.SESSIONS, async (payload) => {
    actions.GetSessions(payload);
  });

  socket.on(tag.ACTIVITY_JOINED, (payload) => {
    // console.log('ACTIVITY_JOINED');
    // console.log(`\nCaught ${tag.ACTIVITY_JOINED} event with payload: ${JSON.stringify(payload)}\n`);
    console.log(`socket_id: ${socket.id}, userData: ${JSON.stringify(socket.userData)}`);

    actions.ActivityJoined(payload);
  });

  socket.on(tag.GROUP_JOINED, (payload) => {
    // console.log(`\nCaught ${tag.GROUP_JOINED} event with payload: ${JSON.stringify(payload)}\n`);
    // console.log(`socket_id: ${socket.id}, userData: ${JSON.stringify(socket.userData)}`);

    actions.GroupJoined(payload);
  });

  socket.on(tag.CREATE_SURPRISE_ACTIVITY, (payload) => {
    // console.log(`\nCaught ${tag.CREATE_SURPRISE_ACTIVITY} event with payload: ${JSON.stringify(payload)}\n`);

    actions.StartSurpriseActivity(payload);
  });

  socket.on(tag.INVITE_PARTICIPANT, (payload) => {
    // console.log(`\nCaught ${tag.INVITE_PARTICIPANT} event with payload: ${JSON.stringify(payload)}\n`);

    actions.InviteParticipant(payload);
  });

  socket.on(tag.JOIN_SURPRISE_ACTIVITY, (payload) => {
    // console.log(`\nCaught ${tag.JOINED_SURPRISE_ACTIVITY} event with payload: ${JSON.stringify(payload)}\n`);
    actions.JoinSurpriseActivity(payload);
  });

  socket.on(tag.CREATE_SURPRISE_POLL, (payload) => {
    // console.log(`\nCaught ${tag.CREATE_SURPRISE_POLL} event with payload: ${JSON.stringify(payload)}\n`);

    io.emit(tag.NOTIFY_SURPRISE_POLL, payload);
  });

  socket.on(tag.VOTE_ACTIVITY, (payload) => {
    // console.log(`\nCaught ${tag.VOTE_ACTIVITY} event with payload: ${JSON.stringify(payload)}\n`);

    actions.VoteActivity(payload);
  });

  socket.on(tag.SURPRISE_ACTIVITY_ENDED, (payload) => {
    // console.log(`\nCaught ${tag.SURPRISE_ACTIVITY_ENDED} event with payload: ${JSON.stringify(payload)}\n`);

    actions.SurpriseActivityEnded(payload);
  });

  socket.on(tag.ACTIVITY_CANCELLED, (payload) => {
    // console.log(`\nCaught ${tag.ACTIVITY_CANCELLED} event with payload: ${JSON.stringify(payload)}\n`);

    io.emit(tag.NOTIFY_ACTIVITY_CANCELLED, payload);
  });

  socket.on(tag.MESSAGE_SENT, (payload) => {
    // console.log(
    //   `Message sent from user_id:${payload.sender_id} to user_id:${payload.receiver_id} at:${payload.sent_at
    //   } socket_id ${socket.id} userData: ${JSON.stringify(socket.userData)}`
    // );
    console.log(`\nCaught ${tag.MESSAGE_SENT} event with payload: ${JSON.stringify(payload)}\n`);

    actions.MessageSent(payload);
  });

  socket.on(tag.MESSAGE_SENT_GP, (payload) => {
    // console.log(
    //   `Message sent from user_id:${payload.sender_id} to user_id:${payload.receiver_id} at:${payload.sent_at
    //   } socket_id ${socket.id} userData: ${JSON.stringify(socket.userData)}`
    // );
    // console.log(`\nCaught ${tag.MESSAGE_SENT} event with payload: ${JSON.stringify(payload)}\n`);

    actions.MessageSentGp(payload);
  });

  io.on(tag.GET_MESSAGE, (payload) => {
    console.log('GET_MESSAGE listening: ', payload);
  });

  socket.on(tag.SET_MESSAGE_GP, (payload) => {
    // console.log('SET_MESSAGE_GP : ');
    io.emit(tag.GET_MESSAGE_GP, payload);
    // console.log('payload');
    // console.log(payload);
    // console.log(
    //   `SET_MESSAGE_GP Message sent from user_id:${payload.sender_id} to user_id:${payload.receiver_id} at:${payload.sent_at
    //   } socket_id ${socket.id} userData: ${JSON.stringify(socket.userData)}`
    // );
    // console.log(`\nCaught ${tag.MESSAGE_SENT} event with payload: ${JSON.stringify(payload)}\n`);

    // actions.MessageSentGp(payload);
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
