import app.schemas.currency as schemas
import re
from app.core.config import settings
from app.core.router_decorated import APIRouter
from fastapi import Depends, HTTPException, status
from fastapi.routing import APIRoute
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from app.db.session import get_db

router = APIRouter()
SCHEMA = settings.SCHEMA_1 + "."
group_tags=["Api-v1"]

# , response_model=List[schemas.Ticker]
@router.get("/currency",
            tags=group_tags,
            response_model=List[schemas.Currency])
def tickers_search(key: str, skip: int = 0, limit: int = 20, db: Session = Depends(get_db)) -> List[schemas.Currency]:
    """ Search for tickers by symbol
    key: str: search key
    skip: int: number of records to skip, default 0, min 0
    limit: int: number of records to return, default 20, min 1, max 100
    """
    # key validation
    try: 
        key = re.sub('([^a-zA-Z0-9\\\/]|_)+', ' ', key).strip()
        key = "^" + key.replace(" ", "|^")
    except:
        key = ""
    # skip and limit validation
    str_limit = ''
    if limit:
        offset = 0
        limit = max(1, limit)
        str_limit = f'limit {limit} offset {offset}'
    query = f"""
        SELECT c.id, aq.symbol, c.name, aq.price, aq.volume_24h, aq.percent_change_24h, aq.market_cap
        from (
        select symbol, price, volume_24h, percent_change_24h, market_cap
        from {SCHEMA}app_quote
        where symbol rlike '{key}'
        {str_limit}
        ) aq
        inner join (
            select id, name, symbol 
            from {SCHEMA}tmp_currency
        ) c on c.symbol = aq.symbol
    """
    result = []
    try:
        result = db.execute(text(query)).fetchall()
    except Exception as e:
        print(e)
        raise HTTPException(detail="loss connection to db", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
    if not result:
        return []
    # print(result)
    return [
        schemas.Currency(
            id=row.id,
            symbol=row.symbol,
            name=row.name,
            price=row.price,
            volume_24h=row.volume_24h,
            percent_change_24h=row.percent_change_24h,
            market_cap=row.market_cap
        )
        for row in result
    ]