const express = require('express');
const cors = require('cors');
const { createHash } = require('crypto');
const session = require("express-session");
const app = express();


const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'qwerty',
    database: 'login_system',
});

connection.connect((err) => {
    if (err) {
        log(time(), "Server", 'Error connecting to MySQL:' + err, true);
        return;
    }
    log(time(), "Server", 'Connected to MySQL database');
});

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));        // Avoid CORS errors in browsers
app.use(express.json()) // Populate req.body

let validSessions = []

const salt = "#ALLLL24"

let users = [
]

const query = 'SELECT * FROM USERS';

connection.query(query, (err, results) => {
    if (err) {
        console.error('Error executing query:', err);
        return;
    }

    // Process and send the results as needed
    results.forEach((result) => {
        users.push({ id: result["id"], name: result["NAME"], hash: result["HASH"] });
    })
    main();
});

const time = () => {
    return new Date().toLocaleString()
}

const session_user = (req) => {
    return req.session?req.session.user?req.session.user.name:"Anonymous":"Anonymous";
}

const log = (time, user, task, error = false) => {
    const fs = require('fs')
    const filePath = "./server.log"
    const content = "[" + time + "] " + user + " - " + task;
    fs.appendFile(filePath, content + "\n", (err) => {
        if (err) {
            console.log("\x1b[0m[" + time + "] Server logging error - " + err + "\n");
        }
    })
    !error?console.log(content):console.error("\x1b[31m" + content + "\x1b[0m");
}

