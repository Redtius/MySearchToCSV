"use strict";
const puppeteer = require("puppeteer");
const fs = require("fs");
const { URLSearchParams } = require("url");

function extractActualLink(encodedUrl) {
  // Step 1: Find the start and end positions of the encoded part
  const startPos = encodedUrl.indexOf('/dp/') + 4;
  const endPos = encodedUrl.indexOf('/ref=');

  // Step 2: Extract the encoded part
  const encodedPart = encodedUrl.slice(startPos, endPos);

  // Step 3: Reconstruct the original URL
  const originalUrl = `https://www.amazon.com/dp/${encodedPart}${encodedUrl.slice(endPos)}`;

  return originalUrl;
}
// this a Scraper you give it a link in Amazon and it scrapes all the products in it
class Scraper {
  constructor(browser, url) {
    this.url = url;
    this.browser = browser;
    this.dataFile = new CsvFile(
      'Prod',
      "Name,Last Month Sales,Price,Image,Number Of Reviews,Rating,Launch Date,Best Seller Rank,Category,Brand\n"
    );
  }
  async openPage() {
      this.page = await this.browser.newPage();
      await this.page.goto(this.url);
  }

  async openAnotherPage(url) {
        const deUrl=extractActualLink(url);
        const page = await this.browser.newPage();
        await page.goto(deUrl);
  
        return page;
  }

