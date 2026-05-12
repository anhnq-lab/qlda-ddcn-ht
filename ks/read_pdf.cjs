const fs = require('fs');
const pdf = require('pdf-parse');

const filePath = process.argv[2];
const dataBuffer = fs.readFileSync(filePath);

pdf(dataBuffer).then(function(data) {
    console.log(data.text);
}).catch(err => {
    console.error(err);
});
