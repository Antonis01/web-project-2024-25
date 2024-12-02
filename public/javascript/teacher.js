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
                        <div class="thesis-title">
                            <strong>Title:</strong> ${thesis.title}
                            <button onclick="toggleDetails(this)">Show details</button>
                        </div>
                        <div class="thesis-details" style="display: none;">
                            <strong>Summary:</strong> ${thesis.summary}<br>
                            <strong>Status:</strong> ${thesis.status}<br>
                            <strong>Teacher AM:</strong> ${thesis.teacher_am}<br>
                            <strong>Student AM:</strong> ${thesis.student_am}<br>
                            <strong>Final Submission Date:</strong> ${thesis.final_submission_date}<br>
                            <strong>PDF Path:</strong> <a href="#" onclick="viewPDF('/${thesis.pdf_path}', this.parentElement)">View PDF</a><br>
                            <button onclick="editThesis(${thesis.thesis_id})">Edit</button>
                        </div>
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

function toggleDetails(button) {
    const details = button.parentElement.nextElementSibling;
    if (details.style.display === 'none') {
        details.style.display = 'block';
        button.textContent = 'Hide details';
    } else {
        details.style.display = 'none';
        button.textContent = 'Show details';
    }
}

document.addEventListener('DOMContentLoaded', fetchTheses);

function viewPDF(pdfPath, container) {
    // Check if the PDF viewer already exists
    const existingViewer = container.querySelector('.pdf-viewer');
    if (existingViewer) {
        // If it exists, remove it
        existingViewer.remove();
    } else {
        // If it doesn't exist, create a new PDF viewer
        const pdfViewer = document.createElement('iframe');
        pdfViewer.src = pdfPath;
        pdfViewer.width = '100%';
        pdfViewer.height = '800px';
        pdfViewer.className = 'pdf-viewer';
        pdfViewer.style.border = 'none';
        pdfViewer.style.marginTop = '10px';

        // Append the PDF viewer to the container
        container.appendChild(pdfViewer);
    }
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
                document.getElementById('editTeacherAM').value = thesis.teacher_am;
                document.getElementById('editStudentAM').value = thesis.student_am;
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
            alert('Theses and Committee updated successfully!');
            document.getElementById('editThesisFormContainer').style.display = 'none';
            fetchTheses(); // Refresh the list of theses
        } else {
            alert('Error updating theses or the commitee: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while updating the theses or the commitee.');
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
                alert('Theses deleted successfully!');
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

// General function to send AJAX requests
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

// Fetch and display active theses
function fetchActiveTheses() {
    console.log('Fetching active theses...');
    sendRequest('/active-theses', 'GET')
        .then(response => {
            console.log('Active theses response:', response);
            const activeThesesList = document.getElementById('activeThesesList');
            activeThesesList.innerHTML = ''; // Clear the current list

            if (response.success) {
                response.data.forEach(thesis => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <div class="thesis-title">
                            <strong>Title:</strong> ${thesis.title}
                            <button onclick="cancelAssignment(${thesis.thesis_id})">Ακύρωση Ανάθεσης</button>
                        </div>
                    `;
                    activeThesesList.appendChild(listItem);
                });
            } else {
                activeThesesList.innerHTML = 'No active theses found.';
            }
        });
}

// Fetch and display active theses in the new section
function fetchActiveThesesSection() {
    console.log('Fetching active theses for the new section...');
    sendRequest('/active-theses', 'GET')
        .then(response => {
            console.log('Active theses response:', response);
            const activeThesesListSection = document.getElementById('activeThesesListSection');
            activeThesesListSection.innerHTML = ''; // Clear the current list

            if (response.success) {
                response.data.forEach(thesis => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <div class="thesis-title">
                            <strong>Title:</strong> ${thesis.title}
                            <button onclick="cancelAssignment(${thesis.thesis_id})">Ακύρωση Ανάθεσης</button>
                        </div>
                    `;
                    activeThesesListSection.appendChild(listItem);
                });
            } else {
                activeThesesListSection.innerHTML = 'No active theses found.';
            }
        });
}

// Cancel assignment
function cancelAssignment(thesisId) {
    if (confirm('Are you sure you want to cancel this assignment?')) {
        sendRequest(`/cancel-assignment/${thesisId}`, 'POST')
            .then(response => {
                if (response.success) {
                    alert('Assignment cancelled successfully!');
                    fetchActiveTheses(); // Refresh the list of active theses
                    fetchActiveThesesSection(); // Refresh the list of active theses in the new section
                } else {
                    alert('Error cancelling assignment: ' + response.message);
                }
            });
    }
}

