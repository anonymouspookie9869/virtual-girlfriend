import type { UserProfile, Mood, ChatMessage, RelationshipStatus, DateScenario } from '../types';

export const sendMessageToAI = async (
  userProfile: UserProfile, 
  mood: Mood, 
  relationshipStatus: RelationshipStatus, 
  history: ChatMessage[], 
  activeScenario: DateScenario | null, 
  message: string
): Promise<{ text: string }> => {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userProfile, mood, relationshipStatus, history, activeScenario, message }),
  });
  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get response");
    } else {
      const text = await response.text();
      throw new Error(`Server error (${response.status}): ${text.substring(0, 100)}...`);
    }
  }
  return response.json();
};

export const extractMemories = async (messages: ChatMessage[], currentMemories: string[] = []): Promise<string[]> => {
  try {
    const response = await fetch("/api/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, currentMemories }),
    });
    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return data.memories || currentMemories;
      }
      return currentMemories;
    }
    const data = await response.json();
    return data.memories || currentMemories;
  } catch (error) {
    console.error("Error extracting memories:", error);
    return currentMemories;
  }
};

export const generateAvatar = async (description: string): Promise<string> => {
  const response = await fetch("/api/generate-avatar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate avatar");
    } else {
      const text = await response.text();
      throw new Error(`Server error (${response.status}): ${text.substring(0, 100)}...`);
    }
  }
  const data = await response.json();
  return data.url;
};
