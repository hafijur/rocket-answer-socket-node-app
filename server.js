const { server, app } = require("./app");
const { io } = require("./app");

const appConfig = require("./config/app.config");
const dbService = require("./service/db.service");

const PORT = process.env.PORT || appConfig.PORT;

// require("./service/socket.service");

// Track the rooms each socket has joined
const socketRooms = new Map();

// Handle incoming socket connections
io.on('connection', (socket) => {
  console.log('A user connected');

  // Join a room
  socket.on('join room', (room) => {
    socket.join(room);
    socketRooms.set(socket, room);
    console.log(`User joined room: ${room}`);
  });

  // Handle incoming chat messages
  socket.on('chat message', (data) => {
    console.log('Received message:', data);
    // Check if the socket has joined a room before broadcasting the message
    if (socketRooms.has(socket)) {
      const room = socketRooms.get(socket);
      console.log(`Broadcasting message to room: ${room}`);
      io.to(room).emit('chat message', data);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
    // Remove the socket's room mapping
    if (socketRooms.has(socket)) {
      socketRooms.delete(socket);
    }
  });
});

app.get("/test", async (req, res) => {
  const message = "testing";
  return res.json({
    status: true,
    message,
  });
});

server.listen(PORT, () => {
  console.log(`\nSocket server is running at: ${PORT}\n`);
});
