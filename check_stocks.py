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

def main():
    print("Fetching active alerts from Supabase...")
    response = supabase.table("stock_alerts").select("*").eq("is_active", True).execute()
    alerts = response.data

    if not alerts:
        print("No active alerts found in database.")
        return

    for item in alerts:
        row_id = item["id"]
        ticker = item["ticker"]
        name = item["name"]
        low = float(item["low_target"]) if item["low_target"] is not None else None
        high = float(item["high_target"]) if item["high_target"] is not None else None
        status = item.get("status") or ""

        stock = yf.Ticker(ticker)
        price = stock.fast_info.get("lastPrice")

        if price is None:
            print(f"[SKIP] Could not fetch price for {ticker}")
            continue

        price = round(float(price), 2)
        new_status = status

        if low is not None and price <= low:
            if status != "ALERT_DROP":
                print(f"📉 [ALERT DROP] {name} ({ticker}) dropped to {price} (Target: <= {low})")
                new_status = "ALERT_DROP"
            else:
                print(f"[INFO] {name} ({ticker}) is still below {low} (Price: {price}) - alert already triggered.")

        elif high is not None and price >= high:
            if status != "ALERT_RISE":
                print(f"📈 [ALERT RISE] {name} ({ticker}) rose to {price} (Target: >= {high})")
                new_status = "ALERT_RISE"
            else:
                print(f"[INFO] {name} ({ticker}) is still above {high} (Price: {price}) - alert already triggered.")

        else:
            print(f"[OK] {name} ({ticker}): Current price = {price} (Targets: {low} - {high})")
            new_status = ""

        supabase.table("stock_alerts").update({
            "last_price": price,
            "status": new_status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", row_id).execute()

    print("Done! Supabase table updated.")

if __name__ == "__main__":
    main()