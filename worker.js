export default {
  async fetch(request, env) {
    // Serve static files
    let response = await env.ASSETS.fetch(request);

    // Only modify HTML
    if (!response.headers.get("content-type")?.includes("text/html")) {
      return response;
    }

    // Get header/footer from KV
    const header = await env.TEMPLATES.get("header");
    const footer = await env.TEMPLATES.get("footer");

    // Inject into HTML
    return new HTMLRewriter()
      .on('#header', {
        element(el) {
          el.setInnerContent(header || '', { html: true });
        }
      })
      .on('#footer', {
        element(el) {
          el.setInnerContent(footer || '', { html: true });
        }
      })
      .transform(response);
  }
};