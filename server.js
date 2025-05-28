// const express = require('express');
// const app = express();
// const db = require('./utils/db')
// const cors = require("cors");
// const login= require("./routes/login");
// const session = require('express-session');
// const admin = require("./routes/Admin");
// const users = require("./routes/User");
// const path = require('path');
// const vendors = require("./routes/Vendor")
// const contest = require("./routes/Contest")
// const PORT = process.env.PORT || 6000;
// const Transaction = require('./models/Transactions');
// const section = require("./routes/Section")
// require('./cron/autoStartContests'); // Adjust path as needed

// require('dotenv').config()
// db();
// // app.use(cors());
// app.use(cors({
//   origin: true,
//   // origin: [
//   //   // 'http://localhost:3000'
//   //   // // 'https://your-production-domain.com',
//   //   // // 'https://your-app.vercel.app'
//   // ],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));
// app.use(express.json());
// let ejs = require('ejs');

// app.use(express.urlencoded({ extended: true }));
// app.listen(PORT,()=>{
//     console.log(`Server started at ${PORT}`)
//  })
//  app.use(
//     session({
//       secret: process.env.SESSION_SECRET,
//       resave: false,
//       saveUninitialized: false,
//     })
//   );
//   app.get("/testingVideos", (req, res) => {
//     res.sendFile(__dirname + "/testingVideos.html");
//   })
//   // Serve the test HTML file
//   app.get("/testing", (req, res) => {
//     res.sendFile(__dirname + "/testing.html");
//   })
// app.use("/api/users",users)
// app.use("/api/admin",admin);
// app.use("/api/vendors",vendors);
// // app.use("/api/contest",contest);
// app.use("/api/sections",section);
// // app.use("/api/auth",vendors);
// app.get('/session', (req, res) => {
//     res.json({ sessionId: req.sessionID });
// });
// //  // Serve the test HTML file
//  app.get("/testingpay", (req, res) => {
//   res.sendFile(__dirname + "/testingVideos.html");
// })
// // Render reset-password.html
// app.get('/reset-password/:token', (req, res) => {
//   res.sendFile(path.join(__dirname, 'reset-password.html'));
// });
// db().then(function (db) {
//     console.log(`Db connnected`)
// })
// // for notificaiotns
// require('./cron/withdrawalNotifier');

// // GET all transactions
// app.get('/api/transactions', async (req, res) => {
//   try {
//     const transactions = await Transaction.find({});
//     res.status(200).json({
//       success: true,
//       message: 'Transactions fetched successfully',
//       data: transactions
//     });
//   } catch (error) {
//     console.error('Error fetching transactions:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal Server Error',
//       error: error.message
//     });
//   }
// });






// const express = require('express');
// const MongoStore = require('connect-mongo'); // Add this package
// const app = express();
// const db = require('./utils/db')
// const cors = require("cors");
// const login= require("./routes/login");
// const session = require('express-session');
// const admin = require("./routes/Admin");
// const users = require("./routes/User");
// const path = require('path');
// const vendors = require("./routes/Vendor")
// const contest = require("./routes/Contest")
// const PORT = process.env.PORT || 6000;
// const Transaction = require('./models/Transactions');
// const section = require("./routes/Section")
// require('./cron/autoStartContests'); // Adjust path as needed

// require('dotenv').config()
// db();
// // app.use(
// //   session({
// //     secret: process.env.SESSION_SECRET,
// //     resave: false,
// //     saveUninitialized: false,
// //     store: MongoStore.create({
// //       mongoUrl: process.env.MONGO_URI,
// //       ttl: 14 * 24 * 60 * 60 // 14 days
// //     }),
// //     cookie: {
// //       secure: process.env.NODE_ENV === 'production',
// //       sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
// //       maxAge: 1000 * 60 * 60 * 24 * 14 // 14 days
// //     }
// //   })
// // );
// // app.use(cors());
// app.use(cors({
//   origin: true,
//   // origin: [
//   //   'http://localhost:3000',
//   //   'http://localhost:3001',
//   //   'https://gutargoof.onrender.com'
//   //   // // 'https://your-production-domain.com',
//   //   // // 'https://your-app.vercel.app'
//   // ],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// app.use(express.json());
// let ejs = require('ejs');

