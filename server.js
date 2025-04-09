const express = require('express');
const app = express();
const db = require('./utils/db')
const cors = require("cors");
const login= require("./routes/login");
const session = require('express-session');
const admin = require("./routes/Admin");
const users = require("./routes/User");
const vendors = require("./routes/Vendor")
// const authRoutes = require('./routes/authRoutes');
// const movieRoutes = require('./routes/movieRoutes');
const PORT = process.env.PORT || 3000;
require('dotenv').config()
db();
app.use(cors());
app.use(express.json());
let ejs = require('ejs');
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/testing.html");
})
// app.get("/"),()=>{
//     console.log("db connected");
// };

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
 
app.use("/api/auth",login);
app.use("/api/users",users)
app.use("/api/admin",admin);
app.use("/api/vendors",vendors);

app.get('/session', (req, res) => {
    res.json({ sessionId: req.sessionID });
});
db().then(function (db) {
    console.log(`Db connnected`)
})
