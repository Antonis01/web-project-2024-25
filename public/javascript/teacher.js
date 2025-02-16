// Erotima 1 prosthiki
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
            alert('Επιτυχής καταχώρηση Διπλωματικής!');
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

// Erotima 1 provoli theseon
function fetchTheses() {
    fetch('/get-theses')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const thesesList = document.getElementById('topicsList');
                thesesList.innerHTML = ''; // Clear any existing content

                data.data.forEach(thesis => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `w
                        <div class="thesis-title">
                            <strong>Tίτλος:</strong> ${thesis.title}
                            <button onclick="toggleDetails(this)">Προβολή Λεπτομερειών</button>
                        </div>
                        <div class="thesis-details" style="display: none;">
                            <strong>Σύνοψη:</strong> ${thesis.summary}<br>
                            <strong>Κατάσταση:</strong> ${thesis.status}<br>
                            <strong>AM Καθηγητή:</strong> ${thesis.teacher_am}<br>
                            <strong>AM Φοιτητή:</strong> ${thesis.student_am}<br>
                            <strong>Τελική Ημερομηνία Υποβολής:</strong> ${thesis.final_submission_date}<br>
                            <strong>PDF:</strong> <a href="#" onclick="viewPDF('/${thesis.pdf_path}', this.parentElement)">Προβολή PDF</a><br>
                            <button onclick="editThesis(${thesis.thesis_id})">Επεξεργασία</button>
                        </div>
                    `;
                    thesesList.appendChild(listItem);
                });
            } else {
                alert('Σφάλμα κατά την ανάκτηση των διπλωματικών εργασιών.: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Σφάλμα');
        });
}

// Erotima 1, Erotima 3, Erotima 6 provoli leptomereion
function toggleDetails(button) {
    const thesisDetails = button.closest('.thesis-title').nextElementSibling;
    if (thesisDetails.style.display === 'none' || thesisDetails.style.display === '') {
        thesisDetails.style.display = 'block';
        button.textContent = 'Aπόκρυψη λεπτομερειών';
    } else {
        thesisDetails.style.display = 'none';
        button.textContent = 'Εμφάνιση λεπτομερειών';
    }
}

document.addEventListener('DOMContentLoaded', fetchTheses);

// pdf viewer function
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

        // Append the PDF viewer to the container
        container.appendChild(pdfViewer);
    }
}

// Erotima 1 view edit form
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
                alert('Σφάλμα κατά την ανάκτηση των διπλωματικών εργασιών.: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Σφάλμα κατά την ανάκτηση των διπλωματικών εργασιών.');
        });
}

// Erotima 1 edit update form
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
            alert('Επιτυχές Ενημέρωση!');
            document.getElementById('editThesisFormContainer').style.display = 'none';
            fetchTheses(); // Refresh the list of theses
        } else {
            alert('Σφάλμα κατά την ενημέρωση ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Σφάλμα κατά την ενημέρωση.');
    });
});

// Erotima 1 delete
function deleteThesis() {
    const thesisId = document.getElementById('editThesisId').value;
    
    if (confirm('Είστε σίγουρος ότι θέλετε να ακυρώσετε την Διπλωματική;')) {
        fetch(`/delete-thesis/${thesisId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Επιτυχής διαγραφή της διπλωματικής!');
                document.getElementById('editThesisFormContainer').style.display = 'none';
                fetchTheses(); // Refresh the list of theses
            } else {
                alert('Σφάλμα κατά την διαγραφή: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Σφάλμα κατά την διαγραφή.');
        });
    }
}

// Erotima 1 cancel edit
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
                            <strong>Tίτλος:</strong> ${thesis.title}
                            <button onclick="cancelAssignment(${thesis.thesis_id})">Ακύρωση Ανάθεσης</button>
                        </div>
                    `;
                    activeThesesList.appendChild(listItem);
                });
            } else {
                activeThesesList.innerHTML = 'Δεν βρέθηκαν ενεργές διπλωματικές.';
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
                            <strong>Tίτλος:</strong> ${thesis.title}
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

// Erotima 6
// Cancel assignment
function cancelAssignment(thesisId) {
    if (confirm('Είσαι σίγουρος ότι θέλεις να ακυρώσεις την ανάθεση;')) {
        sendRequest(`/cancel-assignment/${thesisId}`, 'POST')
            .then(response => {
                if (response.success) {
                    alert('Eπιτυχής ακύρωση ανάθεσης!');
                    fetchActiveTheses(); // Refresh the list of active theses
                    fetchActiveThesesSection(); // Refresh the list of active theses in the new section
                } else {
                    alert('Σφάλμα κατά την ακύρωση: ' + response.message);
                }
            });
    }
}

// Fetch active theses when the page loads
document.addEventListener('DOMContentLoaded', fetchActiveTheses);
document.addEventListener('DOMContentLoaded', fetchActiveThesesSection);

// Erotima 2
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

// Erotima 2
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

// Erotima 2
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
                resultsContainer.innerHTML = "Δεν βρέθηκαν αποτελέσματα.";
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById("thesisSearchResults").innerHTML = "An error occurred while searching.";
        });
}, 300);

