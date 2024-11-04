// pennystock.ai
//
// (C) 2024 Zac Finger, CC BY 4.0 https://creativecommons.org/licenses/by/4.0/deed.en
// Georgia Tech Online MS in Computer Science
// CS 6750: Human Computer Interaction
// Dr. David Joyner
// 2024-11-04

// References
// https://www.investopedia.com/terms/e/ema.asp
// Written in consultation with https://zzzcode.ai/answer-question

const stockSearchInput = document.getElementById('stock-search');
const stockSuggestionsBox = document.getElementById('stock-search-suggestions');
const stockSearchWidget = document.getElementById('stock-search-widget');

const indicatorSearchInput = document.getElementById('indicator-search');
const indicatorSuggestionsBox = document.getElementById('indicator-search-suggestions');
const indicatorSearchWidget = document.getElementById('indicator-search-widget');

const indicatorSymbolSelect = document.getElementById('indicator-symbol-select');

let stockSymbols = ['AAPL'];    // Default stock symbol
let indicators = {};
let currentTimeRange = 183;

var stockSuggestions = [
    "A",
    "AA",
    "AAA",
    "AALI",
    "AAV",
    "AEDUSD",
    "AIR-FR",
    "ARSUSD",
    "AUDUSD",
    "AZN-GB",
    "ABB.N-CH",
    "ALV-DE",
    "AA",
    "AACG",
    "AADR",
    "AACT",
    "AAP",
    "AAPL",
    "AAPB",
    "AAPD",
    "AAPU",
    "DVA",
    "DVN",
    "DVAX",
    "DVYE",
    "DVYA",
    "DVY-FF",
    "DVY",
    "DIA",
    "DKKUSD",
    "USDDKK",
    "DVP",
    "DVLA",
    "DVM",
    "DVYSR",
    "X",
    "XL",
    "XEL",
    "XYL",
    "XOM",
    "XRP.BS",
    "XLB",
    "XLE",
    "XLF",
    "XLG",
    "XLI",
    "XLM",
    "XLS",
    "XLU",
    "XLUP",
    "XLUS-GB",
    "XLUS-GB",
    "XLUS-CH",
    "XLUS^-IT"
];
stockSuggestions.sort();

var indicatorSuggestions = [
    'Moving Average',
    'Moving Average Envelope',
    'Moving Average Deviation',
    'Bollinger Bands',
    'RSI',
    'MACD'
];

function fetchStockData(symbol, range, usePercent) {
    let stockData = [];

    if(symbol == "AAPL") {
        stockData = aaplData;
    }
    if(symbol == "XLU") {
        stockData = xluData;
    }
    if(symbol == "DVY") {
        stockData = dvyData;
    }

    // Sort data by date
    stockData.sort((a, b) => new Date(a.date) - new Date(b.date));

    const startDate = new Date();
    const endDate = new Date();
    
    startDate.setDate(endDate.getDate() - range);

    // Use date range specified by user, i.e., 5D, 1M, 3M, etc
    let filteredStockData = stockData.filter(data => {
        const currentDate = new Date(data.date);
        return currentDate >= startDate && currentDate <= endDate;
    });

    // if multiple symbols selected, display as a ratio from start date
    if(usePercent)
    {
        const initialPrice = filteredStockData[0].price;
        filteredStockData = filteredStockData.map(stock => {
            return {
                date: stock.date,
                price: 100 * stock.price / initialPrice
            };
        });
    }

    return filteredStockData;
}

function removeSymbol() {
    let symbol = this.id.split('-').pop();
    stockSymbols = stockSymbols.filter(item => item !== symbol);
    delete indicators[symbol];
    debugger;
    plotData();
}

function removeIndicator() {
    let myId = this.id.split('-');
    let type = myId.pop();
    let symbol = myId.pop();

    indicators[symbol] = indicators[symbol].filter(item => item.type !== type);

    plotData();
}

