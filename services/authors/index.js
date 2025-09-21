import { Router } from "express";
import mongoose from "mongoose";
import Author from "./model.js";
import { authorsAvatarUploader } from "../uploader.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sgMail from "@sendgrid/mail";

const authorsRouter = Router();

// chiave API di SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/* Registrazione (POST /authors) con password criptata e email di benvenuto */
authorsRouter.post("/", async (req, res, next) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const newAuthor = new Author({
      ...req.body,
      password: hashedPassword,
    });

    const savedAuthor = await newAuthor.save();

    // --- BLOCCO DEBUG SENDGRID ---
    const msg = {
      to: savedAuthor.email,
      from: "coschevici_mihai@yahoo.com", // LA MIA EMAIL VERIFICATA
      subject: "Benvenuto sullo Strive Blog!",
      text: `Ciao ${savedAuthor.nome}, grazie per esserti registrato!`,
      html: `<strong>Ciao ${savedAuthor.nome}, grazie per esserti registrato!</strong>`,
    };

    try {
      console.log("Tentativo di invio email a:", savedAuthor.email);
      await sgMail.send(msg);
      console.log("Email inviata con successo tramite SendGrid!");
    } catch (emailError) {
      console.error("!!! ERRORE DURANTE L'INVIO CON SENDGRID !!!");
      if (emailError.response) {
        console.error(emailError.response.body);
      } else {
        console.error(emailError);
      }
    }
   

    
    const authorResponse = savedAuthor.toObject();
    delete authorResponse.password;

    res.status(201).send(authorResponse);
  } catch (error) {
    next(error);
  }
});

/* Rotta POST /login */
authorsRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const author = await Author.findOne({ email }).select("+password");
    if (!author) {
      return res.status(401).send({ message: "Credenziali non valide" });
    }

    const isMatch = await bcrypt.compare(password, author.password);
    if (!isMatch) {
      return res.status(401).send({ message: "Credenziali non valide" });
    }

    const token = jwt.sign({ id: author._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.send({ message: "Login effettuato con successo", token });
  } catch (error) {
    next(error);
  }
});

/* Rotte GET, PUT, DELETE, PATCH */
authorsRouter.get("/", async (req, res, next) => {
  try {
    const authors = await Author.find();
    res.send(authors);
  } catch (error) {
    next(error);
  }
});

authorsRouter.get("/:id", async (req, res, next) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).send({ message: "Autore non trovato!" });
    res.send(author);
  } catch (error) {
    next(error);
  }
});

authorsRouter.put("/:id", async (req, res, next) => {
  try {
    const updatedAuthor = await Author.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedAuthor)
      return res.status(404).send({ message: "Autore non trovato!" });
    res.send(updatedAuthor);
  } catch (error) {
    next(error);
  }
});

authorsRouter.delete("/:id", async (req, res, next) => {
  try {
    const deletedAuthor = await Author.findByIdAndDelete(req.params.id);
    if (!deletedAuthor)
      return res.status(404).send({ message: "Autore non trovato!" });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

authorsRouter.patch(
  "/:authorId/avatar",
  authorsAvatarUploader.single("avatar"),
  async (req, res, next) => {
    try {
      const author = await Author.findById(req.params.authorId);
      if (!author) return res.status(404).send("Autore non trovato!");
      author.avatar = req.file.path;
      await author.save();
      res.send(author);
    } catch (error) {
      next(error);
    }
  }
);

export default authorsRouter;