const { Page, expect } = require('@playwright/test');

class BasePage {
  constructor(page, path) {
    this.page = page;
    this.path = path;
    this.baseURL = 'http://127.0.0.1:8888';
  }

  async open() {
    await this.page.goto(this.baseURL + this.path, { waitUntil: 'networkidle' });
  }
}

class HomePage extends BasePage {
  constructor(page) {
    super(page, '/index.html');
  }

  get navLinks() {
    return this.page.locator('a[href$=".html"]');
  }
}

class GalleryPage extends BasePage {
  constructor(page) {
    super(page, '/gallery.html');
  }

  get images() {
    return this.page.locator('img');
  }
}

class Tour3DPage extends BasePage {
  constructor(page) {
    super(page, '/tour3d.html');
  }

  get canvas() {
    return this.page.locator('#tour-canvas');
  }
}

class AboutPage extends BasePage {
  constructor(page) {
    super(page, '/about.html');
  }
}

class ContactPage extends BasePage {
  constructor(page) {
    super(page, '/contact.html');
  }
}

module.exports = {
  HomePage,
  GalleryPage,
  Tour3DPage,
  AboutPage,
  ContactPage,
};
