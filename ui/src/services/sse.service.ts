import { useAuthStore } from "@/store/auth.store";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface SSEEventHandlers {
  onLLMResponse?: (data: any) => void;
  onLLMPartial?: (data: { model: string; partial: string; topic?: string }) => void;
  onLLMVote?: (data: any) => void;
  onVoteResponse?: (data: any) => void;
  onChatId?: (data: { chat_id: string }) => void;
  onError?: (data: any) => void;
  onComplete?: () => void;
}

export class SSEService {
  private eventSource: EventSource | null = null;

  /**
   * Create an SSE connection to the specified endpoint
   * Note: EventSource doesn't support POST with body natively,
   * so we'll handle this differently - we'll make a fetch POST
   * and then read the stream
   */
  async createStream(
    endpoint: string,
    body: any,
    handlers: SSEEventHandlers,
    signal?: AbortSignal
  ): Promise<void> {
    const token = useAuthStore.getState().token;
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(body),
        credentials: "include",
        signal,
      });

      if (!response.ok) {
        // Read the error response body to get rate limit info and other details
        let errorData: any = null;
        try {
          errorData = await response.json();
        } catch {
          // response body isn't JSON, continue with status-only error
        }

        const error: any = new Error(
          errorData?.message || `HTTP error! status: ${response.status}`
        );
        error.response = {
          status: response.status,
          data: errorData,
        };
        throw error;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          handlers.onComplete?.();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event:")) {
            const eventType = line.substring(6).trim();
            // Look for the next line which should be data
            continue;
          }
          
          if (line.startsWith("data:")) {
            const dataStr = line.substring(5).trim();
            
            try {
              // Parse the event data - backend sends "Event Type {json}"
              // e.g., "LLM Responses {json}" or "LLM Vote Scores {json}"
              let eventData: any;
              
              if (dataStr.startsWith("LLM Partial ")) {
                const jsonStr = dataStr.substring(12);
                eventData = JSON.parse(jsonStr);
                handlers.onLLMPartial?.(eventData);
              } else if (dataStr.startsWith("LLM Responses ")) {
                const jsonStr = dataStr.substring(14);
                eventData = JSON.parse(jsonStr);
                
                // Check for null/empty response (models unavailable)
                if (eventData === null || eventData === undefined) {
                  handlers.onError?.({ 
                    error: "No response from models. Please check your API keys and model availability.",
                    code: "MODELS_UNAVAILABLE"
                  });
                  return;
                }
                handlers.onLLMResponse?.(eventData);
              } else if (dataStr.startsWith("LLM Vote Scores ")) {
                const jsonStr = dataStr.substring(16);
                eventData = JSON.parse(jsonStr);
                
                // Check for null vote scores
                if (eventData === null || eventData === undefined) {
                  handlers.onError?.({ 
                    error: "Voting failed. Models may not be available.",
                    code: "VOTE_FAILED"
                  });
                  return;
                }
                handlers.onLLMVote?.(eventData);
              } else if (dataStr.startsWith("Vote Response ")) {
                const jsonStr = dataStr.substring(14);
                eventData = JSON.parse(jsonStr);
                
                // Check for null vote response
                if (eventData === null || eventData === undefined) {
                  handlers.onError?.({ 
                    error: "Could not determine the best response. Please try again.",
                    code: "VOTE_RESPONSE_FAILED"
                  });
                  return;
                }
                handlers.onVoteResponse?.(eventData);
              } else if (dataStr.startsWith("Chat ID ")) {
                eventData = JSON.parse(dataStr.substring(8));
                handlers.onChatId?.(eventData);
              } else if (dataStr === "null" || dataStr === "undefined" || dataStr.trim() === "") {
                // Backend returned null directly
                handlers.onError?.({ 
                  error: "No response received from the council. Models may be unavailable.",
                  code: "NULL_RESPONSE"
                });
              } else {
                // Try to parse as JSON directly (for errors)
                try {
                  eventData = JSON.parse(dataStr);
                  if (eventData === null) {
                    handlers.onError?.({ 
                      error: "No response received. Please check model configuration.",
                      code: "NULL_RESPONSE"
                    });
                  } else if (eventData.error) {
                    handlers.onError?.(eventData);
                  }
                } catch {
                  // Not JSON, skip
                }
              }
            } catch (error) {
              console.error("Error parsing SSE data:", error, dataStr);
              // If parsing fails, it might be due to null/invalid data
              if (dataStr === "null" || dataStr.includes("null")) {
                handlers.onError?.({ 
                  error: "Invalid response from server. Models may not be available.",
                  code: "PARSE_ERROR"
                });
              }
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("SSE stream error:", error);
        handlers.onError?.({ error: error.message || "Stream error" });
      }
    }
  }

  /**
   * Close the current stream
   */
  close() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

export const sseService = new SSEService();
