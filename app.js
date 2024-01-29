const express = require('express');
const cors = require('cors');
const { createHash } = require('crypto');
const session = require("express-session");
const app = express();

const mysql = require(`mysql-await`);
const logger = require("./utils/logger");

const connection = mysql.createConnection({
    host: 'bdlcxot20d5o5e3kbaaf-mysql.services.clever-cloud.com',
    user: 'ux5actretttpohqf',
    password: 'X6UJ23VfS7uudaL6Knws',
    database: 'bdlcxot20d5o5e3kbaaf',
});

const secret = "ON!Yl64e')]t7*[sG`RL";
connection.connect((err) => {
    if (err) {
        logger("Server", 'Error connecting to MySQL:' + err, true);
        return;
    }
    logger("Server", 'Connected to MySQL database');
});

app.use(cors({
    origin: ["http://localhost:3000", "https://localhost:3000", "https://localhost:3001", "http://localhost:3001", "http://maalmarkus.ikt.khk.ee", "https://maalmarkus.ikt.khk.ee", "https://login-frontend-klnmxcoj3-markusmaal2s-projects.vercel.app", "https://login-frontend-jet.vercel.app"],
    credentials: true
}));        // Avoid CORS errors in browsers
app.use(express.json()) // Populate req.body

let validSessions = []

const salt = "#ALLLL24"

let users = [
]

const query = 'SELECT * FROM users';

connection.query(query, (err, results) => {
    if (err) {
        console.error('Error executing query:', err);
        return;
    }

    // Process and send the results as needed
    results.forEach((result) => {
        users.push({ id: result["id"], name: result["NAME"], hash: result["HASH"] });
    })
});

const session_user = (req) => {
    return req.session?req.session.user?req.session.user.name:"Anonymous":"Anonymous";
}

const GetLatestNote = (connection, userId) => {
    let query = "SELECT * FROM notes WHERE USER_ID = " + userId + " ORDER BY (CREATED) DESC LIMIT 1";
    return connection.query(query, (err, results) => {
        return results[0]
    })
}

