const { server, app } = require("./app");

const appConfig = require("./config/app.config");
const db = require("./service/db.service");
const { io } = require("./app");
const tag = require("./constants/event.constants");
const MyTime = require("./service/my_time.service");

const PORT = process.env.PORT || appConfig.PORT;

require("./service/socket.service");

// app.use(app.urlencoded({ extended: true }));
app.get("/test", async (req, res) => {
  // db.select('*').from('users').where('id', 3000).first()
  //   .then((data) => {
  //     console.log(data);
  //     res.json(data);
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     res.json({
  //       message: 'Database Connection error'
  //     });
  //   });

  // const requiredFields = ['customer_id', 'expert_category_id', 'title', 'description', 'price']; // Replace with your required fields
  // const missingFields = [];

  // requiredFields.forEach((field) => {
  //   if (!req.body[field] && !req.query[field]) {
  //     missingFields.push(field);
  //   }
  // });

  // if (missingFields.length > 0) {
  //   return res.status(400).json({
  //     success: false,
  //     message: `Missing required fields: ${missingFields.join(', ')}`
  //   });
  // }

  // try {
  //   const [id] = await db.table('conversations')
  //     .insert({
  //       code: Date.now(),
  //       customer_id: req.body.customer_id,
  //       expert_category_id: req.body.expert_category_id,
  //       expert_sub_category_id: req.body.expert_sub_category_id,
  //       subject: req.body.title,
  //       title: req.body.title,
  //       description: req.body.description,
  //       price: req.body.price,
  //       date: MyTime.getDate(),
  //       created_at: MyTime.getDateTime(),
  //     }).returning('id');
  //   res.json({
  //     success: true,
  //     message: 'Conversation created successfully',
  //     data: id
  //   });
  // } catch (error) {
  //   console.log("Not creating reason", error);
  //   res.status(500).json({
  //     success: false,
  //     message: `Conversation not created |${error.message}`,
  //   });
  // }

  // db.count('user_online_id as total').from('jp_user_online').where('online_status', 'active').first()
  //   .then((data) => {
  //     res.json(data);
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     res.json({
  //       message: `Database Connection error${err.message}`
  //     });
  //   });

  // get category wise jp online users ids
  // let data = await db.select('user_online_id').from('jp_user_online').where('online_status', 'active').where('category_id', 1).pluck('socket_id')
  // res.json(data);

  const foundUser = await db.select('*')
    .from('conversations')
    .where('expert_category_id', 1)
    .andWhere('is_expert_closed', false)
    .andWhere('is_customer_closed', false)
    .whereNull('expert_id')
    .orderBy('id', 'desc');
  res.json({
    foundUser
  });

  // .then((data) => {
  //   res.json(data);
  // })
  // .catch((err) => {
  //   console.log(err);
  //   res.json({
  //     message: `Database Connection error${err.message}`
  //   });
  // });
});

app.post("/create_activity", async (req, res) => {
  // const ac = await db
  //   .table("jp_activity")
  //   .insert({
  //     title: req.body.title,
  //     description: req.body.description,
  //     question_answers: req.body.questions
  //   });
  // io.emit(tag.REFRESH_SESSIONS);
  // console.log("request body", req.body.description);
  // res.json(ac);

  const requiredFields = ['customer_id', 'expert_category_id', 'title', 'description']; // Replace with your required fields
  const missingFields = [];

  requiredFields.forEach((field) => {
    if (!req.body[field] && !req.query[field]) {
      missingFields.push(field);
    }
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(', ')}`
    });
  }

  try {
    const [id] = await db.table('conversations')
      .insert({
        code: Date.now(),
        customer_id: req.body.customer_id,
        expert_category_id: req.body.expert_category_id,
        expert_sub_category_id: req.body.expert_sub_category_id,
        subject: req.body.title,
        title: req.body.title,
        description: req.body.description,
        price: null,
        date: MyTime.getDate(),
        created_at: MyTime.getDateTime(),
      }).returning('id');
    res.json({
      success: true,
      message: 'Conversation created successfully',
      data: id
    });
  } catch (error) {
    console.log("Not creating reason", error);
    res.status(500).json({
      success: false,
      message: `Conversation not created |${error.message}`,
    });
  }
});

app.post("/customer_create_activity", async (req, res) => {
  const ac = await db
    .table("jp_activity")
    .insert({
      title: req.body.title,
      description: req.body.description,
      question_answers: req.body.questions
    });


  io.emit('activity_created', {
    title: "Good luck",
    body: "ok",
    topic: 'expert'
  });

  console.log("items-----------------");

  io.emit(tag.REFRESH_SESSIONS);
  res.json(ac);
});

server.listen(PORT, () => {
  console.log(`\nSocket server is running at: ${PORT}\n`);
});
