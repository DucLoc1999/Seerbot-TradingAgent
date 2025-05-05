from datetime import datetime, timedelta, timezone
import app.schemas.al_trade as schemas
from app.core.config import settings

from app.core.router_decorated import APIRouter
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from app.db.session import get_db
from app.utils import str_to_list, str_to_list2d

router = APIRouter()
SCHEMA = settings.SCHEMA_1 + "."
group_tags=["Api-v1"]

@router.get("/top-over-sold",
            tags=group_tags,
            response_model=List[schemas.HeatMap])
def get_tos(heatMapType: str, timeType: str, db: Session = Depends(get_db)):
    """
    PARAM:
    - heatMapType: RSI Window example RSI7 | RSI14
    - timeType: FOUR_HOUR | ONE_HOUR | THIRTY_MINUTE | ONE_DAY
    """
    if heatMapType not in ("RSI7", "RSI14"):
        heatMapType = "RSI7"

    if timeType == "FOUR_HOUR":
        table_name = "f_coin_signal_4h"
    elif timeType == "ONE_HOUR":
        table_name = "f_coin_signal_1h"
    elif timeType == "THIRTY_MINUTE":
        table_name = "f_coin_signal_30m"
    else:
        table_name = "f_coin_signal_1d"
    rsi_period = heatMapType.lower()

    query = f"""
        select symbol, {rsi_period} as rsi, close, low, high, update_time as date_created
        from {SCHEMA}{table_name}
        where {rsi_period} is not null
        and {rsi_period} < 30
        and symbol like '%USDT'
        and open_time = (
            select max(open_time) as open_time
            from (
                select open_time, count(symbol) as num
                from {SCHEMA}{table_name}
                where open_time >= now() - interval 7 day
                group by open_time
            ) d
            where d.num > 0
        )
        order by {rsi_period} asc
        limit 100;
    """
    result = db.execute(text(query)).fetchall()

    return [
        schemas.HeatMap(
            symbol=row.symbol,
            rsi=row.rsi,
            close=row.close, 
            high=row.high, 
            low=row.low, 
            dateCreated=str(row.date_created)
        )
        for row in result
    ]


@router.get("/top-over-bought", 
            tags=group_tags,
            response_model=List[schemas.HeatMap])
def get_tob(heatMapType: str, timeType: str, db: Session = Depends(get_db)):
    """
    PARAM:
    - heatMapType: RSI Window example RSI7 | RSI14
    - timeType: FOUR_HOUR | ONE_HOUR | THIRTY_MINUTE | ONE_DAY
    """
    if heatMapType not in ("RSI7", "RSI14"):
        heatMapType = "RSI7"
    if timeType == "FOUR_HOUR":
        table_name = "f_coin_signal_4h"
    elif timeType == "ONE_HOUR":
        table_name = "f_coin_signal_1h"
    elif timeType == "THIRTY_MINUTE":
        table_name = "f_coin_signal_30m"
    else:
        table_name = "f_coin_signal_1d"
    rsi_period = heatMapType.lower()

    query = f"""
        select symbol, {rsi_period} as rsi, close, low, high, update_time as date_created
        from {SCHEMA}{table_name}
        where {rsi_period} is not null
        and {rsi_period} > 70
        and symbol like '%USDT'
        and open_time = (
        select max(open_time) as open_time
        from (
            select open_time, count(symbol) as num
            from {SCHEMA}{table_name}
            where open_time >= now() - interval 7 day
            group by open_time
        ) d
        where d.num > 0
        )
        order by {rsi_period} desc
        limit 100;
    """

    result = db.execute(text(query)).fetchall()
    return [
        schemas.HeatMap(
            symbol=row.symbol,
            rsi=row.rsi,
            close=row.close, 
            high=row.high, 
            low=row.low, 
            dateCreated=str(row.date_created)
        )
        for row in result
    ]


@router.get("/chart-data", 
            tags=group_tags,
            response_model=List[schemas.ChartData])
