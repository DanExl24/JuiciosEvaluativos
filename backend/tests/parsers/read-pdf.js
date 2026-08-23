import fs from 'fs/promises';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

async function run() {
  const data = await fs.readFile('guides/1.Proyecto Formativo ADSO - 2480542.pdf');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
  let fullText = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str).join(' ');
    fullText += text + '\n';
  }
  await fs.writeFile('pdf-content.txt', fullText);
}
run().catch(console.error);
