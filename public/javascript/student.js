function fetchThesisSt() {
    const thesisDetailsList = document.getElementById('thesisDetailsList').value;

    fetch('/get-thesis-st')
        .then(response => response.json())
        .then(data => {
            const thesisDetailsList = document.getElementById('thesisDetailsList');
            thesisDetailsList.innerHTML = ''; // Καθαρισμός προηγούμενων δεδομένων
            data.data.forEach(theses => {

                // Δημιουργία στοιχείων λίστας για κάθε πεδίο
                const titleItem = document.createElement('li')
                listItem.innerHTML =  `
                <div class="thesis-details">

                  <strong>Τίτλος Θέματος:</strong> ${thesis.title || "Χωρίς Τίτλο"}<br>
                  <strong>Σύνοψη:</strong> ${thesis.description || "Χωρίς Περιγραφή"}<br>
                 <strong>PDF Path:</strong> <a href="#" onclick="viewPDF('/${thesis.pdf_path}', this.parentElement)">View PDF</a><br>
                  <strong>Κατάσταση:</strong> ${thesis.status || "Χωρίς Κατάσταση"}<br>
                  <strong>Μέλη Τριμελούς Επιτροπής:</strong> ${thesis.committee.map(member => member.name).join(', ') || "Δεν υπάρχουν"}<br>
                 <strong>Ημερομηνία Ανάθεσης:</strong> ${thesis.assignment_date || "Χωρίς Ανάθεση"}<br>
                 <strong>Χρόνος από Ανάθεση:</strong> ${thesis.time_since_assignment || "Χωρίς Δεδομένα"}<br>
               </div> 
               `;
               thesisDetailsList.appendChild(listItem);
            });
        })  
            .catch(error => {
            console.error('Error fetching thesis:', error);
            alert('Σφάλμα κατά την προβολή του θέματος.');
        });
}