const main = () => {
    //console.log(users);
    log(time(), "Server", "Found " + String(users.length) + " users in the database");
    app.use(session({
        secret: 'GJeoeJJASwww',
        resave: false,
        saveUninitialized: true,
        cookie: {secure: false, maxAge: 60 * 30 * 1000} // session limited to 30 minutes
    }))

    app.post('/login', (req, res) => {
        let returnUser = {};
        let allowLogin = false;
        if (req.body.password) {
            let passWord = req.body.password;
            users.forEach((user) => {
                let userName = user.name;
                let hash = user.hash;
                let compHash = createHash('sha256').update(req.body.name + salt + req.body.password).digest('hex')
                if ((compHash === hash)) {
                    log(time(), userName, "Authentication OK");
                    returnUser = user;
                    allowLogin = true;
                }
            })
        }
        if (allowLogin) {
            if (!validSessions.includes(req.sessionID)) {
                validSessions.push(req.sessionID);
                req.session.user = returnUser;
                log(time(), req.body.name, "Session started");
                res.status(200).send({...returnUser, token: req.sessionID});
            } else {
                log(time(), req.body.name, "Cannot log in - session already active", true);
                res.status(400).send({error: "The session is already active. Please log out to log in."})
            }
        } else {
            if (!allowLogin) { log(time(), req.body.name, "Authentication failed", true); }
            res.status(401).send({error: "Invalid credentials"})
        }
    })

    app.get('/users/:id', (req, res) => {
        if (typeof users[req.params.id - 1] === 'undefined') {
            log(time(), "Anonymous", "Couldn't find a user with ID of " + req.params.id, true);
            return res.status(404).send({error: "User not found"})
        }
        if (req.body.password) {
            let userName = users[req.params.id - 1].name;
            let passWord = req.body.password;
            let hash = users[req.params.id - 1].hash;
            if (!validSessions.includes(req.sessionID)) {
                validSessions.push(req.sessionID);
                req.session.user = users[req.params.id - 1];
                log(time(), userName, "No valid session ID found, checking credentials");
                if (createHash('sha256').update(userName + salt + passWord).digest('hex') !== hash) {
                    log(time(), userName, "Authentication failed");
                    res.status(401).send({error: "Invalid credentials"})
                    return;
                }
            }
            log(time(), userName, "User found");
            res.send({...users[req.params.id - 1], token: req.sessionID})
        } else {
            log(time(), userName, "Missing credentials", true);
            res.status(401).send({error: "Missing credentials"})
        }
    })

    app.post('/users', (req, res) => {
        if (!req.body.name || !req.body.password) {
            log(time(), "Anonymous", "Missing parameters", true);
            return res.status(400).send({error: 'One or all params are missing'})
        }
        let exists = false;
        users.forEach((user) => {
            if (user.name === req.body.name) {
                log(time(), user.name, "Tried to create account, but user already exists", true);
                exists = true;
            }
        })
        if (exists) {
            return res.status(409).send({error: "The specified user already exists"});
        }
        let newHash = createHash('sha256').update(req.body.name + salt + req.body.password).digest('hex');
        users.push({
            id: users.length + 1,
            name: req.body.name,
            hash: newHash,
        })
        log(time(), req.body.name, 'Created user');
        const query = `INSERT INTO USERS (NAME, HASH) VALUES ("${req.body.name}", "${newHash}")`;

        connection.query(query, (err, results) => {
            if (err) {
                log(time(), req.body.name, 'Error executing query:' + err, true);
                res.status(500).send('Error modifying MySQL data');
                return;
            }
            res.send(users[users.length - 1])
            log(time(), req.body.name, 'User added to database');
        });
    })

    app.delete('/users/:id', (req, res) => {
        let searchUser = {};
        let searchIndex = 0;
        users.forEach((user) => {
            if (user.id === req.params.id - 1) {
                searchUser = user;
            } else {
                searchIndex++;
            }
        })
        if (searchUser === {}) {
            log(time(), session_user(req), 'Couldn\'t find user with ID of ' + req.params.id, true);
            return res.status(404).send({error: "User not found"})
        }
        let validId = validSessions.includes(req.sessionID);
        if (validId) {
            const query = 'DELETE FROM USERS WHERE id = ' + req.params.id;

            connection.query(query, (err, results) => {
                if (err) {
                    log(time(), session_user(req), 'Error executing query: ' + err, true);
                    res.status(500).end();
                    return;
                }
                users.splice(searchIndex - 1, 1);
                validSessions.splice(validSessions.indexOf(req.sessionID), 1)
                log(time(), session_user(req), 'Deleted user with Session ID of ' + req.sessionID);
                res.status(204).end();
            });
        } else {
            //console.log("Invalid credentials");
            //console.log("ID: " + req.params.id);
            //console.log("sessionID: " + req.sessionID);
            log(time(), session_user(req), 'Invalid credentials for session ' + req.sessionID, true);
            res.status(401).send({error: "Invalid credentials"})
        }
    })

    app.get("/isloggedin/:sessionID", (req, res) => {
        //console.log(req.params.sessionID);
        //console.log(validSessions);
        if (validSessions.includes(req.params.sessionID.toString())) {
            log(time(), session_user(req), 'User is logged in');
            res.status(204).end();
        } else {
            log(time(), "Anonymous", 'User is not logged in');
            res.status(401).send({error: "Not logged in"})
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
            log(time(), session_user(req), 'Destroying session');
            console.log({...erasedUserObject, token: erasedToken});
            res.status(200).send({...erasedUserObject, token: erasedToken})
            req.session.destroy();
        } else {
            log(time(), session_user(req), 'Invalid session token', true);
            if (req.session) {
                req.session.destroy();
            }
            res.status(400).send({error: "Invalid session token"})
        }
    })

    app.put("/users/:id", (req, res) => {
        if (validSessions.includes(req.sessionID)) {
            let newHash = createHash('sha256').update(req.body.name + salt + req.body.password).digest('hex');
            const query = `UPDATE USERS SET NAME="${req.body.name}", HASH="${newHash}" WHERE ID = ${req.params.id}`;

            connection.query(query, (err, results) => {
                if (err) {
                    log(time(), req.body.name, 'Error executing query:' + err, true);
                    res.status(500).send('Error modifying MySQL data');
                    return;
                }
                res.send({
                    id: req.params.id,
                    name: req.body.name,
                    hash: newHash
                })
                log(time(), req.body.name, 'Updated user details');
            });
        } else {
            log(time(), session_user(req), 'Invalid session token', true);
            if (req.session) {
                req.session.destroy();
            }
            res.status(400).send({error: "Invalid session token"})
        }
    })

    let port = 8080
    app.listen(port, () => {
        log(time(), "Server", `API running at http://localhost:${port}`);
    })
}