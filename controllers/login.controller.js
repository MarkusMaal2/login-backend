const LoginModel = require("../models/login.model")
const {createHash} = require("crypto");
const loginModel = new LoginModel();
const logger = require("../utils/logger")
const salt = "#ALLLL24"

const session_user = (req) => {
    return req.session?req.session.user?req.session.user.name:"Anonymous":"Anonymous";
}

const createUser = async(req, res, next) => {
    if (!req.body.name || !req.body.password) {
        logger("Anonymous", "Missing parameters", true);
        return res.status(400).send({error: 'One or all params are missing'})
    }
    let exists = false;
    let findUser = await loginModel.findByName(req.body.name);

    if (findUser) {
        logger(findUser.NAME, "Tried to create account, but user already exists", true);
        exists = true;
    }
    if (exists) {
        return res.status(409).send({error: "The specified user already exists"});
    }
    let newHash = createHash('sha256').update(req.body.name + salt + req.body.password).digest('hex');
    const newUser = {
        name: req.body.name,
        hash: newHash,
    }
    logger(req.body.name, 'Created user');
    const userId = await loginModel.create(newUser)
    const returnData = {
        id: userId,
        NAME: req.body.name,
        HASH: newHash,
    }
    res.status(200).send(returnData)
    logger(req.body.name, 'User added to database');
}

const deleteUser = async(req, res, next) => {
    let foundUser = await loginModel.findById(req.params.id);
    if (foundUser.length < 1) {
        logger(session_user(req), 'Couldn\'t find user with ID of ' + req.params.id, true);
        return res.status(404).send({error: "User not found"})
    }
    try {
        if ((Number(req.session.user.id) === Number(req.params.id))) {
            let rows = await loginModel.delete(req.params.id);
            if (rows > 0) {
                logger(foundUser.NAME, 'Deleted user with Session ID of ' + req.sessionID);
                req.session.destroy();
                res.status(204).end();
                return;
            }
            logger(session_user(req), 'Could not delete user with Session ID of ' + req.sessionID, true);
            res.status(500).end();
        } else {
            logger(session_user(req), 'Invalid credentials for session ' + req.sessionID, true);
            res.status(401).send({error: "Invalid credentials"})
        }
    } catch (e) {
        logger(session_user(req), 'Invalid credentials for session ' + req.sessionID, true);
        res.status(401).send({error: "Invalid credentials"})
    }
}

const loginUser = async(req, res, next) => {
    let returnUser = {};
    let allowLogin = false;
    if (req.body.password) {
        let passWord = req.body.password;
        let userName = req.body.name;
        let compHash = createHash('sha256').update(userName + salt + passWord).digest('hex')
        const result = await loginModel.findByCredentials(userName, compHash);
        if (result.length > 0) {
            allowLogin = true;
            returnUser = result[0];
        }
        console.log(result);
    }
    if (allowLogin) {
        if (!req.session.user) {
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
}

const logoutUser = async(req, res, next) => {
    if (req.session.user) {
        logger(session_user(req), 'Destroying session');
        res.status(200).send({...req.session.user, token: req.sessionID})
        req.session.destroy();
    } else {
        logger(session_user(req), 'Invalid session token', true);
        if (req.session) {
            req.session.destroy();
        }
        res.status(400).send({error: "Invalid session token"})
    }
}
const updateUser = async(req, res, next) => {
    if ((Number(req.session.user.id) === Number(req.params.id))) {
        let newHash = createHash('sha256').update(req.body.name + salt + req.body.password).digest('hex');
        const rows = await loginModel.updateDetails(req.params.id, req.body.name, newHash)
        res.status(200).send({name: req.body.name, password: req.body.password})
    } else {
        logger(session_user(req), 'Invalid session token', true);
        if (req.session) {
            req.session.destroy();
        }
        res.status(400).send({error: "Invalid session token"})
    }
}

const checkLogin = async(req, res, next) => {
    if (req.sessionID === req.params.sessionID) {
        logger(session_user(req), 'User is logged in');
        res.status(204).end();
    } else {
        logger("Anonymous", 'User is not logged in');
        res.status(401).send({error: "Not logged in"})
    }
}

const checkUser = async(req, res, next) => {
    if (await loginModel.findById(req.params.id).length < 1) {
        logger("Anonymous", "Couldn't find a user with ID of " + req.params.id, true);
        return res.status(404).send({error: "User not found"})
    }
    if (req.body.password) {
        let userName = users[req.params.id - 1].name;
        let passWord = req.body.password;
        let hash = users[req.params.id - 1].hash;
        if (!req.session.user) {
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
}

module.exports = {createUser, deleteUser, loginUser, logoutUser, updateUser, checkLogin, checkUser}