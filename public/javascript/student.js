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
                  <strong>PDF:</strong> <a href="#" onclick="viewPDF('/${thesis.pdf_path}', this.parentElement)">Προβολή PDF</a><br>
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
            thesisDetailsList.innerHTML = '<li>Δεν βρέθηκε θέμα για τον φοιτητή.</li>';
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
            if (!document.getElementById('teacherAmSelect')) inviteTeacher();
            
        } else if (statuses.includes('Υπό Εξέταση')) {
            if( document.getElementById('pdfFileInput') == null) presentationElements();
            

        } else if (statuses.includes('Περατωμένη')) {
            if (document.getElementById('completedTheses').children.length === 0) thesesCompleted();
            
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
            console.error('Error fetching thesis IDs:', error);
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

function presentationElements() {
    const form = document.getElementById('presentationForm');

    const uploadForm = document.createElement('div');
    uploadForm.className = 'upload-form';

    uploadForm.innerHTML = `
        <input type="file" id="pdfFileInput" accept="application/pdf" class="upload-input">
        <textarea id="additionalLinks" placeholder="Προσθήκη επιπλέον συνδέσμων" class="upload-textarea"></textarea>
        <input type="date" id="examDate" class="upload-input">
        <input type="time" id="examTime" class="upload-input">
        <select id="examType" class="upload-select">
            <option value="">Επίλεξε τρόπο παρουσίασης</option>
            <option value="in-person">Δια ζώσης</option>
            <option value="online">Διαδικτυακά</option>
        </select>
        <textarea id="examLocation" placeholder="Enter exam location" class="upload-textarea" style="display: none;"></textarea>
        <textarea id="examLink" placeholder="Enter exam link" class="upload-textarea" style="display: none;"></textarea>
        <button type="button" class="upload-button" onclick="uploadPresentationData()">Mεταφόρτωση</button>
    `;

    form.appendChild(uploadForm);

    document.getElementById('examType').addEventListener('change', function() {
        const isOnline = this.value === 'online';
        const isInPerson = this.value === 'in-person';
        document.getElementById('examLocation').style.display = isInPerson ? 'block' : 'none';
        document.getElementById('examLink').style.display = isOnline ? 'block' : 'none';
    });

    showRepositoryLinkForm();

}

function uploadPresentationData() {
    const pdfFileInput = document.getElementById('pdfFileInput');
    const file = pdfFileInput.files[0];

    if (!file) {
        alert('Παρακαλώ επιλέξτε αρχείο για μεταφόρτωση.');
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
        formData.append('presentation_date', document.getElementById('examDate').value);
        formData.append('presentation_time', document.getElementById('examTime').value);
        formData.append('presentation_type', document.getElementById('examType').value);
        formData.append('presentation_location', document.getElementById('examLocation').value);
        formData.append('presentation_link', document.getElementById('examLink').value);
        formData.append('additional_links', document.getElementById('additionalLinks').value); 

        fetch('/set-presentation', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            alert(data.success ? 'Τα δεδομένα μεταφορτωθηκαν επιτυχώς!' : 'Σφάλμα κατά την μεταφόρτωση: ' + data.message);
        })
        .catch(error => {
            console.error('Error uploading data:', error);
            alert('Σφάλμα κατά την μεταφόρτωση.');
        });
    });
}

function showRepositoryLinkForm() {
    const form = document.getElementById('presentationForm');

    const uploadForm = document.createElement('div');
    uploadForm.className = 'upload-form';

    uploadForm.innerHTML = `
        <input type="text" id="repositoryLink" placeholder="Enter repository link" class="upload-input">
        <button type="button" class="upload-button" onclick="submitRepositoryLink()">Προσθήκη συνδέσμου</button>
        <button type="button" class="upload-button" onclick="viewExamReport()">Προβολή πρακτικού εξέτασης</button>
    `;

    form.appendChild(uploadForm);
}

function submitRepositoryLink() {
    const repositoryLink = document.getElementById('repositoryLink').value;

    getThesisID().then(thesisID => {
        if (!thesisID) {
            alert('Δεν βρέθηκε θέμα για τον φοιτητή.');
            return;
        }

        fetch('/submit-repository-link', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                thesis_id: thesisID,
                repository_link: repositoryLink
            })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.success ? 'Επιτυχής καταχώρηση συνδέσμου!' : 'Αποτυχία καταχώρησης συνδέσμου: ' + data.message);
        })
        .catch(error => {
            console.error('Error submitting repository link:', error);
            alert('Error submitting repository link.');
        });
    });
}
function viewExamReport() {
    getThesisID().then(thesisID => {
        if (!thesisID) {
            alert('Δεν βρέθηκε θέμα για τον φοιτητή.');
            return;
        }
        window.open(`/exam-report/${thesisID}`, '_blank');
    }).catch(error => {
        console.error('Error fetching thesis ID:', error);
        alert('Σφάλμα κατά την προβολή της αναφοράς εξέτασης.');
    });
}

function thesesCompleted() {
    const form = document.getElementById('completedTheses');

    const completedForm = document.createElement('div');
    completedForm.className = 'completed-form';

    completedForm.innerHTML = `
        <button type="button" class="upload-button" onclick="viewExamReport()">Προβολή πρακτικού εξέτασης</button>
    `;
    form.appendChild(completedForm);

}