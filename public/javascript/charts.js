let chart;

function setCanvasSize() {
    const canvas = document.getElementById('canvas');
    canvas.width = 400;
    canvas.height = 400;
}

function timeChart() {
    setCanvasSize();
    fetch('/get-statistics-time')
        .then(response => response.json())
        .then(data => {
            const ctx = document.getElementById('canvas').getContext('2d');
            
            if (chart) chart.destroy();

            chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Μέσος χρόνος περάτωσης διπλωματικών (Μήνες)'],
                    datasets: [
                        {
                            label: 'Επιβλέπων και Μέλος Τριμελούς',
                            data: [data.data.avgCompletionTimeTotal],
                            backgroundColor: 'rgba(0, 255, 255, 0.2)',
                            borderColor: 'rgb(0, 0, 0)',
                            borderWidth: 1
                        },
                        {
                            label: 'Επιβλέπων ',
                            data: [data.data.avgCompletionTime1],
                            backgroundColor: 'rgba(85, 0, 255, 0.2)',
                            borderColor: 'rgb(0, 0, 0)',
                            borderWidth: 1
                        },
                        {
                            label: 'Μέλος Τριμελούς',
                            data: [data.data.avgCompletionTime2],
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
        })
        .catch(error => {
            console.error('Error fetching statistics:', error);
        });
}

function gradeChart() {
    setCanvasSize();
    fetch('/get-statistics-grades')
        .then(response => response.json())
        .then(data => {
            console.log('Fetched data:', data); // Log the fetched data

            const ctx = document.getElementById('canvas').getContext('2d');
            if (chart) chart.destroy();

            chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Μέσος βαθμός πτυχιακών'],
                    datasets: [
                        {
                            label: 'Επιβλέπων και Μέλος Τριμελούς',
                            data: [data.data.avgGradeTotal],
                            backgroundColor: 'rgba(0, 255, 255, 0.2)',
                            borderColor: 'rgb(0, 0, 0)',
                            borderWidth: 1
                        },
                        {
                            label: 'Επιβλέπων ',
                            data: [data.data.avgGrade1],
                            backgroundColor: 'rgba(85, 0, 255, 0.2)',
                            borderColor: 'rgb(0, 0, 0)',
                            borderWidth: 1
                        },
                        {
                            label: 'Μέλος Τριμελούς',
                            data: [data.data.avgGrade2],
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
        })
        .catch(error => {
            console.error('Error fetching statistics:', error);
        });
} 

function countThesisChart(){
    setCanvasSize();
    fetch('/get-statistics-count')
        .then(response => response.json())
        .then(data => {
            console.log('Fetched data:', data); // Log the fetched data

            const ctx = document.getElementById('canvas').getContext('2d');
            if (chart) chart.destroy();

            chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Αριθμός πτυχιακών'],
                    datasets: [
                        {
                            label: 'Επιβλέπων και Μέλος Τριμελούς',
                            data: [data.data.countTotal],
                            backgroundColor: 'rgba(0, 255, 255, 0.2)',
                            borderColor: 'rgb(0, 0, 0)',
                            borderWidth: 1
                        },
                        {
                            label: 'Επιβλέπων ',
                            data: [data.data.count1],
                            backgroundColor: 'rgba(85, 0, 255, 0.2)',
                            borderColor: 'rgb(0, 0, 0)',
                            borderWidth: 1
                        },
                        {
                            label: 'Μέλος Τριμελούς',
                            data: [data.data.count2],
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
        })
        .catch(error => {
            console.error('Error fetching statistics:', error);
        });
}