export default {
  fetch() {
    return new Response(
      "This preview has been removed because the pull request was closed.",
      {
        status: 410,
        headers: { "content-type": "text/plain; charset=utf-8" },
      },
    )
  },
}
