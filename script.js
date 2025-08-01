async function loadResults() {
  const res = await fetch('results.json');
  const data = await res.json();
  const list = document.getElementById('resultsList');
  const paginationTop = document.getElementById('pagination-top');
  const paginationBottom = document.getElementById('pagination');

  // Pagination settings
  let currentPage = 1;
  const itemsPerPage = 20; // fixed
  let filteredData = [...data];

  const fields = {
    keywords: document.getElementById('keywords'),
    period: document.getElementById('period'),
    type: document.getElementById('type'),
    ledger: document.getElementById('ledger'),
    location: document.getElementById('location'),
    owner: document.getElementById('owner')
  };

  function buildPagination() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, filteredData.length);
    const totalRecords = filteredData.length;

    let html = `<div class="page-status">Displaying records ${start + 1} - ${end} of ${totalRecords}</div>`;
    html += `<div class="page-links">Page: `;

    for (let i = 1; i <= totalPages; i++) {
      if (i === currentPage) {
        html += `<span class="current">${i}</span> `;
      } else {
        html += `<a href="#" data-page="${i}">${i}</a> `;
      }
    }

    if (currentPage < totalPages) {
      html += `| <a href="#" data-page="${currentPage + 1}">next</a>`;
    }

    html += `</div>`;
    return html;
  }

  function render() {
    list.innerHTML = '';
    if (filteredData.length === 0) {
      list.innerHTML = '<p>No results found.</p>';
      paginationTop.innerHTML = '';
      paginationBottom.innerHTML = '';
      return;
    }

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, filteredData.length);
    const pageEntries = filteredData.slice(start, end);

    pageEntries.forEach(item => {
      const previewImage = `thumbnails/${item.id}.jpg`;

      const el = document.createElement('div');
      el.className = 'result-item';
      el.innerHTML = `
        <div class="result-thumbnail">
          <a href="entry.html?id=${item.id}">
            <img src="${previewImage}" alt="${item.title}" onerror="this.style.display='none'">
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

    // Render pagination at top and bottom
    const paginationHTML = buildPagination();
    paginationTop.innerHTML = paginationHTML;
    paginationBottom.innerHTML = paginationHTML;

    // Add event listeners to all page links
    document.querySelectorAll('#pagination-top a[data-page], #pagination a[data-page]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        currentPage = parseInt(link.dataset.page, 10);
        render();
      });
    });
  }

  function applyFilters(resetPage = true) {
    if (resetPage) currentPage = 1;
    filteredData = data.filter(item => {
      return (!fields.keywords.value || item.title.toLowerCase().includes(fields.keywords.value.toLowerCase()) || (item.description && item.description.toLowerCase().includes(fields.keywords.value.toLowerCase()))) &&
             (!fields.period.value || item.period === fields.period.value) &&
             (!fields.type.value || item.type === fields.type.value) &&
             (!fields.ledger.value || (item.ledger && item.ledger.toLowerCase() === fields.ledger.value.toLowerCase())) &&
             (!fields.location.value || (item.location && item.location.toLowerCase().includes(fields.location.value.toLowerCase()))) &&
             (!fields.owner.value || (item.owner && item.owner.toLowerCase() === fields.owner.value.toLowerCase()));
    });
    render();
  }

  // Event listeners for filters
  Object.values(fields).forEach(field => field.addEventListener('input', () => applyFilters(true)));
  document.getElementById('resetBtn').addEventListener('click', () => {
    Object.values(fields).forEach(f => f.value = '');
    applyFilters(true);
  });

  applyFilters(true);
}
loadResults();