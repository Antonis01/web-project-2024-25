function fetchThesisSt() {
    fetch('/get-thesis-st')
        .then(response => response.json())
        .then(data => {
            const thesisDetailsList = document.getElementById('thesisDetailsList');
            thesisDetailsList.innerHTML = '';
            if (data.success) {
                const thesis = data.thesis;

                const titleItem = document.createElement('li');
                titleItem.innerHTML = `
                <div class="thesis-details">
                  <strong>Τίτλος Θέματος:</strong> ${thesis.title || "Χωρίς Τίτλο"}<br>
                  <strong>Σύνοψη:</strong> ${thesis.summary || "Χωρίς Περιγραφή"}<br>
                  <strong>PDF Path:</strong> <a href="#" onclick="viewPDF('/${thesis.pdf_path}', this.parentElement)">View PDF</a><br>
                  <strong>Κατάσταση:</strong> ${thesis.status || "Χωρίς Κατάσταση"}<br>
                  <strong>Επιβλέπων Καθηγητής:</strong> ${thesis.teacher_name || "Χωρίς Δεδομένα"}<br>
                  <strong>Μέλος Τριμελούς Επιτροπής:</strong> ${thesis.teacher_name2 || "Χωρίς Δεδομένα"}<br>
                  <strong>Μέλος Τριμελούς Επιτροπής:</strong> ${thesis.teacher_name3 || "Χωρίς Δεδομένα"}<br>
                  <strong>Χρόνος από Ανάθεση:</strong> ${thesis.days_since_assignment || "Χωρίς Δεδομένα"} Days<br>
                  <strong>Ημερομηνία Τελικής Υποβολής:</strong> ${thesis.final_submission_date || "Χωρίς Δεδομένα"}<br>
                </div>
                `;
                thesisDetailsList.appendChild(titleItem);
            } else {
                thesisDetailsList.innerHTML = '<li>Δεν βρέθηκε θέμα για τον φοιτητή.</li>';
            }
        })
        .catch(error => {
            console.error('Error fetching thesis:', error);
            alert('Σφάλμα κατά την προβολή του θέματος.');
        });
}

function viewPDF(pdfPath, container) {
    const existingViewer = container.querySelector('.pdf-viewer');
    if (existingViewer) {
        existingViewer.remove();
    } else {
        const pdfViewer = document.createElement('iframe');
        pdfViewer.src = pdfPath;
        pdfViewer.width = '100%';
        pdfViewer.height = '800px';
        pdfViewer.className = 'pdf-viewer';
        pdfViewer.style.border = 'none';
        pdfViewer.style.marginTop = '10px';

        container.appendChild(pdfViewer);
    }
}

 
function fetchProfileSt() {
    fetch('/get-profile-st')
        .then(response => response.json())
        .then(data => {
            const profileDetails = document.getElementById('profileDetails');
            profileDetails.innerHTML = '';

            if (data.success) {
                const profile = data.profile;

                profileDetails.innerHTML = `
                <div class="profile-details">
                    <strong>Διεύθυνση:</strong> ${profile.home_address || "Χωρίς Δεδομένα"}<br>
                    <strong>Email:</strong> ${profile.email || "Χωρίς Δεδομένα"}<br>
                    <strong>Κινητό Τηλέφωνο:</strong> ${profile.mobile_phone || "Χωρίς Δεδομένα"}<br>
                    <strong>Σταθερό Τηλέφωνο:</strong> ${profile.landline_phone || "Χωρίς Δεδομένα"}<br>
                </div>
                `;
            } else {
                profileDetails.innerHTML = '<div>Δεν βρέθηκαν στοιχεία προφίλ για τον φοιτητή.</div>';
            }
        })
        .catch(error => {
            console.error('Error fetching profile:', error);
            alert('Σφάλμα κατά την προβολή του προφίλ.');
        });
}

function saveProfileSt() {
    const homeAddress = document.getElementById("home_address").value;
    const email = document.getElementById("email").value;
    const mobilePhone = document.getElementById("mobile_phone").value;
    const landlinePhone = document.getElementById("landline_phone").value;

    fetch('/update-profile-st', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            home_address: homeAddress,
            email: email,
            mobile_phone: mobilePhone,
            landline_phone: landlinePhone,
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Τα στοιχεία του προφίλ σας αποθηκεύτηκαν με επιτυχία!");
                fetchProfileSt(); // Ενημέρωση των δεδομένων
            } else {
                alert("Σφάλμα κατά την αποθήκευση: " + data.message);
            }
        })
        .catch(error => {
            console.error('Error saving profile:', error);
            alert('Σφάλμα κατά την αποθήκευση του προφίλ.');
        });
}
