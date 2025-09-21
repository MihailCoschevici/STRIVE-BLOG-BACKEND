import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authorsRouter from './services/authors/index.js';
import blogPostsRouter from './services/blogPosts/index.js';
import Author from './services/authors/model.js';
import { authMiddleware } from './auth/middleware.js'; 
dotenv.config();

const server = express();
const port = process.env.PORT || 4000;

// Middleware
server.use(express.json());
server.use(cors());

// --- ROTTE PUBBLICHE ---
// Chiunque può registrarsi e fare il login
server.use('/authors', authorsRouter);


// Solo gli utenti con un token valido possono accedere a queste rotte
server.use('/blogPosts', blogPostsRouter); 
server.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const author = await Author.findById(req.authorId);
    if (!author) return res.status(404).send({ message: "Utente non trovato" });
    res.send(author);
  } catch (error) {
    next(error);
  }
});

// Error handler
server.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  const status = err.status || 500;
  const message = err.message || "Errore interno del server";
  res.status(status).send({ message });
});

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