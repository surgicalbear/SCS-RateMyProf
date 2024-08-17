const AUTH_TOKEN = "dGVzdDp0ZXN0"
const SCHOOL_IDS = ["U2Nob29sLTE0MjA="]

const searchProfessor = async (name, schoolIDs) => {
  for (const schoolID of schoolIDs) {
    const response = await fetch(BASE_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${AUTH_TOKEN}`,
        },
        body: JSON.stringify({
          query: SEARCH_PROFS_QUERY,           
          variables: {
            text: name,
            schoolID,
          },
        }),
      }
    );
    const json = await response.json();
    if (json.data.newSearch.teachers.edges.length > 0) {
      return json.data.newSearch.teachers.edges.map((edge) => edge.node);
    }
  }
  return [];
};

const getProfessor = async (id) => {
  const response = await fetch(BASE_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        query: PROF_RATINGS_QUERY,
        variables: {
          id,
        },
      }),
    }
  );
  const json = await response.json();
  return json.data.node;
};

async function sendProfessorInfo(professorName) {
  const normalizedName = professorName.normalize("NFKD");
  const professors = await searchProfessor(normalizedName, SCHOOL_IDS);
  if (professors.length === 0) {
    const names = normalizedName.split(" ");
    if (names.length >= 2) {
      const modifiedName = `${names[0]} ${names[names.length - 1]}`;
      const modifiedProfessors = await searchProfessor(modifiedName, SCHOOL_IDS);
      if (modifiedProfessors.length === 0) {
        return { error: "Professor not found" };
      }
      const professorID = modifiedProfessors[0].id;
      const professor = await getProfessor(professorID);
      return professor;
    }
    return { error: "Professor not found" };
  }
  const professorID = professors[0].id;
  const professor = await getProfessor(professorID);
  return professor;
}

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((request) => {
    sendProfessorInfo(request.professorName).then((professor) => {
      port.postMessage(professor);
    }).catch((error) => {
      console.log('Error:', error);
      port.postMessage({error});
    });
  });
});
