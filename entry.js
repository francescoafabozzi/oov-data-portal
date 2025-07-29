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