// redraw view, also handles elements on widgets
function plotData() {
    const traces = [];
    const colors = ['blue','red','green','yellow'];
    var currentColor = 0;
    const symbolContainer = document.getElementById('symbol-container');
    var usePercent = stockSymbols.length > 1;
    var multipleSymbolTitle = "Comparison of ";

    // remove symbol-container-symbol class
    let elements = Array.from(document.getElementsByClassName('symbol-container-symbol'));
    elements.forEach(e => {
        e.remove();
    });
    // remove widget-stock-symbol class
    elements = Array.from(document.getElementsByClassName('widget-stock-symbol'));
    elements.forEach(e => {
        e.remove();
    });
    // remove widget-indicator class
    elements = Array.from(document.getElementsByClassName('widget-indicator'));
    elements.forEach(e => {
        e.remove();
    });

    for (const symbol of stockSymbols) {
        let stockData = fetchStockData(symbol, currentTimeRange, usePercent);
    
        let dates = stockData.map(data => data.date);
        let prices = stockData.map(data => data.price);

        // add new line to the chart
        let trace = {
            x: dates,
            y: prices,
            type: 'scatter',
            mode: 'lines',
            marker: { color: colors[currentColor] },
            name: symbol,
        };

        traces.push(trace);
        
        if(indicators.hasOwnProperty(symbol))
        {
            for (const indicator of indicators[symbol])
            {
                var windowSize = indicator["windowSize"];
                var type = indicator["type"];
                var prettyType = type.charAt(0).toUpperCase() + type.slice(1);
                const movingAverage = type == "simple" ? 
                    calculateMovingAverage(prices, windowSize) : 
                    calculateExponentialMovingAverage(prices, windowSize);
                const maTrace = {
                    x: dates,
                    y: movingAverage,
                    mode: 'lines',
                    name: `${symbol} ${prettyType} Moving Average`,
                    line: { dash: 'dot' },
                    marker: { color: colors[currentColor] }
                };
                traces.push(maTrace);

                // Populate indicator widget
                let myDiv = document.createElement('div');
                myDiv.setAttribute('class','btn btn-secondary btn-sm d-flex justify-content-between align-items-center widget-indicator');
                myDiv.setAttribute('id',`widget-indicator-${symbol}-${type}`);
                myDiv.textContent = `${symbol} ${prettyType} Moving Average`;
                let iconElement = document.createElement('i');
                iconElement.setAttribute('id',`fa-times-icon-${symbol}-${type}`);
                iconElement.onclick = removeIndicator;
                iconElement.setAttribute('class','fas fa-times');
                myDiv.appendChild(iconElement);
                indicatorSearchWidget.appendChild(myDiv);
            }            
        }

        // Populate symbol-container for each symbol 
        let myBtn = document.createElement('button');
        myBtn.setAttribute('type','button');
        myBtn.setAttribute('class','btn btn-secondary btn-lg symbol-container-symbol');
        myBtn.setAttribute('id','symbol-container-'+symbol);
        myBtn.textContent = symbol;
        symbolContainer.insertBefore(myBtn, symbolContainer.firstChild);

        // Populate stock widget
        let myDiv = document.createElement('div');
        myDiv.setAttribute('class','btn btn-secondary btn-sm d-flex justify-content-between align-items-center widget-stock-symbol');
        myDiv.setAttribute('id','widget-stock-symbol-'+symbol);
        myDiv.textContent = symbol;
        let iconElement = document.createElement('i');
        iconElement.setAttribute('id','fa-times-icon-'+symbol);
        iconElement.onclick = removeSymbol;
        iconElement.setAttribute('class','fas fa-times');
        myDiv.appendChild(iconElement);
        stockSearchWidget.appendChild(myDiv);

        currentColor++;
        multipleSymbolTitle += `${symbol}, `;
    }

    const layout = {
        title: usePercent ? multipleSymbolTitle.slice(0,-2) : 'Stock Price Over Time',
        xaxis: {
            title: 'Date',
        },
        yaxis: {
            title: usePercent ? '% growth' : 'Price (USD)',
        },
    };

    Plotly.newPlot('chart', traces, layout);
}

// moving average
function calculateMovingAverage(data, windowSize) {
    debugger;
    const movingAverage = [];
    for (let i = 0; i < data.length; i++) {
        if (i < windowSize - 1) {
            movingAverage.push(null);
        } else {
            const window = data.slice(i - windowSize + 1, i + 1);
            const average = window.reduce((sum, value) => sum + value, 0) / windowSize;
            movingAverage.push(average);
        }
    }
    return movingAverage;
}

