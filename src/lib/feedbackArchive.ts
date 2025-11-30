// src/lib/feedbackArchive.ts
import { promises as fs } from "fs";
import path from "path";

export type FeedbackRecord = {
  id: string;
  topic: string;
  fromEmail: string | null;
  toEmail: string;
  message: string;
  createdAt: string; // ISO timestamp
  userAgent?: string | null;
};

function getLogFilePath() {
  // You can override this with FEEDBACK_LOG_PATH if you want
  const customPath = process.env.FEEDBACK_LOG_PATH;
  if (customPath) return customPath;

  // Default: ./data/feedback.log.jsonl (one JSON per line)
  return path.join(process.cwd(), "data", "feedback.log.jsonl");
}

export async function appendFeedback(record: FeedbackRecord) {
  const filePath = getLogFilePath();
  const dir = path.dirname(filePath);

  // Make sure the directory exists
  await fs.mkdir(dir, { recursive: true });

  // Append as one JSON line
  const line = JSON.stringify(record) + "\n";
  await fs.appendFile(filePath, line, "utf8");
}
