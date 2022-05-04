const fs = require("fs");
const Excel = require("exceljs");

if (!fs.readdirSync(".").includes("cache.json")) {
    throw new Error("No cache.json file found!")
}

let workbook = new Excel.Workbook();
let worksheet = workbook.addWorksheet("Articles");
worksheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Title', key: 'title', width: 35 },
    { header: 'Post', key: 'post', width: 5 },
    { header: 'URL', key: 'url', width: 50 },
]

worksheet.getRow(1).font = { bold: true }

const data = JSON.parse(fs.readFileSync("./cache.json"));
data.forEach(d => {
    worksheet.addRow(d);
})

workbook.xlsx.writeFile("from-cache.xlsx");
