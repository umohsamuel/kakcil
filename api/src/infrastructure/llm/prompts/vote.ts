import type { TextGenerationResponse } from "@/domain/llm/entity.ts";

export function getVotingPrompt(
  originalPrompt: string,
  promptResponse: TextGenerationResponse[],
) {
  const letters = promptResponse.map((_, idx) => String.fromCharCode(65 + idx));

  const exampleScores = letters
    .map(
      (letter) =>
        `    "${letter}": { "accuracy": 8, "completeness": 7, "clarity": 9, "relevance": 8, "conciseness": 7 }`,
    )
    .join(",\n");

  return `
You are evaluating multiple AI-generated responses to the same prompt. Rate each response objectively using these criteria on a scale of 1-10:

1. **Accuracy**: Is the information factually correct and reliable?
2. **Completeness**: Does it fully address all aspects of the question?
3. **Clarity**: Is it easy to understand and well-structured?
4. **Relevance**: Does it stay on topic and answer what was asked?
5. **Conciseness**: Is it appropriately brief without unnecessary information?

Original Prompt:
${originalPrompt}

Responses to evaluate:
${promptResponse
  .map(
    (r, idx) => `
Response ${letters[idx]}:
${r.response}
`,
  )
  .join("\n---\n")}

Score every response (${letters.join(", ")}). Respond ONLY with a JSON object in this exact format (no markdown, no extra text):
{
  "topic": "A short title for the conversation",
  "scores": {
${exampleScores}
  },
  "reasoning": "Brief explanation of your evaluation"
}
`;
}
