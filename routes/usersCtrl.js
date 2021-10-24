const bcrypt = require("bcrypt");
const jwtUtils = require("../utils/jwt.utils");
const models = require("../models");
const asyncLib = require("async");

//Constants
const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$/;

const PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{4,12}$/;

//-----------------ROUTES------------------------//

module.exports = {
  register: function (req, res) {
    //parametre
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;

    if (email == null || username == null || password == null) {
      return res.status(400).json({ error: "Paramètre manquant" });
    }

    if (username.length >= 15 || username.length <= 2) {
      return res
        .status(400)
        .json({ error: "Le mdp dois contenire entre 3 et 14 caractères" });
    }

    //Waterfall permet d'avoir des fonction en cascade
    asyncLib.waterfall(
      [
        function (done) {
          models.User.findOne({
            attributes: ["email"],
            where: { email: email },
          })
            //Verifiée si l'email existe pas dans la BDD
            .then(function (userFound) {
              done(null, userFound);
            })
            .catch(function (err) {
              return res.status(500).json({
                error: "Impossible de verifié si l'utilisateur existe",
              });
            });
        },
        function (userFound, done) {
          if (!userFound) {
            bcrypt.hash(password, 5, function (err, bcryptedPassword) {
              done(null, userFound, bcryptedPassword);
            });
          } else {
            return res.status(409).json({
              error: "L'utilisateur est deja existant dans la Base de donnée",
            });
          }
        },
        function (userFound, bcryptedPassword, done) {
          const newUser = models.User.create({
            email: email,
            username: username,
            password: bcryptedPassword,
            isAdmin: 0,
          })
            .then(function (newUser) {
              done(newUser);
            })
            .catch(function (err) {
              return res
                .status(500)
                .json({ error: "Impossible de trouvée l'utilisateur" });
            });
        },
      ],
      function (newUser) {
        if (newUser) {
          return res.status(201).json({
            userId: newUser.id,
          });
        } else {
          return res
            .status(500)
            .json({ error: "Impossible de trouvée l'utilisateur" });
        }
      }
    );
  },

  login: function (req, res) {
    const email = req.body.email;
    const password = req.body.password;

    if (email == null || password == null) {
      return res.status(400).json({ error: "Paramètre manquant!" });
    }

    asyncLib.waterfall(
      [
        function (done) {
          //Vérifiée si un utilisateur existe avec cette email
          models.User.findOne({
            where: { email: email },
          })
            .then(function (userFound) {
              done(null, userFound);
            })
            .catch(function (err) {
              return res.status(500).json({
                error: "Impossible de verifié si l'utilisateur existe",
              });
            });
        },
        function (userFound, done) {
          if (userFound) {
            bcrypt.compare(
              password,
              userFound.password,
              function (errBycrypt, resBycrypt) {
                done(null, userFound, resBycrypt);
              }
            );
          } else {
            return res.status(404).json({
              error: "L'utilisateur n'existe pas dans la base de donnée",
            });
          }
        },
        function (userFound, resBycrypt, done) {
          if (resBycrypt) {
            done(userFound);
          } else {
            return res.status(403).json({ error: "Password invalide!" });
          }
        },
      ],
      function (userFound) {
        if (userFound) {
          return res.status(201).json({
            userId: userFound.id,
            token: jwtUtils.generateTokenForUser(userFound),
          });
        } else {
          return res
            .status(500)
            .json({ error: "Impossible de verifié si l'utilisateur existe" });
        }
      }
    );
  },
  //Permet de recup et modifier notre profile
  getUserProfile: function (req, res) {
    // en-tete de recuperation de nos autorisation
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);
    //si le token et invalide envoie une erreur
    if (userId < 0) return res.status(400).json({ error: "erreur token" });

    models.User.findOne({
      attributes: ["id", "email", "username"],
      where: { id: userId },
    })
      .then(function (user) {
        if (user) {
          res.status(201).json(user);
        } else {
          res.status(404).json({ error: "Utilisateur non trouvé!" });
        }
      })
      .catch(function (err) {
        res
          .status(500)
          .json({ error: "Impossible de récupérer l'utilisateur" });
      });
  },

  deleteProfile: function (req, res) {
    //récupération de l'id de l'user
    let userId = jwtUtils.getUserId(req.headers.authorization);
    if (userId != null) {
      //Recherche sécurité si user existe bien
      models.User.findOne({
        where: { id: userId },
      }).then((user) => {
        if (user != null) {
          //Delete de tous les posts de l'user même s'il y en a pas
          models.Message.destroy({
            where: { userId: user.id },
          })
            .then(() => {
              console.log("Tous les posts de cet user ont été supprimé");
              //Suppression de l'utilisateur
              models.User.destroy({
                where: { id: user.id },
              })
                .then(() => res.end())
                .catch((err) => console.log(err));
            })
            .catch((err) => res.status(500).json(err));
        } else {
          res.status(401).json({ error: "Cet user n'existe pas" });
        }
      });
    } else {
      res.status(500).json({
        error: "Impossible de supprimer ce compte, contacter un administrateur",
      });
    }
  },
  updateUserProfile: function (req, res) {
    // Getting auth header
    let headerAuth = req.headers["authorization"];
    let userId = jwtUtils.getUserId(headerAuth);

    // Params
    let username = req.body.username;

    asyncLib.waterfall(
      [
        function (done) {
          models.User.findOne({
            attributes: ["id", "username"],
            where: { id: userId },
          })
            .then(function (userFound) {
              done(null, userFound);
            })
            .catch(function (err) {
              return res.status(500).json({ error: "unable to verify user" });
            });
        },
        function (userFound, done) {
          if (userFound) {
            userFound
              .update({
                username: username ? username : userFound.username,
              })
              .then(function () {
                done(userFound);
              })
              .catch(function (err) {
                res.status(500).json({ error: "cannot update user" });
              });
          } else {
            res.status(404).json({ error: "user not found" });
          }
        },
      ],
      function (userFound) {
        if (userFound) {
          return res.status(201).json(userFound);
        } else {
          return res.status(500).json({ error: "cannot update user profile" });
        }
      }
    );
  },
};
