const DEMO_VIDEO_ASSET = {
  originalName: "demo-campaign.mp4",
  storedName: "demo-campaign-placeholder.mp4",
  mimeType: "video/mp4",
  size: 2048000,
  kind: "video",
  relativePath: "campaigns/demo/demo-campaign-placeholder.mp4",
  publicUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  source: "upload",
  sourceUrl: null,
};

const buildDemoMediaAssets = (index = 0) => [
  {
    ...DEMO_VIDEO_ASSET,
    storedName: `demo-campaign-placeholder-${index + 1}.mp4`,
    originalName: `demo-campaign-${index + 1}.mp4`,
  },
];

module.exports = { DEMO_VIDEO_ASSET, buildDemoMediaAssets };
