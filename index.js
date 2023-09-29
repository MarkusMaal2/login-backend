const express = require('express');
const cors = require('cors');
const { createHash } = require('crypto');
const session = require("express-session");
const app = express();

app.use(cors());        // Avoid CORS errors in browsers
app.use(express.json()) // Populate req.body

let validSessions = []

const salt = "#ALLLL24"

let users = [
]

app.use(session({
    secret: 'GJeoeJJASwww',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 60 * 30 * 1000 } // session limited to 30 minutes
}))

app.get('/users', (req, res) => {
    let returnId = -1;
    if (req.body.password) {
        let passWord = req.body.password;
        users.forEach((user) =>  {
            let userName = user.name;
            let hash = user.hash;
            if (createHash('sha256').update(userName  + salt + passWord).digest('hex') === hash) {
                returnId = user.id;
            }
        })
    }
    if (returnId > 0) {
        if (!validSessions.includes(req.sessionID)) {
            validSessions.push(req.sessionID);
            req.session.user = users[req.params.id - 1];
            res.status(200).send({...users[returnId - 1], token: req.sessionID});
        } else {
            res.status(400).send({error: "The session is already active. Please log out to log in."})
        }
    } else {
        res.status(401).send({error: "Invalid credentials"})
    }
})

app.get('/users/:id', (req, res) => {
    if (typeof users[req.params.id - 1] === 'undefined') {
        return res.status(404).send({ error: "User not found" })
    }
    if (req.body.password) {
        let userName = users[req.params.id - 1].name;
        let passWord = req.body.password;
        let hash = users[req.params.id - 1].hash;
        if (!validSessions.includes(req.sessionID)) {
            validSessions.push(req.sessionID);
            req.session.user = users[req.params.id - 1];
            if (createHash('sha256').update(userName  + salt + passWord).digest('hex') !== hash) {
                res.status(401).send({error: "Invalid credentials"})
                return;
            }
        }
        res.send({...users[req.params.id - 1], token: req.sessionID})
    } else {
        res.status(401).send({error: "Missing credentials"})
    }
})

app.post('/users', (req, res) => {
    if (!req.body.name || !req.body.password) {
        return res.status(400).send({ error: 'One or all params are missing' })
    }
    users.push({
        id: users.length + 1,
        name: req.body.name,
        hash: createHash('sha256').update(req.body.name  + salt + req.body.password).digest('hex')
    })
    res.send(users[users.length - 1])
})

app.delete('/users/:id', (req, res) => {
    if (typeof users[req.params.id - 1] === 'undefined') {
        return res.status(404).send({ error: "User not found" })
    }
    let returnId = -1;
    if (req.body.password) {
        let passWord = req.body.password;
        users.forEach((user) =>  {
            let userName = user.name;
            let hash = user.hash;
            if (createHash('sha256').update(userName  + salt + passWord).digest('hex') === hash) {
                returnId = user.id;
            }
        })
    }
    if (returnId === req.params.id) {
        users.splice(req.params.id-1, 1);
        res.status(204).end();
    } else {
        res.status(401).send({error: "Invalid credentials"})
    }
})

app.get("/logout", (req, res) => {
    if (validSessions.includes(req.sessionID)) {
        let erasedToken = "";
        let erasedUserObject = {};
        for (let i = 0; i < validSessions.length; i++) {
            if (validSessions[i] === req.sessionID) {
                erasedToken = validSessions[i];
                erasedUserObject = req.session.user;
                validSessions.splice(i, 1)
            }
        }
        res.status(200).send({...erasedUserObject, token: erasedToken})
        req.session.destroy();
    } else {
        res.status(400).send({error: "Invalid session token"})
    }
})



app.listen(8080, () => {
    console.log(`Testing API up at: http://localhost:8080`)
})