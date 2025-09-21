import { Router } from "express";
import mongoose from "mongoose";
import BlogPost from "./model.js";
import Author from "../authors/model.js"; 
import { postsCoverUploader } from "../uploader.js";
import { authMiddleware } from "../../auth/middleware.js";
import sgMail from '@sendgrid/mail';

const blogPostsRouter = Router();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ==========================================================
// ## ROTTE PUBBLICHE (VISIBILI A TUTTI) ##
// ==========================================================

// GET tutti i post (con paginazione)
blogPostsRouter.get("/", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await BlogPost.countDocuments();
    const posts = await BlogPost.find()
      .skip(skip)
      .limit(limit);

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
});

// GET singolo post per ID
blogPostsRouter.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID del post non valido" });
    }
    const blogPost = await BlogPost.findById(id);
    if (!blogPost) {
      return res.status(404).json({ message: "Blog post non trovato!" });
    }
    res.json(blogPost);
  } catch (error) {
    next(error);
  }
});

// GET di tutti i commenti di un post
blogPostsRouter.get("/:id/comments", async (req, res, next) => {
    try {
        const blogPost = await BlogPost.findById(req.params.id);
        if (!blogPost) {
          return res.status(404).json({ message: "Blog post non trovato!" });
        }
        res.send(blogPost.comments);
      } catch (error) {
        next(error);
      }
});

// GET di un commento specifico
blogPostsRouter.get("/:id/comments/:commentId", async (req, res, next) => {
    try {
        const blogPost = await BlogPost.findById(req.params.id);
        if (!blogPost) {
          return res.status(404).json({ message: "Blog post non trovato!" });
        }
        const comment = blogPost.comments.id(req.params.commentId);
        if (!comment) {
          return res.status(404).json({ message: "Commento non trovato!" });
        }
        res.send(comment);
      } catch (error) {
        next(error);
      }
});


// ==========================================================
// ## ROTTE PROTETTE (SOLO PER UTENTI AUTENTICATI) ##
// ==========================================================

// POST nuovo post (protetta e con email)
blogPostsRouter.post("/", authMiddleware, postsCoverUploader.single("cover"), async (req, res, next) => {
    try {
        if (!req.file) {
          return res.status(400).json({ message: "Immagine di copertina richiesta." });
        }
        const newPostData = {
          ...req.body,
          cover: req.file.path,
          author: req.authorId, // Associa il post all'autore autenticato
        };
        const newBlogPost = new BlogPost(newPostData);
        const savedBlogPost = await newBlogPost.save();
        
        // Invia un'email all'autore che ha pubblicato il post
        const author = await Author.findById(req.authorId);
        const msg = {
            to: author.email,
            from: 'coschevici_mihai@yahoo.com', 
            subject: `Nuovo post "${savedBlogPost.title}" pubblicato!`,
            text: `Ciao ${author.nome}, il tuo nuovo articolo è online.`,
        };
        await sgMail.send(msg);

        res.status(201).json(savedBlogPost);
    } catch (error) {
        next(error);
    }
});

// PUT (modifica) un post (protetta)
blogPostsRouter.put("/:id", authMiddleware, async (req, res, next) => {
    try {
        const updatedBlogPost = await BlogPost.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
          runValidators: true,
        });
        if (!updatedBlogPost) {
          return res.status(404).json({ message: "Blog post non trovato!" });
        }
        res.json(updatedBlogPost);
      } catch (error) {
        next(error);
      }
});

// DELETE un post (protetta)
blogPostsRouter.delete("/:id", authMiddleware, async (req, res, next) => {
    try {
        const deletedBlogPost = await BlogPost.findByIdAndDelete(req.params.id);
        if (!deletedBlogPost) {
          return res.status(404).json({ message: "Blog post non trovato!" });
        }
        res.status(204).end();
      } catch (error) {
        next(error);
      }
});

// PATCH per caricare la copertina del blog post (protetta)
blogPostsRouter.patch("/:blogPostId/cover", authMiddleware, postsCoverUploader.single("cover"), async (req, res, next) => {
    try {
        const blogPost = await BlogPost.findById(req.params.blogPostId);
        if (!blogPost) {
          return res.status(404).send("Blog post non trovato!");
        }
        blogPost.cover = req.file.path;
        await blogPost.save();
        res.send(blogPost);
      } catch (error) {
        next(error);
      }
});

// POST di un nuovo commento (protetta)
blogPostsRouter.post("/:id/comments", authMiddleware, async (req, res, next) => {
    try {
        const blogPost = await BlogPost.findById(req.params.id);
        if (!blogPost) {
          return res.status(404).json({ message: "Blog post non trovato!" });
        }
        const newComment = {
            ...req.body,
            author: req.authorId // Associa il commento all'autore loggato
        };
        blogPost.comments.push(newComment);
        await blogPost.save();
        res.status(201).send(blogPost.comments);
      } catch (error) {
        next(error);
      }
});

// PUT di un commento specifico (protetta)
blogPostsRouter.put("/:id/comments/:commentId", authMiddleware, async (req, res, next) => {
});

// DELETE di un commento specifico (protetta)
blogPostsRouter.delete("/:id/comments/:commentId", authMiddleware, async (req, res, next) => {
   
});

export default blogPostsRouter;