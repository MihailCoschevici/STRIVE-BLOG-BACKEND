import pkg from "mongoose";
const { Schema, model, models } = pkg;

const blogPostSchema = new Schema(
  {
    category: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    cover: { type: String, required: true, trim: true },
    author: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default models.BlogPost || model("BlogPost", blogPostSchema);