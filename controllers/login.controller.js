const {createHash} = require("crypto");
const logger = require("../utils/logger")
const salt = "#ALLLL24"

const sequelize = require("../utils/db")
const models = require('../models')

const session_user = (req) => {
    return req.session?req.session.user?req.session.user.NAME:"Anonymous":"Anonymous";
}

const createUser = async(req, res, next) => {
    if (!req.body.name || !req.body.password) {
        logger("Anonymous", "Missing parameters", true);
        return res.status(400).send({error: 'One or all params are missing'})
    }
    let exists = false;
    let findUser = await models.Users.findOne({
        where: {
            NAME: req.body.name
        }
    });

    if (findUser) {
        logger(findUser.NAME, "Tried to create account, but user already exists", true);
        exists = true;
    }
    if (exists) {
        return res.status(409).send({error: "The specified user already exists"});
    }
    let newHash = createHash('sha256').update(req.body.name + salt + req.body.password).digest('hex');
    models.Users.create({
        NAME: req.body.name,
        HASH: newHash,
    }).then(user => {
        logger(req.body.name, "User added to database")
        res.status(200).json(user)
    })
        .catch (error =>{
            logger(req.body.name, "Unable to create user", true)
            res.status(500).json({error: error.message})
        });
}

const deleteUser = async(req, res, next) => {
    try {
        const uName = session_user(req);
        if ((Number(req.session.user.id) === Number(req.params.id))) {
            models.Users.destroy({
                where: {
                    id: req.params.id
                }
            }).then((rows) => {
                if (rows > 0) {
                    logger(uName, "Deleted user with Session ID of " + req.sessionID)
                    req.session.destroy();
                    return res.status(204).end()
                }
                logger(uName, 'Couldn\'t find user with ID of ' + req.params.id, true);
                return res.status(404).send({error: "User not found"})
            }).catch (() => {
                logger(uName, 'Could not delete user with Session ID of ' + req.sessionID, true);
                res.status(500).end();
            })
        } else {
            logger(uName, 'Invalid credentials for session ' + req.sessionID, true);
            res.status(401).send({error: "Invalid credentials"})
        }
    } catch (e) {
        logger(uName, 'Invalid credentials for session ' + req.sessionID, true);
        res.status(401).send({error: "Invalid credentials"})
    }
}

const loginUser = async(req, res, next) => {
    if (req.body.password) {
        let passWord = req.body.password;
        let userName = req.body.name;
        let compHash = createHash('sha256').update(userName + salt + passWord).digest('hex')
        models.Users.findOne({
            where: {
                NAME: userName,
                HASH: compHash,
            }
        }).then (
            user => {
                if (!req.session.user) {
                    req.session.user = user.dataValues;
                    logger(req.body.name, "Session started");
                    res.status(200).send({...user.dataValues, token: req.sessionID});
                } else {
                    logger(req.body.name, "Cannot log in - session already active", true);
                    res.status(400).send({error: "The session is already active. Please log out to log in."})
                }
            }
        ).catch (
            () => {
                logger(req.body.name, "Authentication failed", true);
                res.status(401).send({error: "Invalid credentials"})
            }
        )
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
        models.Users.update({
            NAME: req.body.name,
            HASH: newHash,
        }, {
            where: {id: req.params.id}
        }).then(
            rows => {
                if (rows > 0) {
                    logger(req.body.name, "Updated details for " + req.body.name);
                    res.status(200).send({name: req.body.name, password: req.body.password})
                } else {
                    logger(req.body.name, "Couldn't update user details: user not found!", true);
                    res.status(404).send({error: "User not found"});
                }
            }
        )
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
    models.Users.findOne({
        where: {
            id: req.params.id
        }
    }).then(
        user => {
        if (req.body.password) {
            let userName = user.NAME;
            let passWord = req.body.password;
            let hash = user.HASH;
            if (!req.session.user) {
                req.session.user = user;
                logger(userName, "No valid session ID found, checking credentials");
                if (createHash('sha256').update(userName + salt + passWord).digest('hex') !== hash) {
                    logger(userName, "Authentication failed");
                    res.status(401).send({error: "Invalid credentials"})
                    return;
                }
            }
            logger(userName, "User found");
            res.send({...user, token: req.sessionID})
        } else {
            logger(userName, "Missing credentials", true);
            res.status(401).send({error: "Missing credentials"})
        }
        }
    ).catch(e => {
        logger(session_user(req), "Error executing query: " + e.message, true);
        return res.status(500).send({error: e.message});
    })
}

module.exports = {createUser, deleteUser, loginUser, logoutUser, updateUser, checkLogin, checkUser}