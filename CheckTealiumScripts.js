/**
 * Check Tealium scripts inclusion; code conceived to ease frontend developers check
 */

const requiredScripts = {
    'utag.js': 0,
    'utag.sync.js': 0
};

const successStyle = 'color: #2a7; font-weight: bold;';
const errorStyle = 'color: #f05; font-weight: bold;';
const defaultStyle = '';

document
    .querySelectorAll('script[src*="tags.tiqcdn.com"]')
    .forEach(script => {
        try {
            const url = new URL(script.src);
            const fileName = url.pathname.split('/').pop();

            if (fileName in requiredScripts) {
                requiredScripts[fileName]++;

                const parent = script.parentElement;
                const parentName = parent?.tagName === 'HEAD' || parent?.tagName === 'BODY' ? parent.tagName : 'other';
                const nodePosition = parent ? Array.from(parent.children).indexOf(script) + 1 : 0;
                const totalChildNodes = parent?.children.length || 0;

                const isFound = true;
                const isCorrectParent = fileName === 'utag.sync.js' ? parentName === 'HEAD' : parentName === 'BODY';
                const isCorrectPosition = fileName === 'utag.sync.js' ? nodePosition === totalChildNodes : nodePosition === 1;

                const output = `%cFOUND → ${fileName}%c\nParent: %c${parentName}%c\nPosition: %c${nodePosition} / ${totalChildNodes}%c`;

                console.log(
                    output,
                    isFound ? successStyle : errorStyle,
                    defaultStyle,
                    isCorrectParent ? successStyle : errorStyle,
                    defaultStyle,
                    isCorrectPosition ? successStyle : errorStyle,
                    defaultStyle,
                    script
                );

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
    const isFound = count > 0;

    if (!isFound) {
        console.log('%cMISSING → ' + fileName, errorStyle);
    }
});
