const { server, app } = require("./app");

const appConfig = require("./config/app.config");
const db = require("./service/db.service");
const { io } = require("./app");
const tag = require("./constants/event.constants");

const PORT = process.env.PORT || appConfig.PORT;

require("./service/socket.service");

// app.use(app.urlencoded({ extended: true }));
app.get("/test", async (req, res) => {
  db.select('*').from('users').then((data) => {
    console.log(data);
    res.json(data);
  }).catch((err) => {
    console.log(err);
    res.json({
      message: 'Database Connection error'
    });
  });
});

app.post("/create_activity", async (req, res) => {
  const ac = await db
    .table("jp_activity")
    .insert({
      title: req.body.title,
      description: req.body.description,
      question_answers: req.body.questions
    });
  io.emit(tag.REFRESH_SESSIONS);
  console.log("request body", req.body.description);
  res.json(ac);
});

app.post("/customer_create_activity", async (req, res) => {

  const ac = await db
    .table("jp_activity")
    .insert({
      title: req.body.title,
      description: req.body.description,
      question_answers: req.body.questions
    });

  console.log('working here--------------------');
    
    io.emit('activity_created',{
      title: "Good luck",
      body: "ok",
      topic:'expert'
    });

    console.log("items-----------------")
    
    io.emit(tag.REFRESH_SESSIONS);
  res.json(ac);
});

server.listen(PORT, () => {
  console.log(`\nSocket server is running at: ${PORT}\n`);
});
