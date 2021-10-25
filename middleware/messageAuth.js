const jwt = require("jsonwebtoken");
const { Message } = require("../models/index.js");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; // <- à préciser dans notre requête headers: {Authorization : type Bearer}
    const decodedToken = jwt.verify(token, process.env.TOKEN);
    /* Protégeons ce Message en vérifiant si le userId du token correspond au userId du Message sur lequel on souhaite accéder */
    Message.findOne({ where: { id: req.params.id } }).then((message) => {
      if (decodedToken.isAdmin) {
        console.log("vous êtes admin");
      } else if (decodedToken.userId == message.userId) {
        console.log("vous êtes bien le propriétaire de ce message");
      } else {
        console.log("vous n'avez pas les droits sur ce message");
        return res.status(403);
      }
      next();
    });
  } catch {
    console.log("accès non autorisé");
    res.status(401).json({ error: "accès refusé" });
  }
};
