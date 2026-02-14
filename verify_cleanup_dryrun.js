
const fs = require('fs');

async function run() {
    let output = "";
    const log = (msg) => {
        console.log(msg);
        output += msg + "\n";
    };

    try {
        log("Calling Cleanup API (Dry Run)...");
        const response = await fetch('http://localhost:3000/api/admin/cleanup-photos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ retentionMonths: 100 })
        });

        if (!response.ok) {
            log(`Status: ${response.status} ${response.statusText}`);
            const text = await response.text();
            log("Response: " + text);
        } else {
            const result = await response.json();
            log("Success! Result: " + JSON.stringify(result, null, 2));
        }
    } catch (e) {
        log("Error: " + e.message);
    }

    fs.writeFileSync('dryrun_log.txt', output, 'utf8');
}
run();
