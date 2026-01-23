import os
import aiohttp
import aiofiles
from typing import Optional
from fastapi import UploadFile

class ZiplineService:
    ZIPLINE_API_URL = os.getenv("ZIPLINE_API_URL", "")
    ZIPLINE_API_KEY = os.getenv("ZIPLINE_API_KEY", "")
    
    @staticmethod
    async def upload_file(file: UploadFile) -> dict:
        """
        Upload file lên Zipline và trả về URL
        Returns: { "url": "...", "name": "..." }
        """
        if not ZiplineService.ZIPLINE_API_URL or not ZiplineService.ZIPLINE_API_KEY:
            raise ValueError("ZIPLINE_API_URL and ZIPLINE_API_KEY must be set in environment variables")
        
        # Đọc file content
        content = await file.read()
        
        # Tạo FormData
        data = aiohttp.FormData()
        data.add_field('file', 
                      content,
                      filename=file.filename,
                      content_type=file.content_type)
        
        # Upload lên Zipline
        headers = {
            'Authorization': ZiplineService.ZIPLINE_API_KEY
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{ZiplineService.ZIPLINE_API_URL}/api/upload",
                data=data,
                headers=headers
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Zipline upload failed: {response.status} - {error_text}")
                
                result = await response.json()
                
                # Zipline trả về format: { "files": [{ "name": "...", "url": "..." }] }
                if "files" in result and len(result["files"]) > 0:
                    file_info = result["files"][0]
                    return {
                        "url": file_info.get("url", ""),
                        "name": file_info.get("name", file.filename)
                    }
                else:
                    raise Exception("Invalid response from Zipline")
    
    @staticmethod
    async def upload_file_from_url(file_url: str, filename: str) -> dict:
        """
        Upload file từ URL lên Zipline (dùng khi admin upload kết quả)
        """
        if not ZiplineService.ZIPLINE_API_URL or not ZiplineService.ZIPLINE_API_KEY:
            raise ValueError("ZIPLINE_API_URL and ZIPLINE_API_KEY must be set in environment variables")
        
        # Download file từ URL
        async with aiohttp.ClientSession() as session:
            async with session.get(file_url) as response:
                if response.status != 200:
                    raise Exception(f"Failed to download file from URL: {response.status}")
                
                content = await response.read()
                content_type = response.headers.get('Content-Type', 'application/octet-stream')
        
        # Upload lên Zipline
        data = aiohttp.FormData()
        data.add_field('file', 
                      content,
                      filename=filename,
                      content_type=content_type)
        
        headers = {
            'Authorization': ZiplineService.ZIPLINE_API_KEY
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{ZiplineService.ZIPLINE_API_URL}/api/upload",
                data=data,
                headers=headers
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Zipline upload failed: {response.status} - {error_text}")
                
                result = await response.json()
                
                if "files" in result and len(result["files"]) > 0:
                    file_info = result["files"][0]
                    return {
                        "url": file_info.get("url", ""),
                        "name": file_info.get("name", filename)
                    }
                else:
                    raise Exception("Invalid response from Zipline")

