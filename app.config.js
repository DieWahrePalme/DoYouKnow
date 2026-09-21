// app.json holds the static config. This file only adds one thing on top:
// when building for GitHub Pages, the app is served from a subpath
// (https://<user>.github.io/<repo>/) instead of a domain root, so every
// asset/route reference needs that prefix. The GitHub Actions workflow sets
// GH_PAGES_BASE_PATH before running `expo export`; every other build
// (local dev, the Claude Artifact export) leaves it unset and behaves
// exactly as before.
module.exports = ({ config }) => {
  const basePath = process.env.GH_PAGES_BASE_PATH;
  if (basePath) {
    config.experiments = {
      ...config.experiments,
      baseUrl: basePath,
    };
  }
  return config;
};
