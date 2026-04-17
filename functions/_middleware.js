export async function onRequest(context) {
  const { request, env, next } = context;

  let response = await next();

  if (!response.headers.get("content-type")?.includes("text/html")) {
    return response;
  }

  const header = await env.TEMPLATES.get("header");

  return new Response(header || "KV NOT WORKING");
  
  const footer = await env.TEMPLATES.get("footer");

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