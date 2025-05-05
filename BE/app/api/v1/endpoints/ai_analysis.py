from datetime import datetime, timedelta
from app.core.config import settings
import app.schemas.ai_analysis as schemas
from app.core.router_decorated import APIRouter
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from app.db.session import get_db

router = APIRouter()
SCHEMA = settings.SCHEMA_1 + "."
group_tags=["Api-v1"]


@router.get("/get-predictions",
            tags=group_tags,
            response_model=List[schemas.Prediction])
def get_latest_predictions(db: Session = Depends(get_db)) -> List[schemas.Prediction]:
    query = f"""
        SELECT 
            symbol, 
            open_time + interval 2 hour as date,  -- Price is predicted for the end of the next session, mean open_time + 2*period = predicted time
            last_price as price, 
            next_pred as prediction,
            ((next_pred - last_price) / last_price) * 100 AS change_percentage
        FROM 
            {SCHEMA}coin_predictions cp 
        WHERE 
            open_time = (SELECT MAX(open_time) FROM {SCHEMA}coin_predictions where last_price <> 0)
            and last_price <> 0
    """
    result = db.execute(text(query)).fetchall()
    if not result:
        raise HTTPException(status_code=404, detail="No data found")
    # print(result)
    data = []
    for row in result:
        # print("for")
        p, pr, cp = 0, 0, 0
        try: 
            p = float(row.price)
        except Exception as e:
            pass
        try: 
            pr = float(row.prediction)
        except Exception as e:
            pass
        try: 
            cp = float(row.change_percentage)
        except Exception as e:
            pass
        d = schemas.Prediction(
            symbol=row.symbol,
            date=str(row.date),
            price=p,
            prediction=pr,
            price_change=cp
        )
        data.append(d)
    return data

@router.get("/predict-validate", 
            tags=group_tags,
            response_model=schemas.Validate)
def validate(time: str=None, db: Session = Depends(get_db)) -> schemas.Validate:
    """Get the validation of the prediction from given time to now
    - time: str: time to get, format "YYYY-MM-DD HH:MM:SS". if empty or invalid, get the last 30 days 
    """
    time_check = True
    if time is None:
        time_check = False
    else:
        try:
            time_check = bool(datetime.strptime(time, '%Y-%m-%d %H:%M:%S'))
        except ValueError:
            time_check = False
    print(time, time_check)
            
    if not time_check:
        time = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d %H:%M:%S')

    query = f"""
        SELECT
            avg(err) as mae,
            avg(err_on_atr) as avg_err_rate,
            avg(true_pred) as accuracy,
            count(1) as n_trade,
            sum(true_pred) as true_pred,
            count(1) - sum(true_pred) as false_pred,
            GREATEST(max(profit_rate) - 1, 0) as max_profit_rate,
            GREATEST(1 - min(profit_rate), 0) as max_loss_rate,
            avg(profit_rate) - 1 as avg_profit_rate
        from(
            SELECT p.symbol, r.open_time,
                (p.next_pred - r.close) as err,
                abs(p.next_pred - r.close)/r.atr14 as err_on_atr,  -- sai so tren bien dong thi truong
                CASE WHEN p.pred_direction=r.direction THEN 1 ELSE 0 END as true_pred,
                case 
                    when p.pred_direction='up' then r.close / p.last_price
                    when p.pred_direction='down' then p.last_price / r.close
                    else 1
                end as profit_rate
            from(
                SELECT symbol, (open_time + interval 1 hour) as open_time, last_price, next_pred,
                case 
                    when next_pred - last_price > 0 then 'up'
                    when next_pred - last_price < 0 then 'down'
                    else 'flat'
                end as pred_direction
                FROM {SCHEMA}coin_predictions cp 
                WHERE open_time >= '{time}'
                order by open_time desc
            ) p
            inner join(
                SELECT symbol, open, close, atr14, open_time,
                case 
                    when c_diff_p - c_diff_n > 0 then 'up'
                    when c_diff_p - c_diff_n < 0 then 'down'
                    else 'flat'
                end as direction
                from {SCHEMA}f_coin_signal_1h fcsh 
                where open_time >= '{time}'
                order by open_time desc
            ) r on r.open_time = p.open_time and r.symbol = p.symbol
        ) a
    """
    result = db.execute(text(query)).fetchall()
    if not result or len(result) <= 0:
        raise HTTPException(status_code=404, detail="No data found")
    row = result[0]
    return schemas.Validate(
            mae=row.mae,
            avg_err_rate=row.avg_err_rate,
            max_profit_rate=row.max_profit_rate,
            max_loss_rate=row.max_loss_rate,
            avg_profit_rate=row.avg_profit_rate,
            accuracy=row.accuracy,
            n_trade=row.n_trade,
            true_pred=row.true_pred,
            false_pred=row.false_pred
        )

@router.get("/predict-validate/{symbol}", 
            tags=group_tags,
            response_model=schemas.Validate)