// app.use(express.urlencoded({ extended: true }));
// app.listen(PORT,()=>{
//     console.log(`Server started at ${PORT}`)
//  })
// // Configure session storage with MongoDB

//   app.get("/testingVideos", (req, res) => {
//     res.sendFile(__dirname + "/testingVideos.html");
//   })
//   // Serve the test HTML file
//   app.get("/testing", (req, res) => {
//     res.sendFile(__dirname + "/testing.html");
//   })
// app.use("/api/users",users)
// app.use("/api/admin",admin);
// app.use("/api/vendors",vendors);
// // app.use("/api/contest",contest);
// app.use("/api/sections",section);
// // app.use("/api/auth",vendors);
// app.get('/session', (req, res) => {
//     res.json({ sessionId: req.sessionID });
// });
// //  // Serve the test HTML file
//  app.get("/testingpay", (req, res) => {
//   res.sendFile(__dirname + "/testingVideos.html");
// })
// // Render reset-password.html
// app.get('/reset-password/:token', (req, res) => {
//   res.sendFile(path.join(__dirname, 'reset-password.html'));
// });
// db().then(function (db) {
//     console.log(`Db connnected`)
// })
// // for notificaiotns
// require('./cron/withdrawalNotifier');

// // GET all transactions
// app.get('/api/transactions', async (req, res) => {
//   try {
//     const transactions = await Transaction.find({});
//     res.status(200).json({
//       success: true,
//       message: 'Transactions fetched successfully',
//       data: transactions
//     });
//   } catch (error) {
//     console.error('Error fetching transactions:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal Server Error',
//       error: error.message
//     });
//   }
// });


// const express = require('express');
// const MongoStore = require('connect-mongo'); // Add this package
// const app = express();
// const db = require('./utils/db')
// const cors = require("cors");
// const login= require("./routes/login");
// const session = require('express-session');
// const admin = require("./routes/Admin");
// const users = require("./routes/User");
// const path = require('path');
// const vendors = require("./routes/Vendor")
// const contest = require("./routes/Contest")
// const PORT = process.env.PORT || 6000;
// const Transaction = require('./models/Transactions');
// const section = require("./routes/Section")
// require('./cron/autoStartContests'); // Adjust path as needed

// require('dotenv').config()
// db();

// // CORS configuration for Flutter and web apps
// const corsOptions = {
//   origin: function (origin, callback) {
//     // Allow requests with no origin (mobile apps, Postman, etc.)
//     if (!origin) return callback(null, true);
    
//     // List of allowed origins
//     const allowedOrigins = [
//       'http://localhost:3000',
//       'http://localhost:3001', 
//       'https://gutargoof.onrender.com',
//       // Add your frontend domains here
//     ];
    
//     if (allowedOrigins.includes(origin)) {
//       return callback(null, true);
//     }
    
//     // For development/testing, you can be more permissive
//     if (process.env.NODE_ENV !== 'production') {
//       return callback(null, true);
//     }
    
//     return callback(new Error('Not allowed by CORS'));
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
//   allowedHeaders: [
//     'Content-Type', 
//     'Authorization', 
//     'X-Requested-With',
//     'Accept',
//     'Origin'
//   ],
//   // Important for preflight requests
//   preflightContinue: false,
//   optionsSuccessStatus: 200
// };

// app.use(cors(corsOptions));

// // Handle preflight requests explicitly
// // app.options('*', cors(corsOptions));
// // app.use(
// //   session({
// //     secret: process.env.SESSION_SECRET,
// //     resave: false,
// //     saveUninitialized: false,
// //     store: MongoStore.create({
// //       mongoUrl: process.env.MONGO_URI,
// //       ttl: 14 * 24 * 60 * 60 // 14 days
// //     }),
// //     cookie: {
// //       secure: process.env.NODE_ENV === 'production',
// //       sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
// //       maxAge: 1000 * 60 * 60 * 24 * 14 // 14 days
// //     }
// //   })
// // );
// // app.use(cors());
// // app.use(cors({
// //   origin: true,
// //   // origin: [
// //   //   'http://localhost:3000',
// //   //   'http://localhost:3001',
// //   //   'https://gutargoof.onrender.com'
// //   //   // // 'https://your-production-domain.com',
// //   //   // // 'https://your-app.vercel.app'
// //   // ],
// //   credentials: true,
// //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
// //   allowedHeaders: ['Content-Type', 'Authorization']
// // }));

