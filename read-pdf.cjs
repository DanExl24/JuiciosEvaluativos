const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('guides/1.Proyecto Formativo ADSO - 2480542.pdf');

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('pdf-content.txt', data.text);
    console.log("Done");
}).catch(console.error);
