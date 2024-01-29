
const express = require("express")
const router = express.Router()

const noteCtrl = require("../controllers/notes.controller")

router.delete("/notes/:userId/:noteId", (req, res) => noteCtrl.deleteNote(req, res))
router.post("/notes/:userId", (req, res) => noteCtrl.addNote(req, res))
router.put("/notes/:userId/:noteId", (req, res) => noteCtrl.updateNote(req, res))
router.get("/notes/:userId", (req, res) => noteCtrl.getNotes(req, res))

module.exports = router