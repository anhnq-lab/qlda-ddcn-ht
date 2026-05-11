import fetch from 'node-fetch';

async function run() {
    try {
        console.log('Fetching AWS IP ranges...');
        const response = await fetch('https://ip-ranges.amazonaws.com/ip-ranges.json');
        const data = await response.json() as any;

        console.log('Searching for prefixes containing "2406:da12"...');
        for (const prefixObj of data.ipv6_prefixes) {
            const prefix = prefixObj.ipv6_prefix;
            if (prefix.toLowerCase().includes('2406:da12')) {
                console.log(`Prefix: ${prefix}, Region: ${prefixObj.region}, Service: ${prefixObj.service}`);
            }
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

run();
