fetch('/get-statistics')
    .then(response => response.json())
    .then(data => {
        createChart(data.data);
    })
    .catch(error => {
        console.error('Error fetching statistics:', error);
    });

function createChart(data) {
    const ctx = document.getElementById('avgCmpltTime').getContext('2d');
    const myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Average Completion Time'], 
            datasets: [{
                label: 'Average Completion Time (Months)',
                data: [data.avgCompletionTimeInMonths], 
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}