const style = document.createElement('style');
style.innerHTML = `
  .rating {
    margin-top: 7px;
  }
  #cuRMP-controls {
    margin: 10px;
    padding: 10px;
    border: 1px solid #ccc;
    background-color: #f9f9f9;
  }
  #cuRMP-controls label {
    display: inline-block;
    margin-right: 10px;
  }
  #cuRMP-controls input, #cuRMP-controls select {
    margin-left: 5px;
  }
  #applyFilters {
    margin-top: 10px;
    padding: 5px 10px;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
  }
  #applyFilters:hover {
    background-color: #45a049;
  }
`;
document.head.appendChild(style);

let allCourses = [];

function appendRMP() {
  const rows = document.querySelectorAll('tr');
  allCourses = [];
  
  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 12) {
      const statusCell = cells[1];
      const courseCodeCell = cells[3];
      const courseName = cells[5].textContent.trim();
      const professorNameCell = cells[11];  
      
      if (statusCell.textContent.trim() && courseCodeCell.textContent.trim()) {
        const professorName = professorNameCell.textContent.trim();
        
        if (professorName && 
            professorName !== '&nbsp;' && 
            professorName !== 'Instructor' &&
            professorName !== 'Full Session Info' &&  
            !professorName.toUpperCase().includes('TBA') &&
            !/^\d+$/.test(professorName)) {
          allCourses.push({
            row: row,
            courseCode: courseCodeCell.textContent.trim(),
            courseName: courseName,
            professorName: professorName,
            professorNameCell: professorNameCell
          });
          processProfessor(professorNameCell, professorName);
        }
      }
    }
  });

  addControls();
}

function addControls() {
  if (document.getElementById('cuRMP-controls')) return; 

  const controlsDiv = document.createElement('div');
  controlsDiv.id = 'cuRMP-controls';
  controlsDiv.innerHTML = `
    <h3>Filter and Sort Courses</h3>
    <label>Minimum Rating: <input type="number" id="minRating" min="0" max="5" step="0.1"></label>
    <label>Maximum Difficulty: <input type="number" id="maxDifficulty" min="0" max="5" step="0.1"></label>
    <label>Professor Name: <input type="text" id="professorName"></label>
    <label>Sort By: 
      <select id="sortBy">
        <option value="courseCode">Course Code</option>
        <option value="rating">Rating</option>
        <option value="difficulty">Difficulty</option>
      </select>
    </label>
    <button id="applyFilters">Apply Filters</button>
  `;
  document.querySelector('body').insertBefore(controlsDiv, document.querySelector('body').firstChild);

  document.getElementById('applyFilters').addEventListener('click', filterAndSortCourses);
}

function filterAndSortCourses() {
  const minRating = parseFloat(document.getElementById('minRating').value) || 0;
  const maxDifficulty = parseFloat(document.getElementById('maxDifficulty').value) || 5;
  const professorName = document.getElementById('professorName').value.toLowerCase();
  const sortBy = document.getElementById('sortBy').value;

  const filteredCourses = allCourses.filter(course => {
    const ratingElement = course.professorNameCell.querySelector('.rating b');
    const rating = ratingElement ? parseFloat(ratingElement.textContent.split(':')[1]) : 0;
    const difficultyElement = course.professorNameCell.querySelectorAll('.rating b')[1];
    const difficulty = difficultyElement ? parseFloat(difficultyElement.textContent.split(':')[1]) : 5;

    return rating >= minRating &&
           difficulty <= maxDifficulty &&
           course.professorName.toLowerCase().includes(professorName);
  });

  filteredCourses.sort((a, b) => {
    if (sortBy === 'courseCode') {
      return a.courseCode.localeCompare(b.courseCode);
    } else if (sortBy === 'rating' || sortBy === 'difficulty') {
      const aElement = a.professorNameCell.querySelectorAll('.rating b')[sortBy === 'rating' ? 0 : 1];
      const bElement = b.professorNameCell.querySelectorAll('.rating b')[sortBy === 'rating' ? 0 : 1];
      const aValue = aElement ? parseFloat(aElement.textContent.split(':')[1]) : 0;
      const bValue = bElement ? parseFloat(bElement.textContent.split(':')[1]) : 0;
      return bValue - aValue;
    }
  });

  allCourses.forEach(course => course.row.style.display = 'none');
  filteredCourses.forEach(course => course.row.style.display = '');
}

function processProfessor(cell, professorName) {
  try {
    const port = chrome.runtime.connect({ name: 'professor-rating' });
    port.postMessage({ professorName });
    port.onMessage.addListener((teacher) => {
      console.log('Received response for professor:', teacher);
      if (teacher.error) {
        console.error('Error:', teacher.error);
        insertNoProfError(cell, professorName);
      } else {
        const { avgRating, numRatings, avgDifficulty, wouldTakeAgainPercent, legacyId } = teacher;
        if (parseInt(wouldTakeAgainPercent) === -1) {
          console.error('Error: No ratings found for professor.');
          insertNoRatingsError(cell, legacyId);
        } else {
          insertRating(cell, avgRating);
          insertAvgDifficulty(cell, avgDifficulty);
          insertWouldTakeAgainPercent(cell, wouldTakeAgainPercent);
          insertNumRatings(cell, numRatings, legacyId);
        }
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

function insertRating(link, avgRating) {
  link.insertAdjacentHTML('beforeend', `<div class="rating"><b>Rating: ${avgRating}/5</b></div>`);
}

function insertAvgDifficulty(link, avgDifficulty) {
  link.insertAdjacentHTML('beforeend', `<div class="rating"><b>Difficulty: ${avgDifficulty}/5</b></div>`);
}

function insertWouldTakeAgainPercent(link, wouldTakeAgainPercent) {
  link.insertAdjacentHTML('beforeend', `<div class="rating"><b>${wouldTakeAgainPercent}%</b> of students would take this professor again.</div>`);
}

function insertNumRatings(link, numRatings, legacyId) {
  const profLink = `<a target="_blank" rel="noopener noreferrer" href='https://www.ratemyprofessors.com/professor?tid=${legacyId}'>${numRatings} ratings</a>`;
  link.insertAdjacentHTML('beforeend', `<div class="rating">${profLink}</div>`);
}

function insertNoRatingsError(link, legacyId) {
  link.insertAdjacentHTML(
    'beforeend',
    `<div class="rating"><b>Error:</b> this professor has <a target="_blank" rel="noopener noreferrer" href='https://www.ratemyprofessors.com/search/teachers?query=${legacyId}'>no ratings on RateMyProfessors.</a></div>`
  );
}

function insertNoProfError(link, professorName) {
  link.insertAdjacentHTML(
    'beforeend',
    `<div class="rating"><b>Error:</b> Professor ${professorName} not found on RateMyProfessors.</div>`
  );
}

appendRMP();

window.addEventListener('hashchange', appendRMP, false);

chrome.runtime.onMessage.addListener(
  function(request, sendResponse) {
    if (request.action === "refreshRatings") {
      appendRMP();
      sendResponse({status: "Ratings refreshed"});
    }
  }
);
