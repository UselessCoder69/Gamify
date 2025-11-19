import { GoogleGenAI, Type } from '@google/genai';
import { MarketAnalysis, GameLevel, PrototypeResult, ApiServiceError, ApiErrorType } from '../types';

/**
 * Parses a raw error from the Gemini API or network and returns a structured ApiServiceError.
 * @param error The unknown error object to parse.
 * @returns An instance of ApiServiceError with a specific type and message.
 */
const handleApiError = (error: unknown): ApiServiceError => {
    if (error instanceof ApiServiceError) {
        return error; // Don't re-wrap our custom errors
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('API key not valid') || errorMessage.includes('Requested entity was not found')) {
        return new ApiServiceError(ApiErrorType.INVALID_KEY, 'API Key is invalid or not found.');
    }
    if (errorMessage.includes('Rate limit exceeded')) {
        return new ApiServiceError(ApiErrorType.RATE_LIMIT, 'You have exceeded the API rate limit.');
    }
    if (error instanceof TypeError && (errorMessage.includes('fetch') || errorMessage.includes('network'))) {
         return new ApiServiceError(ApiErrorType.NETWORK, 'A network error occurred. Please check your connection.');
    }

    console.error("Unknown API Error:", error);
    return new ApiServiceError(ApiErrorType.UNKNOWN, 'An unknown API error occurred.');
};


export const generateMarketAnalysis = async (genre: string): Promise<MarketAnalysis> => {
    // FIX: Use process.env.API_KEY directly as per Gemini API guidelines.
    if (!process.env.API_KEY) throw new ApiServiceError(ApiErrorType.INVALID_KEY, 'API Key is not configured.');
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the current market for the game genre: "${genre}". Provide a list of 3-4 key market trends, 3-4 popular gameplay mechanics, and 3-4 common successful monetization patterns.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        trends: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Current market trends for the genre."
                        },
                        mechanics: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Popular gameplay mechanics in the genre."
                        },
                        monetization: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Successful monetization patterns for the genre."
                        }
                    },
                    required: ['trends', 'mechanics', 'monetization'],
                },
            },
        });

        if (response.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP') {
            const reason = response.candidates[0].finishReason;
            throw new ApiServiceError(ApiErrorType.RESPONSE_BLOCKED, `Response was blocked due to: ${reason}`);
        }

        if (!response.text) {
             throw new ApiServiceError(ApiErrorType.BAD_RESPONSE, "Received an empty response from the AI.");
        }

        try {
            const jsonText = response.text.trim();
            return JSON.parse(jsonText) as MarketAnalysis;
        } catch (e) {
            console.error("Failed to parse market analysis JSON:", response.text);
            throw new ApiServiceError(ApiErrorType.BAD_RESPONSE, "Received malformed data for market analysis.");
        }
    } catch (error) {
        throw handleApiError(error);
    }
};

export const generateGameLevels = async (genre: string, analysis: MarketAnalysis): Promise<GameLevel[]> => {
    // FIX: Use process.env.API_KEY directly as per Gemini API guidelines.
    if (!process.env.API_KEY) throw new ApiServiceError(ApiErrorType.INVALID_KEY, 'API Key is not configured.');
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Based on the genre "${genre}" and the provided market analysis, generate two different, fully playable, and solvable game levels.
            
            Market Analysis:
            - Trends: ${analysis.trends.join(', ')}
            - Mechanics: ${analysis.mechanics.join(', ')}

            For each level:
            - Ensure there are no unreachable goals, no impossible jumps, no softlocks, no dead ends, and no broken mechanics.
            - Ensure at least one valid path from start to goal.
            - Simulate a virtual player to verify reachability and auto-correct any errors before responding.
            - The level must be internally validated for solvability; if anything is invalid, regenerate until correct.
            
            Return only a valid JSON array containing two objects, where each object has the specified structure.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            level_description: { type: Type.STRING },
                            tilemap: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } },
                            entities: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        type: { type: Type.STRING },
                                        position: {
                                            type: Type.OBJECT,
                                            properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } },
                                            required: ['x', 'y']
                                        }
                                    },
                                    required: ['type', 'position']
                                }
                            },
                            player_start: {
                                type: Type.OBJECT,
                                properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } },
                                required: ['x', 'y']
                            },
                            goal_position: {
                                type: Type.OBJECT,
                                properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } },
                                required: ['x', 'y']
                            },
                            solvable_path: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } },
                                    required: ['x', 'y']
                                }
                            },
                            validity_check: { type: Type.STRING }
                        },
                        required: ['level_description', 'tilemap', 'entities', 'player_start', 'goal_position', 'solvable_path', 'validity_check']
                    }
                },
            },
        });
        
        if (response.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP') {
            const reason = response.candidates[0].finishReason;
            throw new ApiServiceError(ApiErrorType.RESPONSE_BLOCKED, `Response was blocked due to: ${reason}`);
        }

        if (!response.text) {
             throw new ApiServiceError(ApiErrorType.BAD_RESPONSE, "Received an empty response from the AI.");
        }

        try {
            const jsonText = response.text.trim();
            return JSON.parse(jsonText) as GameLevel[];
        } catch (e) {
            console.error("Failed to parse game ideas JSON:", response.text);
            throw new ApiServiceError(ApiErrorType.BAD_RESPONSE, "Received malformed data for game ideas.");
        }
    } catch (error) {
        throw handleApiError(error);
    }
};

