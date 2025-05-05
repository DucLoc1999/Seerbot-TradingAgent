import app.schemas.prices as schemas
from app.core.config import settings

from app.core.router_decorated import APIRouter
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from app.db.session import get_db

router = APIRouter()
SCHEMA = settings.SCHEMA_1 + "."
group_tags=["Api-v1"]

@router.get("/latest-prices",
            tags=group_tags,
            response_model=List[schemas.LatestPrice])
def get_latest_prices(db: Session = Depends(get_db)):
    """ Get the latest prices of coins"""
    query = f"""
        select left(t1.symbol, char_length(t1.symbol) - 4) as coin, t1.close as price, 
               round(((t1.close - t3.close) * 100 / t3.close), 2) as price_change
        from {SCHEMA}f_coin_signal_5m t1
        join (
            select symbol, max(open_time) as latest_open_time
            from {SCHEMA}f_coin_signal_5m
            where open_time >= now() - interval 100 hour
            group by symbol
        ) t2 on t1.symbol = t2.symbol and t1.open_time = t2.latest_open_time
        join (
            select symbol, close, open_time
            from {SCHEMA}f_coin_signal_1d
            where (symbol, open_time) in (
                select symbol, max(open_time)
                from {SCHEMA}f_coin_signal_1d
                where open_time >= now() - interval 20 day
                group by symbol
            )
        ) t3 on t1.symbol = t3.symbol;
    """
    result = db.execute(text(query)).fetchall()
    
    if not result:
        raise HTTPException(status_code=404, detail="No data found")
    
    return [
        schemas.LatestPrice(
            coin=row.coin,
            price=row.price,
            price_change=row.price_change
        )
        for row in result
    ]


@router.get("/coin-prices", 
            tags=group_tags,
            response_model=List[schemas.CoinPrice])
def get_coin_prices(db: Session = Depends(get_db)):
    """ Get the price of coins
    """
    query = f"""
        WITH MaxTime AS (
            -- Step 1: Get the maximum open_time and its minute part
            SELECT 
                MAX(open_time) AS max_open_time,
                EXTRACT(MINUTE FROM MAX(open_time)) AS max_minute
            FROM 
                {SCHEMA}coin_prices_5m
        ),
        FilteredTimes AS (
            -- Step 2: Filter records to only those within the last 24 hours with the same minute as the max_open_time
            SELECT 
                symbol,
                open_time,
                close
            FROM 
                {SCHEMA}coin_prices_5m
            WHERE 
                open_time >= (SELECT max_open_time - INTERVAL 1 DAY FROM MaxTime)
                AND EXTRACT(MINUTE FROM open_time) = (SELECT max_minute FROM MaxTime)
        ),
        MaxTimePrices AS (
            -- Step 3: Get the close prices at max_open_time and max_open_time - INTERVAL 1 DAY
            SELECT 
                symbol,
                MAX(CASE WHEN open_time = (SELECT max_open_time FROM MaxTime) THEN close END) AS close_at_max_time,
                MAX(CASE WHEN open_time = (SELECT max_open_time - INTERVAL 1 DAY FROM MaxTime) THEN close END) AS close_at_prev_day
            FROM 
                {SCHEMA}coin_prices_5m
            WHERE 
                open_time IN ((SELECT max_open_time FROM MaxTime), (SELECT max_open_time - INTERVAL 1 DAY FROM MaxTime))
            GROUP BY 
                symbol
        )
        -- Step 4: Group by symbol and concatenate close prices, calculate price change
        SELECT 
            ft.symbol,
            mp.close_at_max_time as price,
            ROUND(((mp.close_at_max_time - mp.close_at_prev_day) / mp.close_at_prev_day) * 100, 2) AS percent_change,
            GROUP_CONCAT(ft.close ORDER BY ft.open_time SEPARATOR ', ') AS list_prices
        FROM 
            FilteredTimes ft
        JOIN 
            MaxTimePrices mp ON ft.symbol = mp.symbol
        GROUP BY 
            ft.symbol, mp.close_at_max_time, mp.close_at_prev_day
        ORDER BY 
            ft.symbol;
    """

    try:
        result = db.execute(text(query)).fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Query data error")

    return [
        schemas.CoinPrice(
            symbol=row.symbol,
            price=row.price,
            price_change=row.percent_change,
            list_prices=[float(price) for price in row.list_prices.split(",")]
        )
        for row in result
    ]