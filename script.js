const puppeteer = require("puppeteer");
const fs = require("fs");

function writeJSONToFile(obj) {
  const json = JSON.stringify(obj);
  fs.writeFile(`profiles/${obj.login.username}.json`, json, "utf8", (error) => {
    if (error) {
      console.error(error);
    } else {
      console.log("JSON file has been saved.");
    }
  });
}

function getPhoneNumber(country) {
  const phoneList = fs.readFileSync("phones.json", "utf8");
  return JSON.parse(phoneList)[0].Number;
}

async function generateFakeIdentity() {
  const response = await fetch("https://randomuser.me/api/");
  const data = await response.json();
  let profile = data.results[0];

  // Get working phone number
  let phoneNumber = getPhoneNumber();
  profile = { ...profile, phoneNumber: phoneNumber };

  // Generate password to the services standards
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const length = 12;
  let password = "";

  for (let i = 0; i < length; i++) {
    password += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  profile = { ...profile, password: password };

  return profile;
}

async function createGmailAccount(identity, password) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to the Gmail signup page
    await page.goto("https://accounts.google.com/signup");

    // Fill out the form
    await page.type("#firstName", identity.name.first);
    await page.type("#lastName", identity.name.last);
    await page.type("#username", identity.login.username);
    await page.type("#passwd input", identity.password);
    await page.type("#confirm-passwd input", identity.password);

    // Submit the form
    await page.click("#accountDetailsNext button");

    // Wait for the account to be created
    await page.waitForNavigation();

    // Fill out phone number
    await page.type("#phoneNumberId", identity.phoneNumber);

    // Submit the form
    await page.click("button");

    // Wait for the account to be created
    await page.waitForNavigation();

    // Fill out phone number
    await page.type("#code", "388484");
  } finally {
    // Close the browser
    await browser.close();
  }
}

(async () => {
  const fakeIdentity = await generateFakeIdentity();

  writeJSONToFile(fakeIdentity);

  console.log(fakeIdentity);

  await createGmailAccount(fakeIdentity);
})();
