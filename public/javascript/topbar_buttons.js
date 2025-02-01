function toggleLoginForm() {
    var form = document.getElementById("loginForm");
    if (form.style.display === "none" || form.style.display === "") {
        form.style.display = "block";
    } else {
        form.style.display = "none";
    }
}

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/login', true);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                window.location.href = response.redirect;
            } else {
                alert('Λανθασμένο username ή κωδικός πρόσβασης');
            }
        }
    };
    xhr.send(JSON.stringify({ username, password }));
});

function logout() {
    if (confirm("Είστε σίγουρος ότι θέλετε να αποσυνδεθήτε")) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/logout', true);
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    window.location.href = response.redirect;
                } else {
                    alert('Σφάλμα κατά την αποσύνδεση');
                }
            }
        };
        xhr.send();
    }
}

function toggleElementDisplay(elementId, displayStyle = "block") {
    var element = document.getElementById(elementId);
    if (element.style.display === "none" || element.style.display === "") {
        element.style.display = displayStyle;
    } else {
        element.style.display = "none";
    }

    if (elementId !== "dropdownMenu") {
        var menu = document.getElementById("dropdownMenu");
        menu.style.display = "none";
    }

    if (elementId === "topicsContainer" && element.style.display !== "none") {
        var thesesAddView = document.getElementById("thesesAddView");
        if (thesesAddView.style.display === "none" || thesesAddView.style.display === "") {
            thesesAddView.style.display = displayStyle;
        }
    }

    if (elementId === "thesesAddView" && element.style.display !== "none") {
        var topicsContainer = document.getElementById("topicsContainer");
        if (topicsContainer.style.display === "none" || topicsContainer.style.display === "") {
            topicsContainer.style.display = displayStyle;
        }
    }

    if (elementId === "thesesAddView" && element.style.display === "none") {
        var topicsContainer = document.getElementById("topicsContainer");
        if (topicsContainer.style.display !== "none") {
            topicsContainer.style.display = "none";
        }
    }
}

function toggleElement(elementId, displayStyle = "block") {
    toggleElementDisplay(elementId, displayStyle);
}

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
            alert('Επιτυχής προσθήλη διπλωματικής!');
        } else {
            alert('Error adding thesis: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Σφάλμα.');
    });
});
