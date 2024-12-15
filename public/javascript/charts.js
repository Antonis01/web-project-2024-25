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
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Μέσος χρόνος περάτωσης διπλωματικών (Μήνες)'],
            datasets: [
                {
                    label: 'Επιβλέπων',
                    data: [data.avgCompletionTimeInMonths],
                    backgroundColor: 'rgba(0, 255, 255, 0.2)',
                    borderColor: 'rgb(0, 0, 0)',
                    borderWidth: 1
                },
                {
                    label: 'Μέλος Τριμελούς',
                    data: [data.test],
                    backgroundColor: 'rgba(85, 0, 255, 0.2)',
                    borderColor: 'rgb(0, 0, 0)',
                    borderWidth: 1
                },
                {
                    label: 'Επιβλέπων και Μέλος Τριμελούς',
                    data: [data.test2],
                    backgroundColor: 'rgba(0, 255, 42, 0.2)',
                    borderColor: 'rgb(0, 0, 0)',
                    borderWidth: 1
                }
            ]
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