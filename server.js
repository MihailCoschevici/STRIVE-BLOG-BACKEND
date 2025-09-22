import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import passport from 'passport';

// Import dei router e delle configurazioni
import authorsRouter from './services/authors/index.js';
import blogPostsRouter from './services/blogPosts/index.js';
import Author from './services/authors/model.js';
import googleStrategy from './auth/google.js';
import { authMiddleware } from './auth/middleware.js';

// Inizializzazione
dotenv.config();
const server = express();
const port = process.env.PORT || 4000;

// ================== Middleware ==================
server.use(cors());
server.use(express.json());
// Inizializza Passport per l'autenticazione
server.use(passport.initialize());
passport.use("google", googleStrategy);
// ===============================================


// ================== Rotte API ===================
// Rotte pubbliche per registrazione e login (gestite dentro authorsRouter)
server.use('/authors', authorsRouter);

// Rotte per i blog post (alcune protette)
server.use('/blogPosts', blogPostsRouter);

// Rotte per l'autenticazione con Google
server.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

server.get('/auth/google/callback', 
  passport.authenticate('google', { session: false }), 
  (req, res, next) => {
    try {
      // Reindirizza l'utente al frontend, passando il token come parametro URL
      res.redirect(`${process.env.FRONTEND_URL}?token=${req.user.token}`);
    } catch (error) {
      next(error);
    }
});

// Rotta protetta per ottenere i dati dell'utente loggato
server.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const author = await Author.findById(req.authorId);
    if (!author) return res.status(404).send({ message: "Utente non trovato" });
    res.send(author);
  } catch (error) {
    next(error);
  }
});
// ===============================================


// ============ Error Handler & Avvio Server ===========
// Error handler generico
server.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  const status = err.status || 500;
  const message = err.message || "Errore interno del server";
  res.status(status).send({ message });
});

// Connessione al database e avvio del server
mongoose
  .connect(process.env.MONGO_CONNECTION_URL)
  .then(() => {
    server.listen(port, () => {
      console.log(`Server in ascolto sulla porta: ${port}`);
    });
  })
  .catch((error) => {
    console.log('Errore nella connessione al database:', error);
  });