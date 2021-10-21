const express = require("express");
const usersCtrl = require("./routes/usersCtrl");
const messagesCtrl = require("./routes/messagesCtrl");
const multer = require("./");

//Router
exports.router = (function () {
  const apiRouter = express.Router();

  //Routes des utilisateurs
  apiRouter.route("/users/register/").post(usersCtrl.register);
  apiRouter.route("/users/login/").post(usersCtrl.login);
  apiRouter.route("/users/profile/").get(usersCtrl.getUserProfile);
  apiRouter.route("/users/profile/").put(usersCtrl.updateUserProfile);

  //Routes pour les Messages
  apiRouter.route("/messages/new/", multer).post(messagesCtrl.createMessage);
  apiRouter.route("/messages/").get(messagesCtrl.listMessages);
  return apiRouter;
})();
