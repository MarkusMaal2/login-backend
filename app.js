const express = require('express');
const cors = require('cors');
const session = require("express-session");
const app = express();
const logger = require("./utils/logger")

app.use(cors({
    origin: ["http://localhost:3000", "https://localhost:3000", "https://localhost:3001", "http://localhost:3001", "http://maalmarkus.ikt.khk.ee", "https://maalmarkus.ikt.khk.ee", "https://login-frontend-klnmxcoj3-markusmaal2s-projects.vercel.app", "https://login-frontend-jet.vercel.app"],
    credentials: true
}));        // Avoid CORS errors in browsers
app.use(express.json()) // Populate req.body
const secret = "ON!Yl64e')]t7*[sG`RL";
app.use(session({
    secret: secret,
    resave: false,
    saveUninitialized: true,
    rolling: true,
    cookie: {
        secure: true,
        httpOnly: false,
        sameSite: 'None',
        maxAge: 1000 * 60 * 10,
    }
}))

const loginRoutes = require("./routes/login.routes");
const noteRoutes = require("./routes/notes.routes")
app.use("/", loginRoutes)
app.use("/", noteRoutes)
app.disable('x-powered-by');
app.set('trust proxy', 1); // trust first proxy

module.exports = app