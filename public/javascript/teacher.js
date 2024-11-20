document.getElementById('topicForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const formData = new FormData(this);
    
    fetch('/add-thesis', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Thesis added successfully!');
            // Fetch and display the updated list of theses
            fetchTheses();
        } else {
            alert('Error adding thesis: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while adding the thesis.');
    });
});

function fetchTheses() {
    fetch('/get-theses')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const thesesList = document.getElementById('topicsList');
                thesesList.innerHTML = ''; // Clear any existing content

                data.data.forEach(thesis => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <strong>Title:</strong> ${thesis.title}<br>
                        <strong>Summary:</strong> ${thesis.summary}<br>
                        <strong>Status:</strong> ${thesis.status}<br>
                        <strong>Instructor ID:</strong> ${thesis.instructor_id}<br>
                        <strong>Student ID:</strong> ${thesis.student_id}<br>
                        <strong>Final Submission Date:</strong> ${thesis.final_submission_date}<br>
                        <strong>PDF Path:</strong> <a href="#" onclick="viewPDF('/${thesis.pdf_path}')">View PDF</a><br>
                        <button onclick="editThesis(${thesis.thesis_id})">Edit</button>
                    `;
                    thesesList.appendChild(listItem);
                });
            } else {
                alert('Error fetching theses: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while fetching the theses.');
        });
}

document.addEventListener('DOMContentLoaded', fetchTheses);

function viewPDF(pdfPath) {
    const pdfViewerContainer = document.getElementById('pdfViewerContainer');
    const pdfViewer = document.getElementById('pdfViewer');
    pdfViewer.src = pdfPath;
    pdfViewerContainer.style.display = 'block';
}

function editThesis(thesisId) {
    fetch(`/get-thesis/${thesisId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const thesis = data.data;
                document.getElementById('editThesisId').value = thesis.thesis_id;
                document.getElementById('editTitle').value = thesis.title;
                document.getElementById('editDescription').value = thesis.summary;
                document.getElementById('editInstructorId').value = thesis.instructor_id;
                document.getElementById('editStudentId').value = thesis.student_id;
                document.getElementById('editFinalSubmissionDate').value = thesis.final_submission_date;
                document.getElementById('editStatus').value = thesis.status;
                document.getElementById('editThesisFormContainer').style.display = 'block';
            } else {
                alert('Error fetching thesis: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while fetching the thesis.');
        });
}

document.getElementById('editThesisForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const formData = new FormData(this);
    
    fetch('/update-thesis', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Thesis updated successfully!');
            document.getElementById('editThesisFormContainer').style.display = 'none';
            fetchTheses(); // Refresh the list of theses
        } else {
            alert('Error updating thesis: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while updating the thesis.');
    });
});

function deleteThesis() {
    const thesisId = document.getElementById('editThesisId').value;
    
    if (confirm('Are you sure you want to delete this thesis?')) {
        fetch(`/delete-thesis/${thesisId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Thesis deleted successfully!');
                document.getElementById('editThesisFormContainer').style.display = 'none';
                fetchTheses(); // Refresh the list of theses
            } else {
                alert('Error deleting thesis: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while deleting the thesis.');
        });
    }
}

function cancelEdit() {
    document.getElementById('editThesisFormContainer').style.display = 'none';
}
// Γενική συνάρτηση για αποστολή AJAX αιτημάτων
function sendRequest(url, method, data = null) {
    return fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : null
    })
    .then(response => response.json())
    .catch(error => {
        console.error('Error:', error);
        return { success: false, message: 'Σφάλμα κατά την επεξεργασία του αιτήματος.' };
    });
}

// Αναζήτηση φοιτητή βάσει ΑΜ
function searchStudent() {
    const studentId = document.getElementById("studentId").value.trim();
    if (studentId === "") {
        alert("Συμπληρώστε το πεδίο ΑΜ.");
        return;
    }

    sendRequest(`/search-student?studentId=${encodeURIComponent(studentId)}`, 'GET')
        .then(response => {
            if (response.success) {
                alert("Επιτυχής καταχώρηση ΑΜ φοιτητή.");
                document.getElementById("studentName").value = response.data.studentName; // Αυτόματη συμπλήρωση ονόματος
            } else {
                alert("Δεν βρέθηκε φοιτητής με το συγκεκριμένο ΑΜ.");
            }
        });
}

// Αναζήτηση φοιτητή βάσει ονοματεπώνυμου
function searchStudentName() {
    const studentName = document.getElementById("studentName").value.trim();
    if (studentName === "") {
        alert("Συμπληρώστε το πεδίο ονοματεπώνυμου.");
        return;
    }

    sendRequest(`/search-student?studentName=${encodeURIComponent(studentName)}`, 'GET')
        .then(response => {
            if (response.success) {
                alert("Φοιτητής βρέθηκε.");
                document.getElementById("studentId").value = response.data.studentId; // Αυτόματη συμπλήρωση ΑΜ
            } else {
                alert("Δεν βρέθηκε φοιτητής με το συγκεκριμένο ονοματεπώνυμο.");
            }
        });
}

// Αναζήτηση θέματος
function searchThesis() {
    const subject = document.getElementById("subject").value.trim();
    if (subject === "") {
        alert("Συμπληρώστε το πεδίο θέματος.");
        return;
    }

    sendRequest(`/search-thesis?subject=${encodeURIComponent(subject)}`, 'GET')
        .then(response => {
            if (response.success) {
                alert("Θέμα διαθέσιμο για ανάθεση!");
            } else {
                alert("Το θέμα δεν είναι διαθέσιμο.");
            }
        });
}

// Ανάθεση θέματος
function assignTopic() {
    const studentId = document.getElementById("studentId").value.trim();
    const subject = document.getElementById("subject").value.trim();

    if (studentId === "" || subject === "") {
        alert("Συμπληρώστε όλα τα πεδία.");
        return;
    }

    const data = { studentId, subject };
    sendRequest('/assign-topic', 'POST', data)
        .then(response => {
            if (response.success) {
                alert("Η ανάθεση ολοκληρώθηκε με επιτυχία!");
            } else {
                alert("Η ανάθεση απέτυχε: " + response.message);
            }
        });
}

function searchThesesList() {
    const statusFilter = document.getElementById('statusFilter').value;

    fetch(`/search-theses?status=${statusFilter}`)
        .then(response => response.json())
        .then(data => {
            const diplomaListItems = document.getElementById('diplomaListItems');
            diplomaListItems.innerHTML = ''; 

            data.data.forEach(thesis => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <strong>Title:</strong> ${thesis.title}<br>
                    <strong>Summary:</strong> ${thesis.summary}<br>
                    <strong>Status:</strong> ${thesis.status}<br>
                    <strong>Instructor ID:</strong> ${thesis.instructor_id}<br>
                    <strong>Student ID:</strong> ${thesis.student_id}<br>
                    <strong>Final Submission Date:</strong> ${thesis.final_submission_date}<br>
                    <strong>PDF Path:</strong> <a href="#" onclick="viewPDF('/${thesis.pdf_path}')">View PDF</a><br>
                    <button onclick="editThesis(${thesis.thesis_id})">Edit</button>
                `;
                diplomaListItems.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while searching for theses.');
        });
}