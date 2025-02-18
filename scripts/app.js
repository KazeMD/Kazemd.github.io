const counties = {
    'anne-arundel': {
        name: 'Anne Arundel County, MD',
        zone: 'MDZ014',
        coords: { lat: 39.0027, lng: -76.6575 }
    },
    'wicomico': {
        name: 'Wicomico County, MD',
        zone: 'MDZ023',
        coords: { lat: 38.3753, lng: -75.6147 }
    },
    'sussex': {
        name: 'Sussex County, DE',
        zone: 'DEZ003',
        coords: { lat: 38.6783, lng: -75.3369 }
    }
};

async function loadCountyData(countyId) {
    try {
        document.body.classList.remove('loaded');
        const county = counties[countyId];
        
        const [alerts, forecast] = await Promise.all([
            fetch(`https://api.weather.gov/alerts/active/zone/${county.zone}`, {
                headers: { 'Accept': 'application/geo+json' }
            }).then(handleResponse),
            getForecast(county.coords)
        ]);

        displayData(countyId, alerts, forecast);
    } catch (error) {
        showError(error);
    } finally {
        document.body.classList.add('loaded');
    }
}

async function getForecast(coords) {
    try {
        const pointsResponse = await fetch(
            `https://api.weather.gov/points/${coords.lat},${coords.lng}`,
            { headers: { 'Accept': 'application/geo+json' } }
        );
        const pointsData = await handleResponse(pointsResponse);
        const forecastResponse = await fetch(pointsData.properties.forecast);
        return handleResponse(forecastResponse);
    } catch (error) {
        throw new Error('Failed to get forecast: ' + error.message);
    }
}

function displayData(countyId, alerts, forecast) {
    const content = document.getElementById('content');
    
    // Clear previous errors
    content.querySelectorAll('.error-alert').forEach(el => el.remove());
    
    let alertsHtml = '';
    if (alerts.features.length > 0) {
        alertsHtml = alerts.features.map(alert => `
            <li class="alert alert-${getAlertClass(alert.properties.severity)}">
                <strong>${alert.properties.event}</strong><br>
                ${alert.properties.headline}<br>
                <small>${new Date(alert.properties.effective).toLocaleString()}</small>
            </li>
        `).join('');
    } else {
        alertsHtml = '<div class="alert alert-info">No active alerts</div>';
    }

    const threats = extractThreats(forecast);
    let threatsHtml = threats.map(threat => `
        <span class="badge ${getThreatClass(threat)} threat-badge">${threat}</span>
    `).join('');
    
    if (threats.length === 0) {
        threatsHtml = '<div class="text-muted">No significant threats detected</div>';
    }

    content.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h3>Active Alerts</h3>
                <ul class="alert-list">${alertsHtml}</ul>
            </div>
            <div class="col-md-6">
                <h3>Current Threats</h3>
                <div id="threats">${threatsHtml}</div>
                <h4 class="mt-3">Current Conditions</h4>
                <p>${forecast.properties.periods[0]?.detailedForecast || 'No forecast available'}</p>
            </div>
        </div>
    `;
}

function handleResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function showError(error) {
    const content = document.getElementById('content');
    const errorHtml = `
        <div class="error-alert">
            <strong>Error:</strong> ${error.message}<br>
            <small>Please try again later or check the console for details.</small>
        </div>
    `;
    content.insertAdjacentHTML('afterbegin', errorHtml);
    console.error('Weather app error:', error);
}

// Keep the rest of the helper functions from previous version
// (getAlertClass, extractThreats, getThreatClass)

document.querySelectorAll('[data-county]').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('[data-county]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        loadCountyData(tab.dataset.county);
    });
});

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    loadCountyData('anne-arundel');
});