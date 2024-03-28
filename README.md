
## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`NODE_ENV` [Node environmane eg: local,production]

`PORT`  [which port will the application use eg:5000]

`DB_HOST` [Database Host eg: 127.123.245.11]

`DB_USERNAME` [Database Username eg:rocket]

`DB_PASSWORD` [Database Password eg:rocket5655554]

`DB_PORT` [Database Port eg:3306]

`DB_NAME` [Database Name eg:rocket]

`NOTIFICATION_URL` [Firebase notification server url eg:https://fcm.googleapis.com/fcm/send]

`NOTIFICATION_TOKEN` [Firebase token eg:key=AAAAUW_Uf9A:APA91bEaFxcMpmfTvfgdsfgfdgdgGxuhhOTqeeLDHFeSFmLQ6oA343W27K6St-_JmjG7R2GgAENGDOBI-iH3qaJa0RVUqNY6IQj55N3JUg43tk7qpiQHiNCVNzNgrbUtrO8HnmNg7HmY5]




## Note

- Before running socket application please make sure backend and database installed properly

- Then check the Node latest version installed
- Check the environment variables properly
- Then go for installation and run this project
## Run Locally

Clone the project

```bash
  git clone git@github.com:RocketAnswers/rocket.git
```



Go to the project directory

```bash
  cd rocket/rocket-answer-chat-socket
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run dev
```

or 

```bash
    node server.js
```


## Authors

- [@bdtask](https://www.bdtask.com/)


## Tech Stack

**Server:** Nodejs, Express, Knex

