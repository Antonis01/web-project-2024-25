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
    const thesisDetails = button.closest('.thesis-title').nextElementSibling;
    if (thesisDetails.style.display === 'none' || thesisDetails.style.display === '') {
        thesisDetails.style.display = 'block';
        button.textContent = 'Hide details';
    } else {
        thesisDetails.style.display = 'none';
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
            const activeThesesListSection = document.getElementById('activeThesesList');
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
    if (searchType === "studentAM") {
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

    sendRequest(`/search-theses/${encodeURIComponent(subject)}`, 'GET')
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
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById("thesisSearchResults").innerHTML = "An error occurred while searching.";
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
                    suggestionItem.textContent = student.student_name + " " + student.student_am;
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
                    suggestionItem.textContent = student.student_name + " " + student.student_am;
                    suggestionItem.onclick = () => {
                        document.getElementById("studentName").value = student.student_name;
                        document.getElementById("hiddenStudentId").value = student.student_am; // Store student AM in hidden field
                        suggestionsContainer.innerHTML = "";
                    };
                    suggestionsContainer.appendChild(suggestionItem);
                });
            } else {
                suggestionsContainer.innerHTML = "No results found.";
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById("studentNameSuggestions").innerHTML = "An error occurred while searching.";
        });
}, 300);

