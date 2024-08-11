const fs = require('fs');
const { createCanvas, Image } = require('canvas');
const EscPosEncoder = require('esc-pos-encoder');

let encoder = new EscPosEncoder({ 
    imageMode: 'raster' 
});
 
async function encodeImage(imagePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(imagePath, (err, data) => {
            if (err) {
                return reject(new Error(`Error reading the file: ${err.message}`));
            }
  
            const canvas = createCanvas(100, 80);
            const context = canvas.getContext('2d');
            const image = new Image();
  
            image.onerror = (error) => {
                return reject(new Error(`Error loading the image: ${error.message}`));
            };
  
            image.onload = () => {
                context.drawImage(image, 0, 0, 100, 80);
  
                try {
                    let imageData = encoder.image(canvas, 88, 80, 'atkinson').encode();
                    resolve(imageData);
                } catch (encodeError) {
                    reject(new Error(`Error encoding the image: ${encodeError.message}`));
                }
            };
  
            image.src = data;
        });
    });
  }
  module.exports = encodeImage;