// Erotima 2
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
                suggestionsContainer.innerHTML = "Δεν βρέθηκαν αποτελέσματα.";
            }
        });
}, 300);

// Erotima 2
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
                suggestionsContainer.innerHTML = "Δεν βρέθηκαν απορελέσματα.";
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById("studentNameSuggestions").innerHTML = "Σφάλμα κατά την αναζήτηση.";
        });
}, 300);

// Erotima 2
function assignTheses() {
    const thesisId = document.getElementById('thesisId').value;
    const studentAm = document.getElementById('hiddenStudentId').value;

    console.log('Assigning thesis:', thesisId, 'to student:', studentAm); // Add this line

    if (!thesisId || !studentAm) {
        alert('Επίλεξε Διπλωματική και Φοιτητή.');
        return;
    }

    sendRequest('/assign-theses', 'POST', { thesisId, studentAm })
        .then(response => {
            if (response.success) {
                alert('Η ανάθεση πραγματοποιήθηκε επιτυχώς');
            } else {
                alert('Σφάλμα κατά την ανάθεση: ' + response.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Σφάλμα κατά την ανάθεση.');
        });
}

// Erotima 3
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
                        <strong>Τίτλος:</strong> ${theses.title}
                        <button onclick="toggleDetails(this)">Εμφάνιση λεπτομερειών</button>
                    </div>
                    <div class="thesis-details" style="display: none;">
                        <strong>Σύνοψη:</strong> ${theses.summary}<br>
                        <strong>Κατάσταση:</strong> ${theses.status}<br>
                        <strong>AM Φοιτητή:</strong> ${theses.student_am}<br>
                        <strong>Τελική Ημερομηνία Υποβολής:</strong> ${theses.final_submission_date}<br>
                        <strong>Όνομα 1ου καθηγητή:</strong> ${theses.teacher_name}<br>
                        <strong>Ρόλος:</strong> ${theses.role}<br>
                        <strong>Όνομα 2ου καθηγητή:</strong> ${theses.teacher2_name}<br>
                        <strong>Ρόλος:</strong> ${theses.role2}<br>
                        <strong>Όνομα 3ου καθηγητή:</strong> ${theses.teacher3_name}<br>
                        <strong>Ρόλος:</strong> ${theses.role3}<br>
                        <strong>PDF:</strong> <a href="#" onclick="viewPDF('/${theses.pdf_path}', this.parentElement)">Προβολή PDF</a><br>
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

// Erotima 3
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
            console.error('Σφάλμα κατά την εξαγωγή:', error);
            alert('Σφάλμα κατά την εξαγωγή.');
        });
}

// Erotima 4
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

// Erotima 4
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


