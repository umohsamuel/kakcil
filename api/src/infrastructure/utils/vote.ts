import type { TextGenerationResponse } from "@/domain/llm/entity.ts";
import type { VoteCriteria } from "@/infrastructure/types/vote.ts";

export type LMMScore = {
  voter: string;
  scores: {
    A: {
      accuracy: number;
      completeness: number;
      clarity: number;
      relevance: number;
      conciseness: number;
    };
    B: {
      accuracy: number;
      completeness: number;
      clarity: number;
      relevance: number;
      conciseness: number;
    };
  };
  reasoning: string;
  topic: string | any;
};

export function calculateVote(
  llmResponses: (TextGenerationResponse<string> | null)[],
  llmScores: (LMMScore | null)[],
) {
  const aggregateScores = new Map<string, VoteCriteria>();

  llmResponses.forEach((_, idx) => {
    const letter = String.fromCharCode(65 + idx);
    aggregateScores.set(letter, {
      totalScore: 0,
      criteriaScores: {
        accuracy: 0,
        completeness: 0,
        clarity: 0,
        relevance: 0,
        conciseness: 0,
      },
      voteCount: 0,
    });
  });

  llmScores.forEach((vote) => {
    if (!vote) return;

    Object.entries(vote.scores).forEach(([letter, scores]) => {
      const current = aggregateScores.get(letter);
      if (current) {
        current.criteriaScores.accuracy += scores.accuracy;
        current.criteriaScores.completeness += scores.completeness;
        current.criteriaScores.clarity += scores.clarity;
        current.criteriaScores.relevance += scores.relevance;
        current.criteriaScores.conciseness += scores.conciseness;
        current.voteCount++;
      }
    });
  });

  aggregateScores.forEach((score) => {
    if (score.voteCount > 0) {
      Object.keys(score.criteriaScores).forEach((criterion) => {
        score.criteriaScores[criterion as keyof typeof score.criteriaScores] /=
          score.voteCount;
      });

      score.totalScore =
        score.criteriaScores.accuracy * 0.25 +
        score.criteriaScores.completeness * 0.25 +
        score.criteriaScores.clarity * 0.2 +
        score.criteriaScores.relevance * 0.2 +
        score.criteriaScores.conciseness * 0.1;
    }
  });

  let winningLetter = "";
  let highestScore = 0;

  aggregateScores.forEach((score, letter) => {
    if (score.totalScore > highestScore) {
      highestScore = score.totalScore;
      winningLetter = letter;
    }
  });

  const winningIndex = winningLetter.charCodeAt(0) - 65;
  const winningResponse = llmResponses[winningIndex];

  if (!winningResponse) {
    return llmResponses[0] as TextGenerationResponse;
  }

  return winningResponse;
}
