
const express = require("express");
const router = express.Router();
const { register } = require("../Controllers/userController");
const { login } = require("../Controllers/login_controller");
const { getAllUsersList } = require("../Controllers/userController");
const { getApprovedUsersList } = require("../Controllers/userController");
const { getRejectedUsersList } = require("../Controllers/userController");
const { getPendingUsersList } = require("../Controllers/userController");
const { getUsersLength } = require("../Controllers/userController");
const { updateUserStatus } = require("../Controllers/userController");
const { logout } = require("../Controllers/userController");
const { getUserStatusById } = require("../Controllers/userController");
const { checkUsername } = require("../Controllers/userController");
const { getUserProfile } = require("../Controllers/userController");
const authMiddleware = require("../Middlewares/auth_middleware");
const { updateUserProfile } = require("../Controllers/userController");
const { updateUserThroughAdmin } = require("../Controllers/userController");

const { addToWishlist, removeFromWishlist, getUserWishlist, getUserWishlistCarsList } = require("../Controllers/user_wishlist_controller");

const { addToMyBids, removeFromMyBids, getUserMyBids, getUserMyBidsCarsList } = require("../Controllers/user_my_bids_controller");

const parser = require("../Middlewares/multer");
router.post("/register", register);
router.post("/login", login);
router.get("/all-users-list", getAllUsersList);
router.get("/approved-users-list", getApprovedUsersList);
router.get("/rejected-users-list", getRejectedUsersList);
router.get("/pending-users-list", getPendingUsersList);
router.get("/users-length", getUsersLength);
router.put("/update-user-status/:id", updateUserStatus);
router.post("/logout/:id", logout);
router.get("/user-status/:id", getUserStatusById);
router.post("/check-username", checkUsername);
router.get("/user-profile", authMiddleware, getUserProfile);
router.put("/update-profile", authMiddleware, parser.single('image'), updateUserProfile);
router.put("/update-user-through-admin", updateUserThroughAdmin);

router.post("/add-to-wishlist", addToWishlist);
router.post("/remove-from-wishlist", removeFromWishlist);
router.get("/get-user-wishlist", getUserWishlist);
router.get("/get-user-wishlist-cars-list", getUserWishlistCarsList);

router.post("/add-to-my-bids", addToMyBids);
router.post("/remove-from-my-bids", removeFromMyBids);
router.get("/get-user-my-bids", getUserMyBids);
router.get("/get-user-my-bids-cars-list", getUserMyBidsCarsList);
module.exports = router;