const GetUserNotes = (connection, userId) => {
}

    //console.logger(users);
    logger("Server", "Found " + String(users.length) + " users in the database");
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
                    logger(userName, "Authentication OK");
                    returnUser = user;
                    allowLogin = true;
                }
            })
        }
        if (allowLogin) {
            if (!validSessions.includes(req.sessionID)) {
                validSessions.push(req.sessionID);
                req.session.user = returnUser;
                logger(req.body.name, "Session started");
                res.status(200).send({...returnUser, token: req.sessionID});
            } else {
                logger(req.body.name, "Cannot log in - session already active", true);
                res.status(400).send({error: "The session is already active. Please log out to log in."})
            }
        } else {
            if (!allowLogin) { logger(req.body.name, "Authentication failed", true); }
            res.status(401).send({error: "Invalid credentials"})
        }
    })

    app.delete("/notes/:userId/:noteId", (req, res) => {
        let searchUser = {};
        let searchIndex = 0;
        let noteId = req.params.noteId
        users.forEach((user) => {
            if (user.id === req.params.userId - 1) {
                searchUser = user;
            } else {
                searchIndex++;
            }
        })
        if (searchUser === {}) {
            logger(session_user(req), 'Couldn\'t find user with ID of ' + req.params.userId, true);
            return res.status(404).send({error: "User not found"})
        }
        if (String(req.session.user["id"]) !== req.params.userId) {
            logger(session_user(req), 'Permission denied for viewing notes', true);
            return res.status(403).send({error: "Access is denied"})
        }
        let validId = validSessions.includes(req.sessionID);
        if (validId) {
            const query = `DELETE FROM notes WHERE ID = ${req.params.noteId} AND USER_ID = ${req.params.userId}`;
            connection.query(query, (err, results) => {
                if (err) {
                    console.log(query)
                    logger(session_user(req), 'Error executing query: ' + err, true);
                    res.status(500).end();
                    return;
                }
                logger(session_user(req), 'Deleted note with ID of ' + req.params.noteId);
                res.status(204).end()
            });
        } else {
            //console.logger("Invalid credentials");
            //console.logger("ID: " + req.params.id);
            //console.logger("sessionID: " + req.sessionID);
            logger(session_user(req), 'Invalid credentials for session ' + req.sessionID, true);
            res.status(401).send({error: "Invalid credentials"})
        }
    })

    app.get("/notes/:userId", async (req, res) => {
        let searchUser = {};
        let searchIndex = 0;
        users.forEach((user) => {
            if (user.id === req.params.userId - 1) {
                searchUser = user;
            } else {
                searchIndex++;
            }
        })
        if (searchUser === {}) {
            logger(session_user(req), 'Couldn\'t find user with ID of ' + req.params.id, true);
            return res.status(404).send({error: "User not found"})
        }
        /*if (String(req.session.user["id"]) !== req.params.userId) {
            logger(session_user(req), 'Permission denied for viewing notes', true);
            return res.status(403).send({error: "Access is denied"})
        }*/
        let validId = validSessions.includes(req.sessionID);
        if (validId) {
            const query = `SELECT *
                           FROM notes
                           WHERE USER_ID = ${req.params.userId}
                           ORDER BY (MODIFIED) DESC`;
            try {
                let results = await connection.awaitQuery(query);
                logger(session_user(req), 'Returning list of notes for user');
                res.status(200).send(JSON.stringify(results))
            } catch (err) {
                logger(session_user(req), "Access to notes is denied for " + session_user(req), true)
            }

            /*if (err) {
                console.logger(query)
                logger(session_user(req), 'Error executing query: ' + err, true);
                res.status(500).end();
                return;
            }*/
        } else {
            //console.logger("Invalid credentials");
            //console.logger("ID: " + req.params.id);
            //console.logger("sessionID: " + req.sessionID);
            logger(session_user(req), 'Invalid credentials for session ' + req.sessionID, true);
            res.status(401).send({error: "Invalid credentials"})
        }
    })

    app.post("/notes/:userId", (req, res) => {
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
            logger(session_user(req), 'Couldn\'t find user with ID of ' + req.params.id, true);
            return res.status(404).send({error: "User not found"})
        }
        /*if (req.session.user.id !== req.params.userId) {
            logger(session_user(req), 'Permission denied for viewing notes', true);
            return res.status(403).send({error: "Access is denied"})
        }*/
        let validId = validSessions.includes(req.sessionID);
        let noteContent = req.body.content.replaceAll("\"", "\\\"")
        if (validId) {
            const query = `INSERT INTO notes (USER_ID, CONTENT) VALUES (${req.params.userId},"${noteContent}")`;
            connection.query(query, (err, results) => {
                if (err) {
                    logger(session_user(req), 'Error executing query: ' + err, true);
                    res.status(500).end();
                    return;
                }
                let query = "SELECT * FROM notes WHERE USER_ID = " + req.params.userId + " ORDER BY (MODIFIED) DESC LIMIT 1";
                connection.query(query, (err, results) => {
                    logger(session_user(req), 'Note added with ID of ' + results[0].id);
                    res.status(200).send(results[0])
                })
            });
        } else {
            //console.logger("Invalid credentials");
            //console.logger("ID: " + req.params.id);
            //console.logger("sessionID: " + req.sessionID);
            logger(session_user(req), 'Invalid credentials for session ' + req.sessionID, true);
            res.status(401).send({error: "Invalid credentials"})
        }
    })

    app.put("/notes/:userId/:noteId", (req, res) => {
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
            logger(session_user(req), 'Couldn\'t find user with ID of ' + req.params.id, true);
            return res.status(404).send({error: "User not found"})
        }
        /*if (req.session.user.id !== req.params.userId) {
            logger(session_user(req), 'Permission denied for viewing notes', true);
            return res.status(403).send({error: "Access is denied"})
        }*/
        let validId = validSessions.includes(req.sessionID);
        let noteContent = req.body.content.replaceAll("\"", "\\\"")
        if (validId) {
            const query = `UPDATE notes SET CONTENT = "${noteContent}" WHERE id = ${req.params.noteId}`;
            connection.query(query, (err, results) => {
                if (err) {
                    logger(session_user(req), 'Error executing query: ' + err, true);
                    res.status(500).end();
                    return;
                }
                let query = "SELECT * FROM notes WHERE id = " + req.params.noteId + " ORDER BY (MODIFIED) DESC LIMIT 1";
                connection.query(query, (err, results) => {
                    logger(session_user(req), 'Note with ID of ' + results[0].id + ' was modified');
                    res.status(200).send(results[0])
                })
            });
        } else {
            //console.logger("Invalid credentials");
            //console.logger("ID: " + req.params.id);
            //console.logger("sessionID: " + req.sessionID);
            logger(session_user(req), 'Invalid credentials for session ' + req.sessionID, true);
            res.status(401).send({error: "Invalid credentials"})
        }
    })

    app.get('/users/:id', (req, res) => {
        if (typeof users[req.params.id - 1] === 'undefined') {
            logger("Anonymous", "Couldn't find a user with ID of " + req.params.id, true);
            return res.status(404).send({error: "User not found"})
        }
        if (req.body.password) {
            let userName = users[req.params.id - 1].name;
            let passWord = req.body.password;
            let hash = users[req.params.id - 1].hash;
            if (!validSessions.includes(req.sessionID)) {
                validSessions.push(req.sessionID);
                req.session.user = users[req.params.id - 1];
                logger(userName, "No valid session ID found, checking credentials");
                if (createHash('sha256').update(userName + salt + passWord).digest('hex') !== hash) {
                    logger(userName, "Authentication failed");
                    res.status(401).send({error: "Invalid credentials"})
                    return;
                }
            }
            logger(userName, "User found");
            res.send({...users[req.params.id - 1], token: req.sessionID})
        } else {
            logger(userName, "Missing credentials", true);
            res.status(401).send({error: "Missing credentials"})
        }
    })

    app.post('/users', (req, res) => {
        if (!req.body.name || !req.body.password) {
            logger("Anonymous", "Missing parameters", true);
            return res.status(400).send({error: 'One or all params are missing'})
        }
        let exists = false;
        users.forEach((user) => {
            if (user.name === req.body.name) {
                logger(user.name, "Tried to create account, but user already exists", true);
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
        logger(req.body.name, 'Created user');
        const query = `INSERT INTO users (NAME, HASH) VALUES ("${req.body.name}", "${newHash}")`;

        connection.query(query, (err, results) => {
            if (err) {
                logger(req.body.name, 'Error executing query:' + err, true);
                res.status(500).send('Error modifying MySQL data');
                return;
            }
            res.send(users[users.length - 1])
            logger(req.body.name, 'User added to database');
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
            logger(session_user(req), 'Couldn\'t find user with ID of ' + req.params.id, true);
            return res.status(404).send({error: "User not found"})
        }
        let validId = validSessions.includes(req.sessionID);
        if (validId) {
            let query = 'DELETE FROM notes WHERE USER_ID = ' + req.params.id;
            connection.query(query, (err, results) => {
                if (err) {
                    logger(session_user(req), 'Error executing query: ' + err, true);
                    res.status(500).end();
                    return;
                }
                users.splice(searchIndex - 1, 1);
                validSessions.splice(validSessions.indexOf(req.sessionID), 1)
                logger(session_user(req), 'Deleted all notes for user');
                res.status(204).end();
            });
            query = 'DELETE FROM users WHERE id = ' + req.params.id;

            connection.query(query, (err, results) => {
                if (err) {
                    logger(session_user(req), 'Error executing query: ' + err, true);
                    res.status(500).end();
                    return;
                }
                users.splice(searchIndex - 1, 1);
                validSessions.splice(validSessions.indexOf(req.sessionID), 1)
                logger(session_user(req), 'Deleted user with Session ID of ' + req.sessionID);
                res.status(204).end();
            });
        } else {
            //console.logger("Invalid credentials");
            //console.logger("ID: " + req.params.id);
            //console.logger("sessionID: " + req.sessionID);
            logger(session_user(req), 'Invalid credentials for session ' + req.sessionID, true);
            res.status(401).send({error: "Invalid credentials"})
        }
    })

    app.get("/isloggedin/:sessionID", (req, res) => {
        //console.logger(req.params.sessionID);
        //console.logger(validSessions);
        if (validSessions.includes(req.params.sessionID.toString())) {
            logger(session_user(req), 'User is logged in');
            res.status(204).end();
        } else {
            logger("Anonymous", 'User is not logged in');
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
            logger(session_user(req), 'Destroying session');
            console.log({...erasedUserObject, token: erasedToken});
            res.status(200).send({...erasedUserObject, token: erasedToken})
            req.session.destroy();
        } else {
            logger(session_user(req), 'Invalid session token', true);
            if (req.session) {
                req.session.destroy();
            }
            res.status(400).send({error: "Invalid session token"})
        }
    })

    app.put("/users/:id", (req, res) => {
        if (validSessions.includes(req.sessionID)) {
            let newHash = createHash('sha256').update(req.body.name + salt + req.body.password).digest('hex');
            const query = `UPDATE users SET NAME="${req.body.name}", HASH="${newHash}" WHERE ID = ${req.params.id}`;

            connection.query(query, (err, results) => {
                if (err) {
                    logger(req.body.name, 'Error executing query:' + err, true);
                    res.status(500).send('Error modifying MySQL data');
                    return;
                }
                res.send({
                    id: req.params.id,
                    name: req.body.name,
                    hash: newHash
                })
                users[users.length - 1].name = req.body.name
                users[users.length - 1].hash = newHash
                logger(req.body.name, 'Updated user details');
            });
        } else {
            logger(session_user(req), 'Invalid session token', true);
            if (req.session) {
                req.session.destroy();
            }
            res.status(400).send({error: "Invalid session token"})
        }
    })
    app.disable('x-powered-by');

    app.set('trust proxy', 1); // trust first proxy


module.exports = app