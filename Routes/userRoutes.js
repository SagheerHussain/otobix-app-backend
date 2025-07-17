

const express = require("express");
const router = express.Router();
const { register } = require("../Controllers/userController");
const { login } = require("../Controllers/login_controller");
const { getAllUsers } = require("../Controllers/userController");
const { updateUserStatus } = require("../Controllers/userController");
const { logout } = require("../Controllers/userController");
const { getUserStatusById } = require("../Controllers/userController");
const { checkUsername } = require("../Controllers/userController");
router.post("/register", register);
router.post("/login", login);
router.get("/all-users", getAllUsers);
router.put("/update-user-status/:id", updateUserStatus);
router.post("/logout/:id", logout);
router.get("/user-status/:id", getUserStatusById);
router.post("/check-username", checkUsername);
module.exports = router;
