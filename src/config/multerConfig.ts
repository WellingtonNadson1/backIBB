import multer from "fastify-multer";
import path from "path";

const tpmFolder = path.resolve(__dirname, "..", "tmp");

export default {
  directory: tpmFolder,
  storage: multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, tpmFolder);
    },
    filename: function (req, file, callback) {
      const time = new Date().getTime();
      return callback(null, `${time}_${file.originalname}`);
    },
  }),
};
