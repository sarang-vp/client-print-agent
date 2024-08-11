const fs = require("fs");
const util = require("util");

module.exports.createDirectory = async (filepath) => {
    try {
      const makeDir = util.promisify(fs.mkdir);
      await makeDir(filepath, { recursive: true })
        .then(() => {
          console.log(`Directory '${filepath}' is created`);
        })
        .catch((err) => {
          console.log(
            `Error occurs, 
      Error code -> ${err.code},
      Error No -> ${err.errno}`,
            err
          );
        });
    } catch (e) {
      console.error(e);
    }
  };