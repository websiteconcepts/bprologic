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

    return new Response(header || "HEADER NOT FOUND", {
      headers: { "content-type": "text/html" }
    });
    
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