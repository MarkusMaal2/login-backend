const express = require('express');
const cors = require('cors');
const { createHash } = require('crypto');
const session = require("express-session");
const app = express();
const connection = require("./utils/db");
const logger = require("./utils/logger")

app.use(cors({
    origin: ["http://localhost:3000", "https://localhost:3000", "https://localhost:3001", "http://localhost:3001", "http://maalmarkus.ikt.khk.ee", "https://maalmarkus.ikt.khk.ee", "https://login-frontend-klnmxcoj3-markusmaal2s-projects.vercel.app", "https://login-frontend-jet.vercel.app"],
    credentials: true
}));        // Avoid CORS errors in browsers
app.use(express.json()) // Populate req.body

let validSessions = []

const salt = "#ALLLL24"

let users = [
]
const secret = "ON!Yl64e')]t7*[sG`RL";

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
/*
    app.post('/login', (req, res) => {
    })

 */
    const loginRoutes = require("./routes/login.routes");
    app.use("/", loginRoutes)

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
    app.disable('x-powered-by');

    app.set('trust proxy', 1); // trust first proxy

module.exports = app