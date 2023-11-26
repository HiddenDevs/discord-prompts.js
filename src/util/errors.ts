export class PromptError extends Error {
    constructor(message: string) {
        super(message);
        Error.captureStackTrace?.(this, PromptError);
    }
};