import {
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

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

class S3GetStorageLesson {
  async getFile(): Promise<string[]> {
    const folderPath = "licoes-celula-outubro-23";

    const params = {
      Bucket: bucketName,
      Prefix: folderPath,
    };

    const listObjectsV2Command = new ListObjectsV2Command(params);

    try {
      const data = await s3Client.send(listObjectsV2Command);
      // Verifique se algum objeto foi retornado
      if (!data.Contents) {
        throw new Error("Nenhum objeto retornado do S3");
      }
      // Mapeie a lista de objetos para obter os links dos arquivos
      const fileLinks = await Promise.all(
        data.Contents.map(async (object) => {
          // Defina os parâmetros para o comando getObject
          const getObjectParams = {
            Bucket: params.Bucket,
            Key: object.Key,
          };

          // Gere uma URL assinada para o arquivo
          const url = await getSignedUrl(
            s3Client,
            new GetObjectCommand(getObjectParams)
          );

          return url;
        })
      );
      return fileLinks.slice(1);
    } catch (error) {
      console.error("Erro ao fazer o get do arquivo no S3:", error);
      throw error;
    }
  }
}

export default S3GetStorageLesson;
