//Importée Express
const express = require("express");
const cors = require("cors");
const server = express();
const helmet = require("helmet");
const bodyParser = require("body-parser");
const apiRouter = require("./apiRouter").router;

server.use(cors());

//CORS
server.use((req, res, next) => {
  //accéder à notre API depuis n'importe quelle origine ( '*' )
  res.setHeader("Access-Control-Allow-Origin", "*");
  //ajouter les headers mentionnés aux requêtes envoyées vers notre API
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  //envoyer des requêtes avec les méthodes mentionnées
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

/*Helmet aide à sécuriser les applications Express 
en définissant divers en-têtes HTTP*/
server.use(helmet());

server.use(express.urlencoded({ extended: true }));
server.use(express.json());

server.use("/api/", apiRouter);
//Ecoute du serveur
server.listen(3000, function () {
  console.log("serveur en ecoute");
});
