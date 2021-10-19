//Importée Express
const express = require("express");
const server = express();

//Configuration des routes

//Get pour récupérée des information
server.get("/", function (req, res) {
  //En-tete de ma requete reponse HTTP
  res.setHeader("Content-Type", "text/html");
  resr.status(200).send("<h1>Serveur en marche</h1>");
});

//Ecoute du serveur
server.listen(8081, function () {
  console.log("serveur en ecoute");
});
