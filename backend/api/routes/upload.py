from fastapi import APIRouter, HTTPException, UploadFile, File
from slowapi import Limiter
from slowapi.util import get_remote_address
from services.zipline_service import ZiplineService

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

@router.post("/")
@limiter.limit("20/minute")
async def upload_file(
    file: UploadFile = File(...)
):
    """
    Upload file lên Zipline và trả về URL
    """
    try:
        result = await ZiplineService.upload_file(file)
        return {
            "url": result["url"],
            "name": result["name"]
        }
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"Configuration error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

