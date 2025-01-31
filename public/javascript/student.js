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

function thesesStatus(){
    return fetch('/get-theses-status')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                return data.theses.map(thesis => thesis.status);
            } else {
                console.error('Error fetching theses status:', data.message);
                return [];
            }
        })
        .catch(error => {
            console.error('Error fetching theses status:', error);
            return [];
        });
}

document.getElementById("diploManagement").addEventListener("click", function(event){
    thesesStatus().then(statuses => {
        if (statuses.includes('Υπό Ανάθεση')) {
            if (!document.getElementById('teacherAmSelect')) {
                inviteTeacher();
            }
        } else if (statuses.includes('Υπό Εξέταση')) {
            if( document.getElementById('pdfFileInput') == null) addUploadElements();

        } else if (statuses.includes('Περατωμένη')) {
            alert("Περατωμένη");
        } else {
            alert("Δεν μπορείτε να δείτε την διαχείριση διπλωματικής");
        }
    });
});

function inviteTeacher() {
    fetch('/get-teacher-info')
        .then(response => response.json())
        .then(data => {
            const teacherDataElement = document.getElementById('teacherData');
            teacherDataElement.innerHTML = '';

            if (data.success) {

                if (!document.getElementById('teacherAmSelect')) {

                    const teacherAmSelect = document.createElement('select');
                    teacherAmSelect.id = 'teacherAmSelect';

                    data.teachers.forEach(teacher => {
                        const option = document.createElement('option');
                        option.value = teacher.teacher_am;
                        option.text = `${teacher.teacher_name} (${teacher.teacher_am})`;
                        teacherAmSelect.appendChild(option);
                    });

                    const submitButton = document.createElement('button');
                    submitButton.innerText = 'Submit Invitation';
                    submitButton.onclick = function() {
                        const teacherAm = document.getElementById('teacherAmSelect').value;
                        sendInvitation(teacherAm);
                    };

                    teacherDataElement.appendChild(teacherAmSelect);
                    teacherDataElement.appendChild(submitButton);
                }

                data.teachers.forEach(teacher => {
                    const teacherItem = document.createElement('div');
                    teacherItem.classList.add('teacher-details');
                    teacherItem.innerHTML = `
                        <strong>Όνομα Καθηγητή:</strong> ${teacher.teacher_name || "Χωρίς Δεδομένα"}<br>
                        <strong>AM:</strong> ${teacher.teacher_am || "Χωρίς Δεδομένα"}<br>
                        <strong>Email:</strong> ${teacher.email || "Χωρίς Δεδομένα"}<br>
                        <br> 
                    `;
                    teacherDataElement.appendChild(teacherItem);
                });
            } else {
                teacherDataElement.innerHTML = '<div>Δεν βρέθηκαν δεδομένα καθηγητών.</div>';
            }
        })
}

function getThesisID() {
    return fetch('/get-thesis-id')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                return data.thesis_id;
            } else {
                console.error('Error fetching thesis ID:', data.message);
                return null;
            }
        })
        .catch(error => {
            console.error('Error fetching thesis ID:', error);
            return null;
        });
}

function sendInvitation(teacherAm) {
    getThesisID().then(thesisID => {

        if (!thesisID) {
            alert('Δεν βρέθηκε θέμα για τον φοιτητή.');
            return;
        }

        const data = {
            teacher_am: teacherAm,
            role: 'Μέλος',
            thesis_id: thesisID 
        };

        fetch('/invite-teacher', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => response.json())
        .then(data => {

            if (data.success) {
                alert("Η πρόσκληση απεστάλη με επιτυχία!");
            } else {
                alert("Σφάλμα κατά την αποστολή της πρόσκλησης: " + data.message);
            }
        })
    });
}

function addUploadElements() {
    const container = document.getElementById('uploadContainer');

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'pdfFileInput';
    fileInput.accept = 'application/pdf';

    const uploadButton = document.createElement('button');
    uploadButton.innerText = 'Upload PDF';
    uploadButton.onclick = uploadThesesDraft;

    container.appendChild(fileInput);
    container.appendChild(uploadButton);
}
function uploadThesesDraft() {
    const pdfFileInput = document.getElementById('pdfFileInput');
    const file = pdfFileInput.files[0];

    if (!file) {
        alert('Please select a PDF file to upload.');
        return;
    }

    getThesisID().then(thesisID => {
        if (!thesisID) {
            alert('Δεν βρέθηκε θέμα για τον φοιτητή.');
            return;
        }

        const formData = new FormData();
        formData.append('thesisDraft', file);
        formData.append('thesis_id', thesisID);

        fetch('/upload-thesis-draft', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('PDF uploaded successfully!');
            } else {
                alert('Error uploading PDF: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error uploading PDF:', error);
            alert('Error uploading PDF.');
        });
    });
}