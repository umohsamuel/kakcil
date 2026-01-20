import type { TextGenerationResponse } from "@/domain/llm/entity.ts";

export function getVotingPrompt(
  originalPrompt: string,
  promptResponse: (TextGenerationResponse | null)[],
) {
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
  .filter((r) => r !== null)
  .map(
    (r, idx) => `
Response ${String.fromCharCode(65 + idx)}:
${r?.response}
`,
  )
  .join("\n---\n")}

Respond ONLY with a JSON object in this exact format (no markdown, no extra text):
{
  "scores": {
    "A": { "accuracy": 8, "completeness": 7, "clarity": 9, "relevance": 8, "conciseness": 7 },
    "B": { "accuracy": 9, "completeness": 8, "clarity": 8, "relevance": 9, "conciseness": 8 },
    "C": { "accuracy": 7, "completeness": 9, "clarity": 7, "relevance": 8, "conciseness": 6 }
  },
  "reasoning": "Brief explanation of your evaluation"
}
`;
}
