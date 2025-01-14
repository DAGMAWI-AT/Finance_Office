//authmiddleware

const jwt = require("jsonwebtoken");
// const secretKey= require("../configration/jwtConfig");
const secretKey = process.env.JWT_secretKey;

const verifyToken = (req, res, next) => {
    let token;
     let authHeader = req.headers.Authorization || req.headers.authorization;
      if(authHeader && authHeader.startsWith("Bearer")){
        token = authHeader.split(" ")[1];
        if(!token) {
            return res.status(401).json({message:"no token, authorization denied"})
        }

        try{
           const decode = jwt.verify(token, secretKey);
           req.user = decode;
           console.log("the decode user is :", req.user)
          next();
        }catch{
              res.status(400).json({ message: "Token is not valid"})
        }
      }else{
        return res.status(401).json({message:"no token, authorization denied"})

      }
}

module.exports = verifyToken;