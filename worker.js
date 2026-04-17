export default {
  async fetch(request, env) {
    return new Response(
      JSON.stringify({
        assets: !!env.ASSETS,
        kv: !!env.TEMPLATES
      }),
      { headers: { "content-type": "application/json" } }
    );
  }
};