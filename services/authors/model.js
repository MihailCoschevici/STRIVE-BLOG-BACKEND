import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const authorSchema = new Schema(
  {
    nome: {
      type: String,
      required: [true, "Il nome è obbligatorio"],
      trim: true,
    },
    cognome: {
      type: String,
      required: [true, "Il cognome è obbligatorio"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email è obbligatoria"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\S+@\S+\.\S+$/,
        "Formato email non valido"
      ],
    },
    password: { 
        type: String, 
        required: true, 
        select: false 
    },
    dataDiNascita: {
      type: Date,
    },
    avatar: {
      type: String,
      trim: true,
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