const puppeteer = require("puppeteer");
const exceljs = require("exceljs");
const fs = require("fs");
const readline = require("readline");
const { stdin } = require("process");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

async function scrape(amountToScrape = 5) {
    const browser = await puppeteer.launch({});
    const page = await browser.newPage();

    let data = [];
    const start = 2400;
    const articlesPerPage = 5;
    const titleRegex = /(\d{1,2}\.\d{1,2}\.\s?\d{1,4})[\.\s-:]+(.*)/;
    const dateRegex = /(\d{1,2})\.(\d{1,2})\.\s?(\d{1,4})/;
    const zeroPrefix = (a) => {
        return `0${a}`;
    }
    try {
        for (let j = start / articlesPerPage; j <= (start / articlesPerPage) + (amountToScrape / articlesPerPage); j++) {
            const url = `https://european-retail-academy.org/index.php?start=${j * 5}`;
            console.log(`Scraping: ${url}`);
            await page.goto(url);
            for (let i = 1; i <= articlesPerPage; i++) {
                try {
                    let el = await page.$(`body > table:nth-child(1) > tbody > tr > td > table > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr:nth-child(${i}) > td > b`);
                    let title;
                    try {
                        title = await el.evaluate(e => e.textContent);
                    } catch (err) {
                        try {
                            el = await page.$(`body > table:nth-child(1) > tbody > tr > td > table > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr:nth-child(${i}) > td > p:nth-child(1) > b`);
                            title = await el.evaluate(e => e.textContent);
                        } catch (err) {
                            el = await page.$(`body > table:nth-child(1) > tbody > tr > td > table > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > b`);
                            title = await e.evaluate(e => e.textContent);
                        }
                    }
                    const match = title.match(titleRegex);

                    const dateMatch = match[1].match(dateRegex);
                    function checkLength(a) {
                        if (a.length < 2) {
                            return `0${a}`;
                        }
                        return a;
                    }
                    match[1] = `${checkLength(dateMatch[1])}.${checkLength(dateMatch[2])}.${dateMatch[3]}`

                    data.push({
                        date: match[1].replace(" ", "").replace(/\./g, "/"),
                        title: match[2],
                        post: i,
                        url: url
                    })

                } catch (err) {
                    data.push({ date: '0/0/0', title: `Failed to parse`, url, post: i })
                }
            }
            // console.log(data)
        }

        await browser.close();
    } catch (err) {
        console.error(err);
    }

    let workbook = new exceljs.Workbook();
    let worksheet = workbook.addWorksheet("Articles");
    worksheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Title', key: 'title', width: 35 },
        { header: 'Post', key: 'post', width: 5 },
        { header: 'URL', key: 'url', width: 50 },
    ]

    worksheet.getRow(1).font = { bold: true }
    console.log("Sorting...");

    data.forEach((d) => {
        worksheet.addRow(d);
    })

    fs.writeFile("cache.json", JSON.stringify(data), () => console.log("Data cached"));

    workbook.xlsx.writeFile("sites.xlsx");
    console.log("Done!")
}

const getAmountToScrape = async () => {
    let amount;
    const result = new Promise(resolve => {
        rl.question("How many articles would you like to scrape: ", resolve); 
    })
    do {
        amonut = Number.parseInt(await result);
    } while (amount == null)
    return amount;
}

(async () => {   
    scrape(await getAmountToScrape());
})()