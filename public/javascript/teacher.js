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
            // Optionally, you can clear the form or redirect the user
        } else {
            alert('Error adding thesis: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while adding the thesis.');
    });
});

document.addEventListener('DOMContentLoaded', function() {
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
                        <strong>PDF Path:</strong> <a href="/${thesis.pdf_path}" target="_blank">View PDF</a>
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
});