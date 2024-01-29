
const express = require("express")
const router = express.Router()

const loginCtrl = require("../controllers/login.controller")

router.post("/login", (req, res) => loginCtrl.loginUser(req, res))
router.get("/logout", (req, res) => loginCtrl.logoutUser(req, res))
router.post("/users", (req, res) => loginCtrl.createUser(req, res))
router.get("/isloggedin/:sessionID", (req, res) => {loginCtrl.checkLogin(req, res)})
router.put("/users/:id", (req, res) => {loginCtrl.updateUser(req, res)})
router.delete("/users/:id", (req, res) => {loginCtrl.deleteUser(req, res)})
module.exports = router