
/**
 * Check Tealium scripts inclusion and loader placement.
 */

const requiredScripts = {
    'utag.sync.js': 0,
    'utag.js loader': 0
};

const successStyle = 'color: #2a7; font-weight: bold;';
const errorStyle = 'color: #f05; font-weight: bold;';
const defaultStyle = '';

const isTealiumUrl = (src, fileName) => {
    try {
        const url = new URL(src, document.baseURI);

        return url.hostname === 'tags.tiqcdn.com'
            && url.pathname.split('/').pop() === fileName;
    } catch (e) {
        return false;
    }
};

document.querySelectorAll('script').forEach(script => {
    const isSyncScript = script.src
        && isTealiumUrl(script.src, 'utag.sync.js');

    const inlineCode = script.src ? '' : script.textContent;

    const isAsyncLoader = !script.src
        && /tags\.tiqcdn\.com\/utag\/[^'"\s]+\/utag\.js/.test(inlineCode)
        && /createElement\s*\(/.test(inlineCode)
        && /insertBefore\s*\(/.test(inlineCode);

    if (!isSyncScript && !isAsyncLoader) {
        return;
    }

    const fileName = isSyncScript ? 'utag.sync.js' : 'utag.js loader';
    requiredScripts[fileName]++;

    const parent = script.parentElement;
    const parentName = ['HEAD', 'BODY'].includes(parent?.tagName)
        ? parent.tagName
        : 'other';

    const nodePosition = parent
        ? Array.from(parent.children).indexOf(script) + 1
        : 0;

    const totalChildNodes = parent?.children.length || 0;

    const isCorrectParent = isSyncScript
        ? parentName === 'HEAD'
        : parentName === 'BODY';

    const isCorrectPosition = isSyncScript
        ? nodePosition === totalChildNodes
        : nodePosition === 1;

    const output = `%cFOUND → ${fileName}%c\nParent: %c${parentName}%c\nPosition: %c${nodePosition} / ${totalChildNodes}%c`;

    console.log(
        output,
        successStyle,
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
});

Object.entries(requiredScripts).forEach(([fileName, count]) => {
    if (count === 0) {
        console.log('%cMISSING → ' + fileName, errorStyle);
    }
});

// Check dynamically loaded utag.js without enforcing DOM placement.
const loadedUtag = Array.from(document.scripts).filter(script =>
    script.src && isTealiumUrl(script.src, 'utag.js')
);

if (loadedUtag.length > 0) {
    console.log(
        '%cLOADED → utag.js (dynamic)',
        successStyle,
        loadedUtag
    );
} else {
    console.log(
        '%cNOT FOUND → utag.js (dynamic)',
        errorStyle
    );
}
