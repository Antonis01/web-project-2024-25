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
                        <strong>PDF Path:</strong> <a href="/uploads/${thesis.pdf_path}" target="_blank">View PDF</a><br>
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
            // Optionally, refresh the list of theses
        } else {
            alert('Error updating thesis: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while updating the thesis.');
    });
});

function cancelEdit() {
    document.getElementById('editThesisFormContainer').style.display = 'none';
}