export const generatePrototype = async (level: GameLevel): Promise<PrototypeResult> => {
    // FIX: Use process.env.API_KEY directly as per Gemini API guidelines.
    if (!process.env.API_KEY) throw new ApiServiceError(ApiErrorType.INVALID_KEY, 'API Key is not configured.');
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `
            Your task is to generate the raw HTML and embedded JavaScript for a **perfectly responsive** and interactive game prototype. The game must scale to fit any screen size while maintaining its original aspect ratio, ensuring it is always centered and fully playable.

            The final output MUST be only the content that goes inside a <body> tag. Do NOT include <html>, <head>, <body> tags.

            **Game Specification (from JSON):**
            - Tilemap: ${JSON.stringify(level.tilemap)} ('#' is a wall, '.' is empty space).
            - Player Start: ${JSON.stringify(level.player_start)} (in tile coordinates).
            - Goal Position: ${JSON.stringify(level.goal_position)} (in tile coordinates).

            **--- IMPLEMENTATION REQUIREMENTS ---**

            **1. HTML Structure:**
            - The ONLY HTML element must be: \`<canvas id="gameCanvas"></canvas>\`.

            **2. JavaScript Core Logic (inside a single <script> tag):**

            **A. Dynamic Sizing and Rendering Globals:**
            - You MUST define and use these global variables to handle dynamic scaling:
              - \`let TILE_SIZE;\` // The pixel size of one tile, will be calculated dynamically.
              - \`let offsetX;\`   // The horizontal offset to center the game canvas.
              - \`let offsetY;\`   // The vertical offset to center the game canvas.

            **B. The \`resizeCanvas\` Function (CRITICAL FOR RESPONSIVENESS):**
            - This function is the heart of the responsive logic. It MUST be called once on startup and attached to the window's 'resize' event listener.
            - It MUST perform the following steps in order:
              1. **Match Window Size:** Set the canvas element's dimensions to the full browser window size (\`window.innerWidth\`, \`window.innerHeight\`).
              2. **Calculate Aspect Ratios:** Determine the game's aspect ratio (\`tilemap[0].length / tilemap.length\`) and the screen's aspect ratio.
              3. **Calculate \`TILE_SIZE\`:**
                 - If \`screenAspectRatio > gameAspectRatio\` (screen is wider than the game), the game is height-constrained. \`TILE_SIZE\` must be \`canvas.height / tilemap.length\`.
                 - Otherwise, the game is width-constrained. \`TILE_SIZE\` must be \`canvas.width / tilemap[0].length\`.
              4. **Calculate Centering Offsets:**
                 - \`const renderWidth = tilemap[0].length * TILE_SIZE;\`
                 - \`const renderHeight = tilemap.length * TILE_SIZE;\`
                 - \`offsetX = (canvas.width - renderWidth) / 2;\`
                 - \`offsetY = (canvas.height - renderHeight) / 2;\`

            **C. Main Game Loop (\`requestAnimationFrame\`):**
            - Use a standard game loop that calls \`update()\` and \`render()\` functions.

            **D. Rendering (\`render\` function):**
            - **ABSOLUTELY ESSENTIAL:** All drawing operations must account for the dynamic scale and offset.
              1. Clear the entire canvas with a pale cream background (\`#EAF2CE\`).
              2. **Translate the context:** Before drawing any game elements, you MUST call \`ctx.translate(offsetX, offsetY)\`. This centers the entire game area.
              3. All game objects (player, tiles, goal) must be drawn at positions scaled by \`TILE_SIZE\`. For example, a tile at \`(row, col)\` is drawn at \`(col * TILE_SIZE, row * TILE_SIZE)\`.
              4. Use '#A691F2' for walls (#), '#7D5CF2' for the goal, and '#3805F2' for the player.

            **E. Smooth Physics and Gameplay Scaling (CRITICAL FOR USABILITY):**
            - All game physics and movement values MUST be scaled proportionally to \`TILE_SIZE\`. This ensures the game feels the same at any resolution. Use a base tile size of 32 for this scaling calculation.
            - **Player Physics Object:** The player object MUST have \`x, y, width, height, vx, vy\` properties.
            - **Implement Smooth Movement:**
                - **Acceleration:** When a move key is pressed, apply an acceleration force to the player's velocity (\`vx\`). Do not set position directly.
                    - \`const acceleration = 0.5 * (TILE_SIZE / 32);\`
                - **Friction/Deceleration:** When no move keys are pressed, apply a friction force to slow the player down smoothly.
                    - \`const friction = 0.9;\`
                    - In the update loop, do \`player.vx *= friction;\`.
                - **Max Speed:** The player's horizontal velocity (\`vx\`) must be capped at a maximum speed.
                    - \`const maxSpeed = 6 * (TILE_SIZE / 32);\`
                    - Use \`player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx));\`
            - **Update Loop Logic:** The \`update\` function must apply physics in this order:
                1. Apply gravity to \`vy\`.
                2. Apply friction to \`vx\`.
                3. Check for keyboard input and apply acceleration to \`vx\` or trigger a jump by setting \`vy\`.
                4. Clamp \`vx\` to \`maxSpeed\`.
                5. Update player position based on velocity: \`player.x += player.vx;\` and \`player.y += player.vy;\`.
                6. Perform collision detection and resolution *after* updating position.
            - **Example Scaled Values:**
                - \`player.x = ${level.player_start.x} * TILE_SIZE;\`
                - \`gravity = 0.5 * (TILE_SIZE / 32);\`
                - \`jumpForce = -12 * (TILE_SIZE / 32);\`
                - The new \`acceleration\` and \`maxSpeed\` values should also be scaled as shown above.

            **F. Collision Detection:**
            - Collision logic must convert the player's pixel coordinates back to tile coordinates using \`TILE_SIZE\`. E.g., \`const playerCol = Math.floor(player.x / TILE_SIZE);\`.
            - Handle horizontal and vertical collisions separately to prevent sticking.

            **G. Win Condition:**
            - Detect overlap between player and goal rectangles.
            - On win, display "YOU WIN!" text. The font size MUST also be responsive, scaled with \`TILE_SIZE\` (e.g., \`font = \`\${TILE_SIZE * 2}px sans-serif\`\`). The text color should be '#3805F2'.

            **H. Controls:**
            - The player MUST be controlled using the keyboard.
            - Listen for 'keydown' and 'keyup' events.
            - Use ArrowLeft/ArrowRight for horizontal movement.
            - Use the Spacebar or ArrowUp for jumping.
            - **DO NOT** render any on-screen buttons, text, or instructions for the controls. The parent application will display this information separately.

            **--- FINAL CHECK ---**
            Before providing the response, double-check that your generated code meticulously follows every single requirement listed above, especially the \`resizeCanvas\` logic and the scaling of all rendering and physics values.

            If you cannot generate a playable HTML prototype that meets all these requirements, respond with: "PROTOTYPE_UNFEASIBLE:" followed by a clear reason.
            `,
            config: {
                temperature: 0.2,
            },
        });

        const content = response.text?.trim();

        if (!content) {
            throw new ApiServiceError(ApiErrorType.BAD_RESPONSE, "Received an empty prototype response from the AI.");
        }

        if (content.startsWith('PROTOTYPE_UNFEASIBLE:')) {
            return {
                type: 'text',
                content: content.replace('PROTOTYPE_UNFEASIBLE:', '').trim()
            };
        } else {
            const fullHtml = `
                <style>
                    body, html { 
                        margin: 0; 
                        padding: 0; 
                        overflow: hidden; 
                        background-color: #EAF2CE;
                    }
                    canvas { 
                        display: block; 
                    }
                </style>
                ${content}
            `;
            return {
                type: 'html',
                content: fullHtml
            };
        }
    } catch (error) {
        throw handleApiError(error);
    }
};