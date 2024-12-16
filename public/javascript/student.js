function fetchThesisSt() {
    fetch('/get-thesis-st')
        .then(response => response.json())
        .then(data => {
            const thesisDetailsList = document.getElementById('thesisDetailsList');
            thesisDetailsList.innerHTML = ''; // Καθαρισμός προηγούμενων δεδομένων

            if (data.success) {
                const thesis = data.thesis;

                // Δημιουργία στοιχείων λίστας για κάθε πεδίο
                const titleItem = document.createElement('li');
                titleItem.innerHTML = `
                <div class="thesis-details">
                  <strong>Τίτλος Θέματος:</strong> ${thesis.title || "Χωρίς Τίτλο"}<br>
                  <strong>Σύνοψη:</strong> ${thesis.summary || "Χωρίς Περιγραφή"}<br>
                  <strong>PDF Path:</strong> <a href="#" onclick="viewPDF('/${thesis.pdf_path}', this.parentElement)">View PDF</a><br>
                  <strong>Κατάσταση:</strong> ${thesis.status || "Χωρίς Κατάσταση"}<br>
                  <strong>Μέλη Τριμελούς Επιτροπής:</strong> ${thesis.committee.map(member => member.name).join(', ') || "Δεν υπάρχουν"}<br>
                  <strong>Χρόνος από Ανάθεση:</strong> ${thesis.final_submission_date || "Χωρίς Δεδομένα"}<br>
                </div>
                `;
                thesisDetailsList.appendChild(titleItem);
            } else {
                thesisDetailsList.innerHTML = '<li>Δεν βρέθηκε θέμα για τον φοιτητή.</li>';
            }
        })
        .catch(error => {
            console.error('Error fetching thesis:', error);
            alert('Σφάλμα κατά την προβολή του θέματος.');
        });
}

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

        container.appendChild(pdfViewer);
    }
}