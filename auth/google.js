import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import Author from "../services/authors/model.js";
import jwt from "jsonwebtoken";

const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.API_URL}/auth/google/callback`,
  },
  async (accessToken, refreshToken, profile, passportNext) => {
    try {
      
      const author = await Author.findOne({ googleId: profile.id });

      if (author) {
        
        const token = jwt.sign({ id: author._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        passportNext(null, { token });
      } else {
        
        const newAuthor = new Author({
          nome: profile.name.givenName,
          cognome: profile.name.familyName,
          email: profile.emails[0].value,
          googleId: profile.id,
        });

        const savedAuthor = await newAuthor.save();
        const token = jwt.sign({ id: savedAuthor._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        passportNext(null, { token });
      }
    } catch (error) {
      passportNext(error);
    }
  }
);

export default googleStrategy;