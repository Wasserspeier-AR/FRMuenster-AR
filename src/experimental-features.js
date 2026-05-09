/*   gltf.scene.traverse((child) => {
    if (child.isMesh && child.material.map) {
      const roughnessMap = generateRoughnessMap(child.material.map.image);
      child.material.roughnessMap = roughnessMap;
      child.material.roughness = 1.0; // let map drive it

      const normalMap = generateNormalMap(child.material.map.image, 256, 2.0);
      child.material.normalMap = normalMap;
      child.material.normalScale.set(1.0, 1.0);

      child.material.needsUpdate = true;
    }
  }); */

function generateRoughnessMap(image) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const size = 256; // downscale for performance
  canvas.width = size;
  canvas.height = size;

  ctx.drawImage(image, 0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Luminance
    const l = 0.299 * r + 0.587 * g + 0.114 * b;

    // invert + remap for roughness feel
    const rough = 255 - l;

    data[i] = data[i + 1] = data[i + 2] = rough;
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  return texture;
}

function generateNormalMap(image, size = 256, strength = 2.0) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = size;
  canvas.height = size;

  ctx.drawImage(image, 0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  const getLuminance = (x, y) => {
    const i = (y * size + x) * 4;
    return (
      0.299 * data[i] +
      0.587 * data[i + 1] +
      0.114 * data[i + 2]
    ) / 255;
  };

  const normalData = new Uint8ClampedArray(size * size * 4);

  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      // Sobel filter
      const tl = getLuminance(x - 1, y - 1);
      const t = getLuminance(x, y - 1);
      const tr = getLuminance(x + 1, y - 1);
      const l = getLuminance(x - 1, y);
      const r = getLuminance(x + 1, y);
      const bl = getLuminance(x - 1, y + 1);
      const b = getLuminance(x, y + 1);
      const br = getLuminance(x + 1, y + 1);

      const dx = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const dy = (bl + 2 * b + br) - (tl + 2 * t + tr);

      let nx = -dx * strength;
      let ny = -dy * strength;
      let nz = 1.0;

      // normalize
      const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= length;
      ny /= length;
      nz /= length;

      const i = (y * size + x) * 4;
      normalData[i] = (nx * 0.5 + 0.5) * 255;
      normalData[i + 1] = (ny * 0.5 + 0.5) * 255;
      normalData[i + 2] = (nz * 0.5 + 0.5) * 255;
      normalData[i + 3] = 255;
    }
  }

  const normalImage = new ImageData(normalData, size, size);

  ctx.putImageData(normalImage, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  return texture;
}