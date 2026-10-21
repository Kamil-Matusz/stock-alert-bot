import math
import os
from datetime import datetime, timezone
import yfinance as yf
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY! Check your .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

RESET_BUFFER = 0.01


def resolve_status(price, low, high, status):
    if low is not None and price <= low:
        return "ALERT_DROP"
    if high is not None and price >= high:
        return "ALERT_RISE"
    if status == "ALERT_DROP" and low is not None and price < low * (1 + RESET_BUFFER):
        return status
    if status == "ALERT_RISE" and high is not None and price > high * (1 - RESET_BUFFER):
        return status
    return ""


def check_alert(item):
    row_id = item["id"]
    ticker = item["ticker"]
    name = item["name"]
    low = float(item["low_target"]) if item["low_target"] is not None else None
    high = float(item["high_target"]) if item["high_target"] is not None else None
    status = item.get("status") or ""

    price = yf.Ticker(ticker).fast_info.get("lastPrice")
    if price is None or math.isnan(price):
        print(f"[SKIP] Could not fetch price for {ticker}")
        return

    price = float(price)
    display_price = round(price, 2)
    new_status = resolve_status(price, low, high, status)

    if new_status == status and new_status:
        print(f"[INFO] {name} ({ticker}): {display_price} - {new_status} already triggered.")
    elif new_status == "ALERT_DROP":
        print(f"📉 [ALERT DROP] {name} ({ticker}) dropped to {display_price} (Target: <= {low})")
    elif new_status == "ALERT_RISE":
        print(f"📈 [ALERT RISE] {name} ({ticker}) rose to {display_price} (Target: >= {high})")
    else:
        print(f"[OK] {name} ({ticker}): Current price = {display_price} (Targets: {low} - {high})")

    supabase.table("stock_alerts").update({
        "last_price": display_price,
        "status": new_status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", row_id).execute()


def main():
    print("Fetching active alerts from Supabase...")
    response = supabase.table("stock_alerts").select("*").eq("is_active", True).execute()
    alerts = response.data

    if not alerts:
        print("No active alerts found in database.")
        return

    failed = 0
    for item in alerts:
        try:
            check_alert(item)
        except Exception as e:
            failed += 1
            print(f"[ERROR] {item.get('ticker')}: {e}")

    print(f"Done! Supabase table updated ({failed} failed).")


if __name__ == "__main__":
    main()
