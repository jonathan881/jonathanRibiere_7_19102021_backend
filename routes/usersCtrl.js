const bcrypt = require("bcrypt");
const jwtUtils = require("../utils/jwt.utils");
const models = require("../models");
const asyncLib = require("async");

//Constants
const EMAIL_REGEX =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

/*Le mot de passe doit comporter au moins 4 caractères, pas plus de 12 caractères et 
doit inclure au moins une lettre majuscule, une lettre minuscule et un chiffre numérique.*/
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

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "E-mail Invalide!" });
    }

    /*Le mot de passe doit comporter au moins 4 caractères, pas plus de 12 caractères et 
    doit inclure au moins une lettre majuscule, une lettre minuscule et un chiffre numérique.*/
    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        error:
          "Mots de passe Invalide! Entre 4 et 12 caractères une majuscule et un chiffre",
      });
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
  updateUserProfile: function (req, res) {
    // Getting auth header
    const headerAuth = req.headers["authorization"];
    const userId = jwtUtils.getUserId(headerAuth);

    // Params
    const username = req.body.username;

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
              return res
                .status(500)
                .json({ error: "Impossible de vérifié l'utilisateur" });
            });
        },
        function (userFound, done) {
          if (userFound) {
            userFound
              .update({
                bio: username ? username : userFound.username,
              })
              .then(function () {
                done(userFound);
              })
              .catch(function (err) {
                res
                  .status(500)
                  .json({ error: "Impossible de modifiée le pseudo" });
              });
          } else {
            res.status(404).json({ error: "Utilisateur inexistant" });
          }
        },
      ],
      function (userFound) {
        if (userFound) {
          return res.status(201).json(userFound);
        } else {
          return res
            .status(500)
            .json({ error: "Impossible de chargée le profile" });
        }
      }
    );
  },
};
