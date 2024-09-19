// script.js

// CoinGecko API endpoint
const API_URL = 'https://api.coingecko.com/api/v3/coins/markets';

// Parameters for the API request
const parameters = {
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: '100',
    page: '1',
    price_change_percentage: '1h,24h,7d',
    sparkline: false, // Ensure sparkline data is not included
};

// Build the query string
const queryString = new URLSearchParams(parameters).toString();

// Global variable to store fetched data
let cryptoData = [];

// Flag to ensure the event listener is only added once
let eventListenerAdded = false;

// Function to fetch data and update the UI
function fetchDataAndUpdateUI() {
    // Show the loading indicator
    const loadingIndicator = document.getElementById('loading-indicator');
    loadingIndicator.style.display = 'block';

    // Clear any previous error messages
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = '';

    fetch(`${API_URL}?${queryString}`)
        .then(response => response.json())
        .then(data => {
            // Hide the loading indicator
            loadingIndicator.style.display = 'none';

            // Update the global cryptoData variable
            cryptoData = data;

            // Display data
            displayData(cryptoData);

            // Update last updated time
            const lastUpdated = document.getElementById('last-updated');
            const now = new Date();
            lastUpdated.textContent = `Last Updated: ${now.toLocaleTimeString()}`;

            // Attach event listener to the search input if not already added
            if (!eventListenerAdded) {
                const searchInput = document.getElementById('search-input');
                searchInput.addEventListener('input', handleSearch);
                eventListenerAdded = true;
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            // Hide the loading indicator
            loadingIndicator.style.display = 'none';
            // Display error message
            errorMessage.textContent = 'An error occurred while fetching data. Please try again later.';
        });
}

// Function to display data based on current cryptoData and search query
function displayData(data) {
    // Filter out cryptocurrencies without 24h percentage change data
    const filteredData = data.filter(crypto => crypto.price_change_percentage_24h !== null);

    // Sort by 24h percentage change
    const sortedData = filteredData.sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);

    // Get the worst performers
    const worstPerformers = sortedData.slice(0, 5);

    // Get the best performers
    const bestPerformers = sortedData.slice(-5).reverse();

    // Clear existing lists
    const worstList = document.getElementById('worst-list');
    worstList.innerHTML = '';
    const bestList = document.getElementById('best-list');
    bestList.innerHTML = '';

    // Display the worst performers
    worstPerformers.forEach(crypto => {
        const listItem = document.createElement('li');
        listItem.classList.add('negative');
        listItem.textContent = `${crypto.name} (${crypto.symbol.toUpperCase()}): ${crypto.price_change_percentage_24h.toFixed(2)}%`;
        listItem.addEventListener('click', () => showChart(crypto));
        worstList.appendChild(listItem);
    });

    // Display the best performers
    bestPerformers.forEach(crypto => {
        const listItem = document.createElement('li');
        listItem.classList.add('positive');
        listItem.textContent = `${crypto.name} (${crypto.symbol.toUpperCase()}): ${crypto.price_change_percentage_24h.toFixed(2)}%`;
        listItem.addEventListener('click', () => showChart(crypto));
        bestList.appendChild(listItem);
    });
}

// Function to handle search input
function handleSearch(event) {
    const query = event.target.value.toLowerCase();

    // Filter the data based on the search query
    const filteredData = cryptoData.filter(crypto => {
        return (
            crypto.name.toLowerCase().includes(query) ||
            crypto.symbol.toLowerCase().includes(query)
        );
    });

    // Display the filtered data
    displayData(filteredData);
}

// Function to show the chart modal and fetch data
function showChart(crypto) {
    // Display the modal
    const modal = document.getElementById('chart-modal');
    const chartTitle = document.getElementById('chart-title');
    modal.style.display = 'flex';
    chartTitle.textContent = `${crypto.name} Price Chart`;

    // Clear previous error messages and chart
    const modalErrorMessage = document.getElementById('modal-error-message');
    modalErrorMessage.textContent = '';
    const ctx = document.getElementById('price-chart').getContext('2d');
    if (chartInstance) {
        chartInstance.destroy();
    }
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Show the modal loading indicator
    const modalLoadingIndicator = document.getElementById('modal-loading-indicator');
    modalLoadingIndicator.style.display = 'block';

    // Fetch historical data
    fetchHistoricalData(crypto, modalLoadingIndicator, modalErrorMessage);
}

// Function to fetch historical data from CoinGecko API
function fetchHistoricalData(crypto, modalLoadingIndicator, modalErrorMessage) {
    console.log('Fetching historical data for:', crypto.id);
    const days = 30; // Number of days of historical data
    const apiUrl = `https://api.coingecko.com/api/v3/coins/${crypto.id}/market_chart?vs_currency=usd&days=${days}`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                // Handle HTTP errors
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // Hide the modal loading indicator
            modalLoadingIndicator.style.display = 'none';

            if (!data.prices || data.prices.length === 0) {
                throw new Error('No historical price data available.');
            }
            const prices = data.prices;

            // Extract dates and prices
            const chartLabels = prices.map(price => {
                const date = new Date(price[0]);
                return `${date.getMonth() + 1}/${date.getDate()}`;
            });

            const chartData = prices.map(price => price[1]);

            // Render the chart
            renderChart(chartLabels, chartData);
        })
        .catch(error => {
            console.error('Error fetching historical data:', error);
            // Hide the modal loading indicator
            modalLoadingIndicator.style.display = 'none';
            // Display error message
            modalErrorMessage.textContent = `Unable to fetch historical data: ${error.message}`;
        });
}

let chartInstance = null;

// Function to render the chart using Chart.js
function renderChart(labels, data) {
    const ctx = document.getElementById('price-chart').getContext('2d');

    // Destroy existing chart instance if it exists
    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Price in USD',
                data: data,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.1,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false,
                },
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
                    },
                    ticks: {
                        maxTicksLimit: 10
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Price (USD)'
                    }
                }
            }
        }
    });
}

// Close modal when clicking the close button
const closeModalButton = document.getElementById('close-modal');
closeModalButton.addEventListener('click', () => {
    const modal = document.getElementById('chart-modal');
    modal.style.display = 'none';
});

// Close modal when clicking outside the modal content
window.addEventListener('click', (event) => {
    const modal = document.getElementById('chart-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Initial fetch and UI update
fetchDataAndUpdateUI();

// Auto-refresh data every 60 seconds (60000 milliseconds)
setInterval(fetchDataAndUpdateUI, 60000);
