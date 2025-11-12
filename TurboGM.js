// TurboGM, a extension to use Gemini on Turbowarp
// if you hardcode your gemini API key here your Key is gonna get exposed to the internet
class TurboGMBlocks {

    _geminiModel = 'gemini-2.5-flash'; 

    getInfo() {
        return {
            id: 'turbogm', 
            name: 'TurboGM', 
            color1: '#1A73E8', 
            color2: '#0D47A1', 
            menuIconURI: 'https://cdn.jsdelivr.net/gh/Alejandrix2456github/TurboGM@main/TurboGM%20Logo2.png',

            blocks: [
                {
                    opcode: 'setGeminiModel',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'set Gemini Model to [MODEL_NAME]',
                    arguments: {
                        MODEL_NAME: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: 'gemini-2.5-flash', 
                            menu: 'geminiModels'
                        },
                    },
                },
                '---', // A separator 
                {
                    opcode: 'getAiAnswer',
                    blockType: Scratch.BlockType.REPORTER, 
                    text: 'AI Answer for [QUERY] using API Key [KEY]', 
                    arguments: {
                        QUERY: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: 'What is your name?',
                        },
                        KEY: { // This block will now accept the key directly
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: 'YOUR_API_KEY_HERE', 
                        }
                    },
                },
            ],
            menus: {
                // Dropdown menu for Gemini Models
                geminiModels: {
                    acceptsReporters: true, 
                    items: ['gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-pro'] 
                }
            }
        };
    }

    setGeminiModel(args) {
        // Store the user-provided model name
        this._geminiModel = args.MODEL_NAME;
    }

    async getAiAnswer(args) {
        const userQuery = args.QUERY;
        const apiKey = args.KEY; // The API key is read directly from the block input!
        const targetModel = this._geminiModel;

        if (!userQuery || !apiKey) {
            return "Error: Query and API Key are required.";
        }
        
        // This is the official Google API URL, which now includes the key directly.
        const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

        try {
            const requestBody = JSON.stringify({ 
                contents: [{ role: "user", parts: [{ text: userQuery }] }]
            });

            const response = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: requestBody
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.error?.message || `Error status: ${response.status}`;
                return `AI API Error: ${errorMessage.substring(0, 150)}...`;
            }

            const data = await response.json();
            const aiAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            return aiAnswer || "Error: Failed to parse AI response.";

        } catch (error) {
            console.error("Network/Fetch Error:", error);
            return "Error: Could not connect to the API. Check internet connection.";
        }
    }
}

Scratch.extensions.register(new TurboGMBlocks());