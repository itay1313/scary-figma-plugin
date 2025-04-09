// Show UI with different sizes based on command
figma.showUI(__html__, { width: 300, height: 400 });

async function createScaryImage(imageData) {
  try {
    // Ensure we have valid image data
    if (!imageData || !Array.isArray(imageData)) {
      throw new Error('Invalid image data');
    }

    // Convert the array to Uint8Array properly
    const uint8Array = Uint8Array.from(imageData);

    // Create the image
    const image = figma.createImage(uint8Array);

    // Get viewport info for sizing
    const viewport = figma.viewport.bounds;
    const viewportCenter = figma.viewport.center;
    const size = Math.max(viewport.width, viewport.height) * 3; // Make it 3x viewport size for extra scary

    // Create multiple scary images
    const frames = [];
    for (let i = 0; i < 4; i++) {
      // Create a frame instead of rectangle for better performance
      const frame = figma.createFrame();
      frames.push(frame);

      // Make it huge
      frame.resize(size, size);

      // Center it with offset
      frame.x = viewportCenter.x - (size / 2) + (i * 150);
      frame.y = viewportCenter.y - (size / 2) + (i * 150);

      // Set the fill
      frame.fills = [{
        type: 'IMAGE',
        imageHash: image.hash,
        scaleMode: 'FILL'
      }];

      // Add scary glow effect
      frame.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 1, g: 0, b: 0, a: 0.9 },
        offset: { x: 0, y: 0 },
        radius: 150,
        spread: 80,
        visible: true,
        blendMode: 'NORMAL'
      }];

      // Ensure it's visible in the viewport
      frame.appendChild(figma.createRectangle()); // This helps ensure the frame is rendered
    }

    // Group all frames
    const group = figma.group(frames, figma.currentPage);
    group.name = "👻 Scary Surprise";

    // Make sure it's visible
    figma.viewport.scrollAndZoomIntoView(frames);

    // Set zoom to show the full effect
    figma.viewport.zoom = 0.05;

    // Notify everyone
    figma.notify('👻 BOO! Check your screen!', { timeout: 3000 });

    // Close plugin
    figma.closePlugin();

  } catch (error) {
    console.error('Error:', error);
    figma.notify(`Failed to create scary image: ${error.message}`, { error: true });
  }
}

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create-image') {
    await createScaryImage(msg.imageData);
  }
};