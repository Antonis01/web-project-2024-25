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
                alert('Invalid username or password');
            }
        }
    };
    xhr.send(JSON.stringify({ username, password }));
});

function logout() {
    if (confirm("Are you sure you want to logout?")) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/logout', true);
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    window.location.href = response.redirect;
                } else {
                    alert('Error logging out');
                }
            }
        };
        xhr.send();
    }
}

document.addEventListener('click', function(event) {
    var burgerMenu = document.getElementById('burgerMenu');
    var dropdownMenu = document.getElementById('dropdownMenu');

    // Check if the click is outside the burger menu and dropdown menu
    if (dropdownMenu.style.display === 'flex' && !burgerMenu.contains(event.target) && !dropdownMenu.contains(event.target)) {
        dropdownMenu.style.display = 'none';
    }
});

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

    if (elementId == "formContainer") {
        element = document.getElementById("topicsContainer");
        if (element.style.display === "none" || element.style.display === "") {
            element.style.display = displayStyle;
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
            alert('Thesis added successfully!');
        } else {
            alert('Error adding thesis: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while adding the thesis.');
    });
});

function searchTheses(){
    alert("searchTheses");
}
