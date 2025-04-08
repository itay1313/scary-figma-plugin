// Show UI with different sizes based on command
if (figma.command === 'customize') {
  figma.showUI(__html__, { width: 300, height: 600 });
} else if (figma.command === 'spook') {
  // Quick spook with default settings
  figma.showUI(__html__, { width: 0, height: 0, visible: false });
  // Trigger default spook
  const defaultSettings = { size: 200, offset: 20, duration: 3000 };
  handleSpook(defaultSettings);
} else {
  figma.showUI(__html__, { width: 300, height: 400 });
}

let currentImage = null;
let mouseListener = null;

async function createScaryImage(imageData) {
  try {
    // Validate image data
    if (!(imageData instanceof Uint8Array)) {
      throw new Error('Invalid image data format');
    }

    // Create the image first
    const image = await figma.createImage(imageData);

    // Clear any existing image
    if (currentImage) {
      currentImage.remove();
      if (mouseListener) {
        window.removeEventListener('mousemove', mouseListener);
      }
    }

    // Get current frame or create one if none exists
    let frame = figma.currentPage.selection[0];
    if (!frame || !(frame.type === "FRAME")) {
      frame = figma.currentPage.frames[0];
      if (!frame) {
        throw new Error('No frame found in the current page');
      }
    }

    // Create rectangle for the image
    const rect = figma.createRectangle();
    rect.resize(800, 800);
    rect.x = frame.width / 2 - rect.width / 2;
    rect.y = frame.height / 2 - rect.height / 2;

    // Apply image fill
    rect.fills = [{
      type: 'IMAGE',
      imageHash: image.hash,
      scaleMode: 'FILL'
    }];

    // Add intense red glow effect
    rect.effects = [{
      type: 'DROP_SHADOW',
      color: { r: 1, g: 0, b: 0, a: 0.8 },
      offset: { x: 0, y: 0 },
      radius: 30,
      spread: 10,
      visible: true,
      blendMode: 'NORMAL'
    }];

    frame.appendChild(rect);
    rect.moveToFront();
    currentImage = rect;

    // Set up mouse tracking
    mouseListener = (event) => {
      const zoom = figma.viewport.zoom;
      const viewportOffset = figma.viewport.center;

      // Convert screen coordinates to frame coordinates
      const frameX = (event.clientX / zoom) + (viewportOffset.x - frame.width / 2);
      const frameY = (event.clientY / zoom) + (viewportOffset.y - frame.height / 2);

      rect.x = frameX - rect.width / 2;
      rect.y = frameY - rect.height / 2;
    };

    window.addEventListener('mousemove', mouseListener);

    // Remove the image after 2 seconds
    setTimeout(() => {
      if (currentImage) {
        currentImage.remove();
        currentImage = null;
      }
      if (mouseListener) {
        window.removeEventListener('mousemove', mouseListener);
        mouseListener = null;
      }
    }, 2000);

  } catch (error) {
    console.error('Error creating scary image:', error);
    figma.notify(`Error: ${error.message}`, { error: true });
  }
}

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create-image') {
    await createScaryImage(msg.imageData);
  } else if (msg.type === 'error') {
    figma.notify(msg.message, { error: true });
  }
};

// Clean up on plugin close
figma.on("close", () => {
  if (currentImage) {
    currentImage.remove();
  }
});

async function handleSpook(settings, imageData = null) {
  // Clear any existing image and tracking
  if (currentImage) {
    currentImage.remove();
    if (imageData) {
      imageData.remove();
      if (mouseListener) {
        window.removeEventListener('mousemove', mouseListener);
      }
    }
  }

  // Create new image
  const node = figma.createRectangle();

  // Store settings in plugin data
  node.setPluginData('settings', JSON.stringify(settings));

  // Set initial position
  node.x = lastKnownPosition.x + settings.offset;
  node.y = lastKnownPosition.y + settings.offset;

  // Set size and appearance
  node.resize(settings.size, settings.size);
  node.cornerRadius = settings.size / 10; // Slightly rounded corners

  // Apply image fill with scaling animation
  if (imageData) {
    const image = figma.createImage(imageData);
    node.fills = [{ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FILL' }];
  } else {
    // Use default ghost image for quick spook
    node.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    // Add ghost face
    const face = figma.createText();
    face.characters = '👻';
    face.fontSize = settings.size * 0.8;
    face.x = node.x + settings.size * 0.1;
    face.y = node.y + settings.size * 0.1;
    node.appendChild(face);
  }

  // Add a subtle drop shadow
  node.effects = [
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.2 },
      offset: { x: 0, y: 4 },
      radius: 8,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL'
    }
  ];

  // Store reference and start tracking
  currentImage = node;

  // Entrance animation
  const originalSize = settings.size;
  node.resize(0, 0);
  await figma.viewport.scrollAndZoomIntoView([node]);

  const steps = 10;
  const stepDuration = 50;
  for (let i = 1; i <= steps; i++) {
    const size = (i / steps) * originalSize;
    node.resize(size, size);
    await new Promise(resolve => setTimeout(resolve, stepDuration));
  }

  // Set timeout for removal with exit animation
  setTimeout(async () => {
    if (currentImage) {
      // Exit animation
      for (let i = steps; i >= 0; i--) {
        const size = (i / steps) * originalSize;
        currentImage.resize(size, size);
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }
      currentImage.remove();
      currentImage = null;
    }
  }, settings.duration);
}