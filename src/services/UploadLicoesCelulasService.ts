import S3Storage from "../utils/S3Storage";

class UploadLicoesCelulasService {
  async execute(file: { fieldname?: string; originalname?: string; encoding?: string; mimetype?: string; destination?: string; filename: any; path?: string; size?: number; }): Promise<void> {
      const s3Storage = new S3Storage();
      await s3Storage.saveFile(file.filename);

  }
}

export default UploadLicoesCelulasService;
