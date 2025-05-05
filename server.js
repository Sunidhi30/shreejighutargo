const express = require('express');
const app = express();
const db = require('./utils/db')
const cors = require("cors");
const login= require("./routes/login");
const session = require('express-session');
const admin = require("./routes/Admin");
const users = require("./routes/User");
const vendors = require("./routes/Vendor")
const PORT = process.env.PORT || 6000;
require('dotenv').config()
db();
app.use(cors());
app.use(express.json());
let ejs = require('ejs');
app.use(express.urlencoded({ extended: true }));
app.listen(PORT,()=>{
    console.log(`Server started at ${PORT}`)
 })
 app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    })
  );
  app.get("/testingVideos", (req, res) => {
    res.sendFile(__dirname + "/testingVideos.html");
  })
  // Serve the test HTML file
  app.get("/testing", (req, res) => {
    res.sendFile(__dirname + "/testing.html");
  })
app.use("/api/users",users)
app.use("/api/admin",admin);
app.use("/api/vendors",vendors);
// app.use("/api/auth",vendors);
app.get('/session', (req, res) => {
    res.json({ sessionId: req.sessionID });
});
//  // Serve the test HTML file
 app.get("/testingpay", (req, res) => {
  res.sendFile(__dirname + "/testingVideos.html");
})
db().then(function (db) {
    console.log(`Db connnected`)
})
