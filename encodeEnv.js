/* eslint-disable @typescript-eslint/no-var-requires */
// encodeEnv.js
const fs = require('fs');
const path = require('path');

const encodeFileToBase64 = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, { encoding: 'utf-8' });
        const encodedData = Buffer.from(data).toString('base64');
        return encodedData;
    } catch (error) {
        console.error('Error encoding file:', error);
        return null;
    }
};

const encodedEnv = encodeFileToBase64(path.resolve(__dirname, '.env'));
if (encodedEnv) console.log(encodedEnv);
