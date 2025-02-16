// Erotima s1
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

// Erotima s1
function toggleDetails(button) {
    const details = button.parentElement.nextElementSibling;
    details.style.display = details.style.display === 'none' ? 'block' : 'none';
}

// Erotima s1
document.addEventListener('DOMContentLoaded', fetchActiveTheses);

// Erotima s2
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

// Erotima s3
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

// Erotima s3
function displayTheses(theses) {
    const thesesList = document.getElementById('thesesList');
    thesesList.innerHTML = '';

    theses.forEach(thesis => {
        console.log("Processing thesis:", thesis);

        const thesisDiv = document.createElement('div');
        thesisDiv.id = `thesis_${thesis.thesis_id}`;
        thesisDiv.innerHTML = `
            <hr>
            <p><strong>Τίτλος:</strong> ${thesis.title}</p>
            <p><strong>Κατάσταση:</strong> ${thesis.status}</p>

            ${thesis.status === 'Υπό Εξέταση' ? `
                ${thesis.final_grade ? `<p><strong>Βαθμός:</strong> ${thesis.final_grade}</p>` : '<p style="color:red;">Δεν έχει εισαχθεί βαθμός!</p>'}
                ${thesis.repository_link ? `<p><strong>Σύνδεσμος:</strong> <a href="${thesis.repository_link}" target="_blank">${thesis.repository_link}</a></p>` : '<p style="color:red;">Δεν έχει εισαχθεί σύνδεσμος!</p>'}
            ` : ''}

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

            ${thesis.status === 'Υπό Εξέταση' && thesis.final_grade && thesis.repository_link ? `
                <h4>Ολοκλήρωση Διπλωματικής:</h4>
                <button onclick="completeThesis(${thesis.thesis_id})">Οριστική Περάτωση</button>
            ` : ''}
        `;
        thesesList.appendChild(thesisDiv);
    });
}

// Erotima s3
function completeThesis(thesisId) {
    if (!confirm("Είστε σίγουροι ότι θέλετε να ολοκληρώσετε αυτή τη διπλωματική;")) return;

    fetch(`/api/theses/${thesisId}`)
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alert(`Σφάλμα: ${data.message}`);
                return;
            }

            const { final_grade, repository_link } = data.thesis;

            if (!final_grade) {
                alert("Δεν έχει εισαχθεί βαθμός!");
                return;
            }

            if (!repository_link) {
                alert("Δεν έχει εισαχθεί σύνδεσμος!");
                return;
            }

            
            fetch('/api/theses/complete', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ thesis_id: thesisId })
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert("Η διπλωματική ολοκληρώθηκε επιτυχώς!");
                    fetchTheses(); 
                } else {
                    alert(`Αποτυχία ολοκλήρωσης: ${result.message}`);
                }
            })
            .catch(error => {
                console.error("Σφάλμα κατά την ολοκλήρωση:", error);
                alert("Σφάλμα! Δοκιμάστε ξανά.");
            });
        })
        .catch(error => {
            console.error("Σφάλμα στο API:", error);
            alert("Αποτυχία φόρτωσης δεδομένων διπλωματικής.");
        });
}

// Erotima s3
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

// Erotima s3
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
              fetchTheses(); 
          } else {
              alert("Αποτυχία ακύρωσης. Δοκιμάστε ξανά.");
          }
      });
}

// Erotima s3
function completeThesis(thesisId) {
    if (!confirm("Είστε σίγουροι ότι θέλετε να ολοκληρώσετε αυτή τη διπλωματική;")) return;

    fetch('/api/theses/complete', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thesis_id: thesisId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Η διπλωματική ολοκληρώθηκε επιτυχώς!");
            fetchTheses(); 
        } else {
            alert(`Αποτυχία ολοκλήρωσης: ${data.message}`);
        }
    })
    .catch(error => {
        console.error("Σφάλμα κατά την ολοκλήρωση της διπλωματικής:", error);
        alert("Σφάλμα κατά την ολοκλήρωση. Δοκιμάστε ξανά.");
    });
}
