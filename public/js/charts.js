/**
 * Chart.js implementation for Climate Dashboard
 */

document.addEventListener('DOMContentLoaded', () => {
  // Only run if climateData exists (on climate page)
  if (typeof window.climateData === 'undefined') return;

  const data = window.climateData;

  // Temperature Line Chart
  const tempCtx = document.getElementById('tempChart');
  if (tempCtx) {
    new Chart(tempCtx, {
      type: 'line',
      data: {
        labels: data.months,
        datasets: [{
          label: 'Temperature (°C)',
          data: data.temps,
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.parsed.y.toFixed(1)}°C`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: { display: true, text: 'Temperature (°C)' }
          }
        }
      }
    });
  }

  // Rainfall Bar Chart
  const rainCtx = document.getElementById('rainChart');
  if (rainCtx) {
    new Chart(rainCtx, {
      type: 'bar',
      data: {
        labels: data.months,
        datasets: [{
          label: 'Rainfall (mm)',
          data: data.rainfall,
          backgroundColor: '#0d6efd',
          borderColor: '#0d6efd',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.parsed.y} mm`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Rainfall (mm)' }
          }
        }
      }
    });
  }
});

/**
 * Economics Charts
 */
document.addEventListener('DOMContentLoaded', () => {
  // Cumulative Profit Chart
  const profitCanvas = document.getElementById('profitChart');
  if (profitCanvas) {
    const labels = JSON.parse(profitCanvas.dataset.labels);
    const data = JSON.parse(profitCanvas.dataset.data);
    new Chart(profitCanvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cumulative Profit (NT$)',
          data: data,
          borderColor: 'rgb(25, 135, 84)',
          backgroundColor: 'rgba(25, 135, 84, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: function(value) { return 'NT$' + value.toLocaleString(); } }
          }
        }
      }
    });
  }

  // Revenue vs Costs Chart
  const revenueCanvas = document.getElementById('revenueChart');
  if (revenueCanvas) {
    const labels = JSON.parse(revenueCanvas.dataset.labels);
    const revenue = JSON.parse(revenueCanvas.dataset.revenue);
    const costs = JSON.parse(revenueCanvas.dataset.costs);
    new Chart(revenueCanvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Revenue',
            data: revenue,
            backgroundColor: 'rgba(13, 110, 253, 0.7)',
            borderColor: 'rgb(13, 110, 253)',
            borderWidth: 1
          },
          {
            label: 'Total Costs',
            data: costs,
            backgroundColor: 'rgba(220, 53, 69, 0.7)',
            borderColor: 'rgb(220, 53, 69)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: function(value) { return 'NT$' + value.toLocaleString(); } }
          }
        }
      }
    });
  }
});