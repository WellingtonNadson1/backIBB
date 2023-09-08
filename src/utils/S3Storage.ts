import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import fs from "fs";
import mime from "mime";
import path from "path";
import multerConfig from "../config/multerConfig";

dotenv.config();

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

if (!bucketRegion || !accessKey || !secretAccessKey) {
  console.error(
    "Certifique-se de definir as variáveis de ambiente corretamente."
  );
  process.exit(1);
}

const s3Config = {
  region: bucketRegion,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
};

const s3Client = new S3Client(s3Config);

class S3Storage {
  async saveFile(filename: string): Promise<void> {
    const originalPath = path.resolve(multerConfig.directory, filename);

    const ContentType = mime.getType(originalPath);

    if (!ContentType) {
      throw new Error("File not found");
    }

    const fileContent = await fs.promises.readFile(originalPath);

    const params = {
      Bucket: bucketName,
      Key: filename,
      Body: fileContent,
      ContentType: ContentType,
    };

    const putObjectCommand = new PutObjectCommand(params);

    try {
      await s3Client.send(putObjectCommand);
      // Exclui arquivo após upload
      await fs.promises.unlink(originalPath);
    } catch (error) {
      console.error("Erro ao fazer o upload do arquivo para o S3:", error);
      throw error;
    }
  }
}

export default S3Storage;
