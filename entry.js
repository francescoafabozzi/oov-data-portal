async function loadEntry() {
  const urlParams = new URLSearchParams(window.location.search);
  const entryId = parseInt(urlParams.get('id'), 10);

  const res = await fetch('results.json');
  const data = await res.json();
  const entry = data.find(e => e.id === entryId);

  if (!entry) {
    document.body.innerHTML = "<p>Entry not found.</p>";
    return;
  }

  document.getElementById('entryTitle').textContent = entry.title;
  document.getElementById('entryDesc').textContent = entry.description;

  const images = entry.gallery;
  let currentIndex = 0;

  const pageInput = document.getElementById('pageInput');
  const pageCount = document.getElementById('pageCount');
  let viewer;

  // Add custom zoom controls to the viewer
  function addCustomZoomControls(viewerElement) {
    const zoomControls = document.createElement('div');
    zoomControls.className = 'zoom-controls';
    zoomControls.innerHTML = `
      <div class="zoom-slider-container">
        <div class="zoom-label">ZOOM</div>
        <input type="range" class="zoom-slider" min="0" max="100" value="50" step="1">
        <div class="zoom-label" id="zoom-level">100%</div>
      </div>
      <div class="zoom-buttons">
        <button class="zoom-btn" id="zoom-out" title="Zoom Out">−</button>
        <button class="zoom-btn" id="zoom-reset" title="Reset View">⌂</button>
        <button class="zoom-btn" id="zoom-in" title="Zoom In">+</button>
      </div>
    `;
    
    viewerElement.appendChild(zoomControls);
    
    // Get the zoom controls
    const zoomSlider = zoomControls.querySelector('.zoom-slider');
    const zoomLevel = zoomControls.querySelector('#zoom-level');
    const zoomOutBtn = zoomControls.querySelector('#zoom-out');
    const zoomResetBtn = zoomControls.querySelector('#zoom-reset');
    const zoomInBtn = zoomControls.querySelector('#zoom-in');
    
    // Update zoom level display
    function updateZoomLevel() {
      const zoom = viewer.viewport.getZoom(true);
      const zoomPercent = Math.round(zoom * 100);
      zoomLevel.textContent = `${zoomPercent}%`;
      
      // Update slider position (convert zoom to 0-100 range)
      const sliderValue = Math.min(100, Math.max(0, (zoom - 0.5) / 9.5 * 100));
      zoomSlider.value = sliderValue;
    }
    
    // Zoom slider functionality
    zoomSlider.addEventListener('input', function() {
      const sliderValue = parseFloat(this.value);
      const zoom = 0.5 + (sliderValue / 100) * 9.5; // Convert 0-100 to 0.5-10
      viewer.viewport.zoomTo(zoom);
      updateZoomLevel();
    });
    
    // Zoom button functionality
    zoomOutBtn.addEventListener('click', function() {
      viewer.viewport.zoomBy(0.8);
      updateZoomLevel();
    });
    
    zoomResetBtn.addEventListener('click', function() {
      viewer.viewport.goHome();
      updateZoomLevel();
    });
    
    zoomInBtn.addEventListener('click', function() {
      viewer.viewport.zoomBy(1.25);
      updateZoomLevel();
    });
    
    // Update zoom level when viewport changes
    viewer.addHandler('update', updateZoomLevel);
    
    // Initial zoom level update
    setTimeout(updateZoomLevel, 100);
  }

  // Check if this artifact has a manifest file (multi-page)
  try {
    const manifestResponse = await fetch(`records/record_${entryId}.json`);
    if (manifestResponse.ok) {
      // Multi-page artifact - load the manifest and create a multi-page viewer
      const manifest = await manifestResponse.json();
      const pages = manifest.items;
      
      console.log(`Found manifest for artifact ${entryId} with ${pages.length} pages`);

      // Initialize OpenSeadragon with the first page
      viewer = OpenSeadragon({
        id: "viewer",
        prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.1/images/",
        showNavigator: true,
        minZoomLevel: 0.5,
        maxZoomLevel: 10,
        zoomPerScroll: 1.2,
        zoomPerClick: 2.0,
        tileSources: {
          type: "zoomifytileservice",
          tilesUrl: pages[0].tilesUrl,
          width: pages[0].width || 552,
          height: pages[0].height || 768,
          tileSize: pages[0].tileSize || 256
        }
      });

      // Add custom zoom controls after viewer is initialized
      setTimeout(() => {
        addCustomZoomControls(document.getElementById('viewer'));
      }, 100);

      // Update the page count display
      pageCount.textContent = `/ ${pages.length}`;
      pageInput.value = 1;

      // Function to update the current page
      function updatePage(pageIndex) {
        if (pageIndex >= 0 && pageIndex < pages.length) {
          currentIndex = pageIndex;
          const page = pages[currentIndex];
          viewer.open({
            type: "zoomifytileservice",
            tilesUrl: page.tilesUrl,
            width: page.width || 552,
            height: page.height || 768,
            tileSize: page.tileSize || 256
          });
          pageInput.value = currentIndex + 1;
        }
      }

      // Event listeners for navigation
      document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentIndex > 0) {
          updatePage(currentIndex - 1);
        }
      });

      document.getElementById('nextBtn').addEventListener('click', () => {
        if (currentIndex < pages.length - 1) {
          updatePage(currentIndex + 1);
        }
      });

      document.getElementById('endBtn').addEventListener('click', () => {
        updatePage(pages.length - 1);
      });

      pageInput.addEventListener('change', () => {
        let val = parseInt(pageInput.value, 10) - 1;
        if (!isNaN(val) && val >= 0 && val < pages.length) {
          updatePage(val);
        }
      });

      return; // Exit early for multi-page artifacts
    }
  } catch (error) {
    console.log(`No manifest found for artifact ${entryId}, checking for single-page zoom...`);
  }

  // Check if this artifact has a single-page zoom configuration
  // For now, we'll use the existing hardcoded configurations for known artifacts
  if (entryId === 705) {
    // Create the OpenSeadragon viewer for artifact 705
    viewer = OpenSeadragon({
      id: "viewer",
      prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.1/images/",
      minZoomLevel: 0.5,
      maxZoomLevel: 10,
      zoomPerScroll: 1.2,
      zoomPerClick: 2.0,
      tileSources: {
        type: "zoomifytileservice",
        tilesUrl: "https://oov.som.yale.edu/files/new-goetzmann-by-id/zoom/705/",
        width: 1180,
        height: 768,
        tileSize: 256
      }
    });
    
    // Add custom zoom controls after viewer is initialized
    setTimeout(() => {
      addCustomZoomControls(document.getElementById('viewer'));
    }, 100);
    
    // Hide navigation controls for artifact 705 since it's a single image
    document.querySelector('.gallery-nav').style.display = 'none';
    
    return; // Exit early for artifact 705
  }

  // Default behavior for artifacts without manifests or known configurations
  function updateImage() {
    const url = images[currentIndex];

    if (!viewer) {
      viewer = OpenSeadragon({
        id: "viewer",
        prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/",
        tileSources: url,
        showNavigator: true
      });
      
      // Add custom zoom controls after viewer is initialized
      setTimeout(() => {
        addCustomZoomControls(document.getElementById('viewer'));
      }, 100);
    } else {
      viewer.open(url);
    }

    pageInput.value = currentIndex + 1;
    pageCount.textContent = `/ ${images.length}`;
  }

  document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentIndex > 0) currentIndex--;
    updateImage();
  });

  document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentIndex < images.length - 1) currentIndex++;
    updateImage();
  });

  document.getElementById('endBtn').addEventListener('click', () => {
    currentIndex = images.length - 1;
    updateImage();
  });

  pageInput.addEventListener('change', () => {
    let val = parseInt(pageInput.value, 10) - 1;
    if (!isNaN(val) && val >= 0 && val < images.length) {
      currentIndex = val;
      updateImage();
    }
  });

  if (images.length > 0) {
    updateImage();
  } else {
    document.getElementById('viewer').innerHTML = "<p>No images available.</p>";
  }
}

loadEntry();

