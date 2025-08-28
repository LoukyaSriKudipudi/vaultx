const express = require("express");
const xss = require("xss");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const path = require("path");

const userRouter = require("./routes/userRoutes");
const dataRouter = require("./routes/dataRoutes");
const app = express();
app.set("trust proxy", 1);

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use((req, res, next) => {
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === "string") {
        obj[key] = xss(obj[key]);
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
});

const limiter = rateLimit({
  max: 500,
  windowMs: 60 * 60 * 100,
  message: "Too many requests from this IP, please try again in an hour",
});

app.get("/ping", (req, res) => {
  res.json({ reply: "pong" });
});

app.use("/v1", limiter);

app.use("/v1/users", userRouter);
app.use("/v1/data", dataRouter);
app.use(express.static(path.join(__dirname, "public")));

module.exports = app;
