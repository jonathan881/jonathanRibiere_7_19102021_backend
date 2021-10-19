//Importée Express
const express = require("express");
const server = express();
const bodyParser = require("body-parser");
const apiRouter = require("./apiRouter").router;
//Configuration des routes

server.use(express.urlencoded({ extended: true }));
server.use(express.json());

//Get pour récupérée des information
server.get("/", function (req, res) {
  //En-tete de ma requete reponse HTTP
  res.setHeader("Content-Type", "text/html");
  resr.status(200).send("<h1>Serveur en marche</h1>");
});

server.use("/api/", apiRouter);
//Ecoute du serveur
server.listen(3000, function () {
  console.log("serveur en ecoute");
});
