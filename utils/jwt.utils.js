const jwt = require("jsonwebtoken");
const JWT_SIGN_SECRET =
  "hhddfh57jjgjgjg57pkpht67rd34fh8kfesg3gd5hk861saqfr579k";

module.exports = {
  generateTokenForUser: function (userData) {
    return jwt.sign(
      {
        userId: userData.id,
        isAdmin: userData.isAdmin,
      },
      JWT_SIGN_SECRET,
      {
        expiresIn: "6h",
      }
    );
  },
};
