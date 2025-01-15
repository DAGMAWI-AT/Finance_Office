// //roleMiddleware
// const authorizeRoles = (...allowedRoles) => {
//     return (req, res, next) => {
//             if (!allowedRoles.includes(req.user.role)) {

//             return res.status(403).json({ message: "Access denied"})
//         }
//         next();
//     };
// }

// module.exports =authorizeRoles;

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
      const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }
  
      try {
        const decoded = jwt.verify(token, secretKey);
        if (!allowedRoles.includes(decoded.role)) {
          return res.status(403).json({ message: "Access denied" });
        }
        req.user = decoded;
        next();
      } catch (error) {
        res.clearCookie("token");
        return res.status(401).json({ message: "Invalid token" });
      }
    };
  };
  
  module.exports =authorizeRoles;