const moment = require('moment');

class MyTime {
  constructor() {
    this.time = new Date();
  }

  getDate() {
    return moment(this.time).format('YYYY-MM-DD');
  }

  getTime() {
    return moment(this.time).format('HH:mm:ss');
  }

  getDateTime() {
    return moment(this.time).format('YYYY-MM-DD HH:mm:ss');
  }
}

module.exports = new MyTime();
