const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_secretKey;

const verifyToken = (req, res, next) => {
  let token;

  // Check for token in cookies
  if (req.cookies.token) {
    token = req.cookies.token;
  }
  // Check for token in headers
  else {
    const authHeader = req.headers.Authorization || req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded; // Attach the decoded user information to the request
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    return res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = verifyToken;


// //authmiddleware
// require("dotenv").config();
// const jwt = require("jsonwebtoken");
// // const secretKey= require("../configration/jwtConfig");
// const secretKey = process.env.JWT_secretKey ;

// const verifyToken = (req, res, next) => {
//   let token;
//   let authHeader = req.headers.Authorization || req.headers.authorization;
//   if (authHeader && authHeader.startsWith("Bearer")) {
//     token = authHeader.split(" ")[1];
//     if (!token) {
//       return res
//         .status(401)
//         .json({ message: "no toke n, authorization denied" });
//     }

//     try {
//       const decode = jwt.verify(token, secretKey );
//       req.user = decode;
//       // console.log("the decode user is :", req.user);
//       next();
//     } catch(err) {
//        res.status(400).json({ message: "Token is not valid" });
//     }
//   } else {
//     return res.status(401).json({ message: "no token, authorization denied" });
//   }
// };

// module.exports = verifyToken;
