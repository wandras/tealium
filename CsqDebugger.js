(function () {
    /**
     * Just a tiny function to log ContentSquare event network requests,
     * as the CSQ tag assistant is not very precise
     */
    const entries = performance.getEntriesByType('resource');

    entries
        .filter(e => e.name.includes('/events?'))
        .forEach(e => {
            try {
                const url = new URL(e.name);
                const cvarp = url.searchParams.get('cvarp');

                if (!cvarp) {
                    return;
                }
                
                const parsed = JSON.parse(decodeURIComponent(cvarp));
                const vars = Object.values(parsed);
                const eventName = vars.find(v => v[0] === 'cs_event_name');

                console.log({
                    event: eventName ? eventName[1] : 'N/A',
                    vars
                });

            } catch (err) {
                console.warn(err);
            }
        });
})();
