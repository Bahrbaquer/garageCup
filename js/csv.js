window.parseCsv = function parseCsv(csvText) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let index = 0; index < csvText.length; index += 1) {
        const character = csvText[index];

        if (inQuotes) {
            if (character === '"' && csvText[index + 1] === '"') {
                field += '"';
                index += 1;
            } else if (character === '"') {
                inQuotes = false;
            } else {
                field += character;
            }
        } else if (character === '"' && field.length === 0) {
            inQuotes = true;
        } else if (character === ",") {
            row.push(field);
            field = "";
        } else if (character === "\n" || character === "\r") {
            if (character === "\r" && csvText[index + 1] === "\n") {
                index += 1;
            }
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
        } else {
            field += character;
        }
    }

    if (inQuotes) {
        throw new Error("The published CSV contains an unclosed quoted value.");
    }

    if (field.length > 0 || row.length > 0) {
        row.push(field);
        rows.push(row);
    }

    return rows;
};
