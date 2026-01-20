export type VoteCriteria = {
  totalScore: number;
  criteriaScores: {
    accuracy: number;
    completeness: number;
    clarity: number;
    relevance: number;
    conciseness: number;
  };
  voteCount: number;
};
