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
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
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
    main();
});

const main = () => {
    console.log(users);
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
                    returnUser = user;
                    allowLogin = true;
                }
            })
        }
        if (allowLogin) {
            if (!validSessions.includes(req.sessionID)) {
                validSessions.push(req.sessionID);
                req.session.user = returnUser;
                res.status(200).send({...returnUser, token: req.sessionID});
            } else {
                res.status(400).send({error: "The session is already active. Please log out to log in."})
            }
        } else {
            res.status(401).send({error: "Invalid credentials"})
        }
    })

    app.get('/users/:id', (req, res) => {
        if (typeof users[req.params.id - 1] === 'undefined') {
            return res.status(404).send({error: "User not found"})
        }
        if (req.body.password) {
            let userName = users[req.params.id - 1].name;
            let passWord = req.body.password;
            let hash = users[req.params.id - 1].hash;
            if (!validSessions.includes(req.sessionID)) {
                validSessions.push(req.sessionID);
                req.session.user = users[req.params.id - 1];
                if (createHash('sha256').update(userName + salt + passWord).digest('hex') !== hash) {
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
            return res.status(400).send({error: 'One or all params are missing'})
        }
        let exists = false;
        console.log(users);
        users.forEach((user) => {
            if (user.name === req.body.name) {
                console.log("User already exists!");
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
        const query = `INSERT INTO USERS (NAME, HASH) VALUES ("${req.body.name}", "${newHash}")`;

        connection.query(query, (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                res.status(500).send('Error modifying MySQL data');
                return;
            }
            res.send(users[users.length - 1])
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
            return res.status(404).send({error: "User not found"})
        }
        let validId = validSessions.includes(req.sessionID);
        if (validId) {
            const query = 'DELETE FROM users WHERE id = ' + req.params.id;

            connection.query(query, (err, results) => {
                if (err) {
                    console.error('Error executing query:', err);
                    res.status(500).end();
                    return;
                }
                users.splice(searchIndex - 1, 1);
                validSessions.splice(validSessions.indexOf(req.sessionID), 1)
                res.status(204).end();
            });
        } else {
            console.log("Invalid credentials");
            console.log("ID: " + req.params.id);
            console.log("sessionID: " + req.sessionID);
            res.status(401).send({error: "Invalid credentials"})
        }
    })

    app.get("/isloggedin/:sessionID", (req, res) => {
        console.log(req.params.sessionID);
        console.log(validSessions);
        if (validSessions.includes(req.params.sessionID.toString())) {
            console.log("logged in");
            res.status(204).end();
        } else {
            console.log("logged out");
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
            res.status(200).send({...erasedUserObject, token: erasedToken})
            req.session.destroy();
        } else {
            res.status(400).send({error: "Invalid session token"})
        }
    })


    app.listen(8080, () => {
        console.log(`Testing API up at: http://localhost:8080`)
    })
}