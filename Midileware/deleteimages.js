const fs = require("fs");
const path = require("path");

const deleteImage = async (imagePath) => {
  return new Promise((resolve, reject) => {
    // ✅ imagePath should already be a full path
    fs.unlink(imagePath, (error) => {
      if (error) {
        console.error("Image deletion error:", error);
        return reject(error);
      }

      console.log("Successfully deleted:", imagePath);
      return resolve(true);
    });
  });
};

module.exports = {
  deleteImage,
};
