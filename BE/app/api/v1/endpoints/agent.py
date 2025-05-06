import re, os
os.environ['TZ'] = 'UTC'

from starlette.requests import Request
from app.schemas.my_base_model import Message
import app.schemas.sub_info as schemas
from app.core.config import settings
from app.core.router_decorated import APIRouter
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from app.db.session import get_db
from datetime import datetime
import pandas as pd

router = APIRouter()
SCHEMA = settings.SCHEMA_2 + "."
TOKEN_TABLE = SCHEMA + "token"
group_tags=["Trade-bot"]


def get_trades(id:str, status:str, start_time:int=None,offset:int=0, limit:int=100 , db:Session=get_db()) -> List:
    time_cond = f" and entry_time > {start_time}" if start_time else ""
    if status == 'open':
        sql = f"""
        SELECT  a.token, a.direction, a.entry_price, b.price current_price, a.position_size, a.invested_amount, a.position_size*b.price current_value, a.entry_time
        from (
            SELECT pair, LEFT(pair, char_length(pair)-4) token, direction, entry_price, exit_price, invested_amount, net_return, profit, position_size, entry_time, exit_time 
            FROM trade_bot.trades t 
            where bot_id='{id}' and status='open' {time_cond}
            limit {limit} offset {offset}
        ) a left join (
            select symbol, price
            from (
                select symbol, price, open_time,
                    row_number() over (partition by symbol order by open_time desc) r
                from(
                    select symbol, `close` as price, open_time 
                    from proddb.coin_prices_5m cpm 
                    where open_time > UNIX_TIMESTAMP(NOW()) - 1800  -- 30 p
                ) b
            ) b
            where r=1
        ) b on b.symbol = a.pair
        """
    else:
        sql = f"""
        SELECT LEFT(pair, char_length(pair)-4) token, direction, entry_price, exit_price, invested_amount, net_return, profit, position_size, entry_time, exit_time 
        FROM trade_bot.trades t 
        where bot_id="{id}" and status='closed' {time_cond}
        """
    result = []
    try:
        result = db.execute(text(sql)).fetchall()
    except Exception as e:
        print("error:", e)
    return result


@router.get("/bot/{id}/open_pos",
            tags=group_tags,
            # response_model=List[schemas.Blockchain]
            )
def bot_open_pos(id:str,offset:int=0, limit:int=100, db: Session = Depends(get_db)):
    res = get_trades(id, 'open', None, offset, limit, db)
    result = []
    try:
        for row in res:
            result.append({
                'token': row.token,
                'direction': row.direction,
                'entry_price': row.entry_price,
                'current_price': row.current_price,
                'position_size': row.position_size,
                'profit': row.current_value - row.invested_amount,
                'invested_amount': row.invested_amount,
                'current_value': row.current_value, 
                'entry_time': row.entry_time,
            })
    except Exception as e:
        print("error:", e)
    return result

    
@router.get("/bot/{id}/history",
            tags=group_tags,
            # response_model=schemas.Token
            )
def bot_trade_history(id:str, start_time:int=None, offset:int=0, limit:int=100, db: Session = Depends(get_db)) -> List:
    start_time = start_time or int(datetime.now().timestamp()) - 86400 * 30 # 30 days
    res = get_trades(id, 'closed', start_time, offset, limit, db)
    result = []
    try:
        for row in res:
            result.append({
                'token': row.token,
                'direction': row.direction,
                'entry_price': row.entry_price,
                'exit_price': row.exit_price,
                'position_size': row.position_size,
                'profit': row.profit,
                'invested_amount': row.invested_amount,
                'entry_time': row.entry_time,
                'exit_time': row.exit_time
            })
    except Exception as e:
        print("error:", e)
    return result

@router.get("/bot/{id}/summary",
            tags=group_tags,
            # response_model=schemas.Token
            )
def bot_trade_summary(id:str, start_time:int=None,offset:int=0, limit:int=100, db: Session = Depends(get_db)):
    start_time = start_time or int(datetime.now().timestamp()) - 86400 * 30 # 30 days
    data = pd.DataFrame(get_trades(id, 'closed', start_time, offset, limit, db),
                        columns=['token', 'direction', 'entry_price', 'exit_price', 'invested_amount', 'net_return', 'profit', 'position_size', 'entry_time', 'exit_time'])
    profit = data['profit'].sum()

    win = len(data[data['profit'] >= 0])
    loss = len(data[data['profit'] < 0])
    
    result = {
        'win_rate':win / (win+loss)*100, 
        'total_profit': profit, 
        'wining_trades': win,
        'losing_trades': loss,
        'trades': data.to_dict('records'),
    }
    return result

