// Imports
var models = require("../models");
var asyncLib = require("async");
var jwtUtils = require("../utils/jwt.utils");

// Constants global
const TITLE_LIMIT = 2;
const CONTENT_LIMIT = 4;
const ITEMS_LIMIT = 50;

// Routes
module.exports = {
  //Fonction qui permet de créer un message
  createMessage: function (req, res) {
    // Pour l'auth du token
    let headerAuth = req.headers["authorization"];
    let userId = jwtUtils.getUserId(headerAuth);

    // Paramètre
    let title = req.body.title;
    let attachment = req.file;
    let content = req.body.content;
    console.log(attachment);
    //Pour s'assurée que les champs ne sont pas vide
    //if (title == null || content == null) {
    //return res.status(400).json({ error: "Paramètre  manquant!" });
    //}
    //Pour limitté le nombre de caractère et s'assurée d'un minimume
    // if (title.length <= TITLE_LIMIT || content.length <= CONTENT_LIMIT) {
    //return res.status(400).json({ error: "Paramètre Invalide!" });
    // }

    //La mise en place d'un Waterfall permet de simplifié les chose
    asyncLib.waterfall(
      [
        //Récupéré dans la BDD notre utilisateur
        function (done) {
          //Effectue une requette dans la BDD pr recupéré l'utilisateur
          models.User.findOne({
            where: { id: userId },
          })
            .then(function (userFound) {
              //Récupére l'user trouvée 'userFound'
              done(null, userFound);
            })
            .catch(function (err) {
              console.log(err);
              return res
                .status(500)
                .json({ error: "impossible de vérifier l'utilisateur" });
            });
        },
        function (userFound, done) {
          if (userFound) {
            //On appel la methode create qui va prendre en argument un object.
            models.Message.create({
              title: title,
              content: content,
              attachment: req.file
                ? `${req.protocol}://${req.get("host")}/api/images/${
                    req.file.filename
                  }`
                : "",
              UserId: userFound.id,
            }).then(function (newMessage) {
              done(newMessage);
            });
          } else {
            res.status(404).json({ error: "Utilisateur aaaa non trouvé!" });
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
  listMessages: function (req, res) {
    //On va récupérés 4 parametre dans l'url
    //Fields sert a séléctionée les colonnes que l'on veut affichées
    const fields = req.query.fields;
    //Limit et offset permet de recupérés les messag par segmentation
    const limit = parseInt(req.query.limit);
    const offset = parseInt(req.query.offset);
    //Permet de definire un ordre pour affichée les messages
    const order = req.query.order;

    if (limit > ITEMS_LIMIT) {
      limit = ITEMS_LIMIT;
    }

    //FindAll permet de recupérés tous les messages
    models.Message.findAll({
      //On s'assure que les donnée sont pas null
      order: [order != null ? order.split(":") : ["title", "ASC"]],
      attributes: fields !== "*" && fields != null ? fields.split(",") : null,
      limit: !isNaN(limit) ? limit : null,
      offset: !isNaN(offset) ? offset : null,
      include: [
        //Tableau permetant d'inclure plusieur modele
        {
          model: models.User,
          //Attributes permet de selection les info que l'on souhaite affichée
          attributes: ["username"],
        },
      ],
    })
      //Retournée les messages recupérée via le serveur
      .then(function (messages) {
        if (messages) {
          res.status(200).json(messages);
        } else {
          res.status(404).json({ error: "no messages found" });
        }
      })
      .catch(function (err) {
        console.log(err);
        res.status(500).json({ error: "invalid fields" });
      });
  },
};
