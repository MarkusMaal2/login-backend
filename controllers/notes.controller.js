const logger = require("../utils/logger")

const session_user = (req) => {
    return req.session?req.session.user?req.session.user.NAME:"Anonymous":"Anonymous";
}

const deleteNote = async(req, res, next) => {
    let foundNote = await notesModel.findById(req.params.noteId);
    if (!foundNote) {
        logger(session_user(req), 'Couldn\'t find a note with ID of ' + req.params.noteId, true);
        return res.status(404).send({error: "User not found"})
    }
    if (Number(foundNote.USER_ID) !== Number(req.params.userId)) {
        // makes sure that the note being requested belongs to the user we're logged in as
        logger(session_user(req), 'Access denied to note with ID of ' + req.params.noteId, true);
        return res.status(403).send({error: "Access is denied"})
    }
    try {
        if ((Number(req.session.user.id) === Number(req.params.userId))) {
            let rows = await notesModel.delete(req.params.noteId);
            if (rows > 0) {
                logger(req.session.user.NAME, 'Deleted note with ID of ' + req.params.noteId);
                res.status(204).end();
                return;
            }
            logger(session_user(req), 'Could not delete note with ID of ' + req.params.noteId, true);
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

const getNotes = async (req, res, next) => {
    const foundUser = await usersModel.findById(req.params.userId)
    if (!foundUser) {
        logger(session_user(req), 'Couldn\'t find user with ID of ' + req.params.userId, true);
        return res.status(404).send({error: "User not found"})
    }
    try {
        if (Number(foundUser.id) === Number(req.session.user.id)) {
            const results = await notesModel.findMany("USER_ID", foundUser.id);
            logger(session_user(req), 'Returning list of notes for user');
            res.status(200).json(results)
        } else {
            logger(session_user(req), 'Invalid credentials for session ' + req.sessionID, true);
            res.status(401).send({error: "Invalid credentials"})
        }
    } catch  (e) {
        logger(session_user(req), 'Invalid credentials for session ' + req.sessionID, true);
        res.status(401).send({error: "Invalid credentials"})
    }
}
const addNote = async (req, res, next) => {
    const foundUser = await usersModel.findById(req.params.userId)
    if (!foundUser) {
        logger(session_user(req), 'Couldn\'t find user with ID of ' + req.params.userId, true);
        return res.status(404).send({error: "User not found"})
    }
    try {
        if (Number(foundUser.id) === Number(req.session.user.id)) {
            const newNote = {CONTENT: req.body.content.replaceAll("\"", "\\\""), USER_ID: req.params.userId}
            const newNoteId = await notesModel.create(newNote)
            logger(session_user(req), 'Created note with ID of ' + newNoteId);
            const newNoteData = await notesModel.findById(newNoteId);
            res.status(200).json(newNoteData)
        } else {
            logger(session_user(req), 'Invalid credentials for session ' + req.sessionID, true);
            res.status(401).send({error: "Invalid credentials"})
        }
    } catch  (e) {
        logger(session_user(req), 'Invalid credentials for session ' + req.sessionID, true);
        res.status(401).send({error: "Invalid credentials"})
    }
}

const updateNote = async(req, res, next) => {
    let foundNote = await notesModel.findById(req.params.noteId);
    if (!foundNote) {
        logger(session_user(req), 'Couldn\'t find a note with ID of ' + req.params.noteId, true);
        return res.status(404).send({error: "User not found"})
    }
    if (Number(foundNote.USER_ID) !== Number(req.params.userId)) {
        // makes sure that the note being requested belongs to the user we're logged in as
        logger(session_user(req), 'Access denied to note with ID of ' + req.params.noteId, true);
        return res.status(403).send({error: "Access is denied"})
    }
    try {
        if ((Number(req.session.user.id) === Number(req.params.userId))) {
            let rows = await notesModel.updateContent(req.params.noteId, req.body.content.replace("\"", "\\\""));
            const newNoteData = await notesModel.findById(req.params.noteId);
            if (rows > 0) {
                logger(req.session.user.NAME, 'Updated note with ID of ' + req.params.noteId);
                res.status(200).json(newNoteData);
                return;
            }
            logger(session_user(req), 'Could not update note with ID of ' + req.params.noteId, true);
            res.status(500).end();
        } else {
            logger(session_user(req), 'Invalid credentials for session ' + req.sessionID, true);
            res.status(401).send({error: "Invalid credentials"})
        }
    } catch (e) {
        throw(e);
        logger(session_user(req), 'Invalid credentials for session ' + req.sessionID, true);
        res.status(401).send({error: "Invalid credentials"})
    }
}

module.exports = {deleteNote, getNotes, addNote, updateNote}