const express = require("express");
const usersCtrl = require("./routes/usersCtrl");
const messagesCtrl = require("./routes/messagesCtrl");
const path = require("path");
const multer = require("./middleware/multer-config");

//Router
exports.router = (function () {
  const apiRouter = express.Router();
  apiRouter.use("/images", express.static(path.join(__dirname, "images")));
  apiRouter.get("/api/images/test.jpg");
  console.log(path.join(__dirname, "images"));

  //Routes des utilisateurs
  apiRouter.route("/users/register/").post(usersCtrl.register);
  apiRouter.route("/users/login/").post(usersCtrl.login);
  apiRouter.route("/users/profile/").get(usersCtrl.getUserProfile);
  apiRouter.route("/users/delete/").delete(usersCtrl.deleteProfile);
  apiRouter.route("/users/update/").put(usersCtrl.updateUserProfile);

  //Routes pour les Messages
  apiRouter.route("/messages/new/").post(multer, messagesCtrl.createMessage);
  apiRouter.route("/messages/").get(messagesCtrl.listMessages);
  apiRouter.route("/messages/:messagesId").delete(messagesCtrl.deleteMessage);

  return apiRouter;
})();
