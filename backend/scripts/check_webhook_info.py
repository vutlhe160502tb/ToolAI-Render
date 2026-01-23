#!/usr/bin/env python3
import aiohttp
import asyncio

TELEGRAM_BOT_TOKEN = "7654454779:AAFnh5XhImWMlWKzcxpGYl1Jmb_C-c1RxkA"

async def check():
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getWebhookInfo"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            result = await response.json()
            if result.get("ok"):
                info = result.get("result", {})
                print("Webhook Info:")
                print(f"  URL: {info.get('url', 'N/A')}")
                print(f"  Pending updates: {info.get('pending_update_count', 0)}")
                if info.get('last_error_date'):
                    print(f"  [WARNING] Last error date: {info.get('last_error_date')}")
                    print(f"  [WARNING] Last error message: {info.get('last_error_message', 'N/A')}")
            else:
                print(f"[ERROR] {result.get('description', 'Unknown error')}")

asyncio.run(check())

