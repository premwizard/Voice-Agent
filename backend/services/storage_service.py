import os
import logging
from typing import BinaryIO, Optional

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        self.provider = os.getenv("STORAGE_PROVIDER", "local")
        self.local_dir = os.path.join(os.getcwd(), "uploads")
        
        if self.provider == "local" and not os.path.exists(self.local_dir):
            os.makedirs(self.local_dir, exist_ok=True)
            
        if self.provider == "s3":
            import boto3
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                endpoint_url=os.getenv("AWS_ENDPOINT_URL") # Useful for R2/MinIO
            )
            self.bucket_name = os.getenv("AWS_BUCKET_NAME", "ai-platform-assets")

    async def upload_file(self, file_name: str, file_stream: BinaryIO) -> Optional[str]:
        if self.provider == "local":
            file_path = os.path.join(self.local_dir, file_name)
            with open(file_path, "wb") as f:
                f.write(file_stream.read())
            return f"local://{file_path}"
        elif self.provider == "s3":
            try:
                self.s3_client.upload_fileobj(file_stream, self.bucket_name, file_name)
                return f"s3://{self.bucket_name}/{file_name}"
            except Exception as e:
                logger.error(f"Failed to upload to S3: {e}")
                return None
        return None

    async def get_file_url(self, file_path: str) -> str:
        if file_path.startswith("local://"):
            return file_path.replace("local://", "")
        elif file_path.startswith("s3://"):
            if self.provider == "s3":
                path_parts = file_path.replace("s3://", "").split("/")
                bucket = path_parts[0]
                key = "/".join(path_parts[1:])
                # Generate presigned URL
                url = self.s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': bucket, 'Key': key},
                    ExpiresIn=3600
                )
                return url
        return file_path

storage_service = StorageService()
