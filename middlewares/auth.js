const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; // <- à préciser dans notre requête headers: {Authorization : type Bearer}
    const decodedToken = jwt.verify(token, process.env.TOKEN);
    if (!decodedToken.userId) {
      throw "Token invalide!";
    } else {
      next();
    }
  } catch {
    res.status(401).json({
      error: new Error("Requête invalide!"),
    });
  }
};
