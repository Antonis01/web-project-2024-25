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

function fetchTheses() {
    const selectedStatus = document.getElementById('statusFilter').value;
    fetch(`/api/theses?status=${encodeURIComponent(selectedStatus)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayTheses(data.theses);
            } else {
                console.error('Error fetching theses');
            }
        });
}

// Δημιουργεί το UI για τις διπλωματικές
function displayTheses(theses) {
    const thesesList = document.getElementById('thesesList');
    thesesList.innerHTML = '';

    theses.forEach(thesis => {
        const thesisDiv = document.createElement('div');
        thesisDiv.id = `thesis_${thesis.thesis_id}`;
        thesisDiv.innerHTML = `
            <hr>
            <p><strong>Τίτλος:</strong> ${thesis.title}</p>
            <p><strong>Κατάσταση:</strong> <span id="status_${thesis.thesis_id}">${thesis.status}</span></p>
            

            ${thesis.status === 'Ενεργή' ? `
                <h4>Καταχώρηση ΑΠ ΓΣ για ανάθεση:</h4>
               <input type="text" id="gsNumberAssignment_${thesis.thesis_id}" placeholder="ΑΠ ΓΣ Ανάθεσης">
               <button onclick="submitGsNumberAssignment(${thesis.thesis_id})">Καταχώρηση</button>

                <h4>Ακύρωση Ανάθεσης:</h4>
                <input type="text" id="cancelGsNumber_${thesis.thesis_id}" placeholder="Αριθμός ΓΣ">
                <input type="text" id="cancelGsYear_${thesis.thesis_id}" placeholder="Έτος ΓΣ">
                <input type="text" id="cancelReason_${thesis.thesis_id}" placeholder="Λόγος Ακύρωσης">
                <button onclick="cancelThesis(${thesis.thesis_id})">Ακύρωση</button>
            ` : ''}
        `;
        thesesList.appendChild(thesisDiv);
    });
}

function submitGsNumberAssignment(thesisId) {
    const gsNumberAssignment = document.getElementById(`gsNumberAssignment_${thesisId}`).value.trim();

    if (!gsNumberAssignment) {
        alert("Συμπληρώστε τον αριθμό ΓΣ πριν την καταχώρηση.");
        return;
    }

    fetch('/api/assignment/gs_number', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thesis_id: thesisId, gs_number_assignment: gsNumberAssignment })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("ΑΠ Γενικής Συνέλευσης για ολοκλήρωση ανάθεσης καταχωρήθηκε επιτυχώς!");
        } else {
            alert(`Αποτυχία καταχώρησης: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Σφάλμα κατά την καταχώρηση του ΑΠ:', error);
        alert("Σφάλμα κατά την καταχώρηση. Δοκιμάστε ξανά.");
    });
}



function cancelThesis(thesisId) {
    const gsNumber = document.getElementById(`cancelGsNumber_${thesisId}`).value;
    const gsYear = document.getElementById(`cancelGsYear_${thesisId}`).value;
    const reason = document.getElementById(`cancelReason_${thesisId}`).value;

    if (!gsNumber || !gsYear || !reason) {
        alert("Συμπληρώστε όλα τα πεδία πριν την ακύρωση.");
        return;
    }

    fetch('/api/thesis/cancel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thesis_id: thesisId, gs_number: gsNumber, gs_year: gsYear, cancellation_reason: reason })
    }).then(response => response.json())
      .then(data => {
          if (data.success) {
              fetchTheses(); // Επαναφόρτωση της λίστας διπλωματικών από τη βάση
          } else {
              alert("Αποτυχία ακύρωσης. Δοκιμάστε ξανά.");
          }
      });
}