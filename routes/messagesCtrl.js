// Imports
var models = require("../models");
var asyncLib = require("async");
var jwtUtils = require("../utils/jwt.utils");

// Routes
module.exports = {
  createMessage: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);

    // Params
    var title = req.body.title;
    var content = req.body.content;

    if (title == null || content == null) {
      return res.status(400).json({ error: "Paramètre manquant!" });
    }

    if (title.length <= TITLE_LIMIT || content.length <= CONTENT_LIMIT) {
      return res.status(400).json({ error: "Paramètre Invalide!" });
    }

    asyncLib.waterfall(
      [
        function (done) {
          models.User.findOne({
            where: { id: userId },
          })
            .then(function (userFound) {
              done(null, userFound);
            })
            .catch(function (err) {
              return res
                .status(500)
                .json({ error: "impossible de vérifier l'utilisateur" });
            });
        },
        function (userFound, done) {
          if (userFound) {
            models.Message.create({
              title: title,
              content: content,
              likes: 0,
              UserId: userFound.id,
            }).then(function (newMessage) {
              done(newMessage);
            });
          } else {
            res.status(404).json({ error: "Utilisateur non trouvé!" });
          }
        },
      ],
      function (newMessage) {
        if (newMessage) {
          return res.status(201).json(newMessage);
        } else {
          return res
            .status(500)
            .json({ error: "Impossible de poster un message" });
        }
      }
    );
  },
};
