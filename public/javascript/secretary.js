function fetchActiveTheses() {
    fetch('/get-active-theses')
        .then(response => response.json())
        .then(data => {
            const thesesList = document.getElementById('topicsList');
            thesesList.innerHTML = ''; // Καθαρισμός υπάρχοντος περιεχομένου

            if (data.success) {
                data.data.forEach(thesis => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <div class="thesis-title">
                            <strong>Θέμα:</strong> ${thesis.title}
                            <button onclick="toggleDetails(this)">Προβολή Λεπτομερειών</button>
                        </div>
                        <div class="thesis-details" style="display: none;">
                            <strong>Περιγραφή:</strong> ${thesis.summary || 'Χωρίς Περιγραφή'}<br>
                            <strong>Κατάσταση:</strong> ${thesis.status || 'Χωρίς Κατάσταση'}<br>
                            <strong>Χρόνος Από Ανάθεση:</strong> ${thesis.days_since_assignment || 'Χωρίς Δεδομένα'} ημέρες<br>
                            <strong>Επιβλέπων Καθηγητής:</strong> ${thesis.teacher_name || "Χωρίς Δεδομένα"}<br>
                            <strong>Μέλος Τριμελούς Επιτροπής:</strong> ${thesis.teacher_name2 || "Χωρίς Δεδομένα"}<br>
                            <strong>Μέλος Τριμελούς Επιτροπής:</strong> ${thesis.teacher_name3 || "Χωρίς Δεδομένα"}<br>
                        </div>
                    `;
                    thesesList.appendChild(listItem);
                });
            } else {
                thesesList.innerHTML = '<li>Δεν βρέθηκαν διπλωματικές εργασίες.</li>';
            }
        })
        .catch(error => {
            console.error('Σφάλμα:', error);
            alert('Προέκυψε σφάλμα κατά την φόρτωση των διπλωματικών.');
        });
}
function toggleDetails(button) {
    const details = button.parentElement.nextElementSibling;
    if (details.style.display === 'none') {
        details.style.display = 'block';
        button.textContent = 'Απόκρυψη Λεπτομερειών';
    } else {
        details.style.display = 'none';
        button.textContent = 'Προβολή Λεπτομερειών';
    }
}

