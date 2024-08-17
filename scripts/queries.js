const BASE_URL = "https://www.ratemyprofessors.com/graphql";

const SEARCH_PROFS_QUERY = `
  query NewSearchTeachersQuery($text: String!, $schoolID: ID!) {
    newSearch {
      teachers(query: {text: $text, schoolID: $schoolID}) {
        edges {
          cursor
          node {
            id
            firstName
            lastName
            school {
              name
              id
            }
          }
        }
      }
    }
  }
`;

const PROF_RATINGS_QUERY = `
  query TeacherRatingsPageQuery($id: ID!) {
    node(id: $id) {
      ... on Teacher {
        id
        firstName
        lastName
        school {
          name
          id
          city
          state
        }
        avgDifficulty
        avgRating
        department
        numRatings
        legacyId
        wouldTakeAgainPercent
      }
      id
    }
  }
`;
