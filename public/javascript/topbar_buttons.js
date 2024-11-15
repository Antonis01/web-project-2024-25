function toggleAssignmentForm() {
    var form = document.getElementById("assignmentForm");
    if (form.style.display === "none" || form.style.display === "") {
        form.style.display = "block";
    } else {
        form.style.display = "none";
    }
}

function toggleDiplomaList() {
    var list = document.getElementById("diplomaList");
    if (list.style.display === "none" || list.style.display === "") {
        list.style.display = "block";
    } else {
        list.style.display = "none";
    }
}

function filterDiplomas() {
    // Logic to filter diplomas based on status and role
}

function viewDiplomaDetails(diplomaId) {
    // Logic to view detailed information about a specific diploma
}

function cancelAssignment() {
    alert("Η ανάθεση ακυρώθηκε.");
    document.getElementById("assignmentForm").reset();
}

function logout() {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/logout', true);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                alert(response.message);
                window.location.href = response.redirect;
            } else {
                alert('Error logging out');
            }
        }
    };
    xhr.send();
}

function toggleForm() {
    var formContainer = document.getElementById("formContainer");
    var topicsContainer = document.getElementById("topicsContainer");
    if (formContainer.style.display === "none" || formContainer.style.display === "") {
        formContainer.style.display = "block";
        topicsContainer.style.display = "none";
    } else {
        formContainer.style.display = "none";
    }
}

function toggleTopics() {
    var formContainer = document.getElementById("formContainer");
    var topicsContainer = document.getElementById("topicsContainer");
    if (topicsContainer.style.display === "none" || topicsContainer.style.display === "") {
        topicsContainer.style.display = "block";
        formContainer.style.display = "none";
    } else {
        topicsContainer.style.display = "none";
    }
}