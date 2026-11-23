const scheduleTable = document.querySelector("#scheduleTable");
const scheduleRows = document.querySelector("#scheduleRows");
const scheduleStatus = document.querySelector("#scheduleStatus");
const scheduleCsvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRPFqofsibngSPR-qcSst9N36PxWSo9YDAIhBzpJ27pZkhKh7nEtgwL7ehBFai2Nk2HQyoh3k6GHGok/pub?gid=871809002&single=true&output=csv";
const scheduleColumns = ["date", "course", "format", "team_a", "team_b"];

function getScheduleCell(row, headerMap, header) {
    const column = headerMap.get(header);
    return column === undefined ? "" : (row[column] || "").trim();
}

async function loadSchedule() {
    if (!scheduleTable || !scheduleRows || !scheduleStatus) {
        return;
    }

    try {
        const response = await fetch(scheduleCsvUrl, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Google Sheets returned HTTP ${response.status}.`);
        }

        const rows = window.parseCsv(await response.text());
        if (rows.length < 2) {
            throw new Error("The published schedule CSV has no schedule rows.");
        }

        const headerMap = new Map(rows[0].map((header, index) => [
            header.replace(/^\uFEFF/, "").trim().toLowerCase(),
            index
        ]));
        const missingHeaders = scheduleColumns.filter((header) => !headerMap.has(header));
        if (missingHeaders.length > 0) {
            throw new Error(`The published schedule CSV is missing columns: ${missingHeaders.join(", ")}.`);
        }

        const dataRows = rows.slice(1).filter((row) => row.some((value) => value.trim()));
        if (dataRows.length === 0) {
            throw new Error("The published schedule CSV has no schedule rows.");
        }

        const fragment = document.createDocumentFragment();
        dataRows.forEach((row) => {
            const tableRow = document.createElement("tr");
            scheduleColumns.forEach((column) => {
                const cell = document.createElement("td");
                cell.textContent = getScheduleCell(row, headerMap, column);
                tableRow.append(cell);
            });
            fragment.append(tableRow);
        });

        scheduleRows.replaceChildren(fragment);
        scheduleStatus.hidden = true;
    } catch (error) {
        console.error("Unable to load the schedule from the published Google Sheet.", error);
        scheduleStatus.textContent = "The schedule couldn’t be loaded. Please check the published Google Sheet connection.";
        scheduleStatus.classList.add("isError");
    }
}

loadSchedule();
