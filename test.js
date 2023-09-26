const crypto = require("crypto");

const hash = crypto.createHash("sha1").digest("base64");

console.log(hash);
