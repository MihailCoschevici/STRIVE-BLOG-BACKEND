import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

export const authorsAvatarUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'blog-avatars',
    },
  }),
});

export const postsCoverUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'blog-covers',
    },
  }),
});