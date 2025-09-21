import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).send({ message: "Token mancante. Autenticazione richiesta." });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.authorId = decoded.id;
    next();
  } catch (error) {
    res.status(401).send({ message: "Token non valido. Autenticazione fallita." });
  }
};