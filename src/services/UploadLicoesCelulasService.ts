import S3Storage from "../utils/S3Storage";

class UploadLicoesCelulasService {
  async execute(file): Promise<void> {
      const s3Storage = new S3Storage();
      await s3Storage.saveFile(file.filename);

  }
}

export default UploadLicoesCelulasService;
