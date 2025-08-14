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

  // Special handling for artifact ID 705
  if (entryId === 705) {
    // Create the OpenSeadragon viewer for artifact 705
    viewer = OpenSeadragon({
      id: "viewer",
      prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.1/images/",
      tileSources: {
        type: "zoomifytileservice",
        tilesUrl: "https://oov.som.yale.edu/files/new-goetzmann-by-id/zoom/705/",
        width: 1180,
        height: 768,
        tileSize: 256
      }
    });
    
    // Hide navigation controls for artifact 705 since it's a single image
    document.querySelector('.gallery-nav').style.display = 'none';
    
    return; // Exit early for artifact 705
  }

  // Special handling for artifact ID 419 (Reglement op de Wisselbank binnen Utrecht)
  if (entryId === 419) {
    // This is a 7-page pamphlet, so we'll create a multi-page OpenSeadragon viewer
    const pages = [
      {
        type: "zoomifytileservice",
        tilesUrl: "https://oov.som.yale.edu/files/new-goetzmann-by-id/zoom/419/1/",
        width: 1180,
        height: 768,
        tileSize: 256
      },
      {
        type: "zoomifytileservice",
        tilesUrl: "https://oov.som.yale.edu/files/new-goetzmann-by-id/zoom/419/2/",
        width: 1180,
        height: 768,
        tileSize: 256
      },
      {
        type: "zoomifytileservice",
        tilesUrl: "https://oov.som.yale.edu/files/new-goetzmann-by-id/zoom/419/3/",
        width: 1180,
        height: 768,
        tileSize: 256
      },
      {
        type: "zoomifytileservice",
        tilesUrl: "https://oov.som.yale.edu/files/new-goetzmann-by-id/zoom/419/4/",
        width: 1180,
        height: 768,
        tileSize: 256
      },
      {
        type: "zoomifytileservice",
        tilesUrl: "https://oov.som.yale.edu/files/new-goetzmann-by-id/zoom/419/5/",
        width: 1180,
        height: 768,
        tileSize: 256
      },
      {
        type: "zoomifytileservice",
        tilesUrl: "https://oov.som.yale.edu/files/new-goetzmann-by-id/zoom/419/6/",
        width: 1180,
        height: 768,
        tileSize: 256
      },
      {
        type: "zoomifytileservice",
        tilesUrl: "https://oov.som.yale.edu/files/new-goetzmann-by-id/zoom/419/7/",
        width: 1180,
        height: 768,
        tileSize: 256
      }
    ];

    // Initialize OpenSeadragon with the first page
    viewer = OpenSeadragon({
      id: "viewer",
      prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.1/images/",
      tileSources: pages[0],
      showNavigator: true
    });

    // Update the page count display
    pageCount.textContent = `/ ${pages.length}`;
    pageInput.value = 1;

    // Function to update the current page
    function updatePage(pageIndex) {
      if (pageIndex >= 0 && pageIndex < pages.length) {
        currentIndex = pageIndex;
        viewer.open(pages[currentIndex]);
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

    return; // Exit early for artifact 419
  }

  function updateImage() {
    const url = images[currentIndex];

    if (!viewer) {
      viewer = OpenSeadragon({
        id: "viewer",
        prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/",
        tileSources: url,
        showNavigator: true
      });
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

