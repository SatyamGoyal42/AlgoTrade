import yfinance as yf
import pandas as pd

def v20_extra_algo(symbol, period="6mo", interval="1d", target_increase=20):
   
    data = yf.download(symbol, period=period, interval=interval, auto_adjust=False)
    present = yf.download(symbol, period="1d", interval="1d", auto_adjust=False)


    data["Green"] = data["Close"] >= data["Open"]
    data["SMA_200"] = data["Close"].rolling(window=200).mean()
    
    results = []
    i = 0
    n = len(data)
    
    while i < n:
        if data["Green"].iloc[i]:
            # Start of a green candle sequence
            start_idx = i
            while i < n and data["Green"].iloc[i]:
                i += 1
            end_idx = i - 1
            
            # Extract the green candle group
            group = data.iloc[start_idx:end_idx+1]
            
            # LP = lowest Low, HP = highest High in this group
            LP = group["Low"][symbol].min()   # scalar
            HP = group["High"][symbol].max() 

            perc_increase = ((HP - LP) / LP) * 100
            
            current_close = present["Close"][symbol].iloc[-1]
            percentage_from_LP_to_present = ((current_close - LP) / LP) * 100

            if perc_increase >= target_increase:
                # Get the dates
                print(group)
                print("--------LP and HP--------")
                # print(group["Low"][0])
                LP_date = group["Low"].iloc[:, 0].idxmin().date()
                HP_date = group["High"].iloc[:, 0].idxmax().date()

                LP_ts = pd.Timestamp(LP_date)
                if LP_ts in data.index:
                    LP_SMA_value = data.loc[LP_ts, "SMA_200"]
                else:
                    LP_SMA_value = data.loc[data.index.date == LP_date, "SMA_200"].iloc[0]

                if isinstance(LP_SMA_value, pd.Series):
                    LP_SMA_value = LP_SMA_value.squeeze()

                    print("SMA_200 on LP_Date:", LP_SMA_value)

                # Only compare if it's a real number
                if pd.notna(LP_SMA_value) and float(LP) < float(LP_SMA_value):
                    results.append((LP_date, HP_date, LP, HP, perc_increase, percentage_from_LP_to_present))
        else:
            i += 1
    
    return results

