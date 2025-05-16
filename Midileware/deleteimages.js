const fs = require("fs");
const path = require("path");

const deleteImage = async (imagePath) => {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(__dirname, "../storege/userdp", imagePath);

    fs.unlink(fullPath, (error) => {
      if (error) {
        console.error("Image deletion error:", error);
        return reject(error); // allow route to handle this
      }

      console.log("Successfully deleted:", imagePath);
      return resolve(true);
    });
  });
};

module.exports = {
  deleteImage,
};