  async scrapeData() {
    try {
      let isDisabled =
        (await this.page.$(
          "span.s-pagination-item.s-pagination-next.s-pagination-disabled"
        )) === null;
      while (isDisabled) {
        const productHandles = await this.page.$$("div.s-result-item");
        isDisabled =
          (await this.page.$(
            "span.s-pagination-item.s-pagination-next.s-pagination-disabled"
          )) === null;
          for (let i = 0;i<productHandles.length;i++) {
            const productHandle=productHandles[i];
            let item = {};
          //Image Extraction
          try {
            const Image = await this.page.evaluate(
              (el) =>
                el
                  .querySelector(
                    '.s-image'
                  )
                  .getAttribute("src"),
              productHandle
            );
            item.Image=Image;
          } catch (error) {
            item.Image='Unknown';
          }
          // Last Month Sales
          try {
            const lms = await this.page.evaluate(
              (el) =>
                el
                  .querySelector(
                    'div:nth-child(9) > div > div > div > div > div.a-section.a-spacing-small.puis-padding-left-small.puis-padding-right-small > div:nth-child(2) > div.a-row.a-size-base > span'
                  )
                  .getAttribute("src"),
              productHandle
            );
            item.lms=lms?lms.textContent:'Undetermined';
            console.log(lms);
          } catch (error) {
            item.lms='Undetermined';
          }
          
          try {
            const link = await this.page.evaluate(
              (el) =>el.querySelector(
                    '.a-link-normal.s-underline-text.s-underline-link-text.s-link-style.a-text-normal'
                  )
                  .getAttribute("href"),
              productHandle
            );
            const page = await this.openAnotherPage(link);
            const pageScraper = new ProductScraper(page, this.dataFile);
            const details = await pageScraper.scrapeProduct(); // it will automatically come back to the page
            item.details = details;
            this.dataFile.write(item);
            //this.dataFile.Write(Image, true);
          } catch (error) {
            //this.dataFile.Write('Not Found', true);
          }
        }
        if (isDisabled) {
          await this.page.waitForSelector(
            "a.s-pagination-item.s-pagination-next.s-pagination-button.s-pagination-separator",
            { visible: true }
          );
          await this.page.click(
            "a.s-pagination-item.s-pagination-next.s-pagination-button.s-pagination-separator"
          );
        } else {
          break;
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  async closePage() {
    await this.page.close();
  }
}

//<-------------Product Scraper--------------->
class ProductScraper {
  constructor(page, dataFile) {
    this.page = page;
    this.dataFile = dataFile;
  }
  async scrapeProduct() {
    let details = {};
    // price
    try {
      const price = await this.page.evaluate(() => {
        const element = document.querySelector(
          "span.a-price > span.a-offscreen"
        );
        return element ? element.textContent : 'Unknown';
      });
      details.price=price;
    } catch (error) {
      details.price='Unknown';
    }
    try {
      let nameTemp = await this.page.evaluate(() => {
        const element = document.querySelector("#productTitle");
        return element ? element.textContent : 'Unknown';
      });
      const name = nameTemp.replace(/[\n,"']/g, " ").trim();
      details.name=name;
    } catch (error) {
      details.name='Unknown';
    }
    // Number Of Reviews
    try {
      let ratingsTemp = await this.page.evaluate(() => {
        const element = document.querySelector("#acrCustomerReviewText");
        return element ? element.textContent : 'Unknown';
      });
      const ratings = parseInt(ratingsTemp.replace(/[,]/g, ""));
      details.ratings = ratings;
    } catch (error) {
      details.ratings = 'Unknown'
    }
    // Rating
    try {
      const rating = parseFloat(
        await this.page.evaluate(() => {
          const element = document.querySelector(
            "#acrPopover > span.a-declarative > a > span"
          );
          return element ? element.textContent : 'Unknown';
        })
      );
      details.rating=rating;
    } catch (error) {
      details.rating='unknown';
    }
    //Launch Date
    try {
      const launchDate = await this.page.evaluate(() => {
        const element = document.querySelector(
          "#detailBullets_feature_div .detail-bullet-list"
        );
        let launchDate = "Not Found";
        if (!element) return null;
        const listItems = element.querySelectorAll("li");
        listItems.forEach((item) => {
          const text = item.textContent.trim();
          if (text.includes("Date First Available")) {
            launchDate = text
              .slice(27)
              .replace(/[,]/g, "-")
              .replace(/[ :\n]/g, "")
              .trim();
          }
        });
        return launchDate;
      });
      details.launchDate=launchDate;
    } catch (error) {
      details.launchDate='Unknown';
    }
    //BSR (best seller ranking)
    try {
      const bsr = await this.page.evaluate(() => {
        const element = document.querySelector(
          "#detailBulletsWrapper_feature_div > ul:nth-child(4) > li > span"
        );
        return element ? element.textContent.slice(27).replace(/[,]/g, "").trim() : 'Unknown';
      });
      details.bsr=bsr;
    } catch (error) {
      details.bsr='Unknown';
    }
    //category
    try {
      const category = await this.page.evaluate(() => {
        const element = document.querySelector(
          "#wayfinding-breadcrumbs_container"
        );
        return element
          ? element.textContent.replace(/[\n, ]/g, "").trim()
          : 'Unknown';
      });
      details.category=category;
    } catch (error) {
      details.category="Unknown";
    }
    //Brand
    try {
      let brandString = await this.page.evaluate(() => {
        const element = document.querySelector("#bylineInfo");
        return element ? element.textContent.replace(/[,]/g, "").trim() : 'Unknown';
      });
      const brand =
        brandString.slice(0, 1) === "V"
          ? brandString.slice(10)
          : brandString.slice(7);

      details.brand=brand;
    } catch (error) {
      details.brand="Unknown";
    }
    await this.page.close();
    return details;
  }
  async previousPage() {
    await this.page.goBack();

    await this.page.waitForNavigation();
  }
}
//<------------------------------------------->

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    userDataDir: "./tmp",
  });

  const myScraper = new Scraper(
    browser,
    "https://www.amazon.com/s?k=pencils&crid=387L6G5X6B9PL&sprefix=%2Caps%2C2158&ref=nb_sb_ss_sx-trend-t-ps-d_12_0"
  );
  await myScraper.openPage();
  await myScraper.scrapeData();

  await browser.close();
})();

//---------->CSV Writer<--------------

class CsvFile {
  constructor(fileName, columns) {
    this.fileName = `${fileName}.csv`;
    this.creationDate = new Date();
    fs.writeFile(this.fileName, columns, "utf-8", (err) => {
      if (err) {
        console.error("Failed to Create CSV :", err);
      }
    });
  }

  write(item) {
    if (item.details.name !== 'Unknown') {
      //Name,Last Month Sales,Price,Image,Number Of Reviews,Rating,Launch Date,Best Seller Rank,Category,Brand\n
      console.log("Scraped!");
      fs.appendFile(this.fileName, `${item.details.name},${item.lms},${item.details.price},${item.Image},${item.details.ratings},${item.details.rating},${item.details.launchDate},${item.details.bsr},${item.details.category},${item.details.brand}\n`, (err) => {
        if (err) throw err;
      });
    }
  }
}
