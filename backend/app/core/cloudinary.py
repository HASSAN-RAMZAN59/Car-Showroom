import asyncio
import logging
import uuid
from typing import BinaryIO, Union

import cloudinary
import cloudinary.uploader
from fastapi import UploadFile

from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure Cloudinary SDK if credentials are available
if (
    settings.CLOUDINARY_CLOUD_NAME
    and settings.CLOUDINARY_API_KEY
    and settings.CLOUDINARY_API_SECRET
):
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


async def upload_file_to_cloudinary(
    file: Union[UploadFile, bytes, BinaryIO],
    folder: str = "car_showroom",
) -> str:
    """Upload a file to Cloudinary and return its secure URL.
    
    If Cloudinary credentials are not configured, logs a warning and returns a placeholder URL
    so local development and testing function without errors.
    """
    filename = getattr(file, "filename", f"file_{uuid.uuid4().hex}")
    
    # Read file content if it is a FastAPI UploadFile
    if hasattr(file, "read"):
        res = file.read()
        if asyncio.iscoroutine(res) or hasattr(res, "__await__"):
            # pyrefly: ignore [not-async]
            file_bytes = await res
        else:
            file_bytes = res
        if hasattr(file, "seek"):
            seek_res = file.seek(0)
            if asyncio.iscoroutine(seek_res) or hasattr(seek_res, "__await__"):
                # pyrefly: ignore [not-async]
                await seek_res
    elif isinstance(file, bytes):
        file_bytes = file
    else:
        file_bytes = bytes(file)

    # Check if Cloudinary is configured
    if (
        not settings.CLOUDINARY_CLOUD_NAME
        or not settings.CLOUDINARY_API_KEY
        or not settings.CLOUDINARY_API_SECRET
    ):
        logger.warning(
            "Cloudinary credentials not configured. Returning fallback mock URL for %s", filename
        )
        safe_filename = filename.replace(" ", "_") if filename else f"{uuid.uuid4().hex}.jpg"
        return f"https://res.cloudinary.com/demo/image/upload/{folder}/{safe_filename}"

    # Ensure Cloudinary is configured with latest settings
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


    try:
        response = cloudinary.uploader.upload(
            file_bytes,
            folder=folder,
            resource_type="auto",
        )
        secure_url = response.get("secure_url")
        if not secure_url:
            raise ValueError("Cloudinary upload response missing secure_url")
        return secure_url
    except Exception as exc:
        logger.error("Failed to upload file to Cloudinary: %s", exc)
        raise RuntimeError(f"Cloudinary upload failed: {str(exc)}") from exc