// app.use(express.json());
// let ejs = require('ejs');

// app.use(express.urlencoded({ extended: true }));
// app.listen(PORT,()=>{
//     console.log(`Server started at ${PORT}`)
//  })
// // Configure session storage with MongoDB

//   app.get("/testingVideos", (req, res) => {
//     res.sendFile(__dirname + "/testingVideos.html");
//   })
//   // Serve the test HTML file
//   app.get("/testing", (req, res) => {
//     res.sendFile(__dirname + "/testing.html");
//   })
// app.use("/api/users",users)
// app.use("/api/admin",admin);
// app.use("/api/vendors",vendors);
// // app.use("/api/contest",contest);
// app.use("/api/sections",section);
// // app.use("/api/auth",vendors);
// app.get('/session', (req, res) => {
//     res.json({ sessionId: req.sessionID });
// });
// //  // Serve the test HTML file
//  app.get("/testingpay", (req, res) => {
//   res.sendFile(__dirname + "/testingVideos.html");
// })
// // Render reset-password.html
// app.get('/reset-password/:token', (req, res) => {
//   res.sendFile(path.join(__dirname, 'reset-password.html'));
// });
// db().then(function (db) {
//     console.log(`Db connnected`)
// })
// // for notificaiotns
// require('./cron/withdrawalNotifier');

// // GET all transactions
// app.get('/api/transactions', async (req, res) => {
//   try {
//     const transactions = await Transaction.find({});
//     res.status(200).json({
//       success: true,
//       message: 'Transactions fetched successfully',
//       data: transactions
//     });
//   } catch (error) {
//     console.error('Error fetching transactions:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal Server Error',
//       error: error.message
//     });
//   }
// });
const express = require('express');
const MongoStore = require('connect-mongo'); // Add this package
const app = express();
const db = require('./utils/db')
const cors = require("cors");
const login= require("./routes/login");
const session = require('express-session');
const admin = require("./routes/Admin");
const users = require("./routes/User");
const path = require('path');
const vendors = require("./routes/Vendor")
const contest = require("./routes/Contest")
const PORT = process.env.PORT || 6000;
const Transaction = require('./models/Transactions');
const section = require("./routes/Section")
require('./cron/autoStartContests'); // Adjust path as needed

require('dotenv').config()
db();

// ULTRA-PERMISSIVE CORS for testing (use temporarily)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Credentials', 'false'); // Changed to false for mobile
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Remove the cors() middleware for now - we're handling it manually above
// app.use(cors({...}));

app.use(express.json());
let ejs = require('ejs');

app.use(express.urlencoded({ extended: true }));

// Session configuration (uncommented and fixed)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 14 * 24 * 60 * 60 // 14 days
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days
      httpOnly: true // Security improvement
    }
  })
);

app.listen(PORT,()=>{
    console.log(`Server started at ${PORT}`)
})

app.get("/testingVideos", (req, res) => {
  res.sendFile(__dirname + "/testingVideos.html");
})

app.get("/testing", (req, res) => {
  res.sendFile(__dirname + "/testing.html");
})

// Debug: Add logging to identify problematic routes
console.log('Loading routes...');

try {
  app.use("/api/users", users);
  console.log('Users routes loaded');
} catch (error) {
  console.error('Error loading users routes:', error);
}

try {
  app.use("/api/admin", admin);
  console.log('Admin routes loaded');
} catch (error) {
  console.error('Error loading admin routes:', error);
}

try {
  app.use("/api/vendors", vendors);
  console.log('Vendors routes loaded');
} catch (error) {
  console.error('Error loading vendors routes:', error);
}

try {
  app.use("/api/sections", section);
  console.log('Section routes loaded');
} catch (error) {
  console.error('Error loading section routes:', error);
}

app.get('/session', (req, res) => {
  res.json({ sessionId: req.sessionID });
});

app.get("/testingpay", (req, res) => {
  res.sendFile(__dirname + "/testingVideos.html");
})

app.get('/reset-password/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'reset-password.html'));
});

db().then(function (db) {
  console.log(`Db connected`)
})

require('./cron/withdrawalNotifier');

// GET all transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find({});
    res.status(200).json({
      success: true,
      message: 'Transactions fetched successfully',
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    });
  }
});