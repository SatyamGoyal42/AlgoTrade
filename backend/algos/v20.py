import yfinance as yf
import pandas as pd

def v20_algo(symbol, period="6mo", interval="1d", target_increase=20):
   
    data = yf.download(symbol, period=period, interval=interval, auto_adjust=True)
    present = yf.download(symbol, period="1d", interval="1d", auto_adjust=True)


    data["Green"] = data["Close"] >= data["Open"]
    
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
                results.append((LP_date, HP_date, LP,HP, perc_increase,percentage_from_LP_to_present))
        else:
            i += 1
    
    return results

