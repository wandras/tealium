/**
 * Check Tealium scripts inclusion; code conceived to ease frontend developers check
 */

const requiredScripts = {
    'utag.js': 0,
    'utag.sync.js': 0
};

document
    .querySelectorAll('script[src*="tags.tiqcdn.com"]')
    .forEach(script => {
        try {
            const url = new URL(script.src);
            const fileName = url.pathname.split('/').pop();

            if (fileName in requiredScripts) {
                requiredScripts[fileName]++;

                console.log(`FOUND → ${fileName}`, script);

                if (requiredScripts[fileName] > 1) {
                    console.warn(
                        `DUPLICATE → ${fileName} found ${requiredScripts[fileName]} times`
                    );
                }
            }
        } catch (e) {
            console.warn('Invalid script URL:', script.src);
        }
    });

Object.entries(requiredScripts).forEach(([fileName, count]) => {
    if (count === 0) {
        console.warn(`MISSING → ${fileName}`);
    }
});

