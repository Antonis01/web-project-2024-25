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
                            <strong>Instructor ID:</strong> ${thesis.instructor_id}<br>
                            <strong>Student ID:</strong> ${thesis.student_id}<br>
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
                    suggestionItem.textContent = student.am;
                    suggestionItem.onclick = () => {
                        document.getElementById("studentAM").value = student.am;
                        document.getElementById("hiddenStudentId").value = student.student_id; // Store student ID in hidden field
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
                        document.getElementById("hiddenStudentId").value = student.student_id; // Store student ID in hidden field
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
                        <strong>Instructor ID:</strong> ${thesis.instructor_id}<br>
                        <strong>Student ID:</strong> ${thesis.student_id}<br>
                        <strong>Final Submission Date:</strong> ${thesis.final_submission_date}<br>
                        <strong>PDF Path:</strong> <a href="#" onclick="viewPDF('/${thesis.pdf_path}')">View PDF</a><br>
                        <strong>Role:</strong> ${thesis.role}<br>
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