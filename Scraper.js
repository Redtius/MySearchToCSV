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
      let isDisabled =
        (await this.page.$(
          "span.s-pagination-item.s-pagination-next.s-pagination-disabled"
        )) === null;
      const productHandles = await this.page.$$("div.s-result-item");
      const dataFile = new CsvFile(Products,'Image,Last Month Sales,')
      while (isDisabled) {
        //await delay(2000)
        isDisabled =
          (await page.$(
            "span.s-pagination-item.s-pagination-next.s-pagination-disabled"
          )) === null;
        for (const productHandle of productHandles) {
          let item = {};
          //Image Extraction
          try {
            const Image = await this.page.evaluate(
              (el) =>
                el
                  .querySelector(
                    " div.s-product-image-container > span > a > div > img"
                  )
                  .getAttribute("src"),
              productHandle
            );
            dataFile.Write(Image,true);
          } catch (error) {}
          // Last Month Sales
          try {
            //const
          } catch (error) {}

          await this.page.click(
            "a-link-normal s-underline-text s-underline-link-text s-link-style a-text-normal"
          );
          pageScraper = new ProductScraper(this.page);
          await pageScraper.scrapeProduct(); // it will automatically comeback to the page
        }

        if (isDisabled) {
          await page.waitForSelector(
            "a.s-pagination-item.s-pagination-next.s-pagination-button.s-pagination-separator",
            { visible: true }
          );
          await page.click(
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
class ProductScraper{
  constructor(page){
    this.page=page;
  }
  async scrapeProduct(){
    // price
    try{
      const price = await this.page.evaluate(() => {
        const element = document.querySelector('span.a-price > span.a-offscreen');
        return element ? element.textContent : 'Not found';
      });
      console.log(price);
    }
    catch(error){}
    //image
    try{
      const image = await this.page.evaluate(() => {
        const element = document.querySelector('#landingImage');
        return element ? element.getAttribute('src') : 'Not found';
      });
      console.log(image);
    }
    catch(error){}
    //name
    try{
      let nameTemp = await this.page.evaluate(() => {
        const element = document.querySelector('#productTitle');
        return element ? element.textContent : 'Not found';
      });
      const name = nameTemp.ProductName.replace(/[\n,"']/g, " ").trim();
      console.log(name);
    }
    catch(error){}
    // Number Of Reviews
    try{
      let ratingsTemp = await this.page.evaluate(() => {
        const element = document.querySelector('#acrCustomerReviewText');
        return element ? element.textContent : 'Not found';
      })
      const ratings = parseInt(ratingsTemp.replace(/[,]/g, ""));
      console.log(ratings);
    }
    catch(error){
      console.log('error');
    }
    // Rating
    try{
      const rating = parseFloat(await this.page.evaluate(() => {
        const element = document.querySelector('#acrPopover > span.a-declarative > a > span');
        return element ? element.textContent : 'Not found';
      }));
      console.log(rating);
    }
    catch(error){
      console.log('error');
    }
    //Launch Date
    try{
      const launchDate = await this.page.evaluate(() => {
        const element = document.querySelector('#detailBullets_feature_div .detail-bullet-list');
        let launchDate = 'Not Found';
        if (!element) return null;
        const listItems = element.querySelectorAll('li');
        listItems.forEach((item)=>{
          const text = item.textContent.trim();
          if(text.includes('Date First Available')){
            launchDate = text.slice(27).replace(/[,]/g, "-").replace(/[ :\n]/g,"").trim();
          }
        });
        return launchDate;
      });
      console.log(launchDate);
    }
    catch(error){
      console.log(error);
    }
    //BSR (best seller ranking)
    try{
      const bsr = await this.page.evaluate(() => {
        const element = document.querySelector('#detailBulletsWrapper_feature_div > ul:nth-child(4) > li > span');
        return element ? element.textContent.slice(27).trim() : 'Not found';
      })
      console.log(bsr);
    }
    catch(error){
      console.log('error');
    }
    //category 
    try{
      const category = await this.page.evaluate(() => {
        const element = document.querySelector('#wayfinding-breadcrumbs_container');
        return element ? element.textContent.replace(/[\n, ]/g, "").trim() : 'Not found';
      })
      console.log(category);
    }
    catch(error){
      console.log('error');
    }
    //Brand
    try{
      let brandString = await this.page.evaluate(() => {
        const element = document.querySelector('#bylineInfo');
        return element ? element.textContent.trim() : 'Not found';
      });
      const brand = brandString.slice(0,1) === "V"? brandString.slice(10) : brandString.slice(7);
      
      console.log(brand);
    }
    catch(error){
      console.log('error');
    }
    await this.previousPage();
  }
  async previousPage(){
    await this.page.goBack();
  } 
}
//<------------------------------------------->

(async ()=>{
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: false,
    userDataDir: "./tmp",
  });
  
  const myScraper= new Scraper(browser,'https://www.amazon.com/dp/B097CV6KBQ/ref=syn_sd_onsite_desktop_0?ie=UTF8&psc=1&pf_rd_p=78171839-c733-4857-996f-d6b4a32913ec&pf_rd_r=WHRGY40SKS4JYMYA3J38&pd_rd_wg=lGSbe&pd_rd_w=40dhA&pd_rd_r=a72675a9-60df-454e-ba2f-b14ec5bde4b8')
  await myScraper.openPage();
  await myScraper.scrapeData();
  await myScraper.closePage();
  
  await browser.close();
})();


//---------->CSV Writer<--------------

class CsvFile{
  constructor(fileName,columns){
    this.fileName=`${fileName}.csv`;
    this.creationDate=new Date();
    fs.writeFile(this.fileName,columns,'utf-8',(err)=>{
      if(err){
        console.error('Failed to Create CSV :',err);
      }
    });

  }

  Write(content,isNewLine){
    if(!isNewLine){
      fs.appendFile('products.csv', `,${content}`, (err) => {
        if (err) throw err;
      })
    }
    else{
      fs.appendFile('products.csv', `\n${content}`, (err) => {
        if (err) throw err;
      })
    }
  }

}