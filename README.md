Installation et démarrage du Backend :
Ouvrez votre terminal

Clone le repository : https://github.com/jonathan881/jonathanRibiere_7_19102021_backend.git

Installez toutes les dépendances du projet : npm install
Démarrez le serveur Node.js : nodemon server

DATABASE :

Assurez-vous que MySQL est installé globalement

vous devrez vérifier que le nom d'utilisateur et le mot de passe dans le fichier
config config.json correspondent à vos informations d'identification MySQL locales.

npx sequelize-cli db:create
npx sequelize-cli db:migrate

Ouvrez ensuite sur n'importe quel navigateur web : http://localhost:8081/

J'ai créé un réseau social d'entreprise, pour une entreprise fictive. Pour ce projet, j'ai utilisé les technologies ci-dessous :

Pour le serveur : Node.js et framework Express
Pour la base de données : langage MySQL et Sequelize ORM
Pour le frontend : Vue.js (Vue Router, Vuex), Sass, Bootsrap
