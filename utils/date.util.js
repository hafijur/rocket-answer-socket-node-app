// class DateLib {
//   todaysDate() {
//     return new Date();
//   }

//   getYear() {
//     const date = this.todaysDate();

//     return date.getFullYear();
//   }

//   getMonth() {
//     const date = this.todaysDate();

//     return date.getMonth();
//   }

//   firstDayOfMonth() {
//     const year = this.getYear();
//     const month = this.getMonth();

//     const firstDay = new Date(year, month, 1);

//     return firstDay;
//   }

//   lastDayOfMonth() {
//     const year = this.getYear();
//     const month = this.getMonth();
//     const lastDay = new Date(year, month + 1, 0);

//     return lastDay;
//   }

//   today() {
//     const today = this.todaysDate();
//     today.setHours(0, 0, 0, 0);

//     return today;
//   }

//   yesterDay() {
//     const today = this.todaysDate();

//     const yesterDay = today;
//     yesterDay.setDate(today.getDate() - 1);
//     yesterDay.setHours(0, 0, 0, 0);

//     return yesterDay;
//   }

//   tomorrow() {
//     const today = this.todaysDate();

//     const tomorrow = today;
//     tomorrow.setDate(today.getDate() + 1);
//     tomorrow.setHours(0, 0, 0, 0);

//     return tomorrow;
//   }

//   nextXdays(n = 1) {
//     const today = this.todaysDate();

//     const x_day = today;
//     x_day.setDate(today.getDate() + n);
//     x_day.setHours(0, 0, 0, 0);

//     return x_day;
//   }

//   nextXMinutes(n = 1) {
//     const today = this.todaysDate();

//     const x_min = today;
//     x_min.setMinutes(today.getMinutes() + n);

//     return x_min;
//   }
// }

// export default DateLib;
