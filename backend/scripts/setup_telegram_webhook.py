#!/usr/bin/env python3
"""
Setup Telegram Bot Webhook

Script này sẽ setup webhook cho Telegram bot để nhận messages từ admin.
"""

import sys
import os
import aiohttp
import asyncio

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

async def setup_webhook(webhook_url: str):
    """
    Setup webhook cho Telegram bot
    """
    if not TELEGRAM_BOT_TOKEN:
        print("❌ TELEGRAM_BOT_TOKEN không được set trong .env file")
        return False
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook"
    
    print("Setting up webhook...")
    print(f"   Bot Token: {TELEGRAM_BOT_TOKEN[:20]}...")
    print(f"   Webhook URL: {webhook_url}")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, data={"url": webhook_url}) as response:
                if response.status == 200:
                    result = await response.json()
                    if result.get("ok"):
                        print("[OK] Webhook setup thanh cong!")
                        print(f"   Description: {result.get('description', 'N/A')}")
                        
                        # Kiểm tra webhook info
                        info_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getWebhookInfo"
                        async with session.get(info_url) as info_response:
                            if info_response.status == 200:
                                info = await info_response.json()
                                if info.get("ok"):
                                    webhook_info = info.get("result", {})
                                    print(f"\nWebhook Info:")
                                    print(f"   URL: {webhook_info.get('url', 'N/A')}")
                                    print(f"   Pending updates: {webhook_info.get('pending_update_count', 0)}")
                                    if webhook_info.get('last_error_date'):
                                        print(f"   [WARNING] Last error: {webhook_info.get('last_error_message', 'N/A')}")
                        return True
                    else:
                        print(f"[ERROR] Loi: {result.get('description', 'Unknown error')}")
                        return False
                else:
                    error_text = await response.text()
                    print(f"[ERROR] HTTP Error {response.status}: {error_text}")
                    return False
    except Exception as e:
        print(f"[ERROR] Loi khi setup webhook: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def delete_webhook():
    """
    Xóa webhook (dùng khi muốn dùng polling thay vì webhook)
    """
    if not TELEGRAM_BOT_TOKEN:
        print("[ERROR] TELEGRAM_BOT_TOKEN khong duoc set trong .env file")
        return False
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/deleteWebhook"
    
    print("Deleting webhook...")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url) as response:
                if response.status == 200:
                    result = await response.json()
                    if result.get("ok"):
                        print("[OK] Webhook da duoc xoa!")
                        return True
                    else:
                        print(f"[ERROR] Loi: {result.get('description', 'Unknown error')}")
                        return False
                else:
                    error_text = await response.text()
                    print(f"[ERROR] HTTP Error {response.status}: {error_text}")
                    return False
    except Exception as e:
        print(f"[ERROR] Loi khi xoa webhook: {str(e)}")
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Setup Telegram Bot Webhook")
    parser.add_argument(
        "--url",
        type=str,
        help="Webhook URL (ví dụ: https://your-domain.com/api/telegram/webhook)",
        default=None
    )
    parser.add_argument(
        "--delete",
        action="store_true",
        help="Xóa webhook hiện tại"
    )
    
    args = parser.parse_args()
    
    if args.delete:
        asyncio.run(delete_webhook())
    else:
        if args.url:
            webhook_url = args.url
        else:
            # Tự động tạo webhook URL từ BACKEND_URL
            webhook_url = f"{BACKEND_URL}/api/telegram/webhook"
            print(f"[INFO] Su dung BACKEND_URL tu .env: {BACKEND_URL}")
            print(f"   Webhook URL se la: {webhook_url}")
            print(f"\n[WARNING] LUU Y: Neu backend dang chay localhost, webhook se khong hoat dong!")
            print(f"   Can dung ngrok hoac co domain public.\n")
            
            confirm = input("Ban co muon tiep tuc? (y/n): ")
            if confirm.lower() != 'y':
                print("[CANCEL] Da huy.")
                sys.exit(0)
        
        success = asyncio.run(setup_webhook(webhook_url))
        if not success:
            sys.exit(1)

