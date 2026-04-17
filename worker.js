const MENU_HTML = `
<nav id="menu">
  <h2>Menu</h2>
  <ul>
    <li><a href="index.html">Home</a></li>
    <li><a href="about.html">About Us</a></li>
    <li><a href="services.html">Solutions</a></li>
    <li><a href="contact.html">Contact Us</a></li>
  </ul>
</nav>
`;

class HeaderInjector {
  constructor(html) {
    this.html = html;
  }
  element(element) {
    element.replace(this.html, { html: true });
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

    // Fetch header from KV
    const headerHtml = await env.TEMPLATES.get('header');
    if (!headerHtml) {
      return response;
    }

    // Combine KV header + menu
    const fullHeader = headerHtml + MENU_HTML;

    // Use HTMLRewriter to inject into <div id="header"></div>
    return new HTMLRewriter()
      .on('div#header-slot', new HeaderInjector(fullHeader))
      .transform(response);
  }
};