// expontential moving average
function calculateExponentialMovingAverage(data, windowSize) {
    const ema = [];
    const alpha = 2 / (windowSize + 1);
    
    // first index is equal to actual value of first data point
    ema[0] = data[0];

    for (let i = 1; i < data.length; i++) {
        // Use EMA formula
        // https://www.investopedia.com/terms/e/ema.asp
        ema[i] = (data[i] * alpha) + (ema[i - 1] * (1 - alpha));
    }
    
    return ema;
}

// redraw UI after updating time range
function updateTimeRange(range) {
    currentTimeRange = range;
    plotData();
}

function updateSuggestionsBox(mySearch, mySuggestionsBox) {
    const query = mySearch.value.toLowerCase();
    mySuggestionsBox.innerHTML = '';
    if (query) {
        const isStockSearch = event.currentTarget.id.startsWith('stock');
        const suggestions = isStockSearch ? stockSuggestions : indicatorSuggestions;
        const filteredSuggestions = suggestions.filter(item => item.toLowerCase().includes(query));
        filteredSuggestions.forEach(item => {
            const suggestionItem = document.createElement('div');
            suggestionItem.classList.add('suggestion-item');
            suggestionItem.textContent = item;
            if(isStockSearch) {
                suggestionItem.onclick = () => selectSuggestion(item);    
            } else {
                suggestionItem.onclick = () => selectIndicator(item);
            }
            mySuggestionsBox.appendChild(suggestionItem);
        });
    }
}

stockSearchInput.addEventListener('input', function() {
    updateSuggestionsBox(stockSearchInput, stockSuggestionsBox);
});

indicatorSearchInput.addEventListener('input', function() {
    updateSuggestionsBox(indicatorSearchInput, indicatorSuggestionsBox);
});

function selectSuggestion(item) {
    stockSuggestionsBox.innerHTML = '';
    stockSearchInput.value = '';
    stockSymbols.push(item);
    plotData();
}

function selectIndicator(item){
    // reset title
    $('#indicator-modal-label').text(`Add ${item}`);
    // reset symbol selector
    indicatorSymbolSelect.innerHTML = '';
    for (const symbol of stockSymbols) {
        let option = document.createElement('option');
        option.setAttribute('value', symbol);
        option.textContent = symbol;
        indicatorSymbolSelect.appendChild(option);
    }
    // TODO: reset other fields...

    $('#indicator-modal').modal('show');
}

function toggleWidgetVisible(widget, mySearch, mySuggestionsBox) {
    if (widget.style.display === 'none' || widget.style.display === '') {
        widget.style.display = 'block'; // Show the widget
    } else {
        widget.style.display = 'none'; // Hide the widget
        mySearch.value = '';
        updateSuggestionsBox(mySearch, mySuggestionsBox);
    }
}

function addIndicator() {
    // TODO: check if user entered all fields
    var symbol = document.getElementById("indicator-symbol-select").value;

    var indicator = {
        "symbol": symbol,
        "step": +document.getElementById("indicator-step-select").value,
        "windowSize": +document.getElementById("indicator-period").value,
        "type": document.getElementById("indicator-type-select").value
    }

    if(indicators.hasOwnProperty(symbol))
    {
        indicators[symbol].push(indicator);
    }
    else {
        indicators[symbol] = [indicator];
    }
    
    $('#indicator-modal').modal('hide');

    plotData();
}

document.getElementById('add-stocks-btn').addEventListener('click', function() {
   toggleWidgetVisible(stockSearchWidget, stockSearchInput, stockSuggestionsBox); 
});

stockSearchWidget.addEventListener('mouseleave', function() {
    toggleWidgetVisible(stockSearchWidget, stockSearchInput, stockSuggestionsBox);
});

document.getElementById('add-indicators-btn').addEventListener('click', function() {
   toggleWidgetVisible(indicatorSearchWidget, indicatorSearchInput, indicatorSuggestionsBox); 
});

indicatorSearchWidget.addEventListener('mouseleave', function() {
    toggleWidgetVisible(indicatorSearchWidget, indicatorSearchInput, indicatorSuggestionsBox);
});

// Initial plot
plotData();
