
const style = document.createElement('style');
style.innerHTML = `
  .rating {
    margin-top: 7px;
  }
`;
document.head.appendChild(style);

function appendRMP() {
	let professorLinks;
	const profInterval = setInterval(() => {
		professorLinks = document.querySelectorAll('.tblcell[style="width: 175px"]');
		if (professorLinks.length > 0) {
			clearInterval(profInterval);
			console.log('Prof names found:', professorLinks);
			professorLinks.forEach(async (link) => {
				const professorName = link.textContent;
				try {
					const port = chrome.runtime.connect({ name: 'professor-rating' });
					port.postMessage({ professorName });
					port.onMessage.addListener((teacher) => {
						console.log('Received response for professor:', teacher);
						if (teacher.error) {
							console.error('Error:', teacher.error);
							insertNoProfError(link, professorName);
						} else {
							const avgRating = teacher.avgRating;
							const numRatings = teacher.numRatings;
							const avgDifficulty = teacher.avgDifficulty;
							const wouldTakeAgainPercent = parseInt(teacher.wouldTakeAgainPercent);
							const legacyId = teacher.legacyId;

							if (wouldTakeAgainPercent === -1) {
								console.error('Error: No ratings found for professor.');
								insertNoRatingsError(link, legacyId);
								return;
							}
							insertRating(link, avgRating);
							insertAvgDifficulty(link, avgDifficulty);
							insertWouldTakeAgainPercent(link, wouldTakeAgainPercent);
							insertNumRatings(link, numRatings, legacyId);
						}
					});
				} catch (error) {
					console.error('Error:', error);
				}
			});
		} else {
		}
	}, 1500);
}

appendRMP();

window.addEventListener('hashchange', appendRMP, false);

function insertRating(link, avgRating) {
	link.insertAdjacentHTML('beforeend', `<div class="rating"><b>Rating:</b> ${avgRating}/5</div>`);
}

function insertAvgDifficulty(link, avgDifficulty) {
	link.insertAdjacentHTML('beforeend', `<div class="rating"><b>Difficulty:</b> ${avgDifficulty}/5</div>`);
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
