import * as webllm from "https://esm.run/@mlc-ai/web-llm";

const MODEL_ID = "Qwen2-0.5B-Instruct-q4f16_1-MLC";
let engine = null;

const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const progressBar = document.getElementById('progress-bar');
const inputText = document.getElementById('input-text');
const outputText = document.getElementById('output-text');
const translateBtn = document.getElementById('translate-btn');
const exampleBtns = document.querySelectorAll('.example-btn');

async function initializeWebLLM() {
    try {
        statusIndicator.className = 'indicator loading';
        statusText.innerText = 'Downloading and Loading Qwen2-0.5B (Requires WebGPU)...';

        const initProgressCallback = (report) => {
            statusText.innerText = report.text;
            progressBar.style.width = `${report.progress * 100}%`;
        };

        engine = new webllm.MLCEngine();
        engine.setInitProgressCallback(initProgressCallback);

        await engine.reload(MODEL_ID);

        statusIndicator.className = 'indicator connected';
        statusText.innerText = 'Engine Ready! Translating locally via WebGPU.';
        progressBar.parentElement.style.display = 'none';
        translateBtn.disabled = false;
    } catch (error) {
        console.error("Initialization Error:", error);
        statusIndicator.className = 'indicator disconnected';
        statusText.innerText = `Error: ${error.message} (Make sure your browser supports WebGPU)`;
    }
}

async function translate() {
    const textToTranslate = inputText.value.trim();
    if (!textToTranslate || !engine) return;

    translateBtn.disabled = true;
    const originalBtnContent = translateBtn.innerHTML;
    translateBtn.innerHTML = 'Translating...';
    outputText.value = '';

    try {
        const prompt = `Translate the following text to Portuguese. Output ONLY the translation without any additional explanations, quotes or comments.\n\nText: ${textToTranslate}\n\nTranslation:`;
        
        const messages = [
            { role: "system", content: "You are a specialized translator. Your only task is to translate the user's text into Portuguese and output the result." },
            { role: "user", content: prompt }
        ];

        // Stream the response
        const asyncChunkGenerator = await engine.chat.completions.create({
            messages,
            stream: true,
            temperature: 0.3,
            max_tokens: 512
        });

        for await (const chunk of asyncChunkGenerator) {
            if (chunk.choices[0].delta.content) {
                outputText.value += chunk.choices[0].delta.content;
            }
        }
    } catch (error) {
        console.error("Translation Error:", error);
        outputText.value = `Error during translation: ${error.message}`;
    } finally {
        translateBtn.innerHTML = originalBtnContent;
        translateBtn.disabled = false;
    }
}

// Event Listeners
translateBtn.addEventListener('click', translate);

exampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        inputText.value = btn.innerText;
    });
});

// Start initialization on load
window.addEventListener('DOMContentLoaded', initializeWebLLM);
