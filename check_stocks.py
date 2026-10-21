import logging
import os
from datetime import datetime, timezone
import yfinance as yf
from dotenv import load_dotenv
from supabase import create_client, Client

log = logging.getLogger("stock_alerts")

ALERT_DROP = "ALERT_DROP"
ALERT_RISE = "ALERT_RISE"
RESET_BUFFER = 0.01


def resolve_status(price, low, high, status):
    if low is not None and price <= low:
        return ALERT_DROP
    if high is not None and price >= high:
        return ALERT_RISE
    if status == ALERT_DROP and low is not None and price < low * (1 + RESET_BUFFER):
        return status
    if status == ALERT_RISE and high is not None and price > high * (1 - RESET_BUFFER):
        return status
    return None


def fetch_prices(tickers):
    data = yf.download(tickers, period="5d", progress=False)
    if data is None or data.empty:
        return {}

    closes = data["Close"]
    prices = {}
    for ticker in closes.columns:
        series = closes[ticker].dropna()
        if not series.empty:
            prices[ticker] = float(series.iloc[-1])
    return prices


def check_alert(supabase: Client, item, prices):
    row_id = item["id"]
    ticker = item["ticker"]
    name = item["name"]
    low = float(item["low_target"]) if item["low_target"] is not None else None
    high = float(item["high_target"]) if item["high_target"] is not None else None
    status = item.get("status") or None

    if low is not None and high is not None and low >= high:
        log.warning(f"[SKIP] {name} ({ticker}): low target {low} must be below high target {high}")
        return

    price = prices.get(ticker.upper())
    if price is None:
        log.warning(f"[SKIP] Could not fetch price for {ticker}")
        return

    display_price = round(price, 2)
    new_status = resolve_status(price, low, high, status)

    if new_status and new_status == status:
        log.info(f"[INFO] {name} ({ticker}): {display_price} - {new_status} already triggered.")
    elif new_status == ALERT_DROP:
        log.warning(f"📉 [ALERT DROP] {name} ({ticker}) dropped to {display_price} (Target: <= {low})")
    elif new_status == ALERT_RISE:
        log.warning(f"📈 [ALERT RISE] {name} ({ticker}) rose to {display_price} (Target: >= {high})")
    else:
        log.info(f"[OK] {name} ({ticker}): Current price = {display_price} (Targets: {low} - {high})")

    supabase.table("stock_alerts").update({
        "last_price": display_price,
        "status": new_status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", row_id).execute()


def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    load_dotenv()

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY! Check your .env file.")

    supabase = create_client(url, key)

    log.info("Fetching active alerts from Supabase...")
    response = (
        supabase.table("stock_alerts")
        .select("id, ticker, name, low_target, high_target, status")
        .eq("is_active", True)
        .execute()
    )
    alerts = response.data

    if not alerts:
        log.info("No active alerts found in database.")
        return

    prices = fetch_prices([item["ticker"] for item in alerts])

    failed = 0
    for item in alerts:
        try:
            check_alert(supabase, item, prices)
        except Exception:
            failed += 1
            log.exception(f"[ERROR] {item.get('ticker')}")

    log.info(f"Done! Checked {len(alerts)} alerts, {failed} failed.")


if __name__ == "__main__":
    main()
