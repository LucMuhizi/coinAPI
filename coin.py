import requests

# CoinGecko API endpoint for getting market data
API_URL = 'https://api.coingecko.com/api/v3/coins/markets'

# Parameters for the API request
parameters = {
    'vs_currency': 'usd',
    'order': 'market_cap_desc',  # Order by market cap descending
    'per_page': '100',           # Number of cryptocurrencies to fetch
    'page': '1',
    'price_change_percentage': '1h,24h,7d'
}

try:
    response = requests.get(API_URL, params=parameters)
    data = response.json()

    if response.status_code == 200:
        # Sort cryptocurrencies by percent change in the last 24 hours
        sorted_crypto = sorted(data, key=lambda x: x['price_change_percentage_24h'] if x['price_change_percentage_24h'] is not None else -1000)

        # Get the worst performers (excluding None values)
        worst_performers = [crypto for crypto in sorted_crypto if crypto['price_change_percentage_24h'] is not None][:5]

        # Get the best performers
        best_performers = [crypto for crypto in sorted_crypto if crypto['price_change_percentage_24h'] is not None][-5:]

        print("Top 5 Worst Performing Cryptocurrencies in the Last 24 Hours:")
        for crypto in worst_performers:
            name = crypto['name']
            symbol = crypto['symbol'].upper()
            percent_change = crypto['price_change_percentage_24h']
            print(f"{name} ({symbol}): {percent_change:.2f}%")

        print("\nTop 5 Best Performing Cryptocurrencies in the Last 24 Hours:")
        for crypto in reversed(best_performers):
            name = crypto['name']
            symbol = crypto['symbol'].upper()
            percent_change = crypto['price_change_percentage_24h']
            print(f"{name} ({symbol}): {percent_change:.2f}%")
    else:
        print(f"Error fetching data from CoinGecko: {data['error'] if 'error' in data else 'Unknown error'}")

except Exception as e:
    print(f"An error occurred: {e}")
