#!/usr/bin/env python3
import aiohttp
import asyncio

TELEGRAM_BOT_TOKEN = "7654454779:AAFnh5XhImWMlWKzcxpGYl1Jmb_C-c1RxkA"
WEBHOOK_URL = "https://your-domain.com/api/telegram/webhook"  # Thay bằng URL thực tế của bạn

async def setup():
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook"
    async with aiohttp.ClientSession() as session:
        async with session.post(url, data={"url": WEBHOOK_URL}) as response:
            result = await response.json()
            print(result)
            if result.get("ok"):
                print(f"\n[OK] Webhook setup thanh cong!")
                print(f"URL: {WEBHOOK_URL}")
            else:
                print(f"\n[ERROR] {result.get('description', 'Unknown error')}")

asyncio.run(setup())

