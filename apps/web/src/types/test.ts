export type CreateAttemptRequest =
    | { game: "reaction"; value: number; reaction: { bestMs: number; avgMs: number; attempts: number } }
    | { game: "chimp"; value: number; chimp: { level: number; mistakes: number; timeMs: number } }
    | { game: "typing"; value: number; typing: { wpm: number; accuracy: number; characters: number } }
    | { game: "sequence"; value: number; sequence: { level: number; mistakes: number; timeMs: number } };

export type AttemptDto = {
    id: number;
    userId: string;
    game: number | string;
    value: number;
    createdAt: string;
};