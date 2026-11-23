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

window.getImageSource = function getImageSource(image, directory, fallback) {
    const source = (image || "").trim();
    if (!source) {
        return fallback || "";
    }

    if (/^(https?:)?\/\//i.test(source)
        || source.startsWith("/")
        || source.startsWith("./")
        || source.startsWith("../")
        || source.startsWith("images/")) {
        return source;
    }

    return `${directory}/${source}`;
};

window.getGolferImageSource = function getGolferImageSource(image) {
    return window.getImageSource(image, "images/bioPics", "images/logo.png");
};

window.getRankedGolfers = function getRankedGolfers(rows) {
    if (rows.length < 2) {
        throw new Error("The published golfers CSV has no player rows.");
    }

    const headerMap = new Map(rows[0].map((header, index) => [
        header.replace(/^\uFEFF/, "").trim().toLowerCase(),
        index
    ]));
    const requiredHeaders = ["name", "points", "record"];
    const missingHeaders = requiredHeaders.filter((header) => !headerMap.has(header));
    if (missingHeaders.length > 0) {
        throw new Error(`The published golfers CSV is missing columns: ${missingHeaders.join(", ")}.`);
    }

    const golfers = rows.slice(1)
        .filter((row) => row.some((value) => value.trim()))
        .map((row, index) => {
            const nameColumn = headerMap.get("name");
            const pointsColumn = headerMap.get("points");
            const recordColumn = headerMap.get("record");
            const imageColumn = headerMap.get("img");
            const name = (row[nameColumn] || "").trim();
            if (!name) {
                return null;
            }

            const points = (row[pointsColumn] || "").trim();
            const numericPoints = Number(points.replace(/,/g, ""));
            if (!Number.isFinite(numericPoints)) {
                throw new Error(`The points value for ${name} is not numeric.`);
            }

            return {
                name,
                points: points || "0",
                numericPoints,
                record: (row[recordColumn] || "").trim() || "—",
                image: imageColumn === undefined ? "" : (row[imageColumn] || "").trim(),
                sheetOrder: index
            };
        })
        .filter(Boolean)
        .sort((left, right) => right.numericPoints - left.numericPoints || left.sheetOrder - right.sheetOrder);

    if (golfers.length === 0) {
        throw new Error("The published golfers CSV has no players with a name.");
    }

    return golfers;
};
