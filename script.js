// script.js

// CoinGecko API endpoint
const API_URL = 'https://api.coingecko.com/api/v3/coins/markets';

// Parameters for the API request
const parameters = {
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: '100',
    page: '1',
    price_change_percentage: '1h,24h,7d'
};

// Build the query string
const queryString = new URLSearchParams(parameters).toString();

// Fetch data from CoinGecko API
fetch(`${API_URL}?${queryString}`)
    .then(response => response.json())
    .then(data => {
        // Filter out cryptocurrencies without 24h percentage change data
        const filteredData = data.filter(crypto => crypto.price_change_percentage_24h !== null);

        // Sort by 24h percentage change
        const sortedData = filteredData.sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);

        // Get the worst performers
        const worstPerformers = sortedData.slice(0, 5);

        // Get the best performers
        const bestPerformers = sortedData.slice(-5);

        // Display the worst performers
        const worstList = document.getElementById('worst-list');
        worstPerformers.forEach(crypto => {
            const listItem = document.createElement('li');
            listItem.classList.add('negative');
            listItem.textContent = `${crypto.name} (${crypto.symbol.toUpperCase()}): ${crypto.price_change_percentage_24h.toFixed(2)}%`;
            worstList.appendChild(listItem);
        });

        // Display the best performers
        const bestList = document.getElementById('best-list');
        bestPerformers.reverse().forEach(crypto => {
            const listItem = document.createElement('li');
            listItem.classList.add('positive');
            listItem.textContent = `${crypto.name} (${crypto.symbol.toUpperCase()}): ${crypto.price_change_percentage_24h.toFixed(2)}%`;
            bestList.appendChild(listItem);
        });
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'An error occurred while fetching data. Please try again later.';
        document.body.appendChild(errorMessage);
    });
