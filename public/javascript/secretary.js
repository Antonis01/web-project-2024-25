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
                            <strong>Μέλος Τριμελούς Επιτροπής 1:</strong> ${thesis.teacher2_name || "Χωρίς Δεδομένα"}<br>
                            <strong>Μέλος Τριμελούς Επιτροπής 2:</strong> ${thesis.teacher3_name || "Χωρίς Δεδομένα"}<br>
                        </div>
                    `;
                    thesesList.appendChild(listItem);
                });
            } else {
                thesesList.innerHTML = '<li>Δεν βρέθηκαν διπλωματικές εργασίες.</li>';
            }
        })
        .catch(error => {
            console.error('Error fetching active theses:', error);
            thesesList.innerHTML = '<li>Σφάλμα κατά την ανάκτηση των διπλωματικών εργασιών.</li>';
        });
}

function toggleDetails(button) {
    const details = button.parentElement.nextElementSibling;
    details.style.display = details.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', fetchActiveTheses);

async function uploadJSON() {
  const jsonFileInput = document.getElementById('jsonFile');
  if (!jsonFileInput.files.length) {
      alert('Please select a JSON file.');
      return;
  }

  const formData = new FormData();
  formData.append('jsonFile', jsonFileInput.files[0]);

  try {
      const response = await fetch('http://localhost:8080/import-json', {
          method: 'POST',
          body: formData,
      });

      const result = await response.json();

      if (response.ok) {
          alert(result.message);
      } else {
          alert(`Error: ${result.message}`);
      }
  } catch (err) {
      console.error('Error uploading JSON:', err);
      alert('Error uploading JSON.');
  }
}

// Λειτουργία: Καταχώρηση ΑΠ για Ενεργή Διπλωματική
async function submitActiveThesis() {
    const thesisId = document.getElementById('thesis-id-active').value;
    const gsNumber = document.getElementById('gs-number').value;
    const gsYear = document.getElementById('gs-year').value;

    try {
        const response = await fetch(`${API_URL}/theses/active`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ thesis_id: thesisId, gs_number: gsNumber, gs_year: gsYear })
        });

        const result = await response.json();
        alert(result.message || "Επιτυχής καταχώρηση!");
    } catch (error) {
        console.error('Σφάλμα:', error);
        alert("Αποτυχία καταχώρησης.");
    }
}

// Λειτουργία: Ακύρωση Διπλωματικής
async function cancelThesis() {
    const thesisId = document.getElementById('thesis-id-cancel').value;
    const gsNumber = document.getElementById('gs-number-cancel').value;
    const gsYear = document.getElementById('gs-year-cancel').value;
    const reason = document.getElementById('cancellation-reason').value;

    try {
        const response = await fetch(`${API_URL}/theses/cancel`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ thesis_id: thesisId, gs_number: gsNumber, gs_year: gsYear, cancellation_reason: reason })
        });

        const result = await response.json();
        alert(result.message || "Επιτυχής ακύρωση!");
    } catch (error) {
        console.error('Σφάλμα:', error);
        alert("Αποτυχία ακύρωσης.");
    }
}

// Λειτουργία: Περάτωση Διπλωματικής
async function completeThesis() {
    const thesisId = document.getElementById('thesis-id-complete').value;
    const submissionLink = document.getElementById('submission-link').value;

    try {
        const response = await fetch(`${API_URL}/theses/complete`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ thesis_id: thesisId, submission_link: submissionLink })
        });

        const result = await response.json();
        alert(result.message || "Επιτυχής περάτωση!");
    } catch (error) {
        console.error('Σφάλμα:', error);
        alert("Αποτυχία περάτωσης.");
    }
}