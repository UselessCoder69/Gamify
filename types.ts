
export interface MarketAnalysis {
    trends: string[];
    mechanics: string[];
    monetization: string[];
}

export interface Position {
    x: number;
    y: number;
}

export interface Entity {
    type: string;
    position: Position;
}

export interface GameLevel {
    level_description: string;
    tilemap: string[][];
    entities: Entity[];
    player_start: Position;
    goal_position: Position;
    solvable_path: Position[];
    validity_check: string;
}

export interface PrototypeResult {
    type: 'html' | 'text';
    content: string;
}

export enum AppState {
    HERO,
    ANALYSIS_INPUT,
    ANALYSIS_LOADING,
    IDEA_LOADING,
    IDEA_COMPLETE,
    PROTOTYPE_LOADING,
    PROTOTYPE_COMPLETE,
}

export enum ApiErrorType {
    INVALID_KEY = 'INVALID_KEY',
    RATE_LIMIT = 'RATE_LIMIT',
    NETWORK = 'NETWORK',
    BAD_RESPONSE = 'BAD_RESPONSE',
    RESPONSE_BLOCKED = 'RESPONSE_BLOCKED',
    UNKNOWN = 'UNKNOWN',
}

export class ApiServiceError extends Error {
    public readonly type: ApiErrorType;

    constructor(type: ApiErrorType, message: string) {
        super(message);
        this.type = type;
        // This is to ensure 'instanceof' works correctly with custom errors in TypeScript
        Object.setPrototypeOf(this, ApiServiceError.prototype);
    }
}
