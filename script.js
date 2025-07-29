async function loadResults() {
  const res = await fetch('results.json');
  const data = await res.json();
  const list = document.getElementById('resultsList');

  // Pagination variables
  let currentPage = 1;
  let itemsPerPage = 20;

  const fields = {
    keywords: document.getElementById('keywords'),
    period: document.getElementById('period'),
    type: document.getElementById('type'),
    ledger: document.getElementById('ledger'),
    location: document.getElementById('location'),
    owner: document.getElementById('owner')
  };

  // Pagination controls
  const pagination = document.getElementById('pagination');
  const pageInfo = document.getElementById('pageInfo');
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const pageSizeSelect = document.getElementById('pageSize');

  function render(entries) {
    list.innerHTML = '';
    if (entries.length === 0) {
      list.innerHTML = '<p>No results found.</p>';
      pagination.style.display = 'none';
      return;
    }

    pagination.style.display = 'block';

    const totalPages = Math.ceil(entries.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageEntries = entries.slice(start, end);

    pageEntries.forEach(item => {
      const previewImage = `thumbnail/${item.id}.jpg`;

      const el = document.createElement('div');
      el.className = 'result-item';
      el.innerHTML = `
        <div class="result-thumbnail">
          <a href="entry.html?id=${item.id}">
            <img src="${previewImage}" alt="${item.title}">
          </a>
        </div>
        <div class="result-details">
          <h3>
            <a href="entry.html?id=${item.id}">${item.title}</a>
          </h3>
          <p><strong>Location:</strong> ${item.location || 'N/A'}</p>
          <p><strong>Date:</strong> ${item.date || 'N/A'}</p>
          <p><strong>Period:</strong> ${item.period || 'N/A'}</p>
          <p><strong>Type:</strong> ${item.type || 'N/A'}</p>
          <p><strong>Description:</strong> ${item.description || ''}</p>
        </div>
      `;
      list.appendChild(el);
    });

    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
  }

  function applyFilters() {
    currentPage = 1;
    const filtered = data.filter(item => {
      return (!fields.keywords.value || item.title.toLowerCase().includes(fields.keywords.value.toLowerCase()) || (item.description && item.description.toLowerCase().includes(fields.keywords.value.toLowerCase()))) &&
             (!fields.period.value || item.period === fields.period.value) &&
             (!fields.type.value || item.type === fields.type.value) &&
             (!fields.ledger.value || (item.ledger && item.ledger.toLowerCase() === fields.ledger.value.toLowerCase())) &&
             (!fields.location.value || (item.location && item.location.toLowerCase().includes(fields.location.value.toLowerCase()))) &&
             (!fields.owner.value || (item.owner && item.owner.toLowerCase() === fields.owner.value.toLowerCase()));
    });
    render(filtered);
  }

  // Event listeners for search/filter
  Object.values(fields).forEach(field => field.addEventListener('input', applyFilters));
  document.getElementById('resetBtn').addEventListener('click', () => {
    Object.values(fields).forEach(f => f.value = '');
    applyFilters();
  });

  // Pagination controls
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      applyFilters();
    }
  });

  nextBtn.addEventListener('click', () => {
    currentPage++;
    applyFilters();
  });

  pageSizeSelect.addEventListener('change', () => {
    itemsPerPage = parseInt(pageSizeSelect.value, 10);
    currentPage = 1;
    applyFilters();
  });

  applyFilters();
}
loadResults();