const bcrypt = require("bcrypt");
const jwtUtils = require("../utils/jwt.utils");
const models = require("../models");
const asyncLib = require("async");

//-----------------ROUTES------------------------//

module.exports = {
  register: function (req, res) {
    //parametre
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;

    if (email == null || username == null || password == null) {
      return res
        .status(400)
        .json({ error: "Veuillez renseigner tous les champs requis" });
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
            isAdmin: userFound.isAdmin,
            username: userFound.username,
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
  //Permet de recup son profile
  getUserProfile: function (req, res) {
    // en-tete de recuperation de nos autorisation
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);
    //si le token et invalide envoie une erreur
    if (userId < 0) return res.status(400).json({ error: "erreur token" });

    models.User.findOne({
      attributes: ["id", "email", "username", "isAdmin"],
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
  //Modification du profil de l'utilisateur
  updateUserProfile: function (req, res) {
    // Récupérer l'id utilisateur
    let userId = jwtUtils.getUserId(req.headers.authorization);
    // Récupérer les inputs utilisateur dans le body
    const username = req.body.username;

    // Trouver l'utulisateur qui correspond au token
    models.User.findOne({
      //attributes: ["id", "id"],
      where: { id: userId },
    })
      // Modifier les informations renseignées par l'utilisateur
      .then((user) => {
        user
          .update({
            username: username ? username : user.username,
          })
          .then(() =>
            res
              .status(201)
              .json({ confirmation: "Le profil est modifié avec succès !" })
          )
          .catch((err) => res.status(500).json(err));
      })
      .catch((err) => json(err));
  },
};
