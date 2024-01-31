const logger = require("../utils/logger")

const sequelize = require("../utils/db")
const models = require('../models')

const session_user = (req) => {
    return req.session?req.session.user?req.session.user.NAME:"Anonymous":"Anonymous";
}

const deleteNote = async(req, res, next) => {
    models.Note.findOne({
        attributes: {exclude: ['UserId']},
        where: {
            id: req.params.noteId
        }
    }).then(note => {
        if (Number(note.dataValues.USER_ID) !== Number(req.params.userId)) {
            // makes sure that the note being requested belongs to the user we're logged in as
            logger(session_user(req), 'Access denied to note with ID of ' + req.params.noteId, true);
            return res.status(403).send({error: "Access is denied"})
        }
        if ((Number(req.session.user?.id) === Number(req.params.userId))) {
            models.Note.destroy({
                where: {
                    id: req.params.noteId
                }
            }).then(rows => {
                if (rows > 0) {
                    logger(req.session.user.NAME, 'Deleted note with ID of ' + req.params.noteId);
                    res.status(204).end();
                    return;
                }
                logger(session_user(req), 'Could not delete note with ID of ' + req.params.noteId, true);
                res.status(500).end();
            }).catch (e => {
                logger(session_user(req), 'Invalid credentials for session ' + req.sessionID, true);
                res.status(401).send({error: "Invalid credentials"})
            })
        } else {
            logger(session_user(req), 'Invalid credentials for session ' + req.sessionID, true);
            res.status(401).send({error: "Invalid credentials"})
        }
    }).catch(e => {
        logger(session_user(req), 'Couldn\'t find a note with ID of ' + req.params.noteId, true);
        return res.status(404).send({error: "User not found"})
    })
}

const getNotes = async (req, res, next) => {
    models.Users.findOne({
        where: {
            id: req.params.userId
        }
    }).then(user => {
        if (Number(user.dataValues.id) === Number(req.session.user?.id)) {
            models.Note.findAll({
                attributes: {exclude: ['UserId']},
                where: {
                    USER_ID: user.dataValues.id
                }
            }).then(notes => {
                logger(session_user(req), 'Returning list of notes for user');
                res.status(200).json(notes)
            }).catch (e => {
                res.status(200).json([])
            })
        } else {
            logger(session_user(req), 'Invalid credentials for session ' + req.sessionID, true);
            res.status(401).send({error: "Invalid credentials"})
        }
    }).catch(() => {
        logger(session_user(req), 'Couldn\'t find user with ID of ' + req.params.userId, true);
        return res.status(404).send({error: "User not found"})
    })
}
const addNote = async (req, res, next) => {
    models.Users.findOne({
        where: {
            id: req.params.userId
        }
    }).then(user => {
        if (Number(user.dataValues.id) === Number(req.session.user?.id)) {
            models.Note.create({
                CONTENT: req.body.content.replaceAll("\"", "\\\""),
                USER_ID: req.params.userId
            }).then(note => {
                const newNoteId = note.id;
                logger(session_user(req), "Created note with ID of " + newNoteId)
                res.status(200).json(note)
            }).catch(e => {
                logger(session_user(req), "Database error: " + e.message, true);
                res.status(500).json({error: e.message});
            })
        } else {
            logger(session_user(req), 'Invalid credentials for session ' + req.sessionID, true);
            res.status(401).send({error: "Invalid credentials"})
        }
    }).catch(e => {
        logger(session_user(req), 'Couldn\'t find user with ID of ' + req.params.userId, true);
        return res.status(404).send({error: "User not found"})
    })
}

const updateNote = async(req, res, next) => {
    if ((Number(req.session.user?.id) !== Number(req.params.userId))) {
        logger(session_user(req), 'Invalid credentials for session ' + req.sessionID, true);
        return res.status(401).send({error: "Invalid credentials"})
    }
    models.Note.findOne({
        attributes: {exclude: ['UserId']},
        where: {
            id: req.params.noteId
        }
    }).then(note => {
        const foundNote = note.dataValues;
        if (Number(foundNote.USER_ID) !== Number(req.params.userId)) {
            // makes sure that the note being requested belongs to the user we're logged in as
            logger(session_user(req), 'Access denied to note with ID of ' + req.params.noteId, true);
            return res.status(403).send({error: "Access is denied"})
        }
        models.Note.update({
            CONTENT: req.body.content.replaceAll("\"", "\\\"")
        }, {where: {id: req.params.noteId}}).then(rows => {
            if (rows > 0) {
                logger(req.session.user.NAME, 'Updated note with ID of ' + req.params.noteId);
                foundNote.CONTENT = req.body.content.replaceAll("\"", "\\\"");
                foundNote.updatedAt = new Date();
                res.status(200).json(foundNote);
                return;
            }
            logger(session_user(req), 'Could not update note with ID of ' + req.params.noteId, true);
            res.status(500).end();
        }).catch(() => {
            logger(session_user(req), 'Could not update note with ID of ' + req.params.noteId, true);
            res.status(500).end();
        })
    }).catch(e => {
        logger(session_user(req), "Couldn't find a note with ID of " + req.params.noteId, true);
        return res.status(404).send({error: "Note not found"});
    })
}

module.exports = {deleteNote, getNotes, addNote, updateNote}