// Erotima 6
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
                            <strong>Τίτλος:</strong> ${thesis.title}
                            <div class="button-container">
                                <button class="action-button" onclick="toggleDetails(this)">Εμφάνιση λεπτομερειών</button>
                                ${thesis.committee.some(member => member.role === 'Επιβλέπων' && member.teacher_am === data.teacher_am) ? `<button class="action-button" onclick="cancelAssignment(${thesis.thesis_id})">Ακύρωση</button>` : ''}
                            </div>
                        </div>
                        <div class="thesis-details" style="display: none;">
                            <strong>Σύνοψη:</strong> ${thesis.summary}<br>
                            <strong>Κατάσταση:</strong> ${thesis.status}<br>
                            <strong>Student AM:</strong> ${thesis.student_am}<br>
                            <strong>Τελική Ημερομηνία Υποβολής:</strong> ${thesis.final_submission_date}<br>
                            <strong>PDF:</strong> <a href="#" onclick="viewPDF('/${thesis.pdf_path}', this.parentElement)">Προβολή PDF</a><br>
                            ${thesis.status === 'Υπό Ανάθεση' ? `
                            <div class="committee-details">
                                <strong>Μέλη Τριμελούς:</strong>
                                <ul>
                                    ${thesis.committee.map(member => `
                                        <li>
                                            <strong>Καθηγητής:</strong> ${member.teacher_name}<br>
                                            <strong>AM:</strong> ${member.teacher_am}<br>
                                            <strong>Ρόλος:</strong> ${member.role}<br>
                                            <strong>Ημερομηνία Πρόσκλησης :</strong> ${member.invitation_date}<br>
                                            <strong>Απάντηση:</strong> ${member.response}<br>
                                            <strong>Ημερομηνία Απάντησης:</strong> ${member.response_date}<br>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>` : ''}
                            ${thesis.status === 'Ενεργή' ? `
                            <div class="notes-section">
                                <h3>Σημειώσεις</h3>
                                <form id="addNoteForm-${thesis.thesis_id}" onsubmit="addNoteHandler(event, ${thesis.thesis_id})">
                                    <textarea id="noteText-${thesis.thesis_id}" maxlength="300" placeholder="Add your note here..."></textarea>
                                    <button type="submit">Προσθήκη Σημείωσης</button>
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
                                <h3>Πρόχειρο Κείμενο</h3>
                                <p>${thesis.draft_text}</p>
                            </div>
                            ${thesis.presentation_date && thesis.presentation_time && (thesis.presentation_location || thesis.presentation_link) ? `
                            <div class="announcement-section">
                                <button onclick="generateAnnouncement(${thesis.thesis_id})">Δημιουργία Ανακοίνωσης</button>
                                <div id="announcementText-${thesis.thesis_id}" class="announcement-text"></div>
                            </div>` : ''}
                            <div class="grades-section">
                                <h3>Βαθμολογίες</h3>
                                <input type="number" id="gradeInput-${thesis.thesis_id}" placeholder="Προσθήκη Βαθμολογίας">
                                <button onclick="submitGrade(${thesis.thesis_id})">Υποβολή Βαθμολογίας</button>
                                <button onclick="fetchGrades(${thesis.thesis_id})">Προβολή καταχωρημένων βαθμολογιών</button>
                                <button onclick="updateGrade(${thesis.thesis_id})">Ανανέωση Βαθμολογίας</button>
                                <ul id="gradesList-${thesis.thesis_id}">
                                    <!-- Dynamically populated list of grades -->
                                </ul>
                                 </ul>
                                <div id="finalGrade-${thesis.thesis_id}">
                                    <!-- Final grade and bonus info will be displayed here -->
                               </div>
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

// Erotima 6
// Function to submit a grade
function submitGrade(thesisId) {
    const grade = document.getElementById(`gradeInput-${thesisId}`).value.trim();

    if (!grade) {
        alert('Παρακαλώ πρόσθεσε βαθμολογία.');
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
            alert('Επιτυχής καταχώρηση βαθμολογίας!');
            fetchGrades(thesisId); // Refresh the list of grades
        } else {
            alert('Σφάλμα κατά την καταχώρηση: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Σφάλμα κατα την καταχώρηση.');
    });
}

