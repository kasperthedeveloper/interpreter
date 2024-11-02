let currentColor = 'black';
let currentFontSize = '16px';
let lastPromptAnswer = "";  // Käyttäjän viimeinen vastaus promptiin
const variables = {};        // Muuttujat
const functions = {};        // Funktiot

function executeWebScript() {
    const code = document.getElementById("webscript-code").value;
    const outputDiv = document.getElementById("output");
    outputDiv.innerHTML = ""; // Tyhjennetään edellinen tulostus

    const lines = code.split('\n');
    let isFunction = false;
    let functionName = '';
    let functionBody = [];
    let shouldExecute = true;       // Tällä seurataan, suoritettaanko rivit
    let inIfBlock = false;          // Seurataan, ollaanko if-lohkossa
    let ifConditionMet = false;     // Seurataan, täyttyikö ehto

    lines.forEach((line) => {
        line = line.trim();

        // Funktioiden määrittely
        if (line.startsWith("def ")) {
            isFunction = true;
            functionName = line.split(" ")[1];
            functionBody = [];
        } else if (isFunction && line === "end") {
            functions[functionName] = functionBody.slice(); // Tallenna funktio
            isFunction = false;
        } else if (isFunction) {
            functionBody.push(line); // Lisää rivi funktion kehoon
        } else if (line.startsWith("set ")) {
            if (shouldExecute) {
                const match = line.match(/set (\w+) "([^"]+)"/);
                if (match) {
                    const varName = match[1];
                    const varValue = match[2];
                    variables[varName] = varValue; // Tallennetaan muuttuja
                }
            }
        } else if (line.startsWith("prompt")) {
            if (shouldExecute) {
                const promptMessage = line.match(/"([^"]+)"/)[1];
                lastPromptAnswer = prompt(promptMessage);
            }
        } else if (line.startsWith("if ")) {
            // Aloitetaan if-lohko ja tarkistetaan ehto
            const condition = line.match(/if (.+)/)[1].trim();
            inIfBlock = true;
            if (condition.includes("lastPrompt") && condition.includes("==")) {
                const expectedAnswer = condition.split("==")[1].trim().replace(/"/g, '');
                ifConditionMet = lastPromptAnswer === expectedAnswer;
                shouldExecute = ifConditionMet;
            }
        } else if (inIfBlock && line.startsWith("show")) {
            // Näytetään viesti vain, jos ollaan if-lohkossa ja ehto täyttyy
            if (shouldExecute) {
                const message = line.match(/"([^"]+)"/)[1];
                alert(replaceVariables(message));
            }
        } else if (inIfBlock && line.startsWith("hello")) {
            if (shouldExecute) {
                const text = line.match(/"([^"]+)"/)[1];
                displayText(replaceVariables(text));
            }
        } else if (inIfBlock && line.startsWith("setcolor")) {
            if (shouldExecute) {
                const color = line.match(/"([^"]+)"/)[1];
                currentColor = color;
            }
        } else if (inIfBlock && functions[line]) {
            // Kutsu funktiota vain, jos ehto täyttyy
            if (shouldExecute) {
                executeFunction(line);
            }
        } else if (inIfBlock && line === "end") {
            // Lopetetaan if-lohko ja palautetaan oletustila
            inIfBlock = false;
            shouldExecute = true;
        }
    });
}

// Korvaa kaikki {muuttuja} tekstissä vastaavalla arvolla
function replaceVariables(text) {
    return text.replace(/\{(\w+)\}/g, (match, varName) => {
        return variables[varName] !== undefined ? variables[varName] : `{${varName}}`; 
    });
}

function displayText(text) {
    const outputDiv = document.getElementById("output");
    const paragraph = document.createElement("p");
    paragraph.innerText = text;
    paragraph.style.color = currentColor;
    paragraph.style.fontSize = currentFontSize;
    outputDiv.appendChild(paragraph);
}

function executeFunction(funcName) {
    const funcLines = functions[funcName];
    if (funcLines) {
        funcLines.forEach(line => {
            if (line.startsWith("hello")) {
                const text = line.match(/"([^"]+)"/)[1];
                displayText(replaceVariables(text));
            } else if (line.startsWith("setcolor")) {
                const color = line.match(/"([^"]+)"/)[1];
                currentColor = color;
            }
        });
    }
}