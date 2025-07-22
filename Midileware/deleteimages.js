const fs = require("fs");
const path = require("path");


const deleteImage = async (filename) => {
  const fullPath = path.join(__dirname, "../storage/userdp", filename); // 🔁 Ensure this matches your folder

  return new Promise((resolve, reject) => {
    fs.unlink(fullPath, (error) => {
      if (error) {
        console.error("Image deletion error:", error);
        return reject(error);
      }

      console.log("Successfully deleted:", fullPath);
      return resolve(true);
    });
  });
};

module.exports = {
  deleteImage,
};