// Erotima 6
// Function to update a grade
function updateGrade(thesisId) {
    const grade = document.getElementById(`gradeInput-${thesisId}`).value.trim();

    if (!grade) {
        alert('Παρακαλώ καταχωρήστε βαθμό.');
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
            alert('Επιτυχής ανανέωση βαθμολογίας!');
            fetchGrades(thesisId); // Refresh the list of grades
        } else {
            alert('Σφάλμα : ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Σφάλμα κατα την ανανέωση.');
    });
}

// Erotima 6
// Function to fetch and display grades
function fetchGrades(thesisId) {
    fetch(`/get-grades/${thesisId}`)
        .then(response => response.json())
        .then(data => {
            const gradesList = document.getElementById(`gradesList-${thesisId}`);
            const finalGradeDiv = document.getElementById(`finalGrade-${thesisId}`);

            gradesList.innerHTML = ''; // Clear list
            finalGradeDiv.innerHTML = ''; // Clear final grade display

            if (data.success) {
                data.grades.forEach(grade => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `<strong>Καθηγητής:</strong> ${grade.teacher_name} - <strong>Βαθμός:</strong> ${grade.grade}`;
                    gradesList.appendChild(listItem);
                });

                finalGradeDiv.innerHTML = `
                    <h4>Τελικός Βαθμός: ${data.final_grade}</h4>
                    <p>${data.bonusMessage}</p>
                `;
            } else {
                alert('Σφάλμα κατά την προσκόμιση: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Σφάλμα κατά την προσκόμιση.');
        });
}



// Erotima 6
// Function to add a note
function addNoteHandler(event, thesisId) {
    event.preventDefault();
    const noteText = document.getElementById(`noteText-${thesisId}`).value.trim();

    if (noteText.length > 300) {
        alert('Υπέρβαση ορίου λέξεων.');
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
            alert('Επιτυχής καταχώρηση σημείωσης!');
            document.getElementById(`noteText-${thesisId}`).value = ''; // Clear the input field
            fetchNotes(thesisId); // Refresh the list of notes
        } else {
            alert('Σφάλμα: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Σφάλμα κατά την προσθήλη σημείωσης.');
    });
}

// Erotima 6
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
                alert('Σφάλμα: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Σφάλμα.');
        });
}

// Erotima 6
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
            alert('Επιτυχής αλλαγή κατάστασης!');
            fetchThesesForManagement(); // Refresh the list of theses
        } else {
            alert('Σφάλμα κατά την αλλαγή: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Σφάλμα:', error);
        alert('Σφάλμα κατά την αλλαγή κατάστασης.');
    });
}

// Fetch theses for management when the page loads
document.addEventListener('DOMContentLoaded', fetchThesesForManagement);

// Erotima 2
// Function to show pending theses
function showPendingTheses() {
    fetch('/get-pending-theses')
        .then(response => response.json())
        .then(data => {
            const pendingThesesList = document.getElementById('pendingThesesList');
            pendingThesesList.innerHTML = ''; // Clear the current list

            if (data.success) {
                data.data.forEach(thesis => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <div class="thesis-title">
                            <strong>Τίτλος:</strong> ${thesis.title}
                            <button onclick="eraseAssignment(${thesis.thesis_id})">Αναίρεση Ανάθεσης</button>
                        </div>
                    `;
                    pendingThesesList.appendChild(listItem);
                });
                toggleElement('pendingTheses');
            } else {
                pendingThesesList.innerHTML = 'Δεν βρέθηκαν εκκρεμείς διπλωματικές.';
            }
        })
        .catch(error => {
            console.error('Error fetching pending theses:', error);
            alert('Δεν βρέθηκαν εκκρεμείς διπλωματικές.');
        });
}

// Erotima 2
// Function to erase assignment
function eraseAssignment(thesisId) {
    if (confirm('Είσαι σίγουρος ότι θέλεις να αναιρέσεις την διπλωματική?')) {
        fetch(`/erase-assignment/${thesisId}`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Η ανάθεση αναιρέθηκε επιτυχώς!');
                showPendingTheses(); // Refresh the list of pending theses
            } else {
                alert('Σφάλμα κατά την αναίρεση: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Σφάλμα κατά την αναίρεση.');
        });
    }
}
