import type { TextGenerationResponse } from "@/domain/llm/entity.ts";
import type { VoteCriteria } from "@/infrastructure/types/vote.ts";

export type CriteriaScore = {
  accuracy: number;
  completeness: number;
  clarity: number;
  relevance: number;
  conciseness: number;
};

export type LMMScore = {
  voter: string;
  scores: Record<string, CriteriaScore>;
  reasoning: string;
  topic: string;
};

export type VoteOutcome<T extends TextGenerationResponse> = {
  winner: T;
  votes: Map<string, number>;
};

const clampScore = (value: unknown) =>
  Math.min(10, Math.max(1, Number(value) || 1));

const normalizeScores = (scores: CriteriaScore): CriteriaScore => ({
  accuracy: clampScore(scores.accuracy),
  completeness: clampScore(scores.completeness),
  clarity: clampScore(scores.clarity),
  relevance: clampScore(scores.relevance),
  conciseness: clampScore(scores.conciseness),
});

const weightedScore = (scores: CriteriaScore) =>
  scores.accuracy * 0.25 +
  scores.completeness * 0.25 +
  scores.clarity * 0.2 +
  scores.relevance * 0.2 +
  scores.conciseness * 0.1;

export function calculateVote<T extends TextGenerationResponse>(
  llmResponses: T[],
  llmScores: (LMMScore | null)[],
): VoteOutcome<T> | null {
  if (llmResponses.length === 0) return null;

  const letterOf = (idx: number) => String.fromCharCode(65 + idx);
  const aggregateScores = new Map<string, VoteCriteria>();
  const ballots = new Map<string, number>();

  llmResponses.forEach((_, idx) => {
    aggregateScores.set(letterOf(idx), {
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
    ballots.set(letterOf(idx), 0);
  });

  llmScores.forEach((vote) => {
    if (!vote) return;

    let favourite: string | null = null;
    let favouriteScore = -Infinity;

    Object.entries(vote.scores).forEach(([letter, rawScores]) => {
      const current = aggregateScores.get(letter);
      if (!current || !rawScores) return;
      const scores = normalizeScores(rawScores);

      current.criteriaScores.accuracy += scores.accuracy;
      current.criteriaScores.completeness += scores.completeness;
      current.criteriaScores.clarity += scores.clarity;
      current.criteriaScores.relevance += scores.relevance;
      current.criteriaScores.conciseness += scores.conciseness;
      current.voteCount++;

      const score = weightedScore(scores);
      if (score > favouriteScore) {
        favouriteScore = score;
        favourite = letter;
      }
    });

    if (favourite) {
      ballots.set(favourite, (ballots.get(favourite) ?? 0) + 1);
    }
  });

  aggregateScores.forEach((score) => {
    if (score.voteCount > 0) {
      Object.keys(score.criteriaScores).forEach((criterion) => {
        score.criteriaScores[criterion as keyof typeof score.criteriaScores] /=
          score.voteCount;
      });

      score.totalScore = weightedScore(score.criteriaScores);
    }
  });

  let winningIndex = 0;
  let highestScore = 0;

  aggregateScores.forEach((score, letter) => {
    if (score.totalScore > highestScore) {
      highestScore = score.totalScore;
      winningIndex = letter.charCodeAt(0) - 65;
    }
  });

  const votes = new Map<string, number>();
  llmResponses.forEach((response, idx) => {
    votes.set(response.model, ballots.get(letterOf(idx)) ?? 0);
  });

  return {
    winner: llmResponses[winningIndex] ?? llmResponses[0]!,
    votes,
  };
}
