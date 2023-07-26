const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require("http");
const morgan = require("morgan");
const { Server } = require("socket.io");

const corsOptions = {
  origin: '*', // Replace with the allowed client domain
};
const app = express();
const server = http.createServer(app);
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// Serve static files from the public directory
app.use(express.static('public'));

app.enable("etag");
app.set("etag", "strong");

// socket server
const io = new Server(server, {
  transports: ["websocket", "polling"],
  connectTimeout: 5000,
  pingTimeout: 5000,
  pingInterval: 5000,
});

// io.adapter(createAdapter());
// setupWorker(io);

// app.use(cors());
app.use(morgan("dev"));

module.exports = {
  server,
  io,
  app,
};
