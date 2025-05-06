import sys
import pandas as pd
from config.db import DB
from statsmodels.tsa.arima.model import ARIMA
from sklearn.metrics import mean_squared_error
from sklearn.metrics import mean_absolute_error
from sqlalchemy import create_engine, text
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.sql.expression import Insert
@compiles(Insert)
def _prefix_insert_with_ignore(insert, compiler, **kw):
    return compiler.visit_insert(insert.prefix_with('IGNORE'), **kw)

engine = create_engine(f"mysql+pymysql://{DB['user']}:{DB['password']}@{DB['host']}:{DB['port']}/{DB['database']}")
SCHEMA = DB['database'] + '.'
PRICE_1 = SCHEMA+'coin_prices' 
SIGNAL_1 = SCHEMA+'f_coin_signal_1h'
SIGNAL_4 = SCHEMA+'f_coin_signal_4h'
SIGNAL_24 = SCHEMA+'f_coin_signal_1d'


def get_prediction(data):
    arima = ARIMA(data, order=(1, 2, 1))
    arima_res = arima.fit()
    train_pred = arima_res.fittedvalues

    prediction_res = arima_res.get_forecast(1)
    conf_int = prediction_res.conf_int()
   
    lower, upper = conf_int[conf_int.columns[0]], conf_int[conf_int.columns[1]]
    forecast = prediction_res.predicted_mean

    mse = mean_squared_error(train_pred.values, data.values)
    mae = mean_absolute_error(train_pred.values, data.values)

    amse = mse / data.mean()
    amae = mae / data.mean()


    return forecast.values[0], lower.values[0], upper.values[0], amse, amae 

def main():
    df = pd.read_sql(f"select * from {PRICE_1} where open_time >= UNIX_TIMESTAMP(now()) - 3600*24*90", con=engine)
    symbols = []
    open_times = []
    preds = []
    last_prices = []
    lowers = []
    uppers = []
    mses = []
    maes = []

    for symbol, coin_df in df.groupby("symbol"):
        coin_df = coin_df.sort_values("open_time").reset_index(drop=True)
        next_pred, lower, upper, mse, mae = get_prediction(coin_df.close)

        symbols.append(symbol)
        open_times.append(coin_df.open_time.values.tolist()[-1] //3600*3600)
        preds.append(next_pred)
        last_prices.append(coin_df.close.values.tolist()[-1])
        lowers.append(lower)
        uppers.append(upper)
        mses.append(mse)
        maes.append(mae)

    out_data = {"symbol": symbols, "open_time": open_times, "next_pred": preds, "last_price": last_prices, "lower": lowers, "upper": uppers, "mse": mses, "mae": maes}
    out_df = pd.DataFrame(data=out_data)
    print(engine, out_df)
    out_df.to_sql("coin_predictions", con=engine, if_exists="append", index=False)


if __name__ == "__main__":
    try:  # run function in commamnd
        n_args = len(sys.argv)
        if n_args <= 1:
            main()
        elif n_args == 2:
            globals()[sys.argv[1]]()
        else:
            globals()[sys.argv[1]](*sys.argv[2:])
    except Exception as e:
        # run main on default
        print(e)
        main()
