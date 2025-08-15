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

  // Move fields object creation inside loadResults function
  const fields = {
    keywords: document.getElementById('keywords'),
    period: document.getElementById('period'),
    type: document.getElementById('type'),
    ledger: document.getElementById('ledger'),
    location: document.getElementById('location'),
    owner: document.getElementById('owner')
  };

  // Verify all fields exist
  const missingFields = Object.entries(fields).filter(([name, element]) => !element);
  if (missingFields.length > 0) {
    console.error('Missing form fields:', missingFields.map(([name]) => name));
    console.error('All fields:', fields);
    return;
  }

  console.log('All form fields found successfully:', fields);

  function buildPagination() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, filteredData.length);
    const totalRecords = filteredData.length;

    let html = `<div class="page-status">Displaying records ${start + 1} - ${end} of ${totalRecords}</div>`;
    html += `<div class="page-links">`;

    // Previous button
    if (currentPage > 1) {
      html += `<a href="#" data-page="${currentPage - 1}" class="prev">← Prev</a>`;
    }

    // Page numbers with smart truncation
    const maxVisiblePages = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page
    if (startPage > 1) {
      html += `<a href="#" data-page="1">1</a>`;
      if (startPage > 2) {
        html += `<span>...</span>`;
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      if (i === currentPage) {
        html += `<span class="current">${i}</span>`;
      } else {
        html += `<a href="#" data-page="${i}">${i}</a>`;
      }
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        html += `<span>...</span>`;
      }
      html += `<a href="#" data-page="${totalPages}">${totalPages}</a>`;
    }

    // Next button
    if (currentPage < totalPages) {
      html += `<a href="#" data-page="${currentPage + 1}" class="next">Next →</a>`;
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
    console.log('applyFilters called with resetPage:', resetPage);
    
    // Safety check - ensure all fields exist and have values
    if (!fields.keywords || !fields.location || !fields.owner || !fields.period || !fields.type || !fields.ledger) {
      console.error('Some form fields are missing:', fields);
      return;
    }
    
    // Additional safety check - ensure all fields are DOM elements
    const fieldValues = {
      keywords: fields.keywords.value || '',
      location: fields.location.value || '',
      owner: fields.owner.value || '',
      period: fields.period.value || '',
      type: fields.type.value || '',
      ledger: fields.ledger.value || ''
    };
    
    console.log('Current field values:', fieldValues);
    
    if (resetPage) currentPage = 1;
    filteredData = data.filter(item => {
      // Debug: log the item to see what we're working with
      if (item && typeof item === 'object') {
        console.log('Processing item:', item);
      }
      
      // Safe string operations with comprehensive null checks
      const keywordsMatch = !fieldValues.keywords || 
        (item && item.title && typeof item.title === 'string' && item.title.toLowerCase().includes(fieldValues.keywords.toLowerCase())) ||
        (item && item.description && typeof item.description === 'string' && item.description.toLowerCase().includes(fieldValues.keywords.toLowerCase()));
      
      const periodMatch = !fieldValues.period || (item && item.period === fieldValues.period);
      const typeMatch = !fieldValues.type || (item && item.type === fieldValues.type);
      
      const ledgerMatch = !fieldValues.ledger || 
        (item && item.ledger && typeof item.ledger === 'string' && item.ledger.toLowerCase() === fieldValues.ledger.toLowerCase());
      
      const locationMatch = !fieldValues.location || 
        (item && item.location && typeof item.location === 'string' && item.location.toLowerCase().includes(fieldValues.location.toLowerCase()));
      
      const ownerMatch = !fieldValues.owner || 
        (item && item.owner && typeof item.owner === 'string' && item.owner.toLowerCase() === fieldValues.owner.toLowerCase());
      
      return keywordsMatch && periodMatch && typeMatch && ledgerMatch && locationMatch && ownerMatch;
    });
    
    console.log('Filtered data length:', filteredData.length);
    console.log('Original data length:', data.length);
    
    render();
  }

  // Event listeners for filters
  Object.values(fields).forEach(field => field.addEventListener('input', () => applyFilters(true)));
  
  // Search button functionality
  const searchBtn = document.getElementById('searchBtn');
  const searchForm = document.getElementById('searchForm');
  const resetBtn = document.getElementById('resetBtn');
  
  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Search button clicked!');
      applyFilters(true);
    });
  } else {
    console.error('Search button not found!');
  }
  
  // Form submission
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      console.log('Form submitted!');
      applyFilters(true);
    });
  } else {
    console.error('Search form not found!');
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      Object.values(fields).forEach(f => f.value = '');
      applyFilters(true);
    });
  } else {
    console.error('Reset button not found!');
  }

  applyFilters(true);
}
loadResults();