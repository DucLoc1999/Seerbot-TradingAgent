import os
import sys
import requests
import pandas as pd
import sqlite3
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
GECKO_API_URL = os.getenv(
    "GECKO_API_URL",
    "https://api.coingecko.com/api/v3/simple/price"
)
# Comma-separated list of token IDs, e.g. "cardano,liquidity-token,another-token"
TOKEN_IDS = os.getenv("TOKEN_IDS", "cardano").split(",")
DB_PATH     = os.getenv("DB_PATH", "token_prices.sqlite")
TABLE_NAME  = os.getenv("TABLE_NAME", "token_prices")

# Ensure database and table exist
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()
cur.execute(f"""
CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    token_id     TEXT    NOT NULL,
    timestamp    INTEGER NOT NULL,
    datetime     TEXT    NOT NULL,
    price        REAL    NOT NULL,
    volume_24h   REAL,
    change_24h   REAL
);
""")
conn.commit()

class TokenPriceCrawler:
    def __init__(self, connection, tokens):
        self.conn    = connection
        self.tokens  = tokens

    def get_round_timestamp(self, interval: int):
        now = datetime.now()
        if interval == 3600:
            next_round = (now + timedelta(hours=1))\
                         .replace(minute=0, second=0, microsecond=0)
        elif interval == 86400:
            next_round = (now + timedelta(days=1))\
                         .replace(hour=0, minute=0, second=0, microsecond=0)
        else:
            raise ValueError("Interval must be 3600 (hourly) or 86400 (daily)")
        return int(next_round.timestamp()), next_round.strftime("%Y-%m-%d %H:%M:%S")

    def fetch_prices(self):
        params = {
            "ids": ",".join(self.tokens),
            "vs_currencies": "usd",
            "include_24hr_vol": "true",
            "include_24hr_change": "true"
        }
        resp = requests.get(GECKO_API_URL, params=params)
        resp.raise_for_status()
        return resp.json()  # { token_id: { usd, usd_24h_vol, usd_24h_change }, ... }

    def save_to_db(self, rows: list[tuple]):
        sql = f"""
        INSERT INTO {TABLE_NAME}
          (token_id, timestamp, datetime, price, volume_24h, change_24h)
        VALUES (?, ?, ?, ?, ?, ?)
        """
        self.conn.executemany(sql, rows)
        self.conn.commit()

    def run(self, interval: int = 3600):
        data = self.fetch_prices()
        ts, dt_str = self.get_round_timestamp(interval)
        rows = []
        for token_id, stats in data.items():
            rows.append((
                token_id,
                ts,
                dt_str,
                stats.get("usd"),
                stats.get("usd_24h_vol"),
                stats.get("usd_24h_change"),
            ))
        self.save_to_db(rows)
        for token_id, stats in data.items():
            print(f"[{dt_str}] {token_id}: ${stats.get('usd')}")

if __name__ == "__main__":
    crawler = TokenPriceCrawler(conn, TOKEN_IDS)
    try:
        # allow override via CLI: `python script.py hourly token1,token2`
        arg_interval = sys.argv[1] if len(sys.argv) > 1 else None
        if arg_interval in ("hourly", "daily"):
            interval = 3600 if arg_interval == "hourly" else 86400
        else:
            interval = 3600
        # optional second arg to override tokens list
        if len(sys.argv) > 2:
            crawler.tokens = sys.argv[2].split(",")
        crawler.run(interval)
    except Exception as e:
        print("Error:", e)
    finally:
        conn.close()
