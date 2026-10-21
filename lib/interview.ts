export const TOTAL_QUESTIONS = 3;

export type ChatMessage = {
  role: "interviewer" | "candidate";
  content: string;
};

export type QuestionFeedback = {
  question: string;
  score: number;
  feedback: string;
};

export type Evaluation = {
  overallScore: number;
  summary: string;
  questions: QuestionFeedback[];
  strengths: string[];
  improvements: string[];
};

export type InterviewRequest = {
  jobDescription: string;
  messages: ChatMessage[];
};

export type InterviewResponse =
  | { type: "question"; questionNumber: number; content: string }
  | { type: "evaluation"; evaluation: Evaluation };

export const API_KEY_HEADER = "x-openai-api-key";