function assignTheses() {
    const thesisId = document.getElementById('thesisId').value;
    const studentAm = document.getElementById('hiddenStudentId').value;

    console.log('Assigning thesis:', thesisId, 'to student:', studentAm); // Add this line

    if (!thesisId || !studentAm) {
        alert('Please select a thesis and a student.');
        return;
    }

    sendRequest('/assign-theses', 'POST', { thesisId, studentAm })
        .then(response => {
            if (response.success) {
                alert('Thesis assigned successfully');
            } else {
                alert('Error assigning thesis: ' + response.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while assigning the thesis.');
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
function loadInvitations() {
    fetch('/get-invitations')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('invitationsTableBody');
            tableBody.innerHTML = '';                

            if (data.success && data.data.length > 0) {
                data.data.forEach(invitation => {
                    
                    const row = document.createElement('tr');

                    if (invitation.teacherAM2 != null) {
                        row.innerHTML = `
                            <td>${invitation.thesisTitle || "Χωρίς Θέμα"}</td>
                            <td>${invitation.invitation_date2 || "Χωρίς Ημερομηνία"}</td>
                            <td>${invitation.response2 || "Εκκρεμεί"}</td>
                            <td>
                                <button class="accept-btn" onclick="handleInvitationResponse(${invitation.committee_id}, 'accept')">Αποδοχή</button>
                                <button class="reject-btn" onclick="handleInvitationResponse(${invitation.committee_id}, 'reject')">Απόρριψη</button>
                            </td>
                        `;
                        tableBody.appendChild(row);

                    } 
                    else if (invitation.teacherAM3 != null) {
                        row.innerHTML = `
                            <td>${invitation.thesisTitle || "Χωρίς Θέμα"}</td>
                            <td>${invitation.invitation_date3 || "Χωρίς Ημερομηνία"}</td>
                            <td>${invitation.response3 || "Εκκρεμεί"}</td>
                            <td>
                                <button class="accept-btn" onclick="handleInvitationResponse(${invitation.committee_id}, 'accept')">Αποδοχή</button>
                                <button class="reject-btn" onclick="handleInvitationResponse(${invitation.committee_id}, 'reject')">Απόρριψη</button>
                            </td>
                        `;
                        tableBody.appendChild(row);
                    } 
                });
            } 
            else {
                tableBody.innerHTML = '<tr><td colspan="4">Δεν υπάρχουν ενεργές προσκλήσεις.</td></tr>';
            }
        })
        .catch(err => console.error('Error loading invitations:', err));
}

function handleInvitationResponse(committeeId, action) {
    console.log(`Processing ${action} for committee ID: ${committeeId}`);
    
    const url = action === 'accept'
        ? `/accept-invitation/${committeeId}`
        : `/reject-invitation/${committeeId}`;
    
    fetch(url, {
        method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadInvitations();
        } else {
            alert(`Error: ${data.message}`);
        }
    })
    .catch(err => console.error(`Error processing ${action} invitation:`, err));
}

function fetchThesesForManagement() {
    const statusFilter = document.getElementById('statusFilterManagement').value;

    fetch(`/get-theses?status=${statusFilter}`)
        .then(response => response.json())
        .then(data => {
            const diploManagement = document.getElementById('diploManagement');
            diploManagement.innerHTML = ''; // Clear the current list
            
            if (data.success) {
                data.data.forEach(thesis => {
                    console.log('Thesis Data:', thesis); // Debugging: Log thesis data

                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <div class="thesis-title">
                            <strong>Title:</strong> ${thesis.title}
                            <div class="button-container">
                                <button class="action-button" onclick="toggleDetails(this)">Show details</button>
                                ${thesis.committee.some(member => member.role === 'Επιβλέπων' && member.teacher_am === data.teacher_am) ? `<button class="action-button" onclick="cancelAssignment(${thesis.thesis_id})">Cancel Assignment</button>` : ''}
                            </div>
                        </div>
                        <div class="thesis-details" style="display: none;">
                            <strong>Summary:</strong> ${thesis.summary}<br>
                            <strong>Status:</strong> ${thesis.status}<br>
                            <strong>Student AM:</strong> ${thesis.student_am}<br>
                            <strong>Final Submission Date:</strong> ${thesis.final_submission_date}<br>
                            <strong>PDF Path:</strong> <a href="#" onclick="viewPDF('/${thesis.pdf_path}', this.parentElement)">View PDF</a><br>
                            ${thesis.status === 'Υπό Ανάθεση' ? `
                            <div class="committee-details">
                                <strong>Committee Members:</strong>
                                <ul>
                                    ${thesis.committee.map(member => `
                                        <li>
                                            <strong>Teacher:</strong> ${member.teacher_name}<br>
                                            <strong>AM:</strong> ${member.teacher_am}<br>
                                            <strong>Role:</strong> ${member.role}<br>
                                            <strong>Invitation Date:</strong> ${member.invitation_date}<br>
                                            <strong>Response:</strong> ${member.response}<br>
                                            <strong>Response Date:</strong> ${member.response_date}<br>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>` : ''}
                            ${thesis.status === 'Ενεργή' ? `
                            <div class="notes-section">
                                <h3>Σημειώσεις</h3>
                                <form id="addNoteForm-${thesis.thesis_id}" onsubmit="addNoteHandler(event, ${thesis.thesis_id})">
                                    <textarea id="noteText-${thesis.thesis_id}" maxlength="300" placeholder="Add your note here..."></textarea>
                                    <button type="submit">Add Note</button>
                                </form>
                                <ul id="notesList-${thesis.thesis_id}">
                                    <!-- Dynamically populated list of notes -->
                                </ul>
                                ${thesis.committee.some(member => member.role === 'Επιβλέπων' && member.teacher_am === data.teacher_am) ? `
                                <button onclick="changeStatus(${thesis.thesis_id}, 'Υπό Εξέταση')">Change Status to Υπό Εξέταση</button>
                                ` : ''}
                            </div>` : ''}
                            ${thesis.status === 'Υπό Εξέταση' ? `
                            <div class="draft-section">
                                <h3>Draft Text</h3>
                                <p>${thesis.draft_text}</p>
                            </div>
                            ${thesis.presentation_date && thesis.presentation_time && (thesis.presentation_location || thesis.presentation_link) ? `
                            <div class="announcement-section">
                                <button onclick="generateAnnouncement(${thesis.thesis_id})">Generate Announcement</button>
                                <div id="announcementText-${thesis.thesis_id}" class="announcement-text"></div>
                            </div>` : ''}
                            <div class="grades-section">
                                <h3>Grades</h3>
                                <input type="number" id="gradeInput-${thesis.thesis_id}" placeholder="Enter your grade">
                                <button onclick="submitGrade(${thesis.thesis_id})">Submit Grade</button>
                                <button onclick="fetchGrades(${thesis.thesis_id})">View Submitted Grades</button>
                                <button onclick="updateGrade(${thesis.thesis_id})">Update Grade</button>
                                <ul id="gradesList-${thesis.thesis_id}">
                                    <!-- Dynamically populated list of grades -->
                                </ul>
                            </div>
                            ` : ''}
                        </div>
                    `;
                    diploManagement.appendChild(listItem);

                    // Fetch notes if the thesis is active
                    if (thesis.status === 'Ενεργή') {
                        fetchNotes(thesis.thesis_id);
                    }
                });
            } else {
                alert('Failed to fetch theses for management.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while fetching the theses.');
        });
}

// Fetch theses for management when the page loads
document.addEventListener('DOMContentLoaded', fetchThesesForManagement);

// Function to generate and display the announcement text
function generateAnnouncement(thesisId) {
    fetch(`/generate-announcement/${thesisId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const announcementText = document.getElementById(`announcementText-${thesisId}`);
                announcementText.innerHTML = `<pre>${data.announcement}</pre>`;
            } else {
                alert('Failed to generate announcement: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while generating the announcement.');
        });
}

// Function to submit a grade
function submitGrade(thesisId) {
    const grade = document.getElementById(`gradeInput-${thesisId}`).value.trim();

    if (!grade) {
        alert('Please enter a grade.');
        return;
    }

    fetch('/submit-grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thesis_id: thesisId, grade: grade })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Grade submitted successfully!');
            fetchGrades(thesisId); // Refresh the list of grades
        } else {
            alert('Error submitting grade: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while submitting the grade.');
    });
}

// Function to update a grade
function updateGrade(thesisId) {
    const grade = document.getElementById(`gradeInput-${thesisId}`).value.trim();

    if (!grade) {
        alert('Please enter a grade.');
        return;
    }

    fetch('/update-grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thesis_id: thesisId, grade: grade })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Grade updated successfully!');
            fetchGrades(thesisId); // Refresh the list of grades
        } else {
            alert('Error updating grade: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while updating the grade.');
    });
}

// Function to fetch and display grades for a specific thesis
function fetchGrades(thesisId) {
    fetch(`/get-grades/${thesisId}`)
        .then(response => response.json())
        .then(data => {
            const gradesList = document.getElementById(`gradesList-${thesisId}`);
            gradesList.innerHTML = ''; // Clear the current list

            if (data.success) {
                data.data.forEach(grade => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <div class="grade-item">
                            <strong>Teacher:</strong> ${grade.teacher_name}<br>
                            <strong>Grade:</strong> ${grade.grade}
                        </div>
                    `;
                    gradesList.appendChild(listItem);
                });
            } else {
                alert('Error fetching grades: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while fetching the grades.');
        });
}

// Function to add a note
function addNoteHandler(event, thesisId) {
    event.preventDefault();
    const noteText = document.getElementById(`noteText-${thesisId}`).value.trim();

    if (noteText.length > 300) {
        alert('Note text cannot exceed 300 characters.');
        return;
    }

    fetch('/add-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thesis_id: thesisId, content: noteText })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Note added successfully!');
            document.getElementById(`noteText-${thesisId}`).value = ''; // Clear the input field
            fetchNotes(thesisId); // Refresh the list of notes
        } else {
            alert('Error adding note: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while adding the note.');
    });
}

// Function to fetch and display notes for a specific thesis
function fetchNotes(thesisId) {
    fetch(`/get-notes/${thesisId}`)
        .then(response => response.json())
        .then(data => {
            const notesList = document.getElementById(`notesList-${thesisId}`);
            notesList.innerHTML = ''; // Clear the current list

            if (data.success) {
                data.data.forEach(note => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <div class="note-text">
                            ${note.content}
                        </div>
                        <div class="note-date">
                            ${new Date(note.created_at).toLocaleString()}
                        </div>
                    `;
                    notesList.appendChild(listItem);
                });
            } else {
                alert('Error fetching notes: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while fetching the notes.');
        });
}

// Function to change the status of a thesis
function changeStatus(thesisId, newStatus) {
    fetch(`/change-status/${thesisId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Status changed successfully!');
            fetchThesesForManagement(); // Refresh the list of theses
        } else {
            alert('Error changing status: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while changing the status.');
    });
}

// Fetch theses for management when the page loads
document.addEventListener('DOMContentLoaded', fetchThesesForManagement);
