async function loadResults() {
  try {
    // Load data from JSON
    const res = await fetch('results.json');
    const data = await res.json();

    const grid = document.getElementById('resultsGrid');
    const searchInput = document.getElementById('searchInput');

    // Function to render a set of entries
    function render(entries) {
      grid.innerHTML = '';
      if (entries.length === 0) {
        grid.innerHTML = '<p>No records found.</p>';
        return;
      }

      entries.forEach(item => {
        const card = document.createElement('a');
        card.className = 'result-card';
        card.href = `entry.html?id=${item.id}`;  // Link to detail page
        card.innerHTML = `
          <img src="${item.thumbnail}" alt="${item.title}">
          <div class="result-content">
            <h2 class="result-title">${item.title}</h2>
            <p class="result-desc">${item.description}</p>
          </div>
        `;
        grid.appendChild(card);
      });
    }

    // Initial render with all results
    render(data);

    // Live search filter
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = data.filter(item =>
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
      );
      render(filtered);
    });
  } catch (err) {
    console.error('Failed to load results.json:', err);
    document.getElementById('resultsGrid').innerHTML = '<p>Error loading records.</p>';
  }
}

// Initialize
loadResults();

