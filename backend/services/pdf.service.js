const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generateCampaignPdf = (campaign) => {
  return new Promise((resolve, reject) => {
    const reportsDir = path.join(
      __dirname,
      "../uploads/reports"
    );

    fs.mkdirSync(reportsDir, {
      recursive: true,
    });

    const fileName = `report-${campaign._id}.pdf`;
    const filePath = path.join(
      reportsDir,
      fileName
    );

    const doc = new PDFDocument({
      margin: 50,
    });

    const stream =
      fs.createWriteStream(filePath);

    doc.pipe(stream);
    const impressions =
      campaign.analytics?.impressions || 0;

    const clicks =
      campaign.analytics?.clicks || 0;

    const ctr =
      impressions > 0
        ? ((clicks / impressions) * 100).toFixed(2)
        : "0.00";

    const durationDays = Math.max(
      1,
      Math.ceil(
        (
          new Date(campaign.endDate) -
          new Date(campaign.startDate)
        ) /
          (1000 * 60 * 60 * 24)
      )
    );

    const locations =
      campaign.targeting.locations.length > 0
        ? campaign.targeting.locations.join(", ")
        : "N/A";
    // =========================
    // PAGE 1 - CERTIFICATE
    // =========================

    doc.fontSize(26);
    doc.text(
      "TECHLIGENCE PVT. LTD.",
      {
        align: "center",
      }
    );

    doc.moveDown();

    doc.fontSize(24);
    doc.text(
      "CERTIFICATE OF COMPLETION",
      {
        align: "center",
      }
    );

    doc.moveDown(4);

    doc.fontSize(16);

    doc.text(
      "This is to certify that the advertising campaign",
      {
        align: "center",
      }
    );

    doc.moveDown();

    doc.fontSize(22);
    doc.text(
      `"${campaign.title}"`,
      {
        align: "center",
      }
    );

    doc.moveDown();

    doc.fontSize(16);
    doc.text(
      `for ${campaign.brandName}`,
      {
        align: "center",
      }
    );

    doc.moveDown(2);

    doc.text(
      `has been successfully executed and completed from`,
      {
        align: "center",
      }
    );

    doc.text(
      `${new Date(
        campaign.startDate
      ).toDateString()} to ${new Date(
        campaign.endDate
      ).toDateString()}`,
      {
        align: "center",
      }
    );

    doc.moveDown(5);

    doc.text(
      "Issued By",
      {
        align: "center",
      }
    );

    doc.text(
      "Techligence Pvt. Ltd.",
      {
        align: "center",
      }
    );

    doc.moveDown();

    doc.text(
      `Generated On: ${new Date().toDateString()}`,
      {
        align: "center",
      }
    );

    // =========================
    // PAGE 2 - REPORT
    // =========================

    doc.addPage();

    doc.fontSize(24);
    doc.text(
      "CAMPAIGN PERFORMANCE REPORT",
      {
        align: "center",
      }
    );

    doc.moveDown(2);

    doc.fontSize(16);

    doc.text("Campaign Details");

    doc.moveDown();

    doc.fontSize(13);

    doc.text(
      `Campaign Name : ${campaign.title}`
    );

    doc.text(
      `Brand Name : ${campaign.brandName}`
    );

    doc.text(
      `Campaign Duration : ${
        new Date(
          campaign.startDate
        ).toDateString()
      } - ${
        new Date(
          campaign.endDate
        ).toDateString()
      }`
    );

    doc.text(
      `Total Days : ${durationDays} Day(s)`
    );

    doc.text(
      `Locations : ${locations}`
    );

    doc.text(
      `Campaign Status : COMPLETED`
    );

    doc.moveDown(2);

    doc.fontSize(16);
    doc.text(
      "Performance Metrics"
    );

    doc.moveDown();

    doc.fontSize(13);

    doc.text(
      `Total Displays : ${impressions}`
    );

    doc.text(
      `Total Clicks : ${clicks}`
    );

    doc.text(
      `Click Through Rate : ${ctr}%`
    );

    doc.moveDown(2);

    doc.fontSize(16);
    doc.text("Summary");

    doc.moveDown();

    doc.fontSize(13);

    doc.text(
      `The campaign "${campaign.title}" was successfully completed on ${new Date(
        campaign.endDate
      ).toDateString()}.`
    );

    doc.moveDown();

    doc.text(
      `During the campaign period, the advertisement generated ${impressions} displays and ${clicks} clicks.`
    );

    doc.moveDown(4);

    doc.text(
      `Generated On: ${new Date().toDateString()}`
    );

    doc.text(
      "This is a system-generated report."
    );
    doc.end();

    stream.on(
      "finish",
      () => resolve(filePath)
    );

    stream.on(
      "error",
      reject
    );
  });
};

module.exports = {
  generateCampaignPdf,
};