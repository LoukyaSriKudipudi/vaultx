require("dotenv").config();
const app = require("./app");
const mongoose = require("mongoose");
require("./utils/bot");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => {
  console.log(`✅ DB connection successfull.`);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server is running on ${port}.`);
});