// Fetch active theses when the page loads
document.addEventListener('DOMContentLoaded', fetchActiveTheses);
document.addEventListener('DOMContentLoaded', fetchActiveThesesSection);

// Fetch and display active invitations
function fetchActiveInvitations() {
    console.log('Fetching active invitations...');
    sendRequest('/active-invitations', 'GET')
        .then(response => {
            console.log('Active invitations response:', response);
            const invitationListItems = document.getElementById('invitationListItems');
            invitationListItems.innerHTML = ''; // Clear the current list

            if (response.success) {
                response.data.forEach(invitation => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <div class="invitation-title">
                            <strong>Thesis ID:</strong> ${invitation.thesis_id} <br>
                            <strong>Role:</strong> ${invitation.role} <br>
                            <button onclick="acceptInvitation(${invitation.committee_id})">Αποδοχή</button>
                            <button onclick="rejectInvitation(${invitation.committee_id})">Απόρριψη</button>
                        </div>
                    `;
                    invitationListItems.appendChild(listItem);
                });
            } else {
                invitationListItems.innerHTML = 'No active invitations found.';
            }
        });
}

// Accept invitation
function acceptInvitation(committeeId) {
    if (confirm('Are you sure you want to accept this invitation?')) {
        sendRequest(`/accept-invitation/${committeeId}`, 'POST')
            .then(response => {
                if (response.success) {
                    alert('Invitation accepted successfully!');
                    fetchActiveInvitations(); // Refresh the list of active invitations
                } else {
                    alert('Error accepting invitation: ' + response.message);
                }
            });
    }
}

// Reject invitation
function rejectInvitation(committeeId) {
    if (confirm('Are you sure you want to reject this invitation?')) {
        sendRequest(`/reject-invitation/${committeeId}`, 'POST')
            .then(response => {
                if (response.success) {
                    alert('Invitation rejected successfully!');
                    fetchActiveInvitations(); // Refresh the list of active invitations
                } else {
                    alert('Error rejecting invitation: ' + response.message);
                }
            });
    }
}

// Fetch active invitations when the page loads
document.addEventListener('DOMContentLoaded', fetchActiveInvitations);

// Debounce function to delay the search request
function debounce(func, delay) {
    let debounceTimer;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
}

// Toggle search fields based on selected search type
function toggleSearchFields() {
    const searchType = document.getElementById("searchType").value;
    if (searchType === "studentId") {
        document.getElementById("searchByAM").style.display = "block";
        document.getElementById("searchByName").style.display = "none";
    } else {
        document.getElementById("searchByAM").style.display = "none";
        document.getElementById("searchByName").style.display = "block";
    }
}

// Search thesis with debounce
const debounceSearchThesis = debounce(function() {
    const subject = document.getElementById("subject").value.trim();
    if (subject === "") {
        document.getElementById("thesisSearchResults").innerHTML = "";
        return;
    }

    sendRequest(`/get-theses-title?subject=${encodeURIComponent(subject)}`, 'GET')
        .then(response => {
            const resultsContainer = document.getElementById("thesisSearchResults");
            resultsContainer.innerHTML = ""; // Clear previous results

            if (response.success) {
                response.data.forEach(thesis => {
                    const resultItem = document.createElement("div");
                    resultItem.className = "suggestion-item";
                    resultItem.textContent = thesis.title;
                    resultItem.onclick = () => {
                        document.getElementById("subject").value = thesis.title;
                        document.getElementById("thesisId").value = thesis.thesis_id; // Store thesis ID
                        resultsContainer.innerHTML = "";
                    };
                    resultsContainer.appendChild(resultItem);
                });
            } else {
                resultsContainer.innerHTML = "No results found.";
            }
        });
}, 300);

// Search student by AM with debounce
const debounceSearchStudentByAm = debounce(function() {
    const am = document.getElementById("studentAM").value.trim();
    if (am === "") {
        document.getElementById("studentAMSuggestions").innerHTML = "";
        return;
    }

    sendRequest(`/search-student?am=${encodeURIComponent(am)}`, 'GET')
        .then(response => {
            const suggestionsContainer = document.getElementById("studentAMSuggestions");
            suggestionsContainer.innerHTML = ""; // Clear previous suggestions

            if (response.success) {
                response.data.forEach(student => {
                    const suggestionItem = document.createElement("div");
                    suggestionItem.className = "suggestion-item";
                    suggestionItem.textContent = student.student_am;
                    suggestionItem.onclick = () => {
                        document.getElementById("studentAM").value = student.student_am;
                        document.getElementById("hiddenStudentId").value = student.student_am; // Store student ID in hidden field
                        suggestionsContainer.innerHTML = "";
                    };
                    suggestionsContainer.appendChild(suggestionItem);
                });
            } else {
                suggestionsContainer.innerHTML = "No results found.";
            }
        });
}, 300);

// Search student by name with debounce
const debounceSearchStudentByName = debounce(function() {
    const studentName = document.getElementById("studentName").value.trim();
    if (studentName === "") {
        document.getElementById("studentNameSuggestions").innerHTML = "";
        return;
    }

    sendRequest(`/search-student?studentName=${encodeURIComponent(studentName)}`, 'GET')
        .then(response => {
            const suggestionsContainer = document.getElementById("studentNameSuggestions");
            suggestionsContainer.innerHTML = ""; // Clear previous suggestions

            if (response.success) {
                response.data.forEach(student => {
                    const suggestionItem = document.createElement("div");
                    suggestionItem.className = "suggestion-item";
                    suggestionItem.textContent = student.student_name;
                    suggestionItem.onclick = () => {
                        document.getElementById("studentName").value = student.student_name;
                        document.getElementById("hiddenStudentId").value = student.student_am; // Store student am in hidden field
                        suggestionsContainer.innerHTML = "";
                    };
                    suggestionsContainer.appendChild(suggestionItem);
                });
            } else {
                suggestionsContainer.innerHTML = "No results found.";
            }
        });
}, 300);

// Assign topic
function assignTopic() {
    const am = document.getElementById("studentAM").value.trim();
    const subject = document.getElementById("subject").value.trim();

    if (am === "" || subject === "") {
        alert("Συμπληρώστε όλα τα πεδία.");
        return;
    }

    const data = { am, subject };
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
    const roleFilter = document.getElementById('roleFilter').value;

    fetch(`/search-theses?status=${statusFilter}&role=${roleFilter}`)
        .then(response => response.json())
        .then(data => {
            const diplomaListItems = document.getElementById('diplomaListItems');
            diplomaListItems.innerHTML = ''; // Clear the current list

            data.data.forEach(theses => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <div class="thesis-title">
                        <strong>Title:</strong> ${theses.title}
                        <button onclick="toggleDetails(this)">Show details</button>
                    </div>
                    <div class="thesis-details" style="display: none;">
                        <strong>Summary:</strong> ${theses.summary}<br>
                        <strong>Status:</strong> ${theses.status}<br>
                        <strong>Student AM:</strong> ${theses.student_am}<br>
                        <strong>Final Submission Date:</strong> ${theses.final_submission_date}<br>
                        <strong>Instructor Name:</strong> ${theses.teacher_name}<br>
                        <strong>Role:</strong> ${theses.role}<br>
                        <strong>Instructor2 Name:</strong> ${theses.teacher2_name}<br>
                        <strong>Role2:</strong> ${theses.role2}<br>
                        <strong>Instructor3 Name:</strong> ${theses.teacher3_name}<br>
                        <strong>Role3:</strong> ${theses.role3}<br>
                        <strong>PDF Path:</strong> <a href="#" onclick="viewPDF('/${theses.pdf_path}', this.parentElement)">View PDF</a><br>
                    </div>
                `;
                diplomaListItems.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while searching for theses.');
        });
}

app.get("/search-student", (req, res) => {
    const { studentId, studentName } = req.query;
    let query = '';
    let queryParams = [];

    if (studentId) {
        query = 'SELECT am AS student_id FROM Students WHERE am LIKE ?';
        queryParams = [`%${studentId}%`];
    } else if (studentName) {
        query = 'SELECT student_name FROM Students WHERE student_name LIKE ?';
        queryParams = [`%${studentName}%`];
    } else {
        res.status(400).json({ success: false, message: 'Missing search parameter' });
        return;
    }

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error("Error searching student:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }

        res.json({ success: true, data: results });
    });
});

function exportTheses(format) {
    const statusFilter = document.getElementById('statusFilter').value;
    const roleFilter = document.getElementById('roleFilter').value;

    fetch(`/export-theses?status=${statusFilter}&role=${roleFilter}&format=${format}`)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `theses.${format}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        })
        .catch(error => {
            console.error('Error exporting theses:', error);
            alert('An error occurred while exporting the theses.');
        });
}