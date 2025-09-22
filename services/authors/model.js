import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const authorSchema = new Schema(
  {
    nome: {
      type: String,
      required: true,
    },
    cognome: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: { 
      type: String, 
      // La password non è più obbligatoria
      select: false 
    },
    // Campo per l'ID di Google
    googleId: {
      type: String,
    },
    dataDiNascita: {
      type: Date,
    },
    avatar: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

authorSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

export default models.Author || model("Author", authorSchema);