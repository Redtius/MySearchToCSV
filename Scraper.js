'use strict';
const puppeteer = require('puppeteer');
const fs = require('fs');
const { url } = require('inspector');



// this a Scraper you give it a link in Amazon and it scrapes all the products in it
class Scraper {
  constructor(browser, url) {
    this.url = url;
    this.browser = browser;
  }
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async openPage() {
    {
      this.page = await this.browser.newPage();
      await this.page.goto(this.url);

    }
  }

  async scrapeData() {
    try {
      //let isDisabled = await this.page.$('span.s-pagination-item.s-pagination-next.s-pagination-disabled') === null;
      const productHandles = await this.page.$$('div.s-result-item');
      //while (isDisabled) {
      //await delay(2000)
      //isDisabled = await page.$('span.s-pagination-item.s-pagination-next.s-pagination-disabled') === null;
      for (const productHandle of productHandles) {
        let item = {};
        // price Extraction
        try {
          const price = await this.page.evaluate(el => el.querySelector('span.a-price > span.a-offscreen').textContent, productHandle);
          item.price = price;
        }
        catch (error) { }


        //Image Extraction
        try {
          const Image = await this.page.evaluate(el => el.querySelector(' div.s-product-image-container > span > a > div > img').getAttribute('src'), productHandle);
          item.image = Image;
        }
        catch (error) { }
        //Product Name
        try {
          let ProductName = await this.page.evaluate(el => el.querySelector(' div > div > h2').textContent, productHandle);
          item.name = ProductName.replace(/[\n,"']/g, " ");
        }
        catch (error) { }

        if (item.name !== null) {
          fs.appendFile('products.csv', `${item.name},${item.price},${item.image}\n`, (err) => {
            if (err) throw err;
          })
        }

      }

      /*if (isDisabled) {
        await page.waitForSelector('a.s-pagination-item.s-pagination-next.s-pagination-button.s-pagination-separator', { visible: true });
        await page.click("a.s-pagination-item.s-pagination-next.s-pagination-button.s-pagination-separator");
      }
      else {
        break;
      }*/
    }
    catch (error) {
      console.log(error)
    }
  }


  async closePage() {
    await this.page.close();
  }
}

class ProductScraper{
  constructor(page){
    this.page=page;
    this.url=url;
  }
  async scrapeData(){
    // price
    try{
      const price = await this.page.evaluate(() => {
        const element = document.querySelector('span.a-price > span.a-offscreen');
        return element ? element.textContent : null;
      });
      console.log(price);
    }
    catch(error){}
    //image
    try{
      const image = await this.page.evaluate(() => {
        const element = document.querySelector('#landingImage');
        return element ? element.getAttribute('src') : null;
      });
      console.log(image);
    }
    catch(error){}
    //name

    //Launch Date

    //BSR (best seller ranking)

    //number of reviews

    //rating

    //Amazon's Choice

    //how much was bought last month
    //category
    //to evaluate competition we will compare the number of search results to number of reviews and sales per month of the products their

    await this.previousPage();
  }
  async previousPage(){
    await this.page.goBack();
  } 
}
//

(async ()=>{
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    userDataDir: "./tmp",
  });
  
  const myScraper1 = new Scraper(browser,'https://www.amazon.com/Amazon-Essentials-14-Pack-Cotton-Heather/dp/B07JL9J8BK/ref=sr_1_1?qid=1690381611&refinements=p_n_feature_eighteen_browse-bin%3A16926165011&rnid=2528832011&s=fashion-boys-intl-ship&sr=1-1')
  await myScraper1.openPage();

  const myScraper = new ProductScraper(myScraper1.page,'https://www.amazon.com/Amazon-Essentials-14-Pack-Cotton-Heather/dp/B07JL9J8BK/ref=sr_1_1?qid=1690381611&refinements=p_n_feature_eighteen_browse-bin%3A16926165011&rnid=2528832011&s=fashion-boys-intl-ship&sr=1-1')

  await myScraper.scrapeData();
  //await myScraper.openPage();
  //await myScraper.scrapeData();
  //await myScraper.closePage();
  
  await browser.close();
})();
