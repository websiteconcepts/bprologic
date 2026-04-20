const MENU_HTML = `
<nav id="menu">
  <h2>Menu</h2>
  <ul>
    <li><a href="index.html">Home</a></li>
    <li><a href="about.html">About Us</a></li>
    <li><a href="services.html">Solutions</a></li>
    <li><a href="blog">Blog</a></li>
    <li><a href="contact.html">Contact Us</a></li>
  </ul>
</nav>
`;

class HtmlReplacer {
  constructor(html) {
    this.html = html;
  }
  element(element) {
    element.replace(this.html, { html: true });
  }
}

class HtmlAppender {
  constructor(html) {
    this.html = html;
  }
  element(element) {
    element.append(this.html, { html: true });
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Custom API routes that need KV go here
    // if (url.pathname.startsWith('/api/')) {
    //   const value = await env.TEMPLATES.get('some-key');
    //   return new Response(value, { headers: { 'content-type': 'application/json' } });
    // }

    // Fetch the static asset from the ASSETS binding (not fetch() which would loop)
    const response = await env.ASSETS.fetch(request);

    // Only transform HTML responses
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return response;
    }

    // Fetch all template parts from KV
    const [headerHtml, footerHtml, footerScripts, headAppend] = await Promise.all([
      env.TEMPLATES.get('header_content'),
      env.TEMPLATES.get('footer_content'),
      env.TEMPLATES.get('footer_scripts'),
      env.TEMPLATES.get('head_append')
    ]);

    // Combine KV header + menu
    const fullHeader = headerHtml ? headerHtml + MENU_HTML : null;

    // Build HTMLRewriter with available injections
    let rewriter = new HTMLRewriter();

    if (fullHeader) {
      rewriter = rewriter.on('div#header_content', new HtmlReplacer(fullHeader));
    }
    if (footerHtml) {
      rewriter = rewriter.on('div#footer_content', new HtmlReplacer(footerHtml));
    }
    if (footerScripts) {
      rewriter = rewriter.on('div#footer_scripts', new HtmlReplacer(footerScripts));
    }
    if (headAppend) {
      rewriter = rewriter.on('head', new HtmlAppender(headAppend));
    }

    return rewriter.transform(response);
  }
};
