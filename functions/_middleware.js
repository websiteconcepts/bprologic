export async function onRequest(context) {
  const { env } = context;

  try {
    const header = await env.TEMPLATES.get("header");

    return new Response(
      header ? "KV WORKING" : "KV EMPTY",
      { status: 200 }
    );
  } catch (e) {
    return new Response(
      "KV ERROR: " + e.message,
      { status: 500 }
    );
  }
}