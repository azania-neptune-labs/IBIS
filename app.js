"use strict";

require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const morgan = require("morgan");
const passport = require("passport");
const bodyParser = require("body-parser");

const { router: testimonyRouter } = require("./testimonies");
const { router: usersRouter } = require("./users");
const { router: authRouter, localStrategy, jwtStrategy } = require("./auth");

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require("./config/config");

const app = express();

//MIDDLEWARE
app.use(function(req, res, next) {
  //CORS
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
  if (req.method === "OPTIONS") {
    return res.send(204);
  }
  next();
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("common"));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/testimonies", testimonyRouter);
app.use("/api/users", usersRouter);
app.use("/api/auth", authRouter);

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use("*", (req, res) => {
  return res.status(404).json({ message: "Not Found" });
});

let server;

function runServer() {
  return new Promise((resolve, reject) => {
    mongoose.connect(DATABASE_URL, err => {
      if (err) {
        return reject(err);
      }
      server = app
        .listen(PORT, () => {
          console.log(`Your app is listening on port ${PORT}`);
          resolve();
        })
        .on("error", err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log("Closing server");
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer().catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };
