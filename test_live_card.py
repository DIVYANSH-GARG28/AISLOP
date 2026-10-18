"""Quick test script to send a live interactive Mentorship Request Card with inline buttons to Telegram."""

import asyncio
import sys
import io
import httpx

if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


async def send_interactive_card(bot_token: str, chat_id: str):
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

    text = (
        "🎓 <b>New Mentorship Request!</b>\n\n"
        "<b>Student:</b> Divyansh Garg (3rd Year CSE)\n"
        "<b>Topic:</b> Full-Stack System Design & Microservices Scaling\n"
        "<b>Skills:</b> Distributed Systems • FastAPI • Kubernetes\n\n"
        "💬 <b>Message:</b>\n"
        "<i>\"Hi! I am architecting a high-throughput webhook system and would love 30 minutes of guidance on handling rate limits and queue backpressure.\"</i>\n\n"
        "⏳ <b>Response Deadline:</b> 48 Hours\n"
        "<i>Request ID:</i> <code>req_demo_2026</code>\n\n"
        "Would you like to mentor this student?"
    )

    reply_markup = {
        "inline_keyboard": [
            [
                {
                    "text": "✅ Accept Mentorship",
                    "callback_data": "mentor_act:accept:req_demo_2026"
                },
                {
                    "text": "❌ Decline Request",
                    "callback_data": "mentor_act:decline:req_demo_2026"
                }
            ]
        ]
    }

    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "reply_markup": reply_markup
    }

    print(f"\n🚀 Sending Mentorship Card to Chat ID: {chat_id}...")
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(url, json=payload)
        data = res.json()
        if data.get("ok"):
            print("✅ SUCCESS! Card delivered to your Telegram. Check your phone now!\n")
        else:
            print("❌ Telegram API Error:", data.get("description"))


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("\nUsage: python test_live_card.py <YOUR_BOT_TOKEN> <YOUR_CHAT_ID>")
        print("Example: python test_live_card.py 123456:ABC-DEF1234 987654321\n")
        print("Tip: To get your Chat ID, message @userinfobot on Telegram.\n")
    else:
        token = sys.argv[1].strip()
        cid = sys.argv[2].strip()
        asyncio.run(send_interactive_card(token, cid))