def validate_detail(symbol: str, n_predict: int=1000, db: Session = Depends(get_db)) -> schemas.Validate:
    """Get the validation of the prediction of a coin 
    - symbol: str: coin symbol
    - n_predict: int: number of prediction to validate max 1000, min 1 \n
    OUTPUT: list of Validate 
    - mae: mean absolute error - avg(true-predict) 
    - avg_err_rate: mean error rate - avg(abs(true-predict) / ATR14)  with ATR14 is average true range of the last 14 periods
    - accuracy: binary accuracy - sum(binary_acc)/n_trade with binary_acc = 1 if the prediction is in the same direction with the true price, 0 otherwise 
    - n_trade: number of trade
    - true_pred: number of true prediction
    - false_pred: number of false prediction
    - profit_rate: profit rate of each trade
    """
    if n_predict > 1000:
        n_predict = 1000
    elif n_predict < 1:
        n_predict = 1
    time = (datetime.now() - timedelta(hours=n_predict+5)).strftime('%Y-%m-%d %H:%M:%S')
    query = f"""
        SELECT
            avg(err) as mae,
            avg(err_on_atr) as avg_err_rate,
            avg(true_pred) as accuracy,
            count(1) as n_trade,
            sum(true_pred) as true_pred,
            count(1) - sum(true_pred) as false_pred,
            GREATEST(max(profit_rate) - 1, 0) as max_profit_rate,
            GREATEST(1 - min(profit_rate), 0) as max_loss_rate,
            avg(profit_rate) - 1 as avg_profit_rate
        from(
            SELECT p.symbol, r.open_time,
                (p.next_pred - r.close) as err,
                abs(p.next_pred - r.close)/r.atr14 as err_on_atr,  -- sai so tren bien dong thi truong
                CASE WHEN p.pred_direction=r.direction THEN 1 ELSE 0 END as true_pred,
                case 
                    when p.pred_direction='up' then r.close / p.last_price
                    when p.pred_direction='down' then p.last_price / r.close
                    else 1
                end as profit_rate
            from(
                SELECT symbol, (open_time + interval 1 hour) as open_time, last_price, next_pred,
                case 
                    when next_pred - last_price > 0 then 'up'
                    when next_pred - last_price < 0 then 'down'
                    else 'flat'
                end as pred_direction
                FROM {SCHEMA}coin_predictions cp 
                WHERE symbol = '{symbol}' and open_time >= '{time}'
                order by open_time desc
            ) p
            inner join(
                SELECT symbol, open, close, atr14, open_time,
                case 
                    when c_diff_p > 0 then 'up'
                    when c_diff_n > 0 then 'down'
                    else 'flat'
                end as direction
                from {SCHEMA}f_coin_signal_1h fcsh 
                where symbol = '{symbol}' and open_time >= '{time}'
                order by open_time desc
            ) r on r.open_time = p.open_time
            limit {n_predict}
        ) a
    """
    result = db.execute(text(query)).fetchall()
    if not result or len(result) <= 0:
        raise HTTPException(status_code=404, detail="No data found")
    row = result[0]
    return schemas.Validate(
            mae=row.mae,
            avg_err_rate=row.avg_err_rate,
            max_profit_rate=row.max_profit_rate,
            max_loss_rate=row.max_loss_rate,
            avg_profit_rate=row.avg_profit_rate,
            accuracy=row.accuracy,
            n_trade=row.n_trade,
            true_pred=row.true_pred,
            false_pred=row.false_pred
        )


@router.get("/predict-validate/{symbol}/chart",
            tags=group_tags,
            response_model=List[schemas.BackTest])
def get_predict_chart(symbol: str, n_predict: int=1000, db: Session = Depends(get_db)) -> List[schemas.BackTest]:
    """ Get the prediction compare history of a coin
    symbol: str: coin symbol
    start_time: str: start time to get, format "YYYY-MM-DD HH:MM:SS". if empty or invalid, get the last 24 hours 
    """
    if n_predict > 1000:
        n_predict = 1000
    elif n_predict < 1:
        n_predict = 1
    time = (datetime.now() - timedelta(hours=n_predict+5)).strftime('%Y-%m-%d %H:%M:%S')
    query = f"""
        SELECT p.symbol, r.open_time,
            (r.open_time + interval 1 hour) as close_time,
            p.next_pred as close_predict,
            r.open,
            r.close,
            r.high,
            r.low
        from(
            SELECT symbol, (open_time + interval 1 hour) as open_time, next_pred
            FROM {SCHEMA}coin_predictions cp 
            WHERE symbol = '{symbol}' and open_time >= '{time}'
            order by open_time desc
            limit {n_predict}
        ) p
        inner join(
            SELECT symbol, open, close, high, low, open_time
            from {SCHEMA}f_coin_signal_1h fcsh 
            where symbol = '{symbol}' and open_time >= '{time}'
            order by open_time desc
            limit {n_predict}
        ) r on r.open_time = p.open_time
    """
    result = db.execute(text(query)).fetchall()
    if not result:
        raise HTTPException(status_code=404, detail="No data found")
    return [
        schemas.BackTest(
            symbol=row.symbol,
            open_time=row.open_time,
            close_time=row.close_time,
            close_predict=row.close_predict,
            open=row.open,
            close=row.close,
            high=row.high,
            low=row.low
        )
        for row in result
    ]
