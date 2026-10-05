export const RETURN_DESTINATIONS = Object.freeze({
  website: Object.freeze({
    url: "https://www.journeythroughlifeministries.net/",
    label: "Return to Journey Through Life Ministries",
    title: "Continue with Journey Through Life Ministries",
    message: "Return to the ministry website for biblical teaching, resources, and more ways to stay connected."
  }),
  skool: Object.freeze({
    url: "https://www.skool.com/journey-through-life-min-4188/about",
    label: "Return to Journey In His Word Community",
    title: "Continue inside the Journey In His Word Community",
    message: "Return to Skool for community, coaching, and the next step in your journey."
  })
});

export function resolveReturnSource(search = "", referrer = "") {
  const params = new URLSearchParams(search);
  const requestedSource = params.get("from") || params.get("source");

  if (requestedSource && Object.hasOwn(RETURN_DESTINATIONS, requestedSource)) {
    return requestedSource;
  }

  const referringPage = referrer.toLowerCase();
  if (referringPage.includes("skool.com")) return "skool";
  if (
    referringPage.includes("journeythroughlifeministries.net") ||
    referringPage.includes("journeythroughlifeministries.com") ||
    referringPage.includes("journeythroughlifeministries.wordpress.com")
  ) {
    return "website";
  }

  return "website";
}
