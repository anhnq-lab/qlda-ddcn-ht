import { PdfReader } from "pdfreader";
import fs from "fs";

const filePath = process.argv[2];
const reader = new PdfReader();

let text = "";

reader.parseFileItems(filePath, (err, item) => {
  if (err) {
    console.error("error:", err);
  } else if (!item) {
    fs.writeFileSync("ks/temp_pdf.txt", text, "utf8");
    console.log("Done extracting.");
  } else if (item.text) {
    text += item.text + " ";
  }
});
