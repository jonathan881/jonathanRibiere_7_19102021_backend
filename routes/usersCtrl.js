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
      return res.status(400).json({ error: "missing parameters" });
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

    asyncLib.waterfall(
      [
        function (done) {
          done(null, "variable1");
        },
      ],
      function (err) {
        if (!err) {
          return res.status(200).json({ msg: "ok" });
        } else {
          return res.status(404).json({ error: "error" });
        }
      }
    );

    //Verifiée si l'email existe pas dans la BDD
    models.User.findOne({
      attributes: ["email"],
      where: { email: email },
    })
      .then(function (userFound) {
        if (!userFound) {
          bcrypt.hash(password, 5, function (err, bcryptedPassword) {
            const newUser = models.User.create({
              email: email,
              username: username,
              password: bcryptedPassword,
              isAdmin: 0,
            })
              .then(function (newUser) {
                return res.status(201).json({
                  userId: newUser.id,
                });
              })
              .catch(function (err) {
                return res.status(500).json({ error: "cannot add user" });
              });
          });
        } else {
          return res.status(409).json({
            error: "L'utilisateur est deja existant dans la Base de donnée",
          });
        }
      })
      .catch(function (err) {
        return res
          .status(500)
          .json({ error: "Impossible de verifié si l'utilisateur existe" });
      });
  },
  login: function (req, res) {
    const email = req.body.email;
    const password = req.body.password;

    if (email == null || password == null) {
      return res.status(400).json({ error: "missing parametre" });
    }

    //ICI PLACEE LES REGEX
    //Vérifiée si un utilisateur existe avec cette email
    models.User.findOne({
      where: { email: email },
    })
      .then(function (userFound) {
        if (userFound) {
          bcrypt.compare(
            password,
            userFound.password,
            function (errBycrypt, resBycrypt) {
              if (resBycrypt) {
                return res.status(200).json({
                  userId: userFound.id,
                  token: jwtUtils.generateTokenForUser(userFound),
                });
              } else {
                return res.status(403).json({ error: "Password invalide!" });
              }
            }
          );
        } else {
          return res.status(400).json({
            error: "L'utilisateur n'existe pas dans la base de donée",
          });
        }
      })
      .catch(function (err) {
        return res
          .status(500)
          .json({ error: "Impossible de verifié si l'utilisateur existe" });
      });
  },
};