def get_chart_data(heatMapType: str, timeType: str, db: Session = Depends(get_db)):
    """
    PARAM:
    - heatMapType: RSI Window example RSI7 | RSI14
    - timeType: FOUR_HOUR | ONE_HOUR | THIRTY_MINUTE | ONE_DAY
    """
    if heatMapType not in ("RSI7", "RSI14"):
        heatMapType = "RSI7"
    timeType = timeType.strip().upper()
    if timeType == "FOUR_HOUR":
        table_name = "f_coin_signal_4h"
    elif timeType == "ONE_HOUR":
        table_name = "f_coin_signal_1h"
    elif timeType == "THIRTY_MINUTE":
        table_name = "f_coin_signal_30m"
    else:
        table_name = "f_coin_signal_1d"
    rsi_period = heatMapType.strip().lower()

    time_limit = (datetime.now(timezone.utc) - timedelta(days=5)).strftime('%Y-%m-%d %H:%M:%S')
    query = f"""
        select symbol,
            rsi,
            percentage_change
        from (
        SELECT symbol, open_time,
            {rsi_period} AS rsi,
            ({rsi_period} - lead({rsi_period}) over (PARTITION by symbol order by open_time desc)) AS percentage_change,
            row_number() over (PARTITION by symbol order by open_time desc) AS r
        FROM {SCHEMA}{table_name}
        WHERE symbol LIKE '%USDT'
        	and {rsi_period} is not null
            and open_time > "{time_limit}"
        ) a
        where r=1 and rsi is not null and percentage_change is not null
        ORDER BY symbol asc
    """
    result = db.execute(text(query)).fetchall()
    return [
        schemas.ChartData(
            symbol=row.symbol,
            rsi=row.rsi,
            percentage_change=row.percentage_change
        )
        for row in result
    ]


@router.get("/original-pair-list", 
            tags=group_tags,
            response_model=List[schemas.OriSymbol])
def get_original_pair_list(timeType: str, db: Session = Depends(get_db)) -> List[schemas.OriSymbol]:
    """
    PARAM:
    - timeType: FOUR_HOUR | ONE_HOUR | THIRTY_MINUTE | ONE_DAY
    """
    timeType = timeType.strip()
    if timeType == "FOUR_HOUR":
        table_name = "pattern_matching_4h"
    elif timeType == "ONE_HOUR":
        table_name = "pattern_matching_1h"
    elif timeType == "THIRTY_MINUTE":
        table_name = "pattern_matching_30m"
    else:
        table_name = "pattern_matching_1d"

    query = f"""
                SELECT  symbol2 as symbol, MAX(start_date2) AS discovered_symbol_time
                FROM {SCHEMA}{table_name}
                GROUP BY symbol2
                order by symbol2
            """
    result = db.execute(text(query)).fetchall()
    return [
        schemas.OriSymbol(
            symbol=row.symbol,
            discoveredOn=str(row.discovered_symbol_time)
        )
        for row in result
    ]

@router.get("/fibonacci-info",
            tags=group_tags,
            response_model=schemas.RefSymbol)
def get_fibo_info(originalPair, timeType, db: Session = Depends(get_db)) -> schemas.RefSymbol:
    """
    PARAM:
    - originalPair: example BTCUSDT, ...
    - timeType: FOUR_HOUR | ONE_HOUR | ONE_DAY
    """
    originalPair = originalPair.strip()
    timeType = timeType.strip()
    if timeType == "FOUR_HOUR":
        table_name = "pattern_matching_4h"
    elif timeType == "ONE_HOUR":
        table_name = "pattern_matching_1h"
    else:
        table_name = "pattern_matching_1d"

    query = f"""
        SELECT 
            pm.symbol2 as original_symbol, 
            pm.start_date2 as original_start_date, 
            pm.end_date as original_end_date, 
            pm.prices2 as original_prices, 
            pm.s2_norm as original_fibonacci, 
            pm.symbol1 as similar_symbol, 
            pm.start_date1 as similar_start_date, 
            pm.end_date as similar_end_date, 
            pm.prices1 as similar_prices, 
            pm.s1_norm as similar_fibonacci 
        FROM {SCHEMA}{table_name} pm 
        WHERE pm.symbol2 = '{originalPair}'
        AND pm.start_date2 = ( 
            SELECT MAX(start_date2) 
            FROM {SCHEMA}{table_name} 
            WHERE symbol2 = '{originalPair}'
        )
    """
    result = []
    try:
        result = db.execute(text(query)).fetchall()  #
        if not result or len(result) == 0:
            raise HTTPException(status_code=404, detail="No data found")
    except Exception as e:
        print(e)
    r = result[0]
    res = schemas.RefSymbol(
        originalSymbol=r[0],
        originalStartDate=str(r[1]), 
        originalEndDate=str(r[2]),
        originalPrices=str_to_list(r[3]), 
        originalFibonacci=str_to_list(r[4]),
        similarSymbols=[str(r[5])], 
        similarStartDates=[str(r[6])],
        similarEndDates=[str(r[7])],
        similarPrices=str_to_list2d(r[8]),
        similarFibonacci=str_to_list2d(r[9]),
    )
